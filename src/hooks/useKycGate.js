import { useState } from "react";
import { useKycSummary } from "../hooks/useKyc";
import { kycDisabled } from "../lib/flags";
import { isKycApproved } from "../utils/kycStatus";

// Shared gate for community create/manage. Returns whether the KYC sheet
// should open for a pending action. Loading/error => allow through (backend
// remains authoritative); only an explicit non-APPROVED status blocks.
// Status interpretation stays in utils/kycStatus.js — no ad-hoc literals.
export function useKycGate() {
  const [gateOpen, setGateOpen] = useState(false);
  const { data: summary, isLoading } = useKycSummary();
  const hide = kycDisabled();
  const status = summary?.status ?? null;
  const isApproved = isKycApproved(status);

  function enforce(proceed) {
    if (hide || isLoading || isApproved || !status) {
      proceed?.();
      return true;
    }
    setGateOpen(true);
    return false;
  }

  return {
    gateOpen,
    closeGate: () => setGateOpen(false),
    enforce,
    isApproved,
    status,
    isLoading,
  };
}
