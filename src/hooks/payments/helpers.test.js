import { describe, it, expect } from "vitest";
import { unwrapList, deriveStatus } from "./helpers";

describe("unwrapList", () => {
  it("returns a bare array response as-is", () => {
    expect(unwrapList({ data: { data: [1, 2, 3] } })).toEqual([1, 2, 3]);
  });

  it("unwraps a paginated envelope's content field", () => {
    const res = { data: { data: { content: ["a", "b"], pageNumber: 0 } } };
    expect(unwrapList(res)).toEqual(["a", "b"]);
  });

  it("returns an empty array when data is missing entirely", () => {
    expect(unwrapList({ data: {} })).toEqual([]);
    expect(unwrapList({})).toEqual([]);
  });

  it("returns an empty array when the envelope has no content field", () => {
    expect(unwrapList({ data: { data: { pageNumber: 0 } } })).toEqual([]);
  });
});

describe("deriveStatus", () => {
  it("returns 'paid' whenever status is PAID, regardless of dueDate", () => {
    expect(deriveStatus({ status: "PAID", dueDate: "2020-01-01" })).toBe("paid");
  });

  it("returns 'overdue' when dueDate is in the past", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(deriveStatus({ status: "PENDING", dueDate: yesterday })).toBe("overdue");
  });

  it("returns 'due_soon' when dueDate is within 7 days", () => {
    const in3Days = new Date(Date.now() + 3 * 86400000).toISOString();
    expect(deriveStatus({ status: "PENDING", dueDate: in3Days })).toBe("due_soon");
  });

  it("returns 'upcoming' when dueDate is more than 7 days out", () => {
    const in30Days = new Date(Date.now() + 30 * 86400000).toISOString();
    expect(deriveStatus({ status: "PENDING", dueDate: in30Days })).toBe("upcoming");
  });
});
