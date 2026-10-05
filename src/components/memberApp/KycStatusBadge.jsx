import { kycStatusStyle } from "../../utils/kycStatus";

// Status pill for account KYC state — icon-forward (Phosphor duotone mark +
// label, both from kycStatusStyle so chips and pills can never disagree)
// on a light surface; reads at a glance without a dark background. `status`
// is the account-level enum from GET /kyc (NOT_STARTED | PENDING |
// IN_REVIEW | APPROVED | …). The legacy `dot` field stays in the style
// contract but the pill paints the icon.
// `showLabel={false}` collapses the pill to its icon. Needed on the member
// settings row, where a "Not started" pill (~106px) alongside a 36-char
// description left ~160px of text width — the description wrapped to two
// lines, so that one row grew taller than its siblings and its height also
// shifted with the status. The icon still carries the state (kycStatusStyle
// pairs a distinct mark and colour per status), and the label moves to
// screen-reader-only text rather than being dropped. Default is unchanged,
// so every full-width caller still renders the label.
export default function KycStatusBadge({ status, className = "", showLabel = true }) {
  const { label, cls, Icon } = kycStatusStyle(status);
  return (
    <span
      title={showLabel ? undefined : label}
      className={`inline-flex items-center text-xs font-semibold rounded-full border border-black/5 ${
        showLabel ? "gap-1.5 py-1 pl-2 pr-2.5" : "size-6 justify-center"
      } ${cls} ${className}`}
    >
      <Icon size={12} weight="duotone" className="flex-shrink-0" aria-hidden="true" />
      {showLabel ? label : <span className="sr-only">{label}</span>}
    </span>
  );
}
