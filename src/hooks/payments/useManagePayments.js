import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyAuthorisations, deleteAuthorisation } from "../../api/members";
import { unwrapList } from "./helpers";
import { shapeAuthorisation } from "./shape";

// ─────────────────────────────────────────────────────────────────────────────
// Manage Payments hook — saved payment authorisations (bank/channel + consents)
// ─────────────────────────────────────────────────────────────────────────────
// skipAuthRedirect: PaymentSuccess.jsx checks this right on the fragile
// post-payment landing (see its own _skipAuthRedirect usage) to decide
// whether to offer the Auto-Pay prompt -- without opting out here too, a
// transient 401 on just this one call would bypass that same protection
// and hard-sign the payer out a beat after they'd already seen "Payment
// Successful", the exact bug already fixed for the transaction-detail
// fetch on that page. Every other caller (Auto-Pay/Manage Payments
// settings, a normal ProtectedRoute-gated visit) leaves this off, so a
// genuinely dead session there still signs out normally.
// Plain (non-hook) fetch for imperative contexts that can't use
// useManagePayments -- e.g. AdminPaymentCallback deciding whether to offer
// the Auto-Pay prompt from inside an async poll loop rather than component
// render. Same skipAuthRedirect reasoning as the hook below applies here too.
export async function fetchAuthorisationsOnce(config = {}) {
  try {
    const res = await getMyAuthorisations(config);
    return unwrapList(res).map(shapeAuthorisation);
  } catch {
    return [];
  }
}

export function useManagePayments({ enabled = true, skipAuthRedirect = false } = {}) {
  const queryClient = useQueryClient();
  const config = skipAuthRedirect ? { _skipAuthRedirect: true } : {};

  const query = useQuery({
    queryKey: ["authorisations"],
    queryFn: async () => {
      const res = await getMyAuthorisations(config);
      return unwrapList(res).map(shapeAuthorisation);
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  // Disable auto-pay by removing the authorisation entirely
  const disableAutoPay = useMutation({
    mutationFn: (authId) => deleteAuthorisation(authId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorisations"] });
    },
  });

  // Re-enabling isn't supported by the API — auto-pay is re-established only
  // by completing a new payment with a fresh authorisation.
  function toggleAutoPay(id, enabled, options) {
    if (!enabled) disableAutoPay.mutate(id, options);
  }

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    toggleAutoPay,
    isRemoving: disableAutoPay.isPending,
  };
}
