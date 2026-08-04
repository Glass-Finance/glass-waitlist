import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { verifyPayment } from "../../api/members";
import { toastSuccess } from "../../utils/toast";
import { settleLocalPaymentForReference } from "./localCache";

// ─────────────────────────────────────────────────────────────────────────────
// Pending payment verification — covers payers who never reach the callback
// page (back button, closed the Paystack tab). The pending reference stored
// before the redirect is verified once on mount so a completed payment shows
// as Paid immediately instead of waiting for the next background refetch.
// ─────────────────────────────────────────────────────────────────────────────
export function usePendingPaymentVerification() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const reference = sessionStorage.getItem("paymentPendingRef");
    if (!reference) return;
    // Remove up front — one verification attempt per stored reference is
    // enough; the callback page and background refetches cover the rest.
    sessionStorage.removeItem("paymentPendingRef");

    verifyPayment(reference)
      .then((res) => {
        const status = (res.data?.data?.status ?? "").toUpperCase();
        queryClient.invalidateQueries({ queryKey: ["obligations"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["payment-links"] });
        queryClient.invalidateQueries({ queryKey: ["authorisations"] });
        queryClient.invalidateQueries({ queryKey: ["community"] });
        if (status === "SUCCESS" || status === "SUCCESSFUL") {
          settleLocalPaymentForReference(reference);
          toastSuccess("Payment confirmed", { reference });
        }
      })
      .catch(() => {});
  }, [queryClient]);
}
