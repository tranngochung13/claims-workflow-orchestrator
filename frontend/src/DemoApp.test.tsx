import { describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import DemoApp from "./DemoApp";
import App from "./App";
import { api, ApiError } from "./api/client";
import { claim, discovery, audit } from "./test/fixtures";
import type { Claim, Page } from "./api/contracts";
function detailMocks() {
  const getClaim = vi.spyOn(api, "claim").mockResolvedValue(claim);
  const actions = vi.spyOn(api, "actions").mockResolvedValue(discovery);
  const history = vi.spyOn(api, "audit").mockResolvedValue(audit);
  return { getClaim, actions, history };
}
async function open() {
  vi.spyOn(api, "list").mockResolvedValue({
    items: [claim],
    limit: 10,
    offset: 0,
  });
  detailMocks();
  render(<DemoApp />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Open Laptop damage" }),
  );
  await screen.findByRole("heading", { name: "Workflow actions" });
}
describe("claims demo workspace", () => {
  it("shows loading without fake claims", () => {
    vi.spyOn(api, "list").mockReturnValue(new Promise(() => {}));
    render(<DemoApp />);
    expect(screen.getByText("Loading claims…")).toBeTruthy();
    expect(screen.queryByText("Laptop damage")).toBeNull();
  });
  it("shows a useful empty state with no synthetic rows", async () => {
    vi.spyOn(api, "list").mockResolvedValue({
      items: [],
      limit: 10,
      offset: 0,
    });
    render(<DemoApp />);
    await screen.findByText("No claims on this page");
    expect(screen.queryAllByRole("cell")).toHaveLength(0);
  });
  it("shows backend list errors with their stable code", async () => {
    vi.spyOn(api, "list").mockRejectedValue(
      new ApiError("IDENTITY_REQUIRED", "Choose a known actor", 401),
    );
    render(<DemoApp />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "IDENTITY_REQUIRED",
    );
  });
  it("creates a claim and navigates to its actual details", async () => {
    vi.spyOn(api, "list").mockResolvedValue({
      items: [],
      limit: 10,
      offset: 0,
    });
    const create = vi.spyOn(api, "create").mockResolvedValue(claim);
    detailMocks();
    render(<DemoApp />);
    fireEvent.click(screen.getByRole("button", { name: /New claim/ }));
    fireEvent.change(screen.getByLabelText(/Title/), {
      target: { value: "Laptop damage" },
    });
    fireEvent.change(screen.getByLabelText(/Description/), {
      target: { value: "Screen damaged during transport." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create claim" }));
    await screen.findByRole("heading", { name: "Laptop damage" });
    expect(create).toHaveBeenCalledWith("claimant-1", {
      title: "Laptop damage",
      description: "Screen damaged during transport.",
    });
    expect(screen.getByText(/Claim created/)).toBeTruthy();
  });
  it("refreshes detail, discovery, and history after successful execution", async () => {
    vi.spyOn(api, "list").mockResolvedValue({
      items: [claim],
      limit: 10,
      offset: 0,
    });
    const mocks = detailMocks();
    vi.spyOn(api, "transition").mockImplementation(async () => {
      mocks.getClaim.mockResolvedValue({
        ...claim,
        state: "awaiting_information",
        revision: 3,
        informationRequestCount: 1,
      });
      mocks.actions.mockResolvedValue({
        ...discovery,
        state: "awaiting_information",
        revision: 3,
        informationRequestCount: 1,
        transitions: [],
      });
      mocks.history.mockResolvedValue({
        ...audit,
        items: [
          {
            id: "event",
            transitionId: "request_information",
            actor: { id: "adjuster-1", role: "adjuster" },
            fromState: "under_review",
            toState: "awaiting_information",
            previousRevision: 2,
            resultingRevision: 3,
            createdAt: claim.updatedAt,
          },
        ],
      });
      return { claim, auditEventId: "event", notificationIds: [] };
    });
    render(<DemoApp />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open Laptop damage" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Choose action" }),
    );
    fireEvent.change(screen.getByLabelText(/Message/), {
      target: { value: "Please provide details" },
    });
    fireEvent.submit(
      screen.getByRole("form", { name: "Request information form" }),
    );
    await screen.findByText("No further actions");
    expect(mocks.getClaim).toHaveBeenCalledTimes(2);
    expect(mocks.actions).toHaveBeenCalledTimes(2);
    expect(mocks.history).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("progressbar").getAttribute("value")).toBe("1");
  });
  it("locks actor changes during an uncertain request and reuses command context after refresh", async () => {
    vi.spyOn(api, "list").mockResolvedValue({
      items: [claim],
      limit: 10,
      offset: 0,
    });
    detailMocks();
    const send = vi
      .spyOn(api, "transition")
      .mockRejectedValueOnce(
        new ApiError("NETWORK_ERROR", "Unknown outcome", 0, true),
      )
      .mockResolvedValueOnce({
        claim,
        auditEventId: "event",
        notificationIds: [],
      });
    render(<DemoApp />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open Laptop damage" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Choose action" }),
    );
    fireEvent.change(screen.getByLabelText(/Message/), {
      target: { value: "Please provide details" },
    });
    fireEvent.submit(
      screen.getByRole("form", { name: "Request information form" }),
    );
    await screen.findByText("Outcome not yet confirmed");
    expect(screen.getByLabelText("Demo actor").hasAttribute("disabled")).toBe(
      true,
    );
    fireEvent.click(screen.getByRole("button", { name: "Refresh claim" }));
    await waitFor(() => expect(api.actions).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole("button", { name: "Retry same command" }));
    await screen.findByText(/Transition recorded/);
    expect(send.mock.calls[1][2]).toEqual(send.mock.calls[0][2]);
    expect(screen.getByLabelText("Demo actor").hasAttribute("disabled")).toBe(
      false,
    );
  });
  it("paginates claim API data with bounded offsets", async () => {
    const list = vi
      .spyOn(api, "list")
      .mockResolvedValueOnce({
        items: Array.from({ length: 10 }, (_, i) => ({
          ...claim,
          id: `${claim.id}-${i}`,
          title: `Claim ${i}`,
        })),
        limit: 10,
        offset: 0,
      })
      .mockResolvedValue({ items: [], limit: 10, offset: 10 });
    render(<DemoApp />);
    await screen.findByRole("button", { name: "Open Claim 0" });
    fireEvent.click(screen.getByRole("button", { name: "Next claims" }));
    await screen.findByText("Page 2");
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        "claimant-1",
        10,
        expect.any(AbortSignal),
      ),
    );
  });
  it("discards late responses and cached rows when the actor changes", async () => {
    let resolveOld: (page: Page<Claim>) => void = () => {};
    const old = new Promise<Page<Claim>>((resolve) => {
      resolveOld = resolve;
    });
    vi.spyOn(api, "list").mockImplementation((actor) =>
      actor === "claimant-1"
        ? old
        : Promise.resolve({ items: [], limit: 10, offset: 0 }),
    );
    render(<DemoApp />);
    fireEvent.change(screen.getByLabelText("Demo actor"), {
      target: { value: "claimant-2" },
    });
    await screen.findByText("No claims on this page");
    await act(async () => resolveOld({ items: [claim], limit: 10, offset: 0 }));
    expect(screen.queryByText("Laptop damage")).toBeNull();
  });
  it("shows detail authorization errors without inventing a claim", async () => {
    vi.spyOn(api, "list").mockResolvedValue({
      items: [claim],
      limit: 10,
      offset: 0,
    });
    detailMocks();
    vi.mocked(api.claim).mockRejectedValue(
      new ApiError("CLAIM_NOT_FOUND", "Claim not found.", 404),
    );
    render(<DemoApp />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open Laptop damage" }),
    );
    await screen.findByText("CLAIM_NOT_FOUND");
    expect(screen.queryByRole("heading", { name: "Claim summary" })).toBeNull();
  });
  it("does not show a creation control for the demo adjuster", async () => {
    vi.spyOn(api, "list").mockResolvedValue({
      items: [],
      limit: 10,
      offset: 0,
    });
    render(<DemoApp />);
    fireEvent.change(screen.getByLabelText("Demo actor"), {
      target: { value: "adjuster-1" },
    });
    await screen.findByText("No claims on this page");
    expect(screen.queryByRole("button", { name: /New claim/ })).toBeNull();
  });
  it("does not expose demo actor controls or send API requests in production mode", () => {
    vi.stubEnv("DEV", false);
    const list = vi.spyOn(api, "list");
    render(<App />);
    expect(
      screen.getByText("The development demo is unavailable in this build."),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Demo actor")).toBeNull();
    expect(list).not.toHaveBeenCalled();
  });
  it("renders the pinned workflow version and no made-up cycle maximum", async () => {
    await open();
    expect(screen.getByText("claims · v1")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("max")).toBe("3");
  });
});

