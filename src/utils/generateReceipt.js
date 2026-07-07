import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Convert a same-origin URL to a base64 data URI for embedding in
// html2canvas DOM nodes and jsPDF addImage calls.
async function imgToBase64(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

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
    ["Description", tx.description ?? tx.planName ?? "Payment"],
    ["Community", tx.communityName ?? "—"],
    ["Paid by", payerName ?? "—"],
    ["Date", formatDate(tx.date)],
    ["Payment method", tx.channel ?? "—"],
    ["Reference", tx.reference ?? tx.id ?? "—"],
  ];
}

function receiptFilename(tx, ext) {
  return `glass-receipt-${tx.reference ?? tx.id ?? Date.now()}.${ext}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Image receipt — premium shareable card, rasterized with html2canvas.
// ─────────────────────────────────────────────────────────────────────────────
export async function downloadReceiptImage(tx, { payerName } = {}) {
  const status = statusLabel(tx.status);
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

  const logoB64 = await imgToBase64("/Glass.webp");
  const logoHtml = logoB64
    ? `<img src="${logoB64}" width="28" height="28" style="border-radius:8px; display:block; flex-shrink:0;" />`
    : `<div style="width:28px; height:28px; border-radius:8px; background:#1843C8; display:flex; align-items:center; justify-content:center; flex-shrink:0;"><span style="color:#fff; font-size:14px; font-weight:800; line-height:1;">G</span></div>`;

  const rows = receiptRows(tx, payerName);

  const detailRows = rows
    .slice(0, -1)
    .map(
      ([label, value]) => `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; padding:11px 0; border-bottom:1px solid #F1F5F9;">
        <span style="font-size:12px; color:#94A3B8; white-space:nowrap; flex-shrink:0;">${label}</span>
        <span style="font-size:12.5px; color:#0F172A; font-weight:600; text-align:right; word-break:break-word; max-width:220px;">${value}</span>
      </div>`,
    )
    .join("");

  const [, refValue] = rows[rows.length - 1];

  const card = document.createElement("div");
  card.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 400px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, sans-serif;
    background: #EEF2FF;
    border-radius: 20px;
    overflow: hidden;
  `;

  card.innerHTML = `
    <div style="
      background: linear-gradient(145deg, #001030 0%, #001D7A 55%, #002FA7 100%);
      padding: 28px 28px 44px;
      position: relative;
      overflow: hidden;
    ">
      <div style="
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
        background-size: 20px 20px;
        pointer-events: none;
      "></div>
      <div style="position:absolute; right:-60px; top:-60px; width:220px; height:220px; border-radius:50%; background:rgba(255,255,255,0.04); pointer-events:none;"></div>
      <div style="position:absolute; left:-40px; bottom:-80px; width:200px; height:200px; border-radius:50%; background:rgba(255,255,255,0.03); pointer-events:none;"></div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; position:relative; z-index:1;">
        <div style="display:flex; align-items:center; gap:8px;">
          ${logoHtml}
          <span style="color:#fff; font-size:16px; font-weight:700; letter-spacing:0.2px;">Glass</span>
        </div>
        <span style="color:rgba(255,255,255,0.5); font-size:10px; font-weight:600; letter-spacing:1.2px; text-transform:uppercase;">Receipt</span>
      </div>

      <div style="text-align:center; position:relative; z-index:1;">
        <div style="width:70px; height:70px; border-radius:50%; border:2px solid rgba(255,255,255,0.18); background:rgba(255,255,255,0.08); margin:0 auto 20px; display:flex; align-items:center; justify-content:center;">
          <div style="width:50px; height:50px; border-radius:50%; background:${iconBg}; display:flex; align-items:center; justify-content:center;">
            <span style="color:#fff; font-size:24px; font-weight:700; line-height:1;">${iconChar}</span>
          </div>
        </div>
        <div style="color:#fff; font-size:36px; font-weight:800; letter-spacing:-0.5px; line-height:1; margin-bottom:12px;">${formatNaira(tx.amount)}</div>
        <div style="display:inline-block; background:${badgeBg}; border:1px solid ${badgeBorder}; color:${badgeColor}; font-size:10px; font-weight:700; letter-spacing:1.2px; padding:5px 16px; border-radius:100px;">
          PAYMENT ${status.toUpperCase()}
        </div>
      </div>
    </div>

    <div style="
      background: #fff;
      margin: -4px 14px 0;
      border-radius: 20px;
      padding: 8px 20px 8px;
      box-shadow: 0 4px 24px rgba(0,47,167,0.08);
      position: relative;
      z-index: 2;
    ">
      ${detailRows}
      <div style="padding: 12px 0 6px;">
        <div style="font-size:11px; color:#94A3B8; margin-bottom:6px;">Reference</div>
        <div style="
          background: #F8FAFF;
          border: 1px solid #E8EEFF;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 11px;
          color: #1E3A8A;
          font-weight: 600;
          font-family: 'Courier New', Courier, monospace;
          word-break: break-all;
          line-height: 1.6;
        ">${refValue}</div>
      </div>
    </div>

    <div style="text-align:center; padding:14px 16px 20px;">
      <div style="font-size:10px; color:#94A3B8;">
        <strong style="color:#64748B;">glasspay.app</strong>&nbsp;&nbsp;·&nbsp;&nbsp;Generated ${formatDateTime(new Date())}
      </div>
    </div>
  `;

  document.body.appendChild(card);
  try {
    const canvas = await html2canvas(card, {
      scale: 3,
      backgroundColor: "#EEF2FF",
      useCORS: true,
      logging: false,
    });
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = receiptFilename(tx, "png");
    link.click();
  } finally {
    document.body.removeChild(card);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF receipt — one-page document suitable for records and printing.
// ─────────────────────────────────────────────────────────────────────────────
export async function downloadReceiptPdf(tx, { payerName } = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 56;
  const headerH = 130;

  // Header band — dark navy base
  doc.setFillColor(0, 29, 122);
  doc.rect(0, 0, W, headerH, "F");

  // Lighter accent strip at the bottom of the header
  doc.setFillColor(0, 47, 167);
  doc.rect(0, headerH - 30, W, 30, "F");

  // Glass wordmark (white)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("Glass", margin, 52);

  // "PAYMENT RECEIPT" label (top-right, muted)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(180, 195, 230);
  doc.text("PAYMENT RECEIPT", W - margin, 52, { align: "right" });

  // Amount (large, white)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(255, 255, 255);
  doc.text(formatNaira(tx.amount), margin, 104);

  // Status (color-coded, top-right)
  const status = statusLabel(tx.status);
  const isSuccess = status === "Successful";
  const isFailed = status === "Failed";
  const [sr, sg, sb] = isSuccess ? [16, 185, 129] : isFailed ? [239, 68, 68] : [245, 158, 11];
  doc.setFontSize(11);
  doc.setTextColor(sr, sg, sb);
  doc.text(status.toUpperCase(), W - margin, 104, { align: "right" });

  // Detail rows
  let y = headerH + 48;
  const rows = receiptRows(tx, payerName);

  for (let i = 0; i < rows.length; i++) {
    const [label, value] = rows[i];
    const isLast = i === rows.length - 1;

    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 255);
      doc.rect(margin - 8, y - 15, W - (margin - 8) * 2, 26, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(label, margin, y);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    const maxW = W * 0.5;

    if (isLast) {
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(String(value), maxW);
      doc.text(lines, W - margin, y, { align: "right" });
      y += (lines.length - 1) * 14;
    } else {
      doc.text(String(value), W - margin, y, { align: "right", maxWidth: maxW });
    }

    if (!isLast) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin - 8, y + 11, W - margin + 8, y + 11);
    }

    y += 34;
  }

  // Footer separator + generated line
  y += 14;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("glasspay.app", margin, y);
  doc.text(`Generated ${formatDateTime(new Date())}`, W - margin, y, { align: "right" });

  doc.save(receiptFilename(tx, "pdf"));
}
