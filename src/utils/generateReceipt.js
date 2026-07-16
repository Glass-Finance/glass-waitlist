import { jsPDF } from "jspdf";
import { formatNaira as sharedFormatNaira, toTitleCase } from "./format";

function formatNaira(amount) {
  return sharedFormatNaira(amount, { decimals: 2 });
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

// Cosmetic masking for the Member Details row (e.g. "am**bu@gmail.com") — the
// PDF is only ever downloaded by the payer themselves or an admin who already
// has this member's full record elsewhere, so this is polish, not privacy.
function maskEmail(email) {
  if (!email || !email.includes("@")) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return null;
  if (local.length <= 4) return `${local[0]}**@${domain}`;
  return `${local.slice(0, 2)}**${local.slice(-2)}@${domain}`;
}

function receiptRows(tx, payerName, payerEmail) {
  const maskedEmail = maskEmail(payerEmail);
  const memberDetails = [toTitleCase(payerName) || "—", maskedEmail]
    .filter(Boolean)
    .join("   ·   ");

  const rows = [
    ["Community", tx.communityName ?? "—"],
    ["Plan", toTitleCase(tx.planName ?? tx.description) || "—"],
    ["Member Details", memberDetails],
    ["Transaction Type", toTitleCase(tx.channel) || "—"],
    ["Dues Amount", formatNaira(tx.amount)],
  ];
  if (tx.feeMinor != null) rows.push(["Transaction Fee", formatNaira(tx.feeMinor)]);
  return rows;
}

function receiptFilename(tx, ext) {
  return `glass-receipt-${tx.reference ?? tx.id ?? Date.now()}.${ext}`;
}

// Approximates the app's 135deg purple-to-blue brand gradient as a left-to-
// right band — jsPDF has no native gradient fill, so this interpolates the
// same two brand colors used everywhere else (Sidebar CTA, receipt header)
// across thin vertical strips.
function drawGradientBand(doc, x, y, w, h, [r1, g1, b1], [r2, g2, b2], steps = 48) {
  const stepW = w / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    doc.setFillColor(
      Math.round(r1 + (r2 - r1) * t),
      Math.round(g1 + (g2 - g1) * t),
      Math.round(b1 + (b2 - b1) * t),
    );
    doc.rect(x + stepW * i, y, stepW + 0.5, h, "F");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF receipt — clean document layout, branded gradient header band.
// ─────────────────────────────────────────────────────────────────────────────
export async function downloadReceiptPdf(tx, { payerName, payerEmail } = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 56;
  const headerH = 150;

  // Full-width gradient header band — purple (#7C3AED) to Glass blue (#002FA7)
  drawGradientBand(doc, 0, 0, W, headerH, [124, 58, 237], [0, 47, 167]);

  // Glass wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("GLASS", margin, 52);

  // "Transaction Receipt" label top-right
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(160, 180, 220);
  doc.text("TRANSACTION RECEIPT", W - margin, 52, { align: "right" });

  // Thin rule under logo row
  doc.setDrawColor(255, 255, 255);
  doc.setGState(new doc.GState({ opacity: 0.12 }));
  doc.setLineWidth(0.5);
  doc.line(margin, 62, W - margin, 62);
  doc.setGState(new doc.GState({ opacity: 1 }));

  // Amount
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(255, 255, 255);
  doc.text(formatNaira(tx.amount), margin, 106);

  // Status
  const status = statusLabel(tx.status);
  const isSuccess = status === "Successful";
  const isFailed = status === "Failed";
  const [sr, sg, sb] = isSuccess ? [14, 206, 123] : isFailed ? [239, 68, 68] : [245, 158, 11];
  doc.setFontSize(11);
  doc.setTextColor(sr, sg, sb);
  doc.text(status.toUpperCase(), W - margin, 106, { align: "right" });

  // Timestamp
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(190, 200, 230);
  doc.text(formatHeaderDate(tx.date ?? tx.createdAt), margin, 126);

  // Section label
  let y = headerH + 44;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("TRANSACTION DETAILS", margin, y);
  y += 22;

  // Detail rows
  const rows = receiptRows(tx, payerName, payerEmail);
  doc.setFontSize(11);

  for (let i = 0; i < rows.length; i++) {
    const [label, value] = rows[i];

    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 255);
      doc.rect(margin - 8, y - 15, W - (margin - 8) * 2, 26, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(label, margin, y);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(String(value), W - margin, y, { align: "right", maxWidth: W * 0.52 });

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.5);
    doc.line(margin - 8, y + 11, W - margin + 8, y + 11);

    y += 34;
  }

  // Reference
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("TRANSACTION ID", margin, y);
  y += 12;

  // Left accent bar for reference
  doc.setFillColor(0, 47, 167);
  doc.rect(margin - 8, y - 2, 3, 20, "F");
  doc.setFillColor(248, 250, 255);
  doc.rect(margin - 5, y - 2, W - (margin - 5) - margin + 8, 20, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  const refLines = doc.splitTextToSize(String(tx.reference ?? tx.id ?? "—"), W - margin * 2 - 8);
  doc.text(refLines, margin, y + 12);
  y += (refLines.length - 1) * 14 + 32;

  // Footer
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("glasspay.app", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated ${formatDateTime(new Date())}`, W - margin, y, { align: "right" });

  doc.save(receiptFilename(tx, "pdf"));
}