it("paginates actual audit API results without unbounded history requests", async () => {
  vi.spyOn(api, "list").mockResolvedValue({
    items: [claim],
    limit: 10,
    offset: 0,
  });
  detailMocks();
  vi.mocked(api.audit)
    .mockResolvedValueOnce({
      ...audit,
      items: Array.from({ length: 10 }, (_, index) => ({
        id: `event-${index}`,
        transitionId: "submit",
        actor: { id: "claimant-1", role: "claimant" as const },
        fromState: "draft",
        toState: "submitted",
        previousRevision: index,
        resultingRevision: index + 1,
        createdAt: claim.updatedAt,
      })),
    })
    .mockResolvedValue({ ...audit, offset: 10, items: [] });
  render(<DemoApp />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Open Laptop damage" }),
  );
  const next = await screen.findByRole("button", { name: "Next audit events" });
  await waitFor(() => expect(next.hasAttribute("disabled")).toBe(false));
  fireEvent.click(next);
  await screen.findByText("No transitions on this page");
  expect(api.audit).toHaveBeenLastCalledWith(
    "claimant-1",
    claim.id,
    10,
    expect.any(AbortSignal),
  );
});
it("rejects empty creation fields locally", () => {
  vi.spyOn(api, "list").mockResolvedValue({ items: [], limit: 10, offset: 0 });
  const create = vi.spyOn(api, "create");
  render(<DemoApp />);
  fireEvent.click(screen.getByRole("button", { name: /New claim/ }));
  fireEvent.click(screen.getByRole("button", { name: "Create claim" }));
  expect(screen.getByRole("alert").textContent).toContain("Enter a title");
  expect(create).not.toHaveBeenCalled();
});
