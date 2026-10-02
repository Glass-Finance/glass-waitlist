import { ShieldAlert, ArrowRight } from "lucide-react";
import { isKycApproved, isKycInFlight, kycStatusLabel } from "../../utils/kycStatus";

// ── Community-staff KYC notice ───────────────────────────────────────────────
// The in-place state for a community-staff page whose data request was refused
// because this account's identity verification isn't approved yet.
//
// WHY IT EXISTS
// A COMMUNITY_OWNER / COMMUNITY_ADMIN whose kycStatus isn't APPROVED is
// silently downgraded to COMMUNITY_MEMBER permissions server-side
// (AccessControlService), so `GET /communities/{id}/members` and
// `.../groups` come back 403 — with the generic
// "Community permission is required: community.members.read". The guard that
// let them onto the page checks their *role*, not their KYC, so they arrive
// here fully authorised and meet a bare error with no way forward. The fix is
// to name the real blocker and offer the way past it.
//
// Deliberately inline and non-blocking: this replaces the error row/paragraph
// where the table would have rendered, leaving the page's header, search and
// surrounding chrome intact and the user free to navigate away.
//
// Presentation only. Wiring the verification wizard (and resuming whatever the
// user was doing once it completes) is a separate change; `onVerify` is the
// seam for it, and is optional so a caller can render the notice without
// committing to that flow.
export default function CommunityStaffKycNotice({
  status,
  subject = "this",
  onVerify,
  className = "",
}) {
  const approved = isKycApproved(status);
  // "continue" for an attempt already in motion, "start" otherwise — a user
  // mid-verification who lands here is interrupted, not a first-timer.
  const action = isKycInFlight(status) ? "Continue verification" : "Start verification";
  const current = kycStatusLabel(status);

  return (
    <div
      data-testid="community-staff-kyc-notice"
      className={`flex flex-col items-center gap-3 rounded-2xl border border-[#FDDCB5] bg-warning-wash px-6 py-10 text-center ${className}`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
        <ShieldAlert size={20} className="text-warning" />
      </div>
      <div className="max-w-md">
        <p className="text-sm font-semibold text-gray-900">Identity verification required</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">
          Your community role is active, but approved identity verification is required before you
          can view {subject}. This is a security requirement, not a permissions problem with your
          role.
        </p>
        {!approved && current && current !== "—" && (
          <p className="mt-2 text-[11px] text-gray-500">
            Current verification status: <span className="font-semibold">{current}</span>
          </p>
        )}
      </div>
      {onVerify && (
        <button
          type="button"
          onClick={onVerify}
          data-testid="community-staff-kyc-verify"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          {action}
          <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
}
