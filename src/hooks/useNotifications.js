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

// GET /api/v1/notifications/preferences
async function fetchPreferences() {
  const res = await client.get("/notifications/preferences");
  return res.data.data;
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
    mutationFn: patchPreferences,
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "preferences"] });
      const previous = queryClient.getQueryData(["notifications", "preferences"]);
      queryClient.setQueryData(["notifications", "preferences"], (old) => ({ ...old, ...next }));
      return { previous };
    },
    onError: (_err, _next, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["notifications", "preferences"], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "preferences"] });
    },
  });

  return {
    preferences: query.data ?? {},
    isLoading: query.isLoading,
    error: query.error,
    update: (key, value) => update.mutate({ [key]: value }),
  };
}
