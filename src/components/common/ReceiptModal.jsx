import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, FileText, Image as ImageIcon, Share2 } from "lucide-react";
import html2canvas from "html2canvas";

// ── Helpers ──────────────────────────────────────────────────────────────────

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
    weekday: "long",
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

function formatHeaderDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-NG", {
    weekday: "long",
    month: "long",
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
  ];
}

// ── ReceiptCard — rendered as real JSX for the in-app preview ────────────────
// Rules: no border-radius on the outer card or logo, no overlapping sections.

function ReceiptCard({ tx, payerName, logoB64, cardRef }) {
  const status = statusLabel(tx?.status);
  const isSuccess = status === "Successful";
  const isFailed = status === "Failed";

  const statusColor = isSuccess ? "#0ECE7B" : isFailed ? "#EF4444" : "#F59E0B";

  const refValue = tx?.reference ?? tx?.id ?? "—";

  const rows = receiptRows(tx, payerName);

  return (
    <div
      ref={cardRef}
      style={{
        width: "100%",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, sans-serif',
        background: "#ffffff",
        // no border-radius anywhere on the outer container
      }}
    >
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(155deg, #001233 0%, #002FA7 65%, #0038D0 100%)",
          padding: "28px 28px 36px",
          position: "relative",
          overflow: "hidden",
          // no border-radius
        }}
      >
        {/* Angular decorative bands — matching Glass's geometric visual language */}
        <div
          style={{
            position: "absolute",
            right: -55,
            top: -60,
            width: 160,
            height: 280,
            background: "rgba(255,255,255,0.055)",
            transform: "rotate(22deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 30,
            top: -90,
            width: 80,
            height: 240,
            background: "rgba(255,255,255,0.035)",
            transform: "rotate(22deg)",
          }}
        />

        {/* Logo row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {logoB64 ? (
              <img
                src={logoB64}
                width={34}
                height={34}
                alt=""
                style={{ display: "block" /* no border-radius */ }}
              />
            ) : (
              <div
                style={{
                  width: 34,
                  height: 34,
                  background: "#1843C8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 900,
                    lineHeight: 1,
                  }}
                >
                  G
                </span>
              </div>
            )}
            <span
              style={{
                color: "#ffffff",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Glass
            </span>
          </div>
          <span
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "1.8px",
              textTransform: "uppercase",
            }}
          >
            Transaction Receipt
          </span>
        </div>

        {/* Thin divider */}
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.12)",
            marginBottom: 28,
            position: "relative",
            zIndex: 1,
          }}
        />

        {/* Amount + status */}
        <div
          style={{
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              color: "#ffffff",
              fontSize: 42,
              fontWeight: 900,
              letterSpacing: "-1px",
              lineHeight: 1,
              marginBottom: 14,
            }}
          >
            {formatNaira(tx?.amount)}
          </div>

          {/* Status — square bullet, no pill shape */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                background: statusColor,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color: statusColor,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "1.8px",
                textTransform: "uppercase",
              }}
            >
              {status}
            </span>
          </div>

          {/* Timestamp */}
          <div
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 11,
              letterSpacing: "0.2px",
            }}
          >
            {formatHeaderDate(tx?.date ?? tx?.createdAt)}
          </div>
        </div>
      </div>

      {/* ── TRANSACTION DETAILS ───────────────────────────────────────────── */}
      <div style={{ background: "#ffffff" }}>
        {/* Section label */}
        <div
          style={{
            padding: "16px 28px 0",
            fontSize: 9,
            fontWeight: 800,
            color: "#94A3B8",
            letterSpacing: "1.8px",
            textTransform: "uppercase",
          }}
        >
          Transaction Details
        </div>

        {rows.map(([label, value]) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 20,
              padding: "13px 28px",
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
                fontSize: 13,
                color: "#0F172A",
                fontWeight: 600,
                textAlign: "right",
                wordBreak: "break-word",
                maxWidth: "58%",
              }}
            >
              {value}
            </span>
          </div>
        ))}

        {/* Reference row — full-width, left-accent design */}
        <div style={{ padding: "16px 28px 20px" }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: "#94A3B8",
              letterSpacing: "1.8px",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Reference No.
          </div>
          <div
            style={{
              borderLeft: "3px solid #002FA7",
              paddingLeft: 12,
              background: "#F8FAFF",
              padding: "11px 14px",
              borderLeftWidth: 3,
              borderLeftStyle: "solid",
              borderLeftColor: "#002FA7",
              fontSize: 11.5,
              color: "#1E3A8A",
              fontWeight: 700,
              fontFamily: "'Courier New', Courier, monospace",
              wordBreak: "break-all",
              lineHeight: 1.7,
              letterSpacing: "0.3px",
            }}
          >
            {refValue}
          </div>
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "11px 28px 15px",
          borderTop: "1px solid #F1F5F9",
          background: "#FAFBFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {logoB64 && (
            <img
              src={logoB64}
              width={13}
              height={13}
              alt=""
              style={{ display: "block", opacity: 0.35 }}
            />
          )}
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#64748B",
              letterSpacing: "0.3px",
            }}
          >
            glasspay.app
          </span>
        </div>
        <span style={{ fontSize: 10, color: "#94A3B8" }}>
          Generated {formatDateTime(new Date())}
        </span>
      </div>
    </div>
  );
}

// ── Modal (bottom sheet) ──────────────────────────────────────────────────────

export default function ReceiptModal({ tx, payerName, onClose }) {
  const cardRef = useRef(null);
  const [logoB64, setLogoB64] = useState(null);
  const [saving, setSaving] = useState(null); // "image" | "pdf" | "share" | null

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
      backgroundColor: "#ffffff",
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
          // user dismissed — not an error
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

  const actionBtn = (onClick, isActive, children, primary = false) => (
    <button
      onClick={onClick}
      disabled={!!saving}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "13px 10px",
        background: primary ? "#002FA7" : "#EEF2FF",
        color: primary ? "#ffffff" : "#1E3A8A",
        border: "none",
        fontSize: 13,
        fontWeight: 600,
        cursor: saving ? "not-allowed" : "pointer",
        opacity: saving && !isActive ? 0.55 : 1,
        transition: "opacity 0.15s",
        // no border-radius — sharp buttons to match the receipt
      }}
    >
      {children}
    </button>
  );

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
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        style={{
          position: "relative",
          background: "#F0F4FF",
          borderRadius: "20px 20px 0 0", // rounded only at the top of the sheet itself, not the receipt card
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
              width: 36,
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
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
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

        {/* Scrollable receipt */}
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
            background: "#fff",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            gap: 1,
            flexShrink: 0,
          }}
        >
          {canShare &&
            actionBtn(
              handleShare,
              saving === "share",
              <>
                <Share2 size={15} />
                {saving === "share" ? "Sharing…" : "Share"}
              </>,
            )}
          {actionBtn(
            handleSaveImage,
            saving === "image",
            <>
              <ImageIcon size={15} />
              {saving === "image" ? "Saving…" : "Save Image"}
            </>,
          )}
          {actionBtn(
            handleSavePdf,
            saving === "pdf",
            <>
              <FileText size={15} />
              {saving === "pdf" ? "Saving…" : "Save PDF"}
            </>,
            true,
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
