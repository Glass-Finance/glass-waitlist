import { useMutation, useQueryClient } from "@tanstack/react-query";
import { initiatePayment } from "../../api/members";

// ─────────────────────────────────────────────────────────────────────────────
// Initiate payment mutation
// ─────────────────────────────────────────────────────────────────────────────
export function useInitiatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentLinkId, payload }) =>
      initiatePayment(paymentLinkId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obligations"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
