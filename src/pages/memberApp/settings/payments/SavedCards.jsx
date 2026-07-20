import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassLogoGlow from "../../../../components/common/GlassLogoGlow";
import { ChevronLeft, CreditCard, Trash2 } from "lucide-react";
import { useManagePayments } from "../../../../hooks/usePayments";
import PageLoadingState from "../../../../components/common/PageLoadingState";
import EmptyState from "../../../../components/common/EmptyState";
import ConfirmSheet from "../../../../components/common/ConfirmSheet";

export default function SavedCards() {
  const navigate = useNavigate();
  const { data, isLoading, error, toggleAutoPay, isRemoving } = useManagePayments();
  const [removingItem, setRemovingItem] = useState(null);

  function handleDelete(item) {
    setRemovingItem(item);
  }

  return (
    <div
      className="relative overflow-hidden min-h-screen pb-10"
    >
      <GlassLogoGlow />
      <div className="flex items-center gap-2.5 pt-5 px-4 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
        <h1 className="text-lg font-semibold text-[#111] m-0">Payment Methods</h1>
      </div>

      <div className="px-4">
        {data.length > 0 && (
          <p className="text-xs font-semibold text-[#999] mt-0 mx-1 mb-2 uppercase [letter-spacing:0.4px]">
            Saved Cards
          </p>
        )}
        <div className="border border-surface-container-border bg-white rounded-2xl overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
          {isLoading ? (
            <PageLoadingState size={56} padding="36px 24px" />
          ) : error ? (
            <p className="text-center text-danger text-[13px] py-6">
              Couldn't load saved payment methods.
            </p>
          ) : data.length === 0 ? (
            <EmptyState icon={CreditCard} title="No saved cards yet" className="py-6" />
          ) : (
            data.map((item, i) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 py-3.5 px-4 ${i < data.length - 1 ? "border-b border-[#F2F2F2]" : "border-b-0"}`}
              >
                <div className="w-9 h-9 rounded-[10px] bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                  <CreditCard size={16} className="text-[#1C2B8A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111] m-0">
                    {item.bank ?? "Card"} •••{item.last4 ?? "----"}
                  </p>
                  {item.channel && (
                    <p className="text-xs text-[#999] mt-0.5 mx-0 mb-0">{item.channel}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item)}
                  disabled={isRemoving}
                  aria-label="Remove saved card"
                  className={`bg-transparent border-none cursor-pointer p-1.5 flex-shrink-0 ${isRemoving ? "opacity-50" : "opacity-100"}`}
                >
                  <Trash2 size={16} className="text-danger" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {removingItem && (
        <ConfirmSheet
          icon={Trash2}
          title={`Remove ${removingItem.bank ? `${removingItem.bank} ***${removingItem.last4}` : `***${removingItem.last4}`}?`}
          description="Any auto-pay tied to this method will stop, and it won't be usable for future payments."
          confirmLabel="Yes, remove"
          confirmingLabel="Removing…"
          confirming={isRemoving}
          onCancel={() => setRemovingItem(null)}
          onConfirm={() =>
            toggleAutoPay(removingItem.id, false, { onSuccess: () => setRemovingItem(null) })
          }
        />
      )}
    </div>
  );
}
