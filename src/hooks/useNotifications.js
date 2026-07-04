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

// GET /api/v1/notifications/unread-count
async function fetchUnreadCount(communityId) {
  const params = {};
  if (communityId) params.communityId = communityId;
  const res = await client.get("/notifications/unread-count", { params });
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
  const countKey = ["notifications", communityId, "count"];

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

  // ── Unread count ───────────────────────────────────────────────────────────
  const countQuery = useQuery({
    queryKey: countKey,
    queryFn: () => fetchUnreadCount(communityId),
    staleTime: 1000 * 20,
    gcTime:    1000 * 60 * 5,
    refetchInterval: 1000 * 30,
    refetchIntervalInBackground: false,
    select: (data) =>
      typeof data === "number" ? data : (data?.count ?? data?.unreadCount ?? 0),
  });

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
      queryClient.invalidateQueries({ queryKey: countKey });
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
      queryClient.setQueryData(countKey, 0);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(listKey, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
      queryClient.invalidateQueries({ queryKey: countKey });
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
      queryClient.setQueryData(countKey, 0);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: countKey });
    },
  });

  return {
    notifications:    query.data ?? [],
    isLoading:        query.isLoading,
    error:            query.error,
    unreadCount:      countQuery.data ?? 0,
    markRead:         (id) => markReadMutation.mutate(id),
    markAllRead:      () => markAllReadMutation.mutate(),
    isMarkingAllRead: markAllReadMutation.isPending,
    clearAll:         () => clearAllMutation.mutate(),
    isClearing:       clearAllMutation.isPending,
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
