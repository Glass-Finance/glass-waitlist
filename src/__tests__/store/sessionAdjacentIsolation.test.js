import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  SESSION_KEYS,
  SESSION_ADJACENT_KEYS,
  clearSessionStorage,
  onSessionEnd,
} from "../../store/sessionStorage";
import { recordPendingJoinRequest, getPendingJoinRequests } from "../../hooks/useJoinApproval";

// useJoinApproval is only used here through its localStorage-facing helpers
// (recordPendingJoinRequest / getPendingJoinRequests) — nothing renders the
// watcher — but its module graph pulls in the notification hooks, so stub the
// collaborators that would otherwise construct a live query pipeline.
vi.mock("../../api/members", () => ({ getMyCommunities: vi.fn() }));
vi.mock("../../hooks/useActiveCommunityId", () => ({ useActiveCommunityId: () => null }));
vi.mock("../../hooks/useCommunities", () => ({ useCommunities: () => ({ data: undefined }) }));
vi.mock("../../hooks/useRealtimeStream", () => ({ useRealtimeConnected: () => false }));

// F6: session-adjacent localStorage isolation.
//
// These tests pin the invariant the whole sprint exists for — state that
// belongs to the authenticated user dies with that session — plus the
// ordering guarantee clearSessionStorage() is responsible for. They drive
// the real session-end funnel (clearSessionStorage), never a bare
// localStorage.removeItem, so they fail if the clear moves out of the
// lifecycle rather than merely if a key is forgotten.
describe("F6 — session-adjacent localStorage isolation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps SESSION_KEYS as exactly the seven canonical session keys", () => {
    // The adjacent list must NOT be folded into this one: SESSION_KEYS is
    // what AuthContext's cross-tab storage handler treats as "the session
    // ended", and SESSION_KEYS is what the epoch/clear contract is built on.
    expect(SESSION_KEYS).toEqual([
      "accessToken",
      "refreshToken",
      "glass_user",
      "userId",
      "userEmail",
      "glass_community",
      "glass_member_community",
    ]);
    expect(SESSION_KEYS).toHaveLength(7);
  });

  it("declares exactly the three F6 keys as session-adjacent", () => {
    expect([...SESSION_ADJACENT_KEYS].sort()).toEqual([
      "glass_last_google_identity",
      "glass_notification_prefs",
      "glass_pending_join_requests",
    ]);
    // No overlap — the two lists are cleared together but mean different
    // things to the cross-tab listener.
    expect(SESSION_ADJACENT_KEYS.some((k) => SESSION_KEYS.includes(k))).toBe(false);
  });

  it("clears session-adjacent state alongside the session keys, sparing unrelated keys", () => {
    SESSION_KEYS.forEach((k) => localStorage.setItem(k, "session"));
    SESSION_ADJACENT_KEYS.forEach((k) => localStorage.setItem(k, "user-state"));
    localStorage.setItem("glass_dashboard_tour_seen", "1");
    localStorage.setItem("glass_session_epoch", "7");

    clearSessionStorage();

    SESSION_KEYS.forEach((k) => expect(localStorage.getItem(k)).toBeNull());
    SESSION_ADJACENT_KEYS.forEach((k) => expect(localStorage.getItem(k)).toBeNull());
    // Global/device-scoped state and the epoch deliberately survive.
    expect(localStorage.getItem("glass_dashboard_tour_seen")).toBe("1");
    expect(localStorage.getItem("glass_session_epoch")).not.toBe("7");
  });

  it("has session-adjacent state already gone by the time onSessionEnd fires", () => {
    // Ordering is the point of the funnel: a listener must never observe a
    // half-cleared session where tokens are dropped but the user's own data
    // is still readable.
    SESSION_ADJACENT_KEYS.forEach((k) => localStorage.setItem(k, "user-state"));

    let observedAtNotify = null;
    const unsub = onSessionEnd(() => {
      observedAtNotify = SESSION_ADJACENT_KEYS.map((k) => localStorage.getItem(k));
    });
    clearSessionStorage();
    unsub();

    expect(observedAtNotify).not.toBeNull();
    expect(observedAtNotify).toEqual(SESSION_ADJACENT_KEYS.map(() => null));
  });

  it("F6-1: a second user cannot inherit the first user's pending join requests", () => {
    // User A asks to join a community.
    recordPendingJoinRequest({ id: "c-1", slug: "acme-co", name: "Acme Co" });
    expect(getPendingJoinRequests()).toHaveLength(1);
    expect(getPendingJoinRequests()[0]).toMatchObject({ id: "c-1", slug: "acme-co" });

    // User A's session ends.
    clearSessionStorage();

    // User B mounting useJoinApprovalWatcher seeds its state from this read,
    // so an empty result here is what keeps User B off User A's communities.
    expect(localStorage.getItem("glass_pending_join_requests")).toBeNull();
    expect(getPendingJoinRequests()).toEqual([]);
  });

  it("F6-1: pending-join tracking still works while the session is alive", () => {
    // Guards against a fix that 'solves' isolation by never writing the key.
    recordPendingJoinRequest({ id: "c-1", slug: "acme-co", name: "Acme Co" });
    recordPendingJoinRequest({ id: "c-2", slug: "beta-ltd", name: "Beta Ltd" });

    expect(getPendingJoinRequests().map((p) => p.slug)).toEqual(["acme-co", "beta-ltd"]);

    // Re-requesting the same community replaces rather than duplicates it.
    recordPendingJoinRequest({ id: "c-1", slug: "acme-co", name: "Acme Co" });
    expect(getPendingJoinRequests()).toHaveLength(2);
  });

  it("is idempotent across repeated session ends in the same tick", () => {
    SESSION_ADJACENT_KEYS.forEach((k) => localStorage.setItem(k, "user-state"));
    expect(() => {
      clearSessionStorage();
      clearSessionStorage();
    }).not.toThrow();
    SESSION_ADJACENT_KEYS.forEach((k) => expect(localStorage.getItem(k)).toBeNull());
  });
});
