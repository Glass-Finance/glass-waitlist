import { useNavigate } from "react-router-dom";
import { ChevronLeft, Clock, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { usePayments, useInitiatePayment } from "../../hooks/usePayments";

function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount ?? 0)
    .replace("NGN", "₦");
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function statusStyle(status) {
  const s = (status ?? "").toLowerCase();
  if (s === "paid" || s === "success" || s === "successful") return { bg: "#dcfce7", color: "#15803d", label: "Paid" };
  if (s === "overdue") return { bg: "#fce4e4", color: "#dc2626", label: "Overdue" };
  if (s === "due_soon") return { bg: "#fef9c3", color: "#b45309", label: "Due Soon" };
  return { bg: "#f0f4ff", color: "#1C2B8A", label: "Upcoming" };
}

function LogoBubble({ item }) {
  const s = statusStyle(item.status);
  return (
    <div
      style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: item.logo?.url ? "#F0F4FF" : s.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {item.logo?.url
        ? <img src={item.logo.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{item.logoText ?? "P"}</span>}
    </div>
  );
}

function ObligationCard({ item, onPay, paying }) {
  const s = statusStyle(item.status);
  const isPaid = (item.status ?? "").toLowerCase() === "paid";

  return (
    <div
      style={{
        background: "#fff", borderRadius: 14, padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <LogoBubble item={item} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.name}
        </p>
        <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>
          {item.communityName}{item.dueDate ? ` · Due ${formatDate(item.dueDate)}` : ""}
        </p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>{formatNaira(item.amount)}</p>
        {isPaid ? (
          <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, padding: "2px 8px", borderRadius: 6 }}>Paid</span>
        ) : (
          <button
            onClick={() => onPay(item)}
            disabled={paying}
            style={{
              padding: "5px 14px", borderRadius: 6, border: "none",
              background: s.color === "#dc2626" ? "#dc2626" : "#002FA7",
              color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
              opacity: paying ? 0.6 : 1,
            }}
          >
            Pay Now
          </button>
        )}
      </div>
    </div>
  );
}

function TransactionRow({ t }) {
  const success = t.status === "success" || t.status === "successful";
  const failed = t.status === "failed";
  const Icon = success ? CheckCircle2 : failed ? AlertCircle : Clock;
  const iconColor = success ? "#15803d" : failed ? "#dc2626" : "#888";

  return (
    <div
      style={{
        background: "#fff", borderRadius: 14, padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: success ? "#dcfce7" : failed ? "#fce4e4" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} style={{ color: iconColor }} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: "#111", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {t.description}
        </p>
        <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>{formatDate(t.date)}</p>
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: success ? "#15803d" : "#111", margin: 0, flexShrink: 0 }}>
        {formatNaira(t.amount)}
      </p>
    </div>
  );
}

export default function ManagePayments() {
  const navigate = useNavigate();
  const { data, isLoading, error, refresh } = usePayments();
  const { mutate: pay, isPending: paying } = useInitiatePayment();

  const upcoming = data?.upcoming ?? [];
  const history = (data?.history ?? []).slice(0, 8);

  function handlePay(item) {
    navigate("/member/payment-summary", { state: { item } });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#EBEBEB", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: 0 }}>Manage Payments</h1>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 20 }}>
        {isLoading ? (
          <p style={{ textAlign: "center", color: "#999", fontSize: 14, marginTop: 40 }}>Loading…</p>
        ) : error ? (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 12 }}>Couldn't load your payments.</p>
            <button
              onClick={refresh}
              style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 auto", padding: "10px 20px", borderRadius: 8, border: "none", background: "#002FA7", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        ) : (
          <>
            {/* Upcoming / Unpaid */}
            <section>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#555", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Upcoming & Due
              </p>
              {upcoming.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: 14, padding: "24px 16px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <CheckCircle2 size={28} style={{ color: "#15803d", marginBottom: 8 }} strokeWidth={1.5} />
                  <p style={{ fontSize: 14, color: "#555", margin: 0 }}>You're all caught up — no outstanding payments.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {upcoming.map((item) => (
                    <ObligationCard
                      key={item.id ?? item.paymentLinkId}
                      item={item}
                      onPay={handlePay}
                      paying={paying}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Recent Transactions */}
            {history.length > 0 && (
              <section>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#555", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Recent Transactions
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {history.map((t) => (
                    <TransactionRow key={t.id} t={t} />
                  ))}
                </div>
                <button
                  onClick={() => navigate("/member/transactions")}
                  style={{ width: "100%", marginTop: 12, padding: "12px 0", borderRadius: 10, border: "1.5px solid #002FA7", background: "#fff", color: "#002FA7", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  View All Transactions
                </button>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
