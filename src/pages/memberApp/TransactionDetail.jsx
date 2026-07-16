import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Check, Copy, CheckCheck } from "lucide-react";
import { useTransactionDetail } from "../../hooks/useTransactionDetail";
import GlassLogoGlow from "../../components/common/GlassLogoGlow";
import PageLoadingState from "../../components/common/PageLoadingState";
import { formatNaira, toTitleCase } from "../../utils/format";

function statusLabel(status) {
  if (status === "success" || status === "successful") return "Success";
  if (status === "failed") return "Failed";
  return "Pending";
}

function StatusPill({ status }) {
  const label = statusLabel(status);
  const map = {
    Success: { bg: "#dcfce7", color: "#15803d", text: "Successful" },
    Failed: { bg: "#fce4e4", color: "#dc2626", text: "Failed" },
    Pending: { bg: "#fef9c3", color: "#b45309", text: "Pending" },
  };
  const s = map[label] ?? map.Pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: s.bg,
        color: s.color,
        fontSize: 14,
        fontWeight: 600,
        borderRadius: 8,
        padding: "6px 14px",
      }}
    >
      {label === "Success" && (
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: s.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Check size={11} color="#fff" strokeWidth={3} />
        </span>
      )}
      {s.text}
    </span>
  );
}

function Row({ label, children, last }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "14px 0",
        borderBottom: last ? "none" : "1px solid #F3F4F6",
      }}
    >
      <span style={{ fontSize: 14, color: "#6B7280" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#111827", textAlign: "right" }}>
        {children}
      </span>
    </div>
  );
}

export default function TransactionDetail() {
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const { data: tx, isLoading, error } = useTransactionDetail(transactionId);
  const [copied, setCopied] = useState(false);

  function copyReference() {
    if (!tx?.reference) return;
    navigator.clipboard?.writeText(tx.reference).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
        background: "var(--color-surface-bg)",
        fontFamily: "'Inter', system-ui, sans-serif",
        paddingBottom: 40,
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      <GlassLogoGlow />
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36, borderRadius: "50%", background: "#fff",
            border: "none", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)", flexShrink: 0,
          }}
        >
          <ChevronLeft size={18} color="#374151" />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: 0, flex: 1, textAlign: "center", marginRight: 36 }}>
          Transaction Details
        </h1>
      </div>

      {isLoading ? (
        <PageLoadingState label="Loading transaction…" />
      ) : error || !tx ? (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#DC2626" }}>Couldn't load this transaction.</p>
        </div>
      ) : (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Amount card */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "28px 20px",
              boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <p style={{ fontSize: 34, fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.5px" }}>
              {formatNaira(tx.amount, { decimals: 2 })}
            </p>
            <StatusPill status={tx.status} />
            <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>
              {tx.date
                ? new Date(tx.date).toLocaleString("en-NG", {
                    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                  }).replace(",", " •")
                : "—"}
            </p>
          </div>

          {/* Details card */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "18px 20px",
              boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
            }}
          >
            <p style={{ fontSize: 15, fontWeight: 600, color: "#111", margin: "0 0 6px" }}>
              Transaction Details
            </p>

            <Row label="Community:">
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {tx.communityLogo?.url && (
                  <img
                    src={tx.communityLogo.url}
                    alt=""
                    style={{ width: 32, height: 32, objectFit: "cover" }}
                  />
                )}
                {tx.communityName ?? "—"}
              </span>
            </Row>
            <Row label="Plan:" last={!tx.transactionType && !tx.channel}>
              {toTitleCase(tx.planName ?? tx.description) ?? "—"}
            </Row>
            {(tx.transactionType || tx.channel) && (
              <Row label="Transaction Type:">
                {toTitleCase(tx.transactionType ?? tx.channel)}
              </Row>
            )}
            <Row label="Dues Amount:">{formatNaira(tx.amount)}</Row>
            {tx.feeMinor != null && (
              <Row label="Transaction Fee:">{formatNaira(tx.feeMinor, { decimals: 2 })}</Row>
            )}
            <Row label="Transaction ID:" last={!tx.initiatedBy}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {tx.reference ?? tx.id}
                <button
                  onClick={copyReference}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#9CA3AF", display: "flex" }}
                  aria-label="Copy transaction ID"
                >
                  {copied ? <CheckCheck size={13} color="#15803d" /> : <Copy size={13} />}
                </button>
              </span>
            </Row>
            {tx.initiatedBy && (
              <Row label="Initiated by:" last>
                <span
                  style={{
                    display: "inline-block",
                    background: "#D7E2FF",
                    color: "#002FA7",
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 999,
                    padding: "3px 12px",
                  }}
                >
                  {tx.initiatedBy}
                </span>
              </Row>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
