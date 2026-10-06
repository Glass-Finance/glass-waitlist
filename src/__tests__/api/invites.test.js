import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "../../api/client";
import { revokeMyJoinRequest } from "../../api/invites";

// Path kept literal (not built in a helper) so `npm run audit:endpoints`
// can regex it out and prove the route exists on the deployed API — same
// reasoning as the settlements reads in api/transactions.js.
vi.mock("../../api/client", () => ({
  default: { patch: vi.fn() },
}));

describe("revokeMyJoinRequest", () => {
  beforeEach(() => {
    client.patch.mockReset();
  });

  it("PATCHes the requester-only revoke route on the community it belongs to", () => {
    revokeMyJoinRequest("glass-crew", "req-7");
    expect(client.patch).toHaveBeenCalledWith("/communities/glass-crew/join-requests/req-7/revoke");
  });

  it("sends no body — the backend takes only path vars", () => {
    revokeMyJoinRequest("glass-crew", "req-7");
    expect(client.patch.mock.calls[0]).toHaveLength(1);
  });
});
