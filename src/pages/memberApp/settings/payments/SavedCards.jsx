import { useNavigate } from "react-router-dom";
import { ChevronLeft, CreditCard, Trash2 } from "lucide-react";
import { useManagePayments } from "../../../../hooks/usePayments";
import LoadingState from "../../../../components/common/LoadingState";
import EmptyState from "../../../../components/common/EmptyState";

export default function SavedCards() {
  const navigate = useNavigate();
  const { data, isLoading, error, toggleAutoPay, isRemoving } = useManagePayments();

  function handleDelete(item) {
    const label = item.bank ? `${item.bank} ***${item.last4}` : `***${item.last4}`;
    if (!window.confirm(`Remove ${label}? Any auto-pay tied to it will stop.`)) return;
    toggleAutoPay(item.id, false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#EBEBEB", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: 0 }}>Saved Cards</h1>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          {isLoading ? (
            <LoadingState className="py-6" />
          ) : error ? (
            <p style={{ textAlign: "center", color: "#DC2626", fontSize: 13, padding: "24px 0" }}>
              Couldn't load saved payment methods.
            </p>
          ) : data.length === 0 ? (
            <EmptyState icon={CreditCard} title="No saved cards yet" className="py-6" />
          ) : (
            data.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                  borderBottom: i < data.length - 1 ? "1px solid #F2F2F2" : "none",
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CreditCard size={16} style={{ color: "#1C2B8A" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#111", margin: 0 }}>
                    {item.bank ?? "Card"} •••{item.last4 ?? "----"}
                  </p>
                  {item.channel && (
                    <p style={{ fontSize: 12, color: "#999", margin: "2px 0 0" }}>{item.channel}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item)}
                  disabled={isRemoving}
                  aria-label="Remove saved card"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 6, flexShrink: 0, opacity: isRemoving ? 0.5 : 1 }}
                >
                  <Trash2 size={16} style={{ color: "#DC2626" }} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
