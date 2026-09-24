import { kycStatusStyle } from "../../utils/kycStatus";

// Compact status chip for account KYC state. `status` is the account-level
// enum from GET /kyc (NOT_STARTED | PENDING | IN_REVIEW | APPROVED | …).
export default function KycStatusBadge({ status, className = "" }) {
  const { label, cls } = kycStatusStyle(status);
  return (
    <span
      className={`inline-block text-xs font-semibold rounded-full py-0.5 px-2.5 ${cls} ${className}`}
    >
      {label}
    </span>
  );
}
