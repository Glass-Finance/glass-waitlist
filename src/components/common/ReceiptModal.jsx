import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, FileText, Image as ImageIcon, Share2, Check, Copy, CheckCheck } from "lucide-react";
import html2canvas from "html2canvas";
import ctaLogoUrl from "../../assets/cta/ctalogo.webp";
import { formatNaira as sharedFormatNaira, toTitleCase } from "../../utils/format";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";

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

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Photo-or-initials circle for the Member Details row. Plain <img>/div with
// borderRadius: "50%" rather than a CSS mask -- html2canvas (used for Save
// Image/Share) already renders that reliably elsewhere on this same card
// (the ticket-edge dots, the status checkmark circle), it's only
// mask-image/repeating-gradients it struggles with.
function Avatar({ photo, name, size = 28 }) {
  return photo ? (
    <img
      src={photo}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #7C3AED 0%, #002FA7 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span style={{ color: "#fff", fontSize: size * 0.38, fontWeight: 700, lineHeight: 1 }}>
        {getInitials(name)}
      </span>
    </div>
  );
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
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
            <Avatar photo={tx?.payerPhoto} name={payerName} />
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
              <span>{toTitleCase(payerName) || "—"}</span>
              {maskedEmail && (
                <span style={{ fontSize: 11, fontWeight: 500, color: "#94A3B8" }}>
                  {maskedEmail}
                </span>
              )}
            </span>
          </span>
        </DetailRow>

        <DetailRow label="Transaction Type">
          {toTitleCase(tx?.channel) || "—"}
        </DetailRow>

        <DetailRow label="Dues Amount">{formatNaira(tx?.amount)}</DetailRow>

        {/* Always shown, never conditional -- transparency about the fee is
            the point, so the row itself never disappears. The value can
            still be "—" though: Glass's fee is set per-community (there's
            a platform-admin override for it), not a fixed rate, so there's
            no formula to fall back on -- and asserting a specific ₦0.00
            when we simply don't have the real number would be a false
            claim, the opposite of transparent. */}
        <DetailRow label="Transaction Fee">
          {tx?.feeMinor != null ? formatNaira(tx.feeMinor) : "—"}
        </DetailRow>

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
  const [copied, copy] = useCopyToClipboard(1500);

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
    copy(tx?.reference ?? tx?.id);
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
      style={{ opacity: saving && !isActive ? 0.55 : 1 }}
      // no border-radius — sharp buttons to match the receipt
      className={`flex-1 flex items-center justify-center gap-1.5 py-[13px] px-2.5 border-none text-[13px] font-semibold transition-opacity duration-150 ${saving ? "cursor-not-allowed" : "cursor-pointer"} ${primary ? "bg-brand text-white" : "bg-[#EEF2FF] text-[#1E3A8A]"}`}
    >
      {children}
    </button>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Sheet — full-width bottom sheet on mobile (the member app, where
          this is meant to feel native); a normal capped-width centered
          dialog from sm: up so it doesn't swallow most of a desktop
          viewport (this component is shared with the admin dashboard). */}
      <div
        className="relative bg-[#F0F4FF] rounded-t-[20px] sm:rounded-[20px] max-h-[92dvh] sm:max-h-[85vh] sm:w-full sm:max-w-[420px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile-only affordance, meaningless on a centered desktop dialog */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0 sm:hidden">
          <div className="w-9 h-1 rounded-sm bg-black/15" />
        </div>

        {/* Title row */}
        <div className="flex items-center justify-between pt-2 px-5 pb-3 flex-shrink-0">
          <span className="text-[15px] font-bold text-[#0F172A]">
            Payment Receipt
          </span>
          <button
            onClick={onClose}
            className="bg-black/[0.06] border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer text-[#475569] flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable receipt */}
        <div
          style={{ WebkitOverflowScrolling: "touch" }}
          className="flex-1 overflow-y-auto px-4 pt-0 pb-3"
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
        <div className="bg-white border-t border-[#E2E8F0] flex gap-px flex-shrink-0">
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
