import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "../../api/client";
import { exportMyObligations, exportMyTransactions } from "../../api/exports";

// The two member-scoped export triggers. Paths are literal so CI's
// `npm run audit:endpoints --strict` can prove they're deployed — GET
// /exports/{id} is caller-scoped, so polling a job started here works for a
// plain member exactly as it does for an admin.
vi.mock("../../api/client", () => ({
  default: { post: vi.fn() },
}));

beforeEach(() => {
  client.post.mockReset();
});

describe("member exports", () => {
  it("POSTs the member's own obligations export with no filters by default", () => {
    exportMyObligations({});
    expect(client.post).toHaveBeenCalledWith("/finance/obligations/me/export", null, {
      params: { format: "CSV" },
    });
  });

  it("POSTs the member's own transactions export with no filters by default", () => {
    exportMyTransactions({});
    expect(client.post).toHaveBeenCalledWith("/finance/transactions/me/export", null, {
      params: { format: "CSV" },
    });
  });

  it("forwards a selected status and format as query params, not a body", () => {
    exportMyTransactions({ status: "SUCCESS" }, "XLSX");
    const [url, body, config] = client.post.mock.calls[0];
    expect(url).toBe("/finance/transactions/me/export");
    expect(body).toBeNull();
    expect(config.params).toEqual({ status: "SUCCESS", format: "XLSX" });
  });
});
