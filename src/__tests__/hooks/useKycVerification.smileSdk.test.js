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
//
// The second live break was the same class of failure one field later — an
// unset VITE_SMILE_LOGO_URL reached production and the SDK rejected the whole
// capture on "Please include logo_url in the 'partner_details' object". The
// options bag is now validated against the full required set before the SDK is
// called, so the suite below covers every required field.

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

// A complete, valid deployment. The two REQUIRED values have no code default,
// so every test that expects the SDK to be reached has to provide them — which
// is exactly the misconfiguration that shipped broken.
const VALID_ENV = {
  VITE_SMILE_PARTNER_ID: "partner-123",
  VITE_SMILE_LOGO_URL: "https://cdn.glasspay.app/brand/glass-logo.png",
  // Pinned so the derived policy_url below is deterministic.
  VITE_APP_URL: "https://app.glasspay.app",
};

function stubEnv(overrides = {}) {
  for (const [key, value] of Object.entries({ ...VALID_ENV, ...overrides })) {
    if (value === undefined) vi.stubEnv(key, undefined);
    else vi.stubEnv(key, value);
  }
}

beforeEach(() => {
  stubEnv();
  mockKyc.current = queryResult();
  mockStart.current = vi.fn().mockResolvedValue(SESSION);
  mockRefresh.current = vi.fn().mockResolvedValue(SESSION);
  mockConfirm.current = vi.fn().mockResolvedValue(undefined);
  smile = vi.fn();
  vi.stubGlobal("SmileIdentity", smile);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
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
    // All five partner_details keys are required by the SDK for biometric_kyc.
    expect(options.partner_details).toEqual({
      name: "Glass",
      logo_url: VALID_ENV.VITE_SMILE_LOGO_URL,
      partner_id: VALID_ENV.VITE_SMILE_PARTNER_ID,
      policy_url: `${VALID_ENV.VITE_APP_URL}/legal/privacy-policy`, // derived, not set in env
      theme_color: "#002FA7",
    });
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

  it("blocks the capture on a missing logo URL and names the key", async () => {
    // The second live break: VITE_SMILE_LOGO_URL unset, and the SDK rejected
    // the whole capture step with "Please include logo_url in the
    // 'partner_details' object" — for every member, on every retry.
    stubEnv({ VITE_SMILE_LOGO_URL: undefined });
    const { result } = render();

    await act(async () => {
      await result.current.handleStart();
    });

    expect(smile).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.localError).toContain("VITE_SMILE_LOGO_URL"));
  });

  it("names every missing required option in one message, not just the first", async () => {
    stubEnv({ VITE_SMILE_LOGO_URL: undefined, VITE_SMILE_PARTNER_ID: undefined });
    const { result } = render();

    await act(async () => {
      await result.current.handleStart();
    });

    expect(smile).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.localError).toContain("VITE_SMILE_LOGO_URL");
      expect(result.current.localError).toContain("VITE_SMILE_PARTNER_ID");
    });
  });

  it("blocks the capture on a missing partner ID", async () => {
    stubEnv({ VITE_SMILE_PARTNER_ID: undefined });
    const { result } = render();

    await act(async () => {
      await result.current.handleStart();
    });

    expect(smile).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.localError).toContain("VITE_SMILE_PARTNER_ID"));
  });

  it("blocks the capture when the required options are blank rather than unset", async () => {
    stubEnv({ VITE_SMILE_LOGO_URL: "   ", VITE_SMILE_PARTNER_ID: "" });
    const { result } = render();

    await act(async () => {
      await result.current.handleStart();
    });

    expect(smile).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.localError).toContain("VITE_SMILE_LOGO_URL"));
  });

  it("blocks the capture when the API returns no token", async () => {
    mockStart.current = vi.fn().mockResolvedValue({ attemptId: "attempt-1" });
    const { result } = render();

    await act(async () => {
      await result.current.handleStart();
    });

    expect(smile).not.toHaveBeenCalled();
  });

  it("blocks a resume on missing configuration too", async () => {
    mockKyc.current = queryResult({
      status: "PENDING",
      canStart: false,
      canRefreshToken: true,
      attemptId: "attempt-9",
    });
    stubEnv({ VITE_SMILE_LOGO_URL: undefined });
    const { result } = render();

    await act(async () => {
      await result.current.handleResume();
    });

    expect(smile).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.localError).toContain("VITE_SMILE_LOGO_URL"));
  });

  it("omits the optional user_details and consent_information objects", async () => {
    // Neither is required when absent, and the app has no consent surface that
    // could back a `granted: true` — so the SDK call must not invent one.
    const { result } = render();

    await act(async () => {
      await result.current.handleStart();
    });

    const options = smile.mock.calls[0][0];
    expect(options).not.toHaveProperty("user_details");
    expect(options).not.toHaveProperty("consent_information");
  });

  it("keeps the partner details that do have code defaults working when env is empty", async () => {
    // name / theme_color / policy_url are optional in deployment; only logo_url
    // and partner_id are required. Unsetting the optional three must still pass.
    stubEnv({
      VITE_SMILE_PARTNER_NAME: undefined,
      VITE_SMILE_THEME_COLOR: undefined,
      VITE_SMILE_POLICY_URL: undefined,
      VITE_APP_URL: undefined,
    });
    const { result } = render();

    await act(async () => {
      await result.current.handleStart();
    });

    expect(smile).toHaveBeenCalledTimes(1);
    expect(smile.mock.calls[0][0].partner_details).toMatchObject({
      name: "Glass",
      theme_color: "#002FA7",
      policy_url: "/legal/privacy-policy", // VITE_APP_URL unset -> relative
    });
  });

  it("does not echo a configured value into the configuration error", async () => {
    stubEnv({ VITE_SMILE_LOGO_URL: undefined });
    const { result } = render();

    await act(async () => {
      await result.current.handleStart();
    });

    await waitFor(() => {
      expect(result.current.localError).toContain("VITE_SMILE_LOGO_URL");
      expect(result.current.localError).not.toContain(VALID_ENV.VITE_SMILE_PARTNER_ID);
    });
  });
});
