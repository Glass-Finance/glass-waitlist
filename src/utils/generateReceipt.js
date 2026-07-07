import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import backgroundUrl from "../assets/background.webp";

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
    ["Description", tx.description ?? tx.planName ?? "Payment"],
    ["Community", tx.communityName ?? "—"],
    ["Paid by", payerName ?? "—"],
    ["Date", formatDate(tx.date)],
    ["Payment method", tx.channel ?? "—"],
  ];
}

function receiptFilename(tx, ext) {
  return `glass-receipt-${tx.reference ?? tx.id ?? Date.now()}.${ext}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Image receipt — rendered off-screen and captured with html2canvas.
// Sharp corners throughout, no floating card overlap, strong Glass identity.
// ─────────────────────────────────────────────────────────────────────────────
export async function downloadReceiptImage(tx, { payerName } = {}) {
  const status = statusLabel(tx.status);
  const isSuccess = status === "Successful";
  const isFailed = status === "Failed";

  const statusColor = isSuccess ? "#0ECE7B" : isFailed ? "#EF4444" : "#F59E0B";

  const [logoB64, bgB64] = await Promise.all([
    imgToBase64("/Glass.webp"),
    imgToBase64(backgroundUrl),
  ]);
  const logoHtml = logoB64
    ? `<img src="${logoB64}" width="34" height="34" alt="" style="display:block;" />`
    : `<div style="width:34px;height:34px;background:#1843C8;display:flex;align-items:center;justify-content:center;"><span style="color:#fff;font-size:16px;font-weight:900;line-height:1;">G</span></div>`;

  const logoSmall = logoB64
    ? `<img src="${logoB64}" width="13" height="13" alt="" style="display:block;opacity:0.35;" />`
    : "";

  const rows = receiptRows(tx, payerName);
  const detailRowsHtml = rows
    .map(
      ([label, value]) => `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding:13px 28px;border-bottom:1px solid #F1F5F9;">
        <span style="font-size:12px;color:#94A3B8;white-space:nowrap;flex-shrink:0;">${label}</span>
        <span style="font-size:13px;color:#0F172A;font-weight:600;text-align:right;word-break:break-word;max-width:58%;">${value}</span>
      </div>`,
    )
    .join("");

  const refValue = tx.reference ?? tx.id ?? "—";

  const card = document.createElement("div");
  card.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 420px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, sans-serif;
    background: #ffffff;
  `;

  card.innerHTML = `
    <div style="position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;${bgB64 ? `background-image:url(${bgB64});` : "background-color:#001D7A;"}background-size:cover;background-position:center top;"></div>
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(to bottom,rgba(0,8,30,0.44) 0%,rgba(0,12,45,0.62) 100%);"></div>
      <div style="position:relative;z-index:1;padding:28px 28px 36px;">

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;">
        <div style="display:flex;align-items:center;gap:10px;">
          ${logoHtml}
          <span style="color:#fff;font-size:18px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Glass</span>
        </div>
        <span style="color:rgba(255,255,255,0.5);font-size:9px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;">Transaction Receipt</span>
      </div>

      <div style="height:1px;background:rgba(255,255,255,0.12);margin-bottom:28px;position:relative;z-index:1;"></div>

      <div style="text-align:center;position:relative;z-index:1;">
        <div style="color:#fff;font-size:44px;font-weight:900;letter-spacing:-1px;line-height:1;margin-bottom:14px;">${formatNaira(tx.amount)}</div>
        <div style="display:inline-flex;align-items:center;gap:7px;margin-bottom:12px;">
          <div style="width:7px;height:7px;background:${statusColor};flex-shrink:0;"></div>
          <span style="color:${statusColor};font-size:12px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;">${status}</span>
        </div>
        <div style="color:rgba(255,255,255,0.45);font-size:11px;">${formatHeaderDate(tx.date ?? tx.createdAt)}</div>
      </div>
      </div>
    </div>

    <div style="background:#fff;">
      <div style="padding:16px 28px 0;font-size:9px;font-weight:800;color:#94A3B8;letter-spacing:1.8px;text-transform:uppercase;">Transaction Details</div>
      ${detailRowsHtml}
      <div style="padding:16px 28px 20px;">
        <div style="font-size:9px;font-weight:800;color:#94A3B8;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:8px;">Reference No.</div>
        <div style="border-left:3px solid #002FA7;padding:11px 14px;background:#F8FAFF;font-size:11.5px;color:#1E3A8A;font-weight:700;font-family:'Courier New',Courier,monospace;word-break:break-all;line-height:1.7;letter-spacing:0.3px;">${refValue}</div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;padding:11px 28px 15px;border-top:1px solid #F1F5F9;background:#FAFBFF;">
      <div style="display:flex;align-items:center;gap:6px;">
        ${logoSmall}
        <span style="font-size:10px;font-weight:700;color:#64748B;letter-spacing:0.3px;">glasspay.app</span>
      </div>
      <span style="font-size:10px;color:#94A3B8;">Generated ${formatDateTime(new Date())}</span>
    </div>
  `;

  document.body.appendChild(card);
  try {
    const canvas = await html2canvas(card, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = receiptFilename(tx, "png");
    link.click();
  } finally {
    document.body.removeChild(card);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF receipt — clean document layout, branded header band.
// ─────────────────────────────────────────────────────────────────────────────
export async function downloadReceiptPdf(tx, { payerName } = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 56;
  const headerH = 140;

  // Full-width header band
  doc.setFillColor(0, 29, 122); // #001D7A
  doc.rect(0, 0, W, headerH, "F");

  // Lighter accent strip at the bottom of the header
  doc.setFillColor(0, 47, 167); // #002FA7
  doc.rect(0, headerH - 28, W, 28, "F");

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

  // Section label
  let y = headerH + 44;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("TRANSACTION DETAILS", margin, y);
  y += 22;

  // Detail rows
  const rows = receiptRows(tx, payerName);
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
  doc.text("REFERENCE NO.", margin, y);
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
