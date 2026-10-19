import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TransitionActions } from "./TransitionActions";
import { api, ApiError } from "../api/client";
import { claim, action, discovery } from "../test/fixtures";
function draw() {
  const success = vi.fn();
  const lock = vi.fn();
  render(
    <TransitionActions
      actor="adjuster-1"
      discovery={discovery}
      refreshing={false}
      onSuccess={success}
      onLock={lock}
    />,
  );
  return { success, lock };
}
function fill(message = "Please provide details") {
  fireEvent.click(screen.getByRole("button", { name: "Choose action" }));
  fireEvent.change(screen.getByLabelText(/Message/), {
    target: { value: message },
  });
  fireEvent.submit(
    screen.getByRole("form", { name: "Request information form" }),
  );
}
describe("configured action forms", () => {
  it("only renders actionable controls for eligible transitions", () => {
    render(
      <TransitionActions
        actor="adjuster-1"
        discovery={{
          ...discovery,
          transitions: [
            action,
            {
              ...action,
              id: "approve",
              label: "Approve",
              eligible: false,
              reasonCode: "TRANSITION_FORBIDDEN",
            },
          ],
        }}
        refreshing={false}
        onSuccess={vi.fn()}
        onLock={vi.fn()}
      />,
    );
    expect(
      screen.getAllByRole("button", { name: "Choose action" }),
    ).toHaveLength(1);
    expect(
      screen.getByText("Your selected role cannot perform this action."),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Confirm approve" }),
    ).toBeNull();
  });
  it("validates dynamic required and minimum-length fields before sending", () => {
    const send = vi.spyOn(api, "transition");
    draw();
    fill("   ");
    expect(screen.getByRole("alert").textContent).toContain(
      "Message: enter 5–2000 characters",
    );
    expect(send).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Message/), {
      target: { value: "abc" },
    });
    fireEvent.submit(
      screen.getByRole("form", { name: "Request information form" }),
    );
    expect(send).not.toHaveBeenCalled();
  });
  it("sends discovered revision, fresh UUID, and trimmed configured input", async () => {
    const send = vi.spyOn(api, "transition").mockResolvedValue({
      claim: { ...claim, revision: 3 },
      auditEventId: "event",
      notificationIds: [],
    });
    const { success } = draw();
    fill("  Please provide details  ");
    await waitFor(() => expect(success).toHaveBeenCalledOnce());
    expect(send).toHaveBeenCalledWith(
      "adjuster-1",
      claim.id,
      expect.objectContaining({
        transitionId: "request_information",
        expectedRevision: 2,
        input: { message: "Please provide details" },
        commandId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      }),
    );
  });
  it("preserves the exact command ID, input, and revision when retrying an uncertain request", async () => {
    const uuid = vi.spyOn(crypto, "randomUUID");
    const send = vi
      .spyOn(api, "transition")
      .mockRejectedValueOnce(
        new ApiError("NETWORK_ERROR", "Lost connection", 0, true),
      )
      .mockResolvedValueOnce({
        claim,
        auditEventId: "event",
        notificationIds: [],
      });
    const { success, lock } = draw();
    fill();
    fireEvent.click(
      await screen.findByRole("button", { name: "Retry same command" }),
    );
    await waitFor(() => expect(success).toHaveBeenCalledOnce());
    expect(send.mock.calls[1][2]).toEqual(send.mock.calls[0][2]);
    expect(uuid).toHaveBeenCalledOnce();
    expect(lock).toHaveBeenLastCalledWith(false);
  });
  it.each(["REVISION_CONFLICT", "TRANSITION_FORBIDDEN"])(
    "shows %s without silently retrying",
    async (code) => {
      const send = vi
        .spyOn(api, "transition")
        .mockRejectedValue(
          new ApiError(
            code,
            "Backend rejected the request",
            code === "REVISION_CONFLICT" ? 409 : 403,
          ),
        );
      draw();
      fill();
      await screen.findByText(code);
      expect(send).toHaveBeenCalledOnce();
      expect(screen.queryByText("Retry same command")).toBeNull();
      if (code === "REVISION_CONFLICT")
        expect(screen.getByText(/Nothing was resubmitted/)).toBeTruthy();
    },
  );
  it("creates a new command ID only after an explicitly initiated new command", async () => {
    const send = vi
      .spyOn(api, "transition")
      .mockRejectedValue(new ApiError("REVISION_CONFLICT", "Stale", 409));
    draw();
    fill();
    await screen.findByText("REVISION_CONFLICT");
    fireEvent.submit(
      screen.getByRole("form", { name: "Request information form" }),
    );
    await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(send.mock.calls[0][2].commandId).not.toBe(
      send.mock.calls[1][2].commandId,
    );
  });
});

it("handles an additional configured field named constructor and enforces its bounds", async () => {
  const send = vi
    .spyOn(api, "transition")
    .mockResolvedValue({ claim, auditEventId: "event", notificationIds: [] });
  render(
    <TransitionActions
      actor="adjuster-1"
      discovery={{
        ...discovery,
        transitions: [
          {
            ...action,
            inputFields: [
              {
                name: "constructor",
                label: "Details",
                required: true,
                minLength: 1,
                maxLength: 8,
              },
            ],
          },
        ],
      }}
      refreshing={false}
      onSuccess={vi.fn()}
      onLock={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Choose action" }));
  fireEvent.submit(
    screen.getByRole("form", { name: "Request information form" }),
  );
  expect(send).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText(/Details/), {
    target: { value: "123456789" },
  });
  fireEvent.submit(
    screen.getByRole("form", { name: "Request information form" }),
  );
  expect(send).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText(/Details/), {
    target: { value: "valid" },
  });
  fireEvent.submit(
    screen.getByRole("form", { name: "Request information form" }),
  );
  await waitFor(() => expect(send).toHaveBeenCalledOnce());
  expect(send.mock.calls[0][2].input).toEqual({ constructor: "valid" });
});

it.each([
  [
    "initiate_payment",
    "Initiate payment (local record only)",
    "approved",
    "payment_initiated",
  ],
  ["close_paid", "Close claim", "payment_initiated", "closed"],
  ["close_rejected", "Close rejected claim", "rejected", "closed"],
])(
  "executes discovered lifecycle action %s without a frontend transition registry",
  async (id, label, from, to) => {
    const transition = vi
      .spyOn(api, "transition")
      .mockResolvedValue({
        claim: { ...claim, state: to },
        auditEventId: "event",
        notificationIds: [],
      });
    render(
      <TransitionActions
        actor="adjuster-1"
        discovery={{
          ...discovery,
          state: from,
          transitions: [
            {
              ...action,
              id,
              label,
              from,
              to,
              inputFields: [],
              eligible: true,
              reasonCode: null,
            },
          ],
        }}
        refreshing={false}
        onSuccess={vi.fn()}
        onLock={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Choose action" }));
    fireEvent.submit(screen.getByRole("form", { name: `${label} form` }));
    await waitFor(() =>
      expect(transition).toHaveBeenCalledWith(
        "adjuster-1",
        discovery.claimId,
        expect.objectContaining({
          transitionId: id,
          expectedRevision: discovery.revision,
          input: {},
        }),
      ),
    );
  },
);
