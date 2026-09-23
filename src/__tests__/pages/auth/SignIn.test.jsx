import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import SignIn from "../../../pages/auth/SignIn";
import { useAuth } from "../../../store/AuthContext";
import { verifyMfaLogin, requestLoginOtp, verifyLoginOtp } from "../../../services/authService";
import { submitJoinRequest } from "../../../api/invites";

// Sign-in is the front door to every other flow and had zero coverage off the
// V8 baseline. AuthContext is mocked (per the repo's convention of mocking at
// the session boundary) so these tests pin SignIn's own behavior — field
// validation, inline error surfacing, loading state, the post-auth destination,
// and the MFA / one-time-code step handoffs — without a real session or a
// network call. login() and setSession() come back from this mock; the
// password-less OTP + MFA service calls SignIn makes directly are mocked below.
vi.mock("../../../store/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../../../services/authService", () => ({
  verifyMfaLogin: vi.fn(),
  requestLoginOtp: vi.fn(),
  verifyLoginOtp: vi.fn(),
}));
// Invite lookups only run for mobile member sessions (jsdom is desktop), but
// the pending ?community= join-request submission runs on any device during
// resolveDestination — mocked to assert that contract without a network call.
vi.mock("../../../api/invites", () => ({
  getMyInvites: vi.fn(),
  getMyCommunityJoinRequests: vi.fn(),
  submitJoinRequest: vi.fn(),
}));
// Avoids depending on Google's Identity Services in a jsdom test — this file's
// own sign-in behavior is what's under test here, not GoogleAuthButton's
// (same approach as EmailPhoneStep.test.jsx).
vi.mock("../../../components/auth/GoogleAuthButton", () => ({
  default: () => <div data-testid="google-auth-button" />,
}));

const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";
const ORIGINAL_UA = window.navigator.userAgent;
const ORIGINAL_WIDTH = window.innerWidth;

function setUA(ua) {
  Object.defineProperty(window.navigator, "userAgent", { value: ua, configurable: true });
}
function setWidth(width) {
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
}

// Captures where SignIn navigated to, including the query string the
// mobile-required handoff encodes its target into.
function DestinationMarker() {
  const location = useLocation();
  return <div data-testid="destination">{location.pathname + location.search}</div>;
}

function renderSignIn(initialPath = "/sign-in") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/member/app-sign-in" element={<SignIn />} />
        <Route path="/dashboard/admin-panel" element={<div>Admin panel</div>} />
        <Route path="/member/mobile-required" element={<DestinationMarker />} />
      </Routes>
    </MemoryRouter>,
  );
}

function fillCredentials(identifier, password) {
  fireEvent.change(screen.getByPlaceholderText("Enter your email or number"), {
    target: { value: identifier },
  });
  fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
    target: { value: password },
  });
}

function clickSignIn() {
  fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
}

function deferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  // Desktop device + an unauthenticated session by default; individual tests
  // override the auth mock. isMobileDevice() feeds resolvePostAuthDestination,
  // so pinning UA/width keeps the asserted destinations deterministic.
  setUA(DESKTOP_UA);
  setWidth(1440);
  useAuth.mockReturnValue({
    user: null,
    token: null,
    loading: false,
    sessionVerified: false,
    isAuthenticated: false,
    isPlatformAdmin: false,
    isAdmin: false,
    isMember: true,
    login: vi.fn(),
    logout: vi.fn(),
    setSession: vi.fn(),
    storeSessionIfPresent: vi.fn(),
    updateUser: vi.fn(),
    refreshUser: vi.fn(),
    hydrateUserProfile: vi.fn(),
  });
});

afterEach(() => {
  setUA(ORIGINAL_UA);
  setWidth(ORIGINAL_WIDTH);
  sessionStorage.clear();
});

describe("SignIn password form", () => {
  it("blocks submission and flags an invalid identifier without calling login", () => {
    renderSignIn();
    fillCredentials("bad@", "whatever1");

    clickSignIn();

    expect(screen.getByText("Enter a valid email address.")).toBeDefined();
    expect(useAuth().login).not.toHaveBeenCalled();
  });

  it("signs in and routes a platform admin to the admin panel, normalizing the email", async () => {
    renderSignIn();
    useAuth().login.mockResolvedValue({ isPlatformAdmin: true, isAdmin: true });

    fillCredentials("Owner@Example.com", "secret123");
    clickSignIn();

    expect(await screen.findByText("Admin panel")).toBeDefined();
    expect(useAuth().login).toHaveBeenCalledWith({
      email: "owner@example.com",
      password: "secret123",
    });
  });

  it("routes a non-admin member on desktop to the QR handoff instead of the member app", async () => {
    renderSignIn();
    useAuth().login.mockResolvedValue({ isPlatformAdmin: false, isAdmin: false });

    fillCredentials("member@example.com", "secret123");
    clickSignIn();

    const marker = await screen.findByTestId("destination");
    // The member app is mobile-only; resolvePostAuthDestination sends desktop
    // members to the mobile-required screen pointed back at the member
    // sign-in entry point.
    expect(marker.textContent).toBe("/member/mobile-required?to=%2Fmember%2Fapp-sign-in");
  });

  it("surfaces the pre-auth 401 as credential feedback and re-enables the form", async () => {
    renderSignIn();
    useAuth().login.mockRejectedValue({
      response: { status: 401, data: {} },
      config: { url: "/auth/login" },
    });

    fillCredentials("sulaimon@example.com", "wrongpassword");
    clickSignIn();

    expect(await screen.findByText("Incorrect email or password.")).toBeDefined();
    // Still on the sign-in form, not bounced anywhere, and free to retry.
    expect(screen.getByText("Sign In To Your Account")).toBeDefined();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Sign In" }).disabled).toBe(false),
    );
  });

  it("shows the submitting state and disables the inputs while login is in flight", async () => {
    renderSignIn();
    const gate = deferred();
    useAuth().login.mockReturnValue(gate.promise);

    fillCredentials("sulaimon@example.com", "secret123");
    clickSignIn();

    expect(screen.getByText("Signing in…")).toBeDefined();
    expect(screen.getByPlaceholderText("Enter your email or number").disabled).toBe(true);

    gate.resolve({ isPlatformAdmin: true, isAdmin: true });
    expect(await screen.findByText("Admin panel")).toBeDefined();
  });

  it("submits a pending community join request before resolving the destination", async () => {
    sessionStorage.setItem("glass_join_community", "glass-community-link");
    submitJoinRequest.mockResolvedValue({ data: {} });
    renderSignIn();
    useAuth().login.mockResolvedValue({ isPlatformAdmin: true, isAdmin: true });

    fillCredentials("owner@example.com", "secret123");
    clickSignIn();

    expect(await screen.findByText("Admin panel")).toBeDefined();
    expect(submitJoinRequest).toHaveBeenCalledWith("glass-community-link");
    // One-shot flag: consumed so a later sign-in can't re-submit it.
    expect(sessionStorage.getItem("glass_join_community")).toBeNull();
  });
});

