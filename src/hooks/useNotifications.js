import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";

// GET /api/v1/notifications — returns a paginated envelope: { content, pageNumber, pageSize, totalElements, totalPages, last }
async function fetchNotifications() {
  const res = await client.get("/notifications", { params: { pageSize: 50 } });
  return res.data.data;
}

// GET /api/v1/notifications/unread-count
async function fetchUnreadCount() {
  const res = await client.get("/notifications/unread-count");
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

export function useNotifications() {
  const queryClient = useQueryClient();

  // ── Main list ──────────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 1000 * 20,
    gcTime:    1000 * 60 * 5,
    // Poll every 30s so the bell updates without requiring a page reload.
    // Window focus already triggers a refetch via TanStack Query's defaults.
    refetchInterval: 1000 * 30,
    refetchIntervalInBackground: false, // pause polling when tab is hidden
    select: (data) => {
      const notifications = data?.content ?? [];
      const clearedAt = Number(localStorage.getItem("glass_notifications_cleared_at") ?? 0);
      return [...notifications]
        .filter((n) => {
          if (!clearedAt) return true;
          // Hide read notifications that were present before the last clear.
          if (n.readFlag && new Date(n.createdAt).getTime() <= clearedAt) return false;
          return true;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
  });

  // ── Unread count (used by topbar bell + sidebar badge) ────────────────────
  const countQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
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
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData(["notifications"]);

      // Optimistically flip readFlag — the cache holds the raw paginated
      // envelope ({ content: [...] }), not the flat array `select` derives.
      queryClient.setQueryData(["notifications"], (old) =>
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
      if (ctx?.previous) queryClient.setQueryData(["notifications"], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  // ── Mark all read ──────────────────────────────────────────────────────────
  const markAllReadMutation = useMutation({
    mutationFn: markAllRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData(["notifications"]);

      queryClient.setQueryData(["notifications"], (old) =>
        old
          ? { ...old, content: old.content.map((n) => ({ ...n, readFlag: true })) }
          : old
      );
      queryClient.setQueryData(["notifications", "unread-count"], 0);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["notifications"], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  // ── Clear all (mark all read + hide from view persistently) ─────────────
  const clearAllMutation = useMutation({
    mutationFn: markAllRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      // Record the cleared timestamp so the select filter keeps them hidden
      // even after the poll refetches read notifications from the backend.
      localStorage.setItem("glass_notifications_cleared_at", String(Date.now()));
      queryClient.setQueryData(["notifications"], (old) =>
        old ? { ...old, content: [] } : old
      );
      queryClient.setQueryData(["notifications", "unread-count"], 0);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
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