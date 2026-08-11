import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyCommunities } from "../api/members";
import { getMyCommunityJoinRequests } from "../api/invites";
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

export function useJoinApprovalWatcher() {
  // Same key/queryFn as the rest of the app — shares the cached list, so
  // this adds no extra network traffic.
  const { data: communities } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => unwrapList(await getMyCommunities()),
    staleTime: 1000 * 60 * 5,
  });

  // A rejected request never becomes a membership, so it can never show up
  // in `communities` above — this is the only place a REJECTED outcome is
  // visible at all, and it's what lets a rejected card flip back to
  // "Request to Join" instead of sitting on "Request sent" until the TTL.
  const { data: joinRequests } = useQuery({
    queryKey: ["join-requests", "me"],
    queryFn: async () => unwrapList(await getMyCommunityJoinRequests()),
    staleTime: 1000 * 60,
  });

  const [approved, setApproved] = useState([]);
  const [pending, setPending] = useState(() => getPendingJoinRequests());

  useEffect(() => {
    if (!communities?.length && !joinRequests?.length) return;
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
      const rejected = joinRequests?.some((r) => {
        const rid = r.community?.id ?? r.communityId ?? r.id;
        const rslug = r.community?.slug ?? r.communitySlug ?? r.slug;
        const status = (r.status ?? "PENDING").toUpperCase();
        return (
          status === "REJECTED" &&
          ((p.id && rid === p.id) || (p.slug && rslug === p.slug))
        );
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
  }, [communities, joinRequests]);

  return {
    approved,
    dismiss: (entry) =>
      setApproved((prev) => prev.filter((a) => a !== entry)),
    pending,
  };
}