describe("SignIn MFA challenge", () => {
  it("verifies the challenge code and completes sign-in via setSession", async () => {
    renderSignIn();
    const auth = useAuth();
    auth.login.mockResolvedValue({ mfaRequired: true, mfaChallengeToken: "challenge-1" });
    verifyMfaLogin.mockResolvedValue({ accessToken: "mfa-token" });
    auth.setSession.mockResolvedValue({ isPlatformAdmin: true, isAdmin: true });

    fillCredentials("sulaimon@example.com", "secret123");
    clickSignIn();

    expect(await screen.findByText("Enter MFA Code")).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText("000000"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify Code" }));

    expect(await screen.findByText("Admin panel")).toBeDefined();
    expect(verifyMfaLogin).toHaveBeenCalledWith({
      challengeToken: "challenge-1",
      code: "123456",
    });
    expect(auth.setSession).toHaveBeenCalledWith({ accessToken: "mfa-token" });
  });

  it("keeps the user on the challenge screen, clears the code, and explains a rejected code", async () => {
    renderSignIn();
    const auth = useAuth();
    auth.login.mockResolvedValue({ mfaRequired: true, mfaChallengeToken: "challenge-1" });
    verifyMfaLogin.mockRejectedValue({
      response: { status: 400, data: { message: "That code was not valid" } },
    });

    fillCredentials("sulaimon@example.com", "secret123");
    clickSignIn();
    await screen.findByText("Enter MFA Code");

    fireEvent.change(screen.getByPlaceholderText("000000"), { target: { value: "654321" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify Code" }));

    expect(await screen.findByText("That code was not valid")).toBeDefined();
    expect(screen.getByPlaceholderText("000000").value).toBe("");
    expect(screen.getByRole("button", { name: "Verify Code" }).disabled).toBe(true);
    expect(auth.setSession).not.toHaveBeenCalled();
  });
});

describe("SignIn one-time-code mode", () => {
  function switchToOtpMode() {
    fireEvent.click(screen.getByRole("button", { name: "One-Time Code" }));
  }

  it("flags an invalid identifier before requesting a code", () => {
    renderSignIn();
    switchToOtpMode();

    fireEvent.change(screen.getByPlaceholderText("Enter your email or number"), {
      target: { value: "bad@" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send Code" }));

    expect(screen.getByText("Enter a valid email address.")).toBeDefined();
    expect(requestLoginOtp).not.toHaveBeenCalled();
  });

  it("requests a code, verifies it, and completes sign-in via setSession", async () => {
    renderSignIn();
    const auth = useAuth();
    requestLoginOtp.mockResolvedValue({
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    verifyLoginOtp.mockResolvedValue({ accessToken: "otp-token" });
    auth.setSession.mockResolvedValue({ isPlatformAdmin: true, isAdmin: true });
    switchToOtpMode();

    fireEvent.change(screen.getByPlaceholderText("Enter your email or number"), {
      target: { value: "Member@Example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send Code" }));

    expect(await screen.findByText("Enter Your Code")).toBeDefined();
    expect(requestLoginOtp).toHaveBeenCalledWith({ email: "member@example.com" });

    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify & Sign In" }));

    expect(await screen.findByText("Admin panel")).toBeDefined();
    expect(verifyLoginOtp).toHaveBeenCalledWith({
      email: "member@example.com",
      token: "654321",
    });
    expect(auth.setSession).toHaveBeenCalledWith({ accessToken: "otp-token" });
  });

  it("stays on the code screen and explains a rejected code", async () => {
    renderSignIn();
    const auth = useAuth();
    requestLoginOtp.mockResolvedValue({
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    verifyLoginOtp.mockRejectedValue({
      response: { status: 400, data: { message: "That code has expired" } },
    });
    switchToOtpMode();

    fireEvent.change(screen.getByPlaceholderText("Enter your email or number"), {
      target: { value: "member@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send Code" }));
    await screen.findByText("Enter Your Code");

    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: "111222" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify & Sign In" }));

    expect(await screen.findByText("That code has expired")).toBeDefined();
    expect(screen.getByText("Enter Your Code")).toBeDefined();
    expect(auth.setSession).not.toHaveBeenCalled();
  });
});
