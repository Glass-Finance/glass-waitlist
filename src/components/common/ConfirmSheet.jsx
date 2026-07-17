import { AlertTriangle, X } from "lucide-react";

// Generalized version of the bottom-sheet confirm pattern first built for
// MyCommunities.jsx's LeaveConfirmModal -- a real in-app disclaimer instead
// of the bare OS window.confirm() the member app's destructive actions
// (remove payment method, turn off auto-pay) previously relied on, which is
// easy to blow past without reading and breaks the app's visual flow.
export default function ConfirmSheet({
  icon: Icon = AlertTriangle,
  title,
  description,
  confirmLabel = "Yes, continue",
  confirmingLabel,
  danger = true,
  confirming = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(15,23,42,0.45)",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 430,
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          padding: "24px 20px 28px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={confirming}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9CA3AF" }}
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: danger ? "#FEF2F2" : "var(--color-brand-tint)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 4,
            }}
          >
            <Icon size={24} style={{ color: danger ? "#DC2626" : "var(--color-brand)" }} />
          </div>
          <p style={{ fontSize: 17, fontWeight: 700, color: "#111", margin: 0 }}>{title}</p>
          <p style={{ fontSize: 13.5, color: "#6B7280", margin: 0, lineHeight: 1.55, maxWidth: 320 }}>
            {description}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          <button
            onClick={onConfirm}
            disabled={confirming}
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 12,
              border: "none",
              background: danger ? "#DC2626" : "var(--color-brand)",
              color: "#fff",
              fontSize: 14.5,
              fontWeight: 600,
              cursor: confirming ? "default" : "pointer",
              opacity: confirming ? 0.7 : 1,
            }}
          >
            {confirming ? (confirmingLabel ?? "Please wait…") : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={confirming}
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              background: "#fff",
              color: "#374151",
              fontSize: 14.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
