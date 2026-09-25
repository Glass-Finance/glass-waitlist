import { useState } from "react";
import { useKycSummary } from "../hooks/useKyc";
import { kycDisabled } from "../lib/flags";
import { isKycApproved } from "../utils/kycStatus";
import { useAuth } from "../store/AuthContext";

// Shared gate for community create/manage. Three distinct outcomes, never a
// timing-dependent guess:
//
//   - loading   → block the trigger silently (caller spins/disables until
//                 the status is known — "still loading" never means "let
//                 them through")
//   - error     → fail open: backend remains authoritative (docs/kyc.md),
//                 and a broken summary endpoint must not lock admins out
//   - known-not-approved → open the wizard modal, remembering the pending
//                 continuation so verification can resume the interrupted
//                 action instead of dumping the user back at a dashboard
//
// Platform staff are exempt from the normal-user KYC gate by backend
// contract (kyc-frontend-integration.md: "Platform staff are exempt") and
// cannot start a personal attempt at all — gating them here would trap
// them in a flow they can never complete. The kill switch hides everything.
// Status interpretation stays in utils/kycStatus.js — no ad-hoc literals.
export function useKycGate() {
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingProceed, setPendingProceed] = useState(null);
  const { isPlatformAdmin } = useAuth();
  const { data: summary, isLoading, isError } = useKycSummary();
  const hide = kycDisabled();
  const status = summary?.status ?? null;
  const isApproved = isKycApproved(status);
  const exempt = hide || isPlatformAdmin;

  // Store the continuation as a state value; the functional setState form
  // keeps React from treating the callback itself as an updater.
  function openGate(proceed) {
    setPendingProceed(() => proceed ?? null);
    setGateOpen(true);
    return false;
  }

  function enforce(proceed) {
    if (exempt || isError || isApproved) {
      proceed?.();
      return true;
    }
    if (isLoading || !summary) {
      // Status not known yet — hold the trigger. The caller's disabled /
      // loading state tells the user why; no modal, no navigation.
      return false;
    }
    if (!status) {
      // Settled summary without a status (backend has no KYC record for
      // this account) — nothing to gate on; fail open like the error case.
      proceed?.();
      return true;
    }
    return openGate(proceed);
  }

  function closeGate() {
    setGateOpen(false);
    setPendingProceed(null);
  }

  // Modal "Done" after an APPROVED outcome: close and continue whatever
  // the user was doing when the gate fired. Dismissals never resume.
  function completeGate() {
    const proceed = pendingProceed;
    setGateOpen(false);
    setPendingProceed(null);
    proceed?.();
  }

  return {
    gateOpen,
    closeGate,
    completeGate,
    openGate,
    enforce,
    isApproved,
    status,
    isLoading,
    isError,
  };
}
