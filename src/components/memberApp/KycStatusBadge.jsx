import { kycStatusStyle } from "../../utils/kycStatus";

// Compact status pill for account KYC state (marloden-style: light pill +
// colored dot, reads at a glance on a light surface — no dark background
// needed). `status` is the account-level enum from GET /kyc (NOT_STARTED |
// PENDING | IN_REVIEW | APPROVED | …). Label + colors still come from
// kycStatusStyle so chips and pills can never disagree.
export default function KycStatusBadge({ status, className = "" }) {
  const { label, cls, dot } = kycStatusStyle(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full py-1 pl-2 pr-2.5 border border-black/5 ${cls} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
