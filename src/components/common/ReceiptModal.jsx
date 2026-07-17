import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, FileText, Image as ImageIcon, Share2, Check, Copy, CheckCheck } from "lucide-react";
import html2canvas from "html2canvas";
import ctaLogoUrl from "../../assets/cta/ctalogo.webp";
import { formatNaira as sharedFormatNaira, toTitleCase } from "../../utils/format";

// ── Helpers ──────────────────────────────────────────────────────────────────
// Receipts show 2 decimal places (kobo precision), unlike the app-wide 0-decimal default.
function formatNaira(amount) {
  return sharedFormatNaira(amount, { decimals: 2 });
}

// Splits "₦5,010.00" into the whole part and ".00" so the decimals can be
// styled in a lighter tone, matching the Figma amount treatment.
function splitNaira(amount) {
  const full = formatNaira(amount);
  const dot = full.lastIndexOf(".");
  if (dot === -1) return { whole: full, decimals: "" };
  return { whole: full.slice(0, dot), decimals: full.slice(dot) };
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

// Compact "Apr 1,2025 • 12:00AM" -- toLocaleString's "en-NG" locale defaults
// to a 24-hour clock with no AM/PM marker, which is why the header timestamp
// never matched the Figma format. Built by hand so the 12-hour clock and
// AM/PM suffix are guaranteed regardless of locale/engine defaults.
function formatHeaderDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${month} ${day},${year} • ${hours}:${minutes}${ampm}`;
}

function statusLabel(status) {
  const s = (status ?? "").toLowerCase();
  if (s === "success" || s === "successful") return "Successful";
  if (s === "failed") return "Failed";
  return "Pending";
}

// Cosmetic masking for the Member Details row (e.g. "am**bu@gmail.com") — the
// viewer is always either the payer themselves or an admin who already has
// this member's full record elsewhere, so this is polish, not real privacy.
function maskEmail(email) {
  if (!email || !email.includes("@")) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return null;
  if (local.length <= 4) return `${local[0]}**@${domain}`;
  return `${local.slice(0, 2)}**${local.slice(-2)}@${domain}`;
}

function DetailRow({ label, children, last }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 20,
        padding: "13px 28px",
        borderBottom: last ? "none" : "1px solid #F1F5F9",
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: "#94A3B8",
          whiteSpace: "nowrap",
          flexShrink: 0,
          paddingTop: 2,
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
          maxWidth: "62%",
        }}
      >
        {children}
      </span>
    </div>
  );
}

// ── ReceiptCard — rendered as real JSX for the in-app preview ────────────────
// Rules: no border-radius on the outer card or logo, no overlapping sections.

function ReceiptCard({ tx, payerName, payerEmail, logoB64, footerLogoB64, cardRef, copied, onCopyReference }) {
  const status = statusLabel(tx?.status);
  const isSuccess = status === "Successful";
  const isFailed = status === "Failed";

  const statusColor = isSuccess ? "#ffffff" : isFailed ? "#FCA5A5" : "#FDE68A";

  const refValue = tx?.reference ?? tx?.id ?? "—";
  const maskedEmail = maskEmail(payerEmail);
  const amountParts = splitNaira(tx?.amount);

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
      {/* ── Scalloped ticket edge — plain white circles (matching the card's
          own white body, not the modal sheet behind it) that overlap the
          header's top corners via negative margin, biting into the
          gradient in normal document flow. DOM circles rather than a CSS
          mask/gradient specifically because this card is also captured by
          html2canvas for Save Image/Share/PDF, which has weak support for
          masks and repeating gradients but renders plain bordered/rounded
          divs reliably. ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 12px",
          marginBottom: -8,
          position: "relative",
          zIndex: 2,
        }}
      >
        {Array.from({ length: 11 }).map((_, i) => (
          <div
            key={i}
            style={{ width: 16, height: 16, borderRadius: "50%", background: "#ffffff", flexShrink: 0 }}
          />
        ))}
      </div>

      {/* ── HEADER — brand gradient, matches the accent used on Sidebar/CTA
          surfaces elsewhere in the app (135deg, purple to Glass blue) ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #7C3AED 0%, #002FA7 100%)",
          padding: "28px 28px 32px",
        }}
      >
        {/* Logo row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 36,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {logoB64 ? (
              <img
                src={logoB64}
                width={30}
                height={30}
                alt=""
                style={{ display: "block" }}
              />
            ) : (
              <div
                style={{
                  width: 30,
                  height: 30,
                  background: "rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "#fff", fontSize: 15, fontWeight: 900, lineHeight: 1 }}>
                  G
                </span>
              </div>
            )}
            <span
              style={{
                color: "#ffffff",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              Glass
            </span>
          </div>
          <span
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Transaction Receipt
          </span>
        </div>

        {/* Amount + status */}
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 14, lineHeight: 1 }}>
            <span style={{ color: "#ffffff", fontSize: 38, fontWeight: 700, letterSpacing: "-1px" }}>
              {amountParts.whole}
            </span>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 38, fontWeight: 700, letterSpacing: "-1px" }}>
              {amountParts.decimals}
            </span>
          </div>

          {/* Status — flat checkmark + label, no pill container */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                width: 15,
                height: 15,
                borderRadius: "50%",
                background: isSuccess ? "#0ECE7B" : isFailed ? "#EF4444" : "#F59E0B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isSuccess && <Check size={10} color="#fff" strokeWidth={3.5} />}
            </span>
            <span
              style={{
                color: statusColor,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.2px",
              }}
            >
              {status}
            </span>
          </div>

          {/* Timestamp */}
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11.5, letterSpacing: "0.2px" }}>
            {formatHeaderDate(tx?.date ?? tx?.createdAt)}
          </div>
        </div>
      </div>

      {/* ── TRANSACTION DETAILS ───────────────────────────────────────────── */}
      <div style={{ background: "#ffffff" }}>
        <DetailRow label="Community">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, justifyContent: "flex-end" }}>
            {tx?.communityLogo?.url && (
              <img
                src={tx.communityLogo.url}
                alt=""
                width={32}
                height={32}
                style={{ objectFit: "cover", flexShrink: 0 }}
              />
            )}
            {tx?.communityName ?? "—"}
          </span>
        </DetailRow>

        <DetailRow label="Plan">
          {toTitleCase(tx?.planName ?? tx?.description) ?? "—"}
        </DetailRow>

        <DetailRow label="Member Details">
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <span>{toTitleCase(payerName) || "—"}</span>
            {maskedEmail && (
              <span style={{ fontSize: 11, fontWeight: 500, color: "#94A3B8" }}>
                {maskedEmail}
              </span>
            )}
          </span>
        </DetailRow>

        <DetailRow label="Transaction Type">
          {toTitleCase(tx?.channel) || "—"}
        </DetailRow>

        <DetailRow label="Dues Amount">{formatNaira(tx?.amount)}</DetailRow>

        {/* Always shown, never conditional -- Glass's fee is part of being
            transparent about the service, not something to hide when it
            happens to be zero. */}
        <DetailRow label="Transaction Fee">{formatNaira(tx?.feeMinor ?? 0)}</DetailRow>

        <DetailRow label="Transaction ID" last>
          <span style={{ wordBreak: "break-all" }}>{refValue}</span>{" "}
          <button
            onClick={onCopyReference}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94A3B8", display: "inline-flex", verticalAlign: "middle" }}
            aria-label="Copy transaction ID"
          >
            {copied ? <CheckCheck size={13} color="#15803d" /> : <Copy size={13} />}
          </button>
        </DetailRow>
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
          {footerLogoB64 && (
            <img
              src={footerLogoB64}
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

export default function ReceiptModal({ tx, payerName, payerEmail, onClose }) {
  const cardRef = useRef(null);
  // Two variants: the silver/grey mark reads correctly against the gradient
  // header, but is too low-contrast at the small, faded opacity the footer
  // uses on a near-white background -- the footer keeps the colored mark.
  const [logoB64, setLogoB64] = useState(null);
  const [footerLogoB64, setFooterLogoB64] = useState(null);
  const [saving, setSaving] = useState(null); // "image" | "pdf" | "share" | null
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function toB64(blob) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
    fetch(ctaLogoUrl).then((r) => r.blob()).then(toB64).then(setLogoB64).catch(() => {});
    fetch("/Glass.webp").then((r) => r.blob()).then(toB64).then(setFooterLogoB64).catch(() => {});
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function copyReference() {
    const refValue = tx?.reference ?? tx?.id;
    if (!refValue) return;
    navigator.clipboard?.writeText(String(refValue)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

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
      await downloadReceiptPdf(tx, { payerName, payerEmail });
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
            payerEmail={payerEmail}
            logoB64={logoB64}
            footerLogoB64={footerLogoB64}
            cardRef={cardRef}
            copied={copied}
            onCopyReference={copyReference}
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
