import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyCommunities } from "../api/members";
import client from "../api/client";
import { toastSuccess } from "../utils/toast";

// The backend sends no reliable signal to the requesting member when an
// admin approves their join request — so the member app tracks its own
// outgoing requests and watches the communities list: the moment a tracked
// community shows up as an ACTIVE membership, the request was approved.
// Result: a toast + a dismissible "you're in" banner on Home (see
// useJoinApprovalWatcher's `approved` return).
const PENDING_KEY = "glass_pending_join_requests";

function readPending() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY)) ?? [];
  } catch {
    return [];
  }
}

function writePending(list) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-20)));
  } catch {
    /* ignore */
  }
}

// Called by DiscoverCommunities when a join request goes to PENDING.
export function recordPendingJoinRequest({ id, slug, name }) {
  if (!id && !slug) return;
  const list = readPending().filter((e) => e.id !== id);
  list.push({
    id: id ?? null,
    slug: slug ?? null,
    name: name ?? "the community",
    requestedAt: Date.now(),
  });
  writePending(list);
}

// Pending requests younger than 14 days — Discover uses this to keep the
// button on "Request sent" across reloads. useJoinApprovalWatcher below is
// what actually clears an entry once the backend resolves it (approved or
// rejected); the TTL here is just a last-resort backstop in case that watch
// never runs for some reason, so the member isn't locked out forever.
const PENDING_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function getPendingJoinRequests() {
  return readPending().filter(
    (e) => !e.requestedAt || Date.now() - e.requestedAt < PENDING_TTL_MS,
  );
}

function unwrapList(res) {
  const data = res.data?.data;
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}

// GET /communities/join-requests/me was the obvious place to look for a
// REJECTED outcome, but confirmed against the live backend it comes back
// empty (totalElements: 0) even for an account with a real, confirmed
// rejection sitting in the admin's own Join Requests list -- it apparently
// only ever surfaces PENDING requests, not resolved ones. The notification
// the backend already sends the member on rejection (JOIN_REQUEST_REJECTED,
// same feed the bell badge polls) is the only signal that's actually been
// observed to work.
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fetchRecentNotifications() {
  const res = await client.get("/notifications", { params: { pageSize: 50 } });
  const data = res.data?.data;
  return Array.isArray(data) ? data : (data?.content ?? []);
}

export function useJoinApprovalWatcher() {
  // Same key/queryFn as the rest of the app — shares the cached list, so
  // this adds no extra network traffic.
  const { data: communities } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => unwrapList(await getMyCommunities()),
    staleTime: 1000 * 60 * 5,
  });

  // A rejected request never becomes a membership, so it can never show up
  // in `communities` above — the JOIN_REQUEST_REJECTED notification the
  // backend sends the member is what lets a rejected card flip back to
  // "Request to Join" instead of sitting on "Request sent" until the TTL.
  const { data: notifications } = useQuery({
    queryKey: ["notifications", "all", "list"],
    queryFn: fetchRecentNotifications,
    staleTime: 1000 * 20,
  });

  const [approved, setApproved] = useState([]);
  const [pending, setPending] = useState(() => getPendingJoinRequests());

  useEffect(() => {
    if (!communities?.length && !notifications?.length) return;
    const current = readPending();
    if (!current.length) return;

    const matched = [];
    const remaining = [];
    for (const p of current) {
      const activeHit = communities?.find((c) => {
        const cid = c.id ?? c.community?.id;
        const cslug = c.slug ?? c.community?.slug;
        const status = (c.memberStatus ?? "ACTIVE").toUpperCase();
        return (
          status === "ACTIVE" &&
          ((p.id && cid === p.id) || (p.slug && cslug === p.slug))
        );
      });
      if (activeHit) {
        matched.push({
          ...p,
          communitySlug: activeHit.slug ?? activeHit.community?.slug ?? p.slug,
          communityId: activeHit.id ?? activeHit.community?.id ?? p.id,
          name: activeHit.name ?? activeHit.community?.name ?? p.name,
        });
        continue;
      }
      const rejected = notifications?.some((n) => {
        const type = (n.notificationType ?? n.type ?? "").toUpperCase();
        if (type !== "JOIN_REQUEST_REJECTED") return false;
        // Confirmed against a real payload: the top-level communityId comes
        // back null on this notification type -- the real id lives in
        // content.communityId, and again as relatedEntityId (paired with
        // relatedEntityType "Community").
        const nid =
          n.communityId ??
          n.content?.communityId ??
          (n.relatedEntityType === "Community" ? n.relatedEntityId : null);
        if (p.id && nid && nid === p.id) return true;
        // Id still isn't guaranteed on every payload -- fall back to
        // matching the tracked community's name (as a whole word, so a
        // short name doesn't match unrelated text) against the
        // notification's own title/message.
        if (p.name && p.name !== "the community") {
          const text = `${n.title ?? ""} ${n.message ?? n.bodyText ?? ""}`;
          const re = new RegExp(`\\b${escapeRegex(p.name)}\\b`, "i");
          if (re.test(text)) return true;
        }
        return false;
      });
      if (rejected) continue;
      remaining.push(p);
    }

    if (remaining.length !== current.length) {
      writePending(remaining);
      setPending(getPendingJoinRequests());
    }
    if (matched.length) {
      setApproved((prev) => [...prev, ...matched]);
      for (const m of matched) {
        toastSuccess(`You're in! Your request to join ${m.name} was approved`);
      }
    }
  }, [communities, notifications]);

  return {
    approved,
    dismiss: (entry) =>
      setApproved((prev) => prev.filter((a) => a !== entry)),
    pending,
  };
}
