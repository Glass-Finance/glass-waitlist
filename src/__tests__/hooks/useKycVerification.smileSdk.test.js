import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useKycVerification } from "../../hooks/useKycVerification";
import { DEFAULT_SMILE_CALLBACK_URL } from "../../api/kyc";

// Regression guard for a LIVE break: the Smile Identity Web SDK throws
// synchronously when its initialisation call omits `callback_url`
// ("SmileIdentity: Please provide a callback URL via the 'callback_url'
// attribute"), which killed the whole capture step — no document or camera
// ever started, and every resume hit the same wall.
//
// The SDK does not read a callback out of the capture token, so the option has
// to be present on the call itself. KycWizardModal.test.jsx could never catch
// this: it mocks this whole hook, so nothing asserted the SDK's options.

const { mockKyc, mockStart, mockRefresh, mockConfirm } = vi.hoisted(() => ({
  mockKyc: { current: {} },
  mockStart: { current: null },
  mockRefresh: { current: null },
  mockConfirm: { current: null },
}));

vi.mock("../../hooks/useKyc", () => ({
  useKycSummary: () => mockKyc.current,
  useStartKycAttempt: () => ({ mutateAsync: mockStart.current }),
  useRefreshKycToken: () => ({ mutateAsync: mockRefresh.current }),
  useConfirmKycSubmission: () => ({ mutateAsync: mockConfirm.current }),
}));

// The real loader injects the Smile ID CDN <script>; in jsdom that is both
// pointless and a network call. Everything asserted here is the options object
// handed to the already-present window.SmileIdentity stub.
vi.mock("../../utils/smileScript", () => ({ loadSmileScript: () => Promise.resolve() }));

const SESSION = { attemptId: "attempt-1", token: "capture-token" };

function summary(overrides = {}) {
  return {
    summary: { status: "NOT_STARTED", canStart: true, attemptsAllowed: true },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
    ...overrides,
  };
}

// useKycSummary is a useQuery result — the hook under test reads
// `useKycSummary().data`, and derives canRefreshToken / activeAttemptId from
// THAT object, so the mock has to hand back a query-shaped object or every
// resume path silently no-ops.
function queryResult(overrides = {}) {
  const data = summary().summary;
  return {
    data: { ...data, ...overrides },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  };
}

let smile;

beforeEach(() => {
  mockKyc.current = queryResult();
  mockStart.current = vi.fn().mockResolvedValue(SESSION);
  mockRefresh.current = vi.fn().mockResolvedValue(SESSION);
  mockConfirm.current = vi.fn().mockResolvedValue(undefined);
  smile = vi.fn();
  vi.stubGlobal("SmileIdentity", smile);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function render() {
  return renderHook(() => useKycVerification());
}

describe("useKycVerification — Smile Identity SDK initialisation", () => {
  it("passes the required callback_url when starting an attempt", async () => {
    const { result } = render();

    await act(async () => {
      await result.current.handleStart();
    });

    expect(smile).toHaveBeenCalledTimes(1);
    const options = smile.mock.calls[0][0];
    expect(options.callback_url).toBe(DEFAULT_SMILE_CALLBACK_URL);
    expect(options.callback_url).toBe("https://api.glasspay.app/api/v1/webhooks/smile-id");
  });

  it("passes the required callback_url when resuming an open attempt", async () => {
    // Resume is the path the broken build's users were stuck on: the status
    // step kept offering "Continue" and every attempt re-threw.
    mockKyc.current = queryResult({
      status: "PENDING",
      canStart: false,
      canRefreshToken: true,
      attemptId: "attempt-9",
    });
    const { result } = render();

    await act(async () => {
      await result.current.handleResume();
    });

    expect(smile).toHaveBeenCalledTimes(1);
    expect(smile.mock.calls[0][0].callback_url).toBe(DEFAULT_SMILE_CALLBACK_URL);
    // Resume must still mint a fresh token rather than reuse a stale one.
    expect(mockRefresh.current).toHaveBeenCalledWith("attempt-9");
    expect(smile.mock.calls[0][0].token).toBe("capture-token");
  });

  it("preserves the rest of the SDK contract", async () => {
    // The fix must add callback_url and change nothing else about the call.
    const { result } = render();

    await act(async () => {
      await result.current.handleStart();
    });

    const options = smile.mock.calls[0][0];
    expect(options).toMatchObject({
      token: "capture-token",
      product: "biometric_kyc",
      environment: "sandbox", // no VITE_SMILE_ENV set in tests
    });
    expect(options.partner_details).toMatchObject({ name: "Glass" });
    expect(typeof options.onSuccess).toBe("function");
    expect(typeof options.onError).toBe("function");
    expect(typeof options.onClose).toBe("function");
  });

  it("still confirms submission on SDK success", async () => {
    const { result } = render();

    await act(async () => {
      await result.current.handleStart();
    });
    const { onSuccess } = smile.mock.calls[0][0];

    await act(async () => {
      onSuccess();
    });

    await waitFor(() => expect(mockConfirm.current).toHaveBeenCalledWith("attempt-1"));
  });

  it("surfaces an SDK launch error through localError, unchanged", async () => {
    smile.mockImplementation(() => {
      throw new Error(
        "SmileIdentity: Please provide a callback URL via the 'callback_url' attribute",
      );
    });
    const { result } = render();

    await act(async () => {
      await result.current.handleStart();
    });

    await waitFor(() => expect(result.current.localError).toContain("callback_url"));
  });
});
