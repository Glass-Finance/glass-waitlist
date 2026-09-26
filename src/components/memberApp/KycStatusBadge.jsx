import { kycStatusStyle } from "../../utils/kycStatus";

// Status pill for account KYC state — icon-forward (Phosphor duotone mark +
// label, both from kycStatusStyle so chips and pills can never disagree)
// on a light surface; reads at a glance without a dark background. `status`
// is the account-level enum from GET /kyc (NOT_STARTED | PENDING |
// IN_REVIEW | APPROVED | …). The legacy `dot` field stays in the style
// contract but the pill paints the icon.
export default function KycStatusBadge({ status, className = "" }) {
  const { label, cls, Icon } = kycStatusStyle(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full py-1 pl-2 pr-2.5 border border-black/5 ${cls} ${className}`}
    >
      <Icon size={12} weight="duotone" className="flex-shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}
