import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";
import { useActiveCommunityId } from "./useActiveCommunityId";

// GET /api/v1/notifications — paginated envelope: { content, pageNumber, ... }
async function fetchNotifications(communityId) {
  const params = { pageSize: 50 };
  if (communityId) params.communityId = communityId;
  const res = await client.get("/notifications", { params });
  return res.data.data;
}

// PATCH /api/v1/notifications/{notificationId}/read
async function markOneRead(notificationId) {
  const res = await client.patch(`/notifications/${notificationId}/read`);
  return res.data;
}

// PATCH /api/v1/notifications/read-all
async function markAllRead() {
  const res = await client.patch("/notifications/read-all");
  return res.data;
}

function clearedAtKey(communityId) {
  return communityId
    ? `glass_notifications_cleared_at_${communityId}`
    : "glass_notifications_cleared_at";
}

export function useNotifications() {
  const communityId = useActiveCommunityId();
  const queryClient = useQueryClient();

  const listKey  = ["notifications", communityId, "list"];

  // ── Main list ──────────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: listKey,
    queryFn: () => fetchNotifications(communityId),
    staleTime: 1000 * 20,
    gcTime:    1000 * 60 * 5,
    refetchInterval: 1000 * 30,
    refetchIntervalInBackground: false,
    // Overrides the app-wide false: coming back to the tab (or the app on
    // mobile) should surface new notifications immediately, not up to 30s
    // later when the poll interval next fires.
    refetchOnWindowFocus: true,
    select: (data) => {
      const notifications = data?.content ?? [];
      const clearedAt = Number(localStorage.getItem(clearedAtKey(communityId)) ?? 0);
      return [...notifications]
        .filter((n) => {
          if (!clearedAt) return true;
          if (n.readFlag && new Date(n.createdAt).getTime() <= clearedAt) return false;
          return true;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
  });

  // Derive unread count from the already-filtered list so the badge always
  // reflects only the current community (the backend /unread-count endpoint
  // returns a global total and cannot be scoped per community).
  const unreadCount = useMemo(
    () => (query.data ?? []).filter((n) => !n.readFlag).length,
    [query.data]
  );

  // ── Mark one read ──────────────────────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: markOneRead,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData(listKey);
      queryClient.setQueryData(listKey, (old) =>
        old
          ? {
              ...old,
              content: old.content.map((n) =>
                n.id === notificationId ? { ...n, readFlag: true } : n
              ),
            }
          : old
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
    },
  });

  // ── Mark all read ──────────────────────────────────────────────────────────
  const markAllReadMutation = useMutation({
    mutationFn: markAllRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData(listKey);
      queryClient.setQueryData(listKey, (old) =>
        old
          ? { ...old, content: old.content.map((n) => ({ ...n, readFlag: true })) }
          : old
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
    },
  });

  // ── Clear all (mark read + hide from view persistently per community) ──────
  const clearAllMutation = useMutation({
    mutationFn: markAllRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: listKey });
      localStorage.setItem(clearedAtKey(communityId), String(Date.now()));
      queryClient.setQueryData(listKey, (old) =>
        old ? { ...old, content: [] } : old
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
    },
  });

  return {
    notifications:    query.data ?? [],
    isLoading:        query.isLoading,
    error:            query.error,
    unreadCount,
    markRead:         (id) => markReadMutation.mutate(id),
    markAllRead:      () => markAllReadMutation.mutate(),
    isMarkingAllRead: markAllReadMutation.isPending,
    clearAll:         () => clearAllMutation.mutate(),
    isClearing:       clearAllMutation.isPending,
  };
}

