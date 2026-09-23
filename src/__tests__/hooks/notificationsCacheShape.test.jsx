import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAllNotifications, selectNotificationItems } from "../../hooks/useNotifications";
import { useJoinApprovalWatcher } from "../../hooks/useJoinApproval";
import client from "../../api/client";
import { getMyCommunities } from "../../api/members";

vi.mock("../../api/client", () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}));

vi.mock("../../api/members", () => ({
  getMyCommunities: vi.fn(),
}));

vi.mock("../../hooks/useActiveCommunityId", () => ({
  useActiveCommunityId: () => null,
}));

vi.mock("../../hooks/useCommunities", () => ({
  useCommunities: () => ({ data: undefined }),
}));

vi.mock("../../hooks/useRealtimeStream", () => ({
  useRealtimeConnected: () => false,
}));

vi.mock("../../utils/toast", () => ({
  toastSuccess: vi.fn(),
}));

const LIST_KEY = ["notifications", "all", "list"];
const PENDING_KEY = "glass_pending_join_requests";

// The payload shape the shared queryFn caches: the raw /notifications
// envelope. Consumers derive from it with `select` — they never replace it.
const ENVELOPE = {
  content: [
    {
      id: "n-rejected",
      notificationType: "JOIN_REQUEST_REJECTED",
      title: "Request rejected",
      message: "Your request to join Acme Co was rejected",
      createdAt: "2026-02-01T09:00:00.000Z",
      readFlag: false,
      communityId: null,
      content: { communityId: "community-1" },
    },
    {
      id: "n-older",
      notificationType: "PAYMENT_RECEIVED",
      title: "Payment received",
      message: "You paid your dues",
      createdAt: "2026-01-01T09:00:00.000Z",
      readFlag: true,
      communityId: null,
      content: {},
    },
  ],
  pageNumber: 0,
  pageSize: 50,
};

function notificationFetches() {
  return client.get.mock.calls.filter(([url]) => url === "/notifications").length;
}

// Mounts both observers of ["notifications", "all", "list"] against one
// QueryClient in a chosen order — whichever queryFn registers first is the one
// that populates the entry, which is exactly the race the old two-queryFn
// arrangement lost.
function mountInOrder(order) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  let list;
  let watcher;
  if (order === "list-first") {
    list = renderHook(() => useAllNotifications(), { wrapper });
    watcher = renderHook(() => useJoinApprovalWatcher(), { wrapper });
  } else {
    watcher = renderHook(() => useJoinApprovalWatcher(), { wrapper });
    list = renderHook(() => useAllNotifications(), { wrapper });
  }

  return { queryClient, list, watcher };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  client.get.mockResolvedValue({ data: { data: ENVELOPE } });
  getMyCommunities.mockResolvedValue({ data: { data: { content: [] } } });
  // A join request the watcher tracks, which can only ever be resolved by
  // reading JOIN_REQUEST_REJECTED out of the shared notification list.
  localStorage.setItem(
    PENDING_KEY,
    JSON.stringify([
      { id: "community-1", slug: "acme-co", name: "Acme Co", requestedAt: Date.now() },
    ]),
  );
});

describe('F1 — ["notifications", "all", "list"] cache shape', () => {
  it.each(["list-first", "watcher-first"])(
    "stores one envelope and serves both consumers their own shape (%s)",
    async (order) => {
      const { queryClient, list, watcher } = mountInOrder(order);

      // One key → one queryFn → one request, whoever mounts first.
      await waitFor(() => expect(list.result.current.notifications).toHaveLength(2));
      expect(notificationFetches()).toBe(1);

      // The cached value is the envelope, never the unwrapped array.
      const cached = queryClient.getQueryData(LIST_KEY);
      expect(Array.isArray(cached)).toBe(false);
      expect(cached.content).toHaveLength(2);

      // List consumer (Topbar / CommunitiesHome / dashboard Notifications):
      // an array, newest first.
      expect(list.result.current.notifications.map((n) => n.id)).toEqual(["n-rejected", "n-older"]);

      // Watcher consumer: same key, and its `select` is the only thing that
      // turns the entry into the array it calls `.some()` on.
      const watcherView = selectNotificationItems(cached);
      expect(Array.isArray(watcherView)).toBe(true);
      expect(watcherView).toHaveLength(2);

      // The actual P1 failure mode: that `.some()` lives in the watcher's
      // effect, which clears tracked join requests. Being handed the envelope
      // (or a bare array to the list hook) threw / silently rendered nothing,
      // so the pending entry was never resolved.
      await waitFor(() => expect(watcher.result.current.pending).toHaveLength(0));
      expect(JSON.parse(localStorage.getItem(PENDING_KEY))).toEqual([]);
      expect(watcher.result.current.approved).toEqual([]);
    },
  );

  it('reaches both observers when invalidated via the ["notifications"] prefix', async () => {
    const { queryClient, list } = mountInOrder("list-first");
    await waitFor(() => expect(list.result.current.notifications).toHaveLength(2));

    const before = notificationFetches();
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });

    await waitFor(() => expect(notificationFetches()).toBeGreaterThan(before));
    expect(queryClient.getQueryState(LIST_KEY)).toBeDefined();
  });

  it("keeps both consumers on an empty list when the envelope has no content", async () => {
    client.get.mockResolvedValue({ data: { data: { content: [], pageNumber: 0 } } });
    const { queryClient, list, watcher } = mountInOrder("list-first");

    await waitFor(() => expect(list.result.current.notifications).toEqual([]));
    expect(list.result.current.unreadCount).toBe(0);
    expect(selectNotificationItems(queryClient.getQueryData(LIST_KEY))).toEqual([]);
    // No data to decide from → the tracked request is left alone, not dropped.
    expect(watcher.result.current.pending).toHaveLength(1);
  });

  it("tolerates a bare-array payload without breaking either consumer", async () => {
    client.get.mockResolvedValue({ data: { data: ENVELOPE.content } });
    const { queryClient, list, watcher } = mountInOrder("watcher-first");

    await waitFor(() => expect(list.result.current.notifications).toHaveLength(2));
    expect(queryClient.getQueryData(LIST_KEY)).toEqual(ENVELOPE.content);
    expect(selectNotificationItems(queryClient.getQueryData(LIST_KEY))).toHaveLength(2);
    await waitFor(() => expect(watcher.result.current.pending).toHaveLength(0));
  });
});
