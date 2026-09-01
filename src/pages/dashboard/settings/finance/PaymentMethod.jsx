import { useState } from "react";
import { Landmark, Trash2 } from "lucide-react";
import { useManagePayments } from "../../../../hooks/usePayments";
import LoadingState from "../../../../components/common/LoadingState";
import ConfirmDialog from "../../../../components/dashboard/ConfirmDialog";

export default function PaymentMethod() {
  const { data: authorisations, isLoading, error, toggleAutoPay, isRemoving } = useManagePayments();
  const [removingAuth, setRemovingAuth] = useState(null);

  function handleRemove(auth) {
    setRemovingAuth(auth);
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Single card, heading inside -- was a bare "Payment methods" heading
          wrapping a second, redundant "Saved methods" heading inside its
          own card, the only page with a double heading like that. */}
      <div>
        <div className="bg-surface-container rounded-xl p-5 border border-surface-container-border">
          <p className="text-sm font-semibold text-gray-900 mb-0.5">Payment methods</p>
          <p className="text-xs text-gray-500 mb-4">Saved cards and bank accounts used for your personal dues payments.</p>
          <div className="-mx-5 border-b border-gray-100 mb-4" />

          <div className="flex flex-col gap-3">
            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <p className="text-xs text-red-500">Couldn't load payment methods.</p>
            ) : authorisations.length === 0 ? (
              // Shaped like a real method row below (same w-9 h-9 rounded-lg
              // icon tile, same flex layout) but dashed and empty, instead
              // of the generic icon-in-a-circle EmptyState.
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex-shrink-0 border-2 border-dashed border-gray-200" />
                  <div>
                    <p className="text-sm text-gray-400">No saved payment methods yet</p>
                    <p className="text-xs text-gray-400">These are created automatically the first time you pay.</p>
                  </div>
                </div>
              </div>
            ) : (
              authorisations.map((auth) => (
                <div key={auth.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#EEF2FF]">
                      <Landmark size={16} className="text-brand" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">{auth.bank ?? "Bank account"} ●●●● {auth.last4}</p>
                      <p className="text-xs text-gray-500">{auth.channel ?? "—"} · {(auth.status ?? "").toLowerCase() === "active" ? "Active" : auth.status}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(auth)}
                    disabled={isRemoving}
                    className="text-red-400 hover:text-red-600 transition-colors bg-transparent border-none cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>

          <p className="text-xs text-gray-400 mt-4">
            New payment methods are added automatically the next time you complete a payment.
          </p>
        </div>
      </div>

      {removingAuth && (
        <ConfirmDialog
          title="Remove Payment Method"
          description={`Remove ${removingAuth.bank ?? "this bank account"} ●●●● ${removingAuth.last4}? Any auto-pay tied to it will stop, and it won't be usable for future payments.`}
          confirmLabel="Remove"
          confirmingLabel="Removing…"
          confirming={isRemoving}
          onClose={() => setRemovingAuth(null)}
          onConfirm={() =>
            toggleAutoPay(removingAuth.id, false, { onSuccess: () => setRemovingAuth(null) })
          }
        />
      )}
    </div>
  );
}
