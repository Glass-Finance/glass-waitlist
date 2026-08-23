import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInviteToken } from "../../../../hooks/useInviteToken";
import { useJoinCommunityParam } from "../../../../hooks/useJoinCommunityParam";
import { useJoinEmailParam } from "../../../../hooks/useJoinEmailParam";
import { recordPendingJoinRequest } from "../../../../hooks/useJoinApproval";
import { register } from "../../../../services/authService";
import PhoneOTPStep from "../../SignUp/PhoneOTPStep";
import { submitJoinRequest } from "../../../../api/invites";
import { notifyError } from "../../../../utils/errorHandler";
import { toastSuccess } from "../../../../utils/toast";
import { useAuth } from "../../../../store/AuthContext";
import PageLoadingState from "../../../../components/memberApp/PageLoadingState";
import AuthLayout from "../../../../layouts/AuthLayout";
import { STEPS, PENDING_KEY } from "./constants";
import StepContact from "./StepContact";
import StepProfile from "./StepProfile";
import StepOTP from "./StepOTP";
import StepSignInOtp from "./StepSignInOtp";

// ---------------------------------------------------------------------------
// Join root
// ---------------------------------------------------------------------------
export default function Join() {
  const navigate = useNavigate();
  const { token, consumeToken } = useInviteToken();
  const { community, consumeCommunity } = useJoinCommunityParam();
  const joinEmail = useJoinEmailParam();
  const { setSession, isAuthenticated, loading: authLoading } = useAuth();

  // A user who already has a session (e.g. they're a member of another
  // community, or just left themselves logged in) shouldn't be forced
  // through the signup form just because they clicked an invite/join link —
  // join them into the community directly instead. Mirrors InviteLanding.jsx's
  // same already-authenticated short-circuit for the personalized-invite path.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (community) {
      consumeCommunity();
      submitJoinRequest(community)
        .then((res) => {
          const data = res?.data?.data ?? res?.data;
          const status = (data?.status ?? "").toUpperCase();
          if (status !== "APPROVED") {
            recordPendingJoinRequest({ id: null, slug: community, name: null });
          }
          toastSuccess("Join request sent", { description: "The community admin will review it shortly." });
        })
        .catch((err) => notifyError(err, { context: "Join community" }))
        .finally(() => navigate("/member/invites", { replace: true }));
      return;
    }
    // A personalized invite token only matters for account creation
    // (sent along with register()) — an already-authenticated user's
    // invite already exists server-side under their email, so just take
    // them to where every pending invite/join-request shows up.
    if (token) {
      consumeToken();
      navigate("/member/invites", { replace: true });
    }
  }, [authLoading, isAuthenticated, community, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const [email, setEmail] = useState(() => {
    try {
      const pending = sessionStorage.getItem(PENDING_KEY);
      return pending ? JSON.parse(pending).email : "";
    } catch { return ""; }
  });
  // Email/phone collected in StepContact, carried forward into StepProfile's
  // register() call. Seeded from joinEmail when arriving via CheckEmail.jsx's
  // QR (?email=) so scanning it doesn't drop what was already typed on
  // desktop -- useJoinEmailParam strips the param right after this first
  // read, but useState only consults its argument on mount, so the later
  // re-render (with the param gone) doesn't clobber this.
  const [contact, setContact] = useState({ email: joinEmail, phone: "" });
  const [phoneConfirmToken, setPhoneConfirmToken] = useState("");
  const [step, setStep] = useState(() => {
    if (email) return STEPS.OTP; // resuming a pending registration verification
    // Arrived via CheckEmail.jsx's QR with just an email, no personal
    // invite -- skip CONTACT/PROFILE entirely and go straight to signing
    // them in (see StepSignInOtp). A real invite token always takes the
    // normal registration path regardless, even if this combination could
    // somehow occur.
    if (joinEmail && !token) return STEPS.SIGNIN_OTP;
    return STEPS.CONTACT;
  });

  // Some backends issue a session immediately on register, others only
  // after email verification — store it the moment either response
  // actually includes a token, instead of assuming which step does it
  // (matches the admin SignUp flow's same pattern).
  function maybeStoreSession(authData) {
    if (authData?.accessToken) setSession(authData);
  }

  // The community's own generic, shareable "Invite Link" (?community=) has
  // no personal token to send at registration, unlike a personalized
  // invite — it goes through its own join-request call once the account
  // exists, then routes to /member/invites the same way a pending
  // personalized invite does, since both are "waiting on something" states
  // from the member's point of view.
  async function submitCommunityJoinAndRoute() {
    consumeCommunity();
    try {
      const res = await submitJoinRequest(community);
      const data = res?.data?.data ?? res?.data;
      const status = (data?.status ?? "").toUpperCase();
      // An open community approves instantly -- nothing to watch for in
      // that case. Otherwise, track it the same way DiscoverCommunities
      // does so Home's approval watcher can pick it up later, since this
      // link only carries a slug (no id/name yet -- the watcher fills
      // those in from the live communities list once it actually matches).
      if (status !== "APPROVED") {
        recordPendingJoinRequest({ id: null, slug: community, name: null });
      }
      toastSuccess("Join request sent", { description: "The community admin will review it shortly." });
    } catch (err) {
      notifyError(err, { context: "Join community" });
    }
    navigate("/member/invites", { replace: true });
  }

  function finishAndRoute() {
    consumeToken();
    if (community) {
      submitCommunityJoinAndRoute();
      return;
    }
    // A personalized invite grants access immediately (unlike the
    // join-request path above, which has its own confirmation toast) — say
    // so explicitly rather than silently dropping the new member onto Home
    // with no context for what just happened.
    if (token) {
      toastSuccess("You're in!", { description: "Welcome to the community." });
      navigate("/member/home", { replace: true });
      return;
    }
    // Neither a personal token nor a community slug -- this account was
    // created via the marketing site's contextless "Join A Community" CTA,
    // not a specific invite. /member/invites would just be empty; send them
    // straight to browsing instead of a dead end they'd have to find their
    // own way out of via Home's empty state. This is also the one path with
    // no other confirmation moment (the community-slug and token branches
    // above both have their own), and DiscoverCommunities' own header is
    // just "Browse Communities" with no acknowledgment that signup actually
    // succeeded -- worth saying so explicitly here instead of silently
    // landing them on a search box with no idea whether it worked.
    toastSuccess("Account created!", { description: "Find a community to join below." });
    navigate("/member/communities/search", { replace: true });
  }

  // Google already proves the user owns this email, so registration is
  // immediate — no OTP step needed. Note: the invite token isn't sent to
  // /auth/google today (it only takes a credential), so it's never
  // actually applied here — unlike finishAndRoute() above (used after the
  // regular register()+OTP flow, which does send the token), a pending
  // invite needs /member/invites to accept it manually instead of
  // /member/home, the opposite direction of finishAndRoute()'s ternary.
  function handleGoogleAuth() {
    consumeToken();
    if (community) {
      submitCommunityJoinAndRoute();
      return;
    }
    if (token) {
      navigate("/member/invites", { replace: true });
      return;
    }
    // Same missing-confirmation gap as finishAndRoute()'s equivalent branch
    // above -- kept in sync with it.
    toastSuccess("Account created!", { description: "Find a community to join below." });
    navigate("/member/communities/search", { replace: true });
  }

  function handleContactNext({ email: enteredEmail, phone }) {
    setContact({ email: enteredEmail, phone });
    // StepContact requires a phone number client-side (see its
    // validatePhone), so this step always runs today -- the empty-phone
    // fallback exists for symmetry with SignUp.jsx and in case that
    // requirement is ever relaxed to match the backend's "phone stays
    // optional" stance.
    setStep(phone ? STEPS.PHONE_OTP : STEPS.PROFILE);
  }

  function handlePhoneVerified(confirmToken) {
    setPhoneConfirmToken(confirmToken);
    setStep(STEPS.PROFILE);
  }

  // "Not you?" on StepSignInOtp -- the QR's email guess was wrong (or this
  // is someone else's device); drop back to a normal CONTACT step instead
  // of insisting they sign in as whoever CheckEmail.jsx assumed.
  function handleUseDifferentEmail() {
    setContact((c) => ({ ...c, email: "" }));
    setStep(STEPS.CONTACT);
  }

  function handleBack() {
    if (step === STEPS.OTP) {
      sessionStorage.removeItem(PENDING_KEY);
      setStep(STEPS.CONTACT);
    }
  }

  // Registration has to happen before any verification code can be sent —
  // there's no account yet to send one for. This was previously inverted
  // (collecting just an email and calling a nonexistent /api/auth/send-otp
  // before the account existed), which is why no code was ever delivered.
  async function handleProfileSubmit({
    firstName,
    lastName,
    password,
    confirmPassword,
    loading: setLoading,
    setError,
    setAccountExists,
  }) {
    try {
      const payload = {
        email: contact.email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        confirmPassword,
        ...(token && { inviteToken: token }),
        // phoneConfirmToken is required whenever phoneNumber is present --
        // StepContact requires a phone client-side, so contact.phone is
        // always set here today, but this stays conditional for symmetry
        // with SignUp.jsx's genuinely-optional case.
        ...(contact.phone && { phoneNumber: contact.phone, phoneConfirmToken }),
      };
      const authData = await register(payload);
      maybeStoreSession(authData);
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ email: contact.email }));
      setEmail(contact.email);
      setStep(STEPS.OTP);
    } catch (err) {
      // The invited email already belongs to a registered account (e.g.
      // someone who's already a member of another community) — the
      // backend returns a 409 for this rather than a validation error.
      // Registering them again isn't the right path; they need to sign in
      // instead, at which point resolveDestination() in SignIn.jsx already
      // routes anyone with a pending invite to /member/invites, so the
      // invite still gets honored without needing this token.
      if (err?.response?.status === 409) {
        setAccountExists?.(true);
        setError("");
      } else {
        setError(notifyError(err, { context: "Member register" }));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerified(authData) {
    sessionStorage.removeItem(PENDING_KEY);
    if (authData?.accessToken) {
      await setSession(authData);
      finishAndRoute();
    } else {
      // Verify succeeded but no token returned — direct to sign-in so they
      // can log in with the account they just created.
      navigate("/member/app-sign-in", { replace: true });
    }
  }

  // Still resolving the session, or an already-authenticated user is being
  // routed straight into the community — show a clean loading state rather
  // than flashing the signup form first. PageLoadingState (the app's one
  // branded full-page treatment), not the small generic LoadingState --
  // this replaces the whole viewport right after the route-level Suspense
  // fallback (LoadingScreen, also BrandedSpinner) resolves, so a plain
  // Loader2 here was a visible downgrade mid-sequence, not a lesser variant
  // of the same loading experience.
  if (authLoading || (isAuthenticated && (community || token))) {
    return (
      <div className="flex flex-col min-h-screen bg-surface-bg">
        <PageLoadingState />
      </div>
    );
  }

  return (
    <AuthLayout heroTitle="Manage Your Community" heroSubtitle="Finance Effortlessly">
      {step === STEPS.CONTACT ? (
        // StepContact renders its own top-level Fragment (content block +
        // a separately-pinned consent line) rather than sitting inside the
        // shared wrapper below -- that wrapper's mb-auto only pushes free
        // space below itself as a whole, which isn't enough to pin just the
        // consent text to the bottom the way the Figma treatment shows it.
        <StepContact
          initialEmail={contact.email}
          initialPhone={contact.phone}
          onNext={handleContactNext}
          onGoogleAuth={handleGoogleAuth}
          hasCommunity={Boolean(community)}
        />
      ) : (
        <div className="w-full max-w-md flex flex-col md:mt-14 mb-auto gap-5">
          {step === STEPS.PHONE_OTP && (
            <PhoneOTPStep
              phone={contact.phone}
              onVerified={handlePhoneVerified}
              onBack={() => setStep(STEPS.CONTACT)}
            />
          )}
          {step === STEPS.PROFILE && (
            <StepProfile onSubmit={handleProfileSubmit} />
          )}
          {step === STEPS.OTP && (
            <StepOTP email={email} onVerified={handleVerified} onBack={handleBack} />
          )}
          {step === STEPS.SIGNIN_OTP && (
            <StepSignInOtp
              email={contact.email}
              onVerified={handleVerified}
              onUseDifferentEmail={handleUseDifferentEmail}
            />
          )}
        </div>
      )}
    </AuthLayout>
  );
}
