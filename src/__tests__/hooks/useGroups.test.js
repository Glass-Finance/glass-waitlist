import { describe, it, expect } from "vitest";
import { isArchivedGroup } from "../../hooks/useGroups";

// `status` is fixed by the backend enum CommunityMemberGroupStatus { ACTIVE,
// ARCHIVED } (confirmed against both the Java enum and the OpenAPI property
// enum). These tests pin the exact comparison, including the fact that an
// `archivedAt` timestamp alone no longer counts — the enum is the contract.

describe("isArchivedGroup", () => {
  it("treats exactly ARCHIVED as archived", () => {
    expect(isArchivedGroup({ status: "ARCHIVED" })).toBe(true);
  });

  it("treats exactly ACTIVE as not archived", () => {
    expect(isArchivedGroup({ status: "ACTIVE" })).toBe(false);
  });

  it("does not guess at other status strings", () => {
    // The old implementation matched /ARCHIV/ and fell back to archivedAt, so
    // "ARCHIVED_PENDING" and a bare timestamp both counted. Neither is a value
    // the backend can send, and guessing at them is what this correction removes.
    expect(isArchivedGroup({ status: "ARCHIVED_PENDING" })).toBe(false);
    expect(isArchivedGroup({ status: "archived" })).toBe(false);
    expect(isArchivedGroup({ archivedAt: "2026-09-28T10:00:00Z" })).toBe(false);
  });

  it("tolerates a missing group or status", () => {
    expect(isArchivedGroup(null)).toBe(false);
    expect(isArchivedGroup(undefined)).toBe(false);
    expect(isArchivedGroup({})).toBe(false);
  });
});
