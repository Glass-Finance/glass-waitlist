import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, FileText, Image as ImageIcon, Share2 } from "lucide-react";
import html2canvas from "html2canvas";

// ── Helpers (duplicated from generateReceipt.js to keep this self-contained) ─

function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  })
    .format(amount ?? 0)
    .replace("NGN", "₦");
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusLabel(status) {
  const s = (status ?? "").toLowerCase();
  if (s === "success" || s === "successful") return "Successful";
  if (s === "failed") return "Failed";
  return "Pending";
}

function receiptRows(tx, payerName) {
  return [
    ["Description", tx?.description ?? tx?.planName ?? "Payment"],
    ["Community", tx?.communityName ?? "—"],
    ["Paid by", payerName ?? "—"],
    ["Date", formatDate(tx?.date)],
    ["Payment method", tx?.channel ?? "—"],
    ["Reference", tx?.reference ?? tx?.id ?? "—"],
  ];
}

// ── Receipt card — the same design rendered as real JSX ──────────────────────

function ReceiptCard({ tx, payerName, logoB64, cardRef }) {
  const status = statusLabel(tx?.status);
  const isSuccess = status === "Successful";
  const isFailed = status === "Failed";

  const iconBg = isSuccess ? "#10B981" : isFailed ? "#EF4444" : "#F59E0B";
  const iconChar = isSuccess ? "✓" : isFailed ? "✕" : "·";
  const badgeBg = isSuccess
    ? "rgba(16,185,129,0.15)"
    : isFailed
      ? "rgba(239,68,68,0.15)"
      : "rgba(245,158,11,0.15)";
  const badgeBorder = isSuccess
    ? "rgba(16,185,129,0.35)"
    : isFailed
      ? "rgba(239,68,68,0.35)"
      : "rgba(245,158,11,0.35)";
  const badgeColor = isSuccess ? "#6EE7B7" : isFailed ? "#FCA5A5" : "#FCD34D";

  const rows = receiptRows(tx, payerName);
  const detailRows = rows.slice(0, -1);
  const [, refValue] = rows[rows.length - 1];

  return (
    <div
      ref={cardRef}
      style={{
        width: "100%",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, sans-serif',
        background: "#EEF2FF",
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background:
            "linear-gradient(145deg, #001030 0%, #001D7A 55%, #002FA7 100%)",
          padding: "28px 28px 44px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* dot texture */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            pointerEvents: "none",
          }}
        />
        {/* decorative arcs */}
        <div
          style={{
            position: "absolute",
            right: -60,
            top: -60,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -40,
            bottom: -80,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.03)",
            pointerEvents: "none",
          }}
        />

        {/* Logo row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {logoB64 ? (
              <img
                src={logoB64}
                width={28}
                height={28}
                alt=""
                style={{ borderRadius: 8, display: "block", flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "#1843C8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  G
                </span>
              </div>
            )}
            <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>
              Glass
            </span>
          </div>
          <span
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
            }}
          >
            Receipt
          </span>
        </div>

        {/* Status icon + amount */}
        <div
          style={{ textAlign: "center", position: "relative", zIndex: 1 }}
        >
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.08)",
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {iconChar}
              </span>
            </div>
          </div>
          <div
            style={{
              color: "#fff",
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              lineHeight: 1,
              marginBottom: 12,
            }}
          >
            {formatNaira(tx?.amount)}
          </div>
          <div
            style={{
              display: "inline-block",
              background: badgeBg,
              border: `1px solid ${badgeBorder}`,
              color: badgeColor,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "1.2px",
              padding: "5px 16px",
              borderRadius: 100,
            }}
          >
            PAYMENT {status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Detail card */}
      <div
        style={{
          background: "#fff",
          margin: "-4px 14px 0",
          borderRadius: 20,
          padding: "8px 20px 8px",
          boxShadow: "0 4px 24px rgba(0,47,167,0.08)",
          position: "relative",
          zIndex: 2,
        }}
      >
        {detailRows.map(([label, value]) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              padding: "11px 0",
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "#94A3B8",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontSize: 12.5,
                color: "#0F172A",
                fontWeight: 600,
                textAlign: "right",
                wordBreak: "break-word",
                maxWidth: 220,
              }}
            >
              {value}
            </span>
          </div>
        ))}
        <div style={{ padding: "12px 0 6px" }}>
          <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>
            Reference
          </div>
          <div
            style={{
              background: "#F8FAFF",
              border: "1px solid #E8EEFF",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 11,
              color: "#1E3A8A",
              fontWeight: 600,
              fontFamily: "'Courier New', Courier, monospace",
              wordBreak: "break-all",
              lineHeight: 1.6,
            }}
          >
            {refValue}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "14px 16px 20px" }}>
        <div style={{ fontSize: 10, color: "#94A3B8" }}>
          <strong style={{ color: "#64748B" }}>glasspay.app</strong>
          {" · "}
          Generated {formatDateTime(new Date())}
        </div>
      </div>
    </div>
  );
}

