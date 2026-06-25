import { Landmark, Trash2 } from "lucide-react";
import { useManagePayments } from "../../../../hooks/usePayments";

export default function PaymentMethod() {
  const { data: authorisations, isLoading, error, toggleAutoPay, isRemoving } = useManagePayments();

  function handleRemove(id) {
    if (!window.confirm("Remove this payment method? Any auto-pay tied to it will stop.")) return;
    toggleAutoPay(id, false);
  }

  return (
    <div className="flex flex-col gap-5 max-w-3xl w-full">
      <div>
        <p className="text-sm font-medium text-gray-900 mb-0.5">Payment methods</p>
        <p className="text-xs text-gray-500 mb-5">Saved cards and bank accounts used for your personal dues payments.</p>

        <div className="bg-gray-50 rounded-xl p-5 mb-4" style={{ border: "1px solid #E5E7EB" }}>
          <p className="text-sm font-medium text-gray-900 mb-0.5">Saved methods</p>
          <p className="text-xs text-gray-500 mb-4">
            Methods used across all communities you're a paying member of.
          </p>

          <div className="flex flex-col gap-3">
            {isLoading ? (
              <p className="text-xs text-gray-400">Loading…</p>
            ) : error ? (
              <p className="text-xs text-red-500">Couldn't load payment methods.</p>
            ) : authorisations.length === 0 ? (
              <p className="text-xs text-gray-400">No saved payment methods yet — these are created automatically the first time you pay.</p>
            ) : (
              authorisations.map((auth) => (
                <div key={auth.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#EEF2FF" }}>
                      <Landmark size={16} className="text-[#002FA7]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">{auth.bank ?? "Bank account"} ●●●● {auth.last4}</p>
                      <p className="text-xs text-gray-500">{auth.channel ?? "—"} · {(auth.status ?? "").toLowerCase() === "active" ? "Active" : auth.status}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(auth.id)}
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
    </div>
  );
}
