import KycStatusBadge from "../memberApp/KycStatusBadge";
import { kycCompletionState } from "../../utils/kycStatus";

// Verification-completion indicator for member rows on admin surfaces
// (Members table, Member Access). Wraps the shared pill so the four
// displayed states come from one mapper (kycCompletionState) and the
// colors/labels can't drift from Settings/Home badges.
//
// Renders nothing until the backend member DTO carries kycStatus — the
// badge ships ahead of that field so the wiring lands first (docs/kyc.md).
// Never mirror this onto member-app surfaces: one member's verification
// state is admin-facing only.
export default function KycStateBadge({ status, className = "" }) {
  const state = kycCompletionState(status);
  if (!state) return null;
  return <KycStatusBadge status={state} className={className} />;
}
