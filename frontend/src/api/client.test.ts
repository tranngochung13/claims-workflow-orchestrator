import { describe, it, expect, vi } from "vitest";
import { api } from "./client";
import { claim } from "../test/fixtures";
describe("API contract", () => {
  it("uses relative URLs, backend-owned actor selection, and bounded pages", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ items: [], limit: 10, offset: 10 }), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetcher);
    await api.list("claimant-2", 10);
    expect(fetcher).toHaveBeenCalledWith(
      "/api/claims?limit=10&offset=10",
      expect.objectContaining({
        method: "GET",
        headers: { "X-Demo-Actor-Id": "claimant-2" },
      }),
    );
  });
  it("sends the exact transition envelope without role or state overrides", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ claim, auditEventId: "event", notificationIds: [] }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetcher);
    const command = {
      transitionId: "submit",
      expectedRevision: 0,
      commandId: crypto.randomUUID(),
      input: {},
    };
    await api.transition("claimant-1", claim.id, command);
    expect(fetcher).toHaveBeenCalledWith(
      `/api/claims/${claim.id}/transitions`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(command),
      }),
    );
  });
  it("marks network and unreadable success responses as uncertain", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(new Response("bad JSON", { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    await expect(
      api.create("claimant-1", { title: "X", description: "Y" }),
    ).rejects.toMatchObject({ code: "NETWORK_ERROR", uncertain: true });
    await expect(api.list("claimant-1", 0)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      uncertain: true,
    });
  });
  it.each([409, 403])(
    "preserves stable HTTP %s errors without marking them uncertain",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            new Response(
              JSON.stringify({
                error: { code: "BACKEND_ERROR", message: "Rejected" },
              }),
              { status },
            ),
          ),
      );
      await expect(api.list("claimant-1", 0)).rejects.toMatchObject({
        code: "BACKEND_ERROR",
        status,
        message: "Rejected",
        uncertain: false,
      });
    },
  );
  it("never sends a demo identity header in production mode", async () => {
    vi.stubEnv("DEV", false);
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    await api.list("claimant-1", 0);
    expect(fetcher).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: {} }),
    );
  });
  it("treats server/proxy failures as safe same-command retry candidates", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response('{"error":{"code":"STORAGE_BUSY","message":"Busy"}}', {
            status: 503,
          }),
        ),
    );
    await expect(api.list("claimant-1", 0)).rejects.toMatchObject({
      code: "STORAGE_BUSY",
      status: 503,
      uncertain: true,
    });
  });
});
