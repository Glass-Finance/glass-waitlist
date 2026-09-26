import { useMutation, useQueryClient } from "@tanstack/react-query";
import { initiatePayment } from "../../api/members";

// ─────────────────────────────────────────────────────────────────────────────
// Initiate payment mutation
// ─────────────────────────────────────────────────────────────────────────────
export function useInitiatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentLinkId, payload }) => initiatePayment(paymentLinkId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obligations"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // Community-scoped state (metrics, community transactions/obligations,
      // activity, plan metrics) sits under this prefix. A direct charge
      // completes with no redirect, so no callback page refreshes it.
      queryClient.invalidateQueries({ queryKey: ["community"] });
    },
  });
}