// ── Universal (all-community) hook — used by the Topbar dropdown panel ────────
// Does NOT scope by communityId so the panel shows every notification the
// user has, regardless of which community is currently active.
export function useAllNotifications() {
  const queryClient = useQueryClient();
  const listKey = ["notifications", "all", "list"];

  const query = useQuery({
    queryKey: listKey,
    queryFn: () => fetchNotifications(null),
    staleTime: 1000 * 20,
    gcTime:    1000 * 60 * 5,
    refetchInterval: 1000 * 30,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    select: (data) =>
      [...(data?.content ?? [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
  });

  const markReadMutation = useMutation({
    mutationFn: markOneRead,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData(listKey);
      queryClient.setQueryData(listKey, (old) =>
        old ? { ...old, content: old.content.map((n) => n.id === notificationId ? { ...n, readFlag: true } : n) } : old
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData(listKey);
      queryClient.setQueryData(listKey, (old) =>
        old ? { ...old, content: old.content.map((n) => ({ ...n, readFlag: true })) } : old
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  const unreadCount = useMemo(
    () => (query.data ?? []).filter((n) => !n.readFlag).length,
    [query.data]
  );

  return {
    notifications:    query.data ?? [],
    isLoading:        query.isLoading,
    unreadCount,
    markRead:         (id) => markReadMutation.mutate(id),
    markAllRead:      () => markAllReadMutation.mutate(),
    isMarkingAllRead: markAllReadMutation.isPending,
  };
}

// ── Preferences mirror ────────────────────────────────────────────────────────
// The backend currently persists only the channel toggles (inAppEnabled,
// emailEnabled, whatsappEnabled). Every category toggle (paymentReminder,
// receipts, failed payments, …) is accepted by the PATCH but never comes back
// from the GET — so after a refetch the missing key fell back to its default
// and the switch visibly snapped back on. Mirror all preferences locally:
// server fields always win when present; the mirror carries everything else
// until the backend stores those fields too.
const PREFS_MIRROR_KEY = "glass_notification_prefs";

function readPrefsMirror() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_MIRROR_KEY)) ?? {};
  } catch {
    return {};
  }
}

function writePrefsMirror(patch) {
  try {
    localStorage.setItem(
      PREFS_MIRROR_KEY,
      JSON.stringify({ ...readPrefsMirror(), ...patch }),
    );
  } catch {
    /* ignore */
  }
}

// GET /api/v1/notifications/preferences
async function fetchPreferences() {
  const res = await client.get("/notifications/preferences");
  return { ...readPrefsMirror(), ...(res.data.data ?? {}) };
}

// PATCH /api/v1/notifications/preferences
async function patchPreferences(payload) {
  const res = await client.patch("/notifications/preferences", payload);
  return res.data.data;
}

export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: fetchPreferences,
    staleTime: 1000 * 60 * 5,
  });

  const update = useMutation({
    mutationKey: ["notification-preferences"],
    mutationFn: patchPreferences,
    // Without this the toggle flips optimistically and nothing confirms the
    // save — indistinguishable from a broken switch when the user is unsure.
    meta: { successMessage: "Notification preferences saved" },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "preferences"] });
      const previous = queryClient.getQueryData(["notifications", "preferences"]);
      // Persist to the local mirror too — for fields the backend doesn't
      // store yet, this is what keeps the toggle where the user put it
      // across refetches and sessions.
      writePrefsMirror(next);
      queryClient.setQueryData(["notifications", "preferences"], (old) => ({ ...old, ...next }));
      return { previous };
    },
    onSuccess: (data) => {
      // The PATCH echoes the saved preferences — merge them in so the cache
      // reflects server truth without waiting for a refetch.
      if (data && typeof data === "object") {
        queryClient.setQueryData(["notifications", "preferences"], (old) => ({ ...old, ...data }));
      }
    },
    onError: (_err, next, ctx) => {
      if (ctx?.previous) {
        // Roll the mirror back too, only for the keys this failed PATCH touched.
        const revert = {};
        for (const k of Object.keys(next ?? {})) revert[k] = ctx.previous[k];
        writePrefsMirror(revert);
        queryClient.setQueryData(["notifications", "preferences"], ctx.previous);
      }
    },
    onSettled: () => {
      // Flipping several toggles quickly runs mutations concurrently — a
      // refetch triggered by an early one can return stale values and snap a
      // later toggle back. Only refetch once the last one settles.
      if (queryClient.isMutating({ mutationKey: ["notification-preferences"] }) === 1) {
        queryClient.invalidateQueries({ queryKey: ["notifications", "preferences"] });
      }
    },
  });

  return {
    preferences: query.data ?? {},
    isLoading: query.isLoading,
    error: query.error,
    update: (key, value) => update.mutate({ [key]: value }),
  };
}
