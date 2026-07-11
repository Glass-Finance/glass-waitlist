import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyCommunities } from "../api/members";
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
// button on "Request sent" across reloads. There's no rejection signal, so
// older entries drop out and the member can request again rather than being
// locked out forever by a request an admin quietly rejected.
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

  const [approved, setApproved] = useState([]);

  useEffect(() => {
    if (!communities?.length) return;
    const pending = readPending();
    if (!pending.length) return;

    const matched = [];
    const remaining = [];
    for (const p of pending) {
      const hit = communities.find((c) => {
        const cid = c.id ?? c.community?.id;
        const cslug = c.slug ?? c.community?.slug;
        const status = (c.memberStatus ?? "ACTIVE").toUpperCase();
        return (
          status === "ACTIVE" &&
          ((p.id && cid === p.id) || (p.slug && cslug === p.slug))
        );
      });
      if (hit) {
        matched.push({
          ...p,
          communitySlug: hit.slug ?? hit.community?.slug ?? p.slug,
          communityId: hit.id ?? hit.community?.id ?? p.id,
          name: hit.name ?? hit.community?.name ?? p.name,
        });
      } else {
        remaining.push(p);
      }
    }

    if (matched.length) {
      writePending(remaining);
      setApproved((prev) => [...prev, ...matched]);
      for (const m of matched) {
        toastSuccess(`You're in! Your request to join ${m.name} was approved`);
      }
    }
  }, [communities]);

  return {
    approved,
    dismiss: (entry) =>
      setApproved((prev) => prev.filter((a) => a !== entry)),
  };
}
