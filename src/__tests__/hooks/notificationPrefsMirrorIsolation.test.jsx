import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useNotificationPreferences } from "../../hooks/useNotifications";
import client from "../../api/client";
import { clearSessionStorage } from "../../store/sessionStorage";

vi.mock("../../api/client", () => ({
  default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

// F6-2: the preference mirror is spread INSIDE the queryFn, so clearing the
// QueryClient on a session transition cannot remove it — only clearing the
// storage can. These tests prove (a) it dies with the session, (b) a later
// account's first GET therefore cannot merge the previous account's category
// toggles, and (c) the mirror still does its job while the session is alive.
const MIRROR_KEY = "glass_notification_prefs";

// What the backend actually returns: channel toggles only. Category toggles
// (paymentReminder, receipts, ...) are accepted by PATCH but never come back
// from GET — exactly why the mirror exists.
const SERVER_PREFS = { inAppEnabled: true, emailEnabled: true, whatsappEnabled: true };

const USER_A_MIRROR = {
  paymentReminderEnabled: false,
  paymentReceiptEnabled: false,
  emailEnabled: false,
};

function wrapper({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function seedMirror(value = USER_A_MIRROR) {
  localStorage.setItem(MIRROR_KEY, JSON.stringify(value));
}

describe("F6-2 — notification preference mirror isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    client.get.mockResolvedValue({ data: { data: SERVER_PREFS } });
    client.patch.mockResolvedValue({ data: { data: SERVER_PREFS } });
  });

  it("clears the mirror when the session ends", () => {
    seedMirror();
    expect(localStorage.getItem(MIRROR_KEY)).not.toBeNull();

    clearSessionStorage();

    expect(localStorage.getItem(MIRROR_KEY)).toBeNull();
  });

  it("a preferences fetch after session end cannot merge the previous user's mirror", async () => {
    // User A left category toggles behind...
    seedMirror();
    // ...their session ends (the QueryClient is cleared too, on every
    // session transition)...
    clearSessionStorage();

    // ...and User B's first authenticated GET returns only what the backend
    // stores for them.
    const { result } = renderHook(() => useNotificationPreferences(), { wrapper });

    await waitFor(() => expect(result.current.preferences).toHaveProperty("inAppEnabled"));

    // Server truth, and nothing else: User A's category toggles must not
    // appear, and User A's emailEnabled:false must not override User B's
    // server value.
    expect(result.current.preferences).toEqual(SERVER_PREFS);
    expect(result.current.preferences.paymentReminderEnabled).toBeUndefined();
    expect(result.current.preferences.paymentReceiptEnabled).toBeUndefined();
  });

  it("still carries category toggles the backend omits, while the session is alive", async () => {
    // Same mirror, but no session end — the behavior the mirror exists for.
    seedMirror({ ...USER_A_MIRROR, emailEnabled: true });

    const { result } = renderHook(() => useNotificationPreferences(), { wrapper });

    await waitFor(() => expect(result.current.preferences).toHaveProperty("inAppEnabled"));

    // Mirror carries what GET doesn't return...
    expect(result.current.preferences.paymentReminderEnabled).toBe(false);
    expect(result.current.preferences.paymentReceiptEnabled).toBe(false);
    // ...and server fields still win wherever both have an opinion.
    expect(result.current.preferences.emailEnabled).toBe(true);
    expect(result.current.preferences.inAppEnabled).toBe(true);
  });

  it("still writes the mirror while the session is alive", async () => {
    const { result } = renderHook(() => useNotificationPreferences(), { wrapper });
    await waitFor(() => expect(result.current.preferences).toHaveProperty("inAppEnabled"));
    expect(localStorage.getItem(MIRROR_KEY)).toBeNull();

    act(() => {
      result.current.update("paymentReminderEnabled", false);
    });

    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(MIRROR_KEY))).toEqual({
        paymentReminderEnabled: false,
      }),
    );
  });
});