// ── Modal (bottom sheet) ──────────────────────────────────────────────────────

export default function ReceiptModal({ tx, payerName, onClose }) {
  const cardRef = useRef(null);
  const [logoB64, setLogoB64] = useState(null);
  const [saving, setSaving] = useState(null); // "image" | "pdf" | "share" | null

  // Load the Glass logo as a base64 data URL so html2canvas can embed it
  useEffect(() => {
    fetch("/Glass.webp")
      .then((r) => r.blob())
      .then(
        (b) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(b);
          }),
      )
      .then(setLogoB64)
      .catch(() => {});
  }, []);

  // Close on Escape key
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function captureCard(scale = 3) {
    if (!cardRef.current) return null;
    return html2canvas(cardRef.current, {
      scale,
      backgroundColor: "#EEF2FF",
      useCORS: true,
      logging: false,
    });
  }

  async function handleSaveImage() {
    if (saving) return;
    setSaving("image");
    try {
      const canvas = await captureCard(3);
      if (!canvas) return;
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `glass-receipt-${tx?.reference ?? tx?.id ?? Date.now()}.png`;
      link.click();
    } finally {
      setSaving(null);
    }
  }

  async function handleSavePdf() {
    if (saving) return;
    setSaving("pdf");
    try {
      const { downloadReceiptPdf } = await import("../../utils/generateReceipt");
      await downloadReceiptPdf(tx, { payerName });
    } finally {
      setSaving(null);
    }
  }

  async function handleShare() {
    if (saving) return;
    setSaving("share");
    try {
      const canvas = await captureCard(2);
      if (!canvas) return;
      canvas.toBlob(async (blob) => {
        if (!blob) { setSaving(null); return; }
        try {
          await navigator.share({
            files: [
              new File(
                [blob],
                `glass-receipt-${tx?.reference ?? tx?.id ?? ""}.png`,
                { type: "image/png" },
              ),
            ],
            title: "Payment Receipt",
          });
        } catch {
          // user dismissed the share sheet — not an error
        } finally {
          setSaving(null);
        }
      }, "image/png");
    } catch {
      setSaving(null);
    }
  }

  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof File !== "undefined";

  const btnBase = {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "13px 12px",
    borderRadius: 14,
    fontSize: 13,
    fontWeight: 600,
    cursor: saving ? "not-allowed" : "pointer",
    opacity: saving ? 0.65 : 1,
    transition: "opacity 0.15s",
    border: "none",
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: "relative",
          background: "#F0F4FF",
          borderRadius: "24px 24px 0 0",
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 12,
            paddingBottom: 4,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: "rgba(0,0,0,0.15)",
            }}
          />
        </div>

        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 20px 12px",
            flexShrink: 0,
          }}
        >
          <span
            style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}
          >
            Payment Receipt
          </span>
          <button
            onClick={onClose}
            style={{
              background: "rgba(0,0,0,0.06)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#475569",
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable receipt preview */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 16px 12px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <ReceiptCard
            tx={tx}
            payerName={payerName}
            logoB64={logoB64}
            cardRef={cardRef}
          />
        </div>

        {/* Action bar */}
        <div
          style={{
            padding: "14px 16px",
            background: "#fff",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            gap: 10,
            flexShrink: 0,
          }}
        >
          {canShare && (
            <button
              onClick={handleShare}
              disabled={!!saving}
              style={{
                ...btnBase,
                background: "#EEF2FF",
                color: "#3730A3",
              }}
            >
              <Share2 size={15} />
              {saving === "share" ? "Sharing…" : "Share"}
            </button>
          )}
          <button
            onClick={handleSaveImage}
            disabled={!!saving}
            style={{
              ...btnBase,
              background: "#EEF2FF",
              color: "#3730A3",
            }}
          >
            <ImageIcon size={15} />
            {saving === "image" ? "Saving…" : "Save Image"}
          </button>
          <button
            onClick={handleSavePdf}
            disabled={!!saving}
            style={{
              ...btnBase,
              background: "#002FA7",
              color: "#fff",
            }}
          >
            <FileText size={15} />
            {saving === "pdf" ? "Saving…" : "Save PDF"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
