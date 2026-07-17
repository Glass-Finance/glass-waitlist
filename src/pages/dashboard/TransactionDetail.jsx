import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Check, Copy, CheckCheck, Share2 } from "lucide-react";
import { useActiveCommunityId } from "../../hooks/useActiveCommunityId";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useCommunityTransactionDetail } from "../../hooks/useCommunityTransactionDetail";
import ReceiptModal from "../../components/common/ReceiptModal";
import LoadingState from "../../components/common/LoadingState";
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
      className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {label === "Success" && (
        <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: s.color }}>
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
      className="flex items-start justify-between gap-4 py-3.5"
      style={{ borderBottom: last ? "none" : "1px solid #F3F4F6" }}
    >
      <span className="text-sm text-gray-500 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right" style={{ wordBreak: "break-word", maxWidth: "62%" }}>
        {children}
      </span>
    </div>
  );
}

// Admin-side counterpart to the member app's Transaction Details page
// (src/pages/memberApp/TransactionDetail.jsx) -- same content, same Share
// Receipt action via the shared ReceiptModal, reached from a community
// admin's own transaction tables (AdminDashboard.jsx's Member Payments
// table, MemberDetail.jsx's Payment History table) instead of a member's
// own history.
export default function TransactionDetail() {
  usePageTitle("Transaction Details");
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const communityId = useActiveCommunityId();
  const { data: tx, isLoading, error } = useCommunityTransactionDetail(communityId, transactionId);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  function copyReference() {
    if (!tx?.reference) return;
    navigator.clipboard?.writeText(tx.reference).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="px-4 md:px-6 py-6 overflow-y-auto h-full">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-black">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 font-medium bg-transparent border-none p-0 cursor-pointer hover:text-gray-600 hover:underline inline-flex items-center gap-1"
          >
            <ChevronLeft size={15} /> Back
          </button>
          <span className="text-gray-300 mx-2">›</span> Transaction Details
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">A full picture of this transaction.</p>
      </div>

      {isLoading ? (
        <div className="bg-surface-container rounded-xl border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
          <LoadingState className="py-16" />
        </div>
      ) : error || !tx ? (
        <p className="text-xs text-red-500">Couldn't load this transaction.</p>
      ) : (
        <div className="max-w-xl flex flex-col gap-4">
          {/* Amount card */}
          <div
            className="bg-surface-container rounded-xl border border-gray-100 px-8 py-9 flex flex-col items-center gap-3"
            style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}
          >
            <p className="text-4xl font-bold text-gray-900" style={{ letterSpacing: "-0.5px" }}>
              {formatNaira(tx.amount, { decimals: 2 })}
            </p>
            <StatusPill status={tx.status} />
            <p className="text-sm text-gray-400">
              {tx.date
                ? new Date(tx.date).toLocaleString("en-NG", {
                    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                  }).replace(",", " •")
                : "—"}
            </p>
          </div>

          {/* Details card */}
          <div
            className="bg-surface-container rounded-xl border border-gray-100 px-6 py-4"
            style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}
          >
            <p className="text-sm font-semibold text-black mb-1">Transaction Details</p>

            <Row label="Community">
              <span className="inline-flex items-center gap-2">
                {tx.communityLogo?.url && (
                  <img src={tx.communityLogo.url} alt="" className="w-6 h-6 object-contain" />
                )}
                {tx.communityName ?? "—"}
              </span>
            </Row>
            <Row label="Plan">{toTitleCase(tx.planName ?? tx.description) ?? "—"}</Row>
            {tx.payerName && <Row label="Member">{toTitleCase(tx.payerName)}</Row>}
            <Row label="Transaction Type">{toTitleCase(tx.transactionType ?? tx.channel) || "—"}</Row>
            <Row label="Dues Amount">{formatNaira(tx.amount)}</Row>
            {/* Always shown, never conditional -- transparency about the
                fee is the point. The value can still be "—": Glass's fee
                is set per-community (there's a platform-admin commission
                override), not a fixed rate, so there's nothing to derive
                it from when the raw data doesn't carry it. */}
            <Row label="Transaction Fee">
              {tx.feeMinor != null ? formatNaira(tx.feeMinor, { decimals: 2 }) : "—"}
            </Row>
            <Row label="Transaction ID" last={!tx.initiatedBy}>
              <span style={{ wordBreak: "break-all" }}>{tx.reference ?? tx.id}</span>{" "}
              <button
                onClick={copyReference}
                className="bg-transparent border-none cursor-pointer p-0.5 text-gray-400 inline-flex align-middle"
                aria-label="Copy transaction ID"
              >
                {copied ? <CheckCheck size={13} color="#15803d" /> : <Copy size={13} />}
              </button>
            </Row>
            {tx.initiatedBy && (
              <Row label="Initiated by" last>
                <span className="inline-block bg-[#D7E2FF] text-[#002FA7] text-xs font-semibold rounded-full px-3 py-1">
                  {tx.initiatedBy}
                </span>
              </Row>
            )}
          </div>

          <button
            onClick={() => setShareOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold cursor-pointer"
            style={{ background: "#fff", border: "1.5px solid #002FA7", color: "#002FA7" }}
          >
            <Share2 size={15} />
            Share Receipt
          </button>
        </div>
      )}

      {shareOpen && tx && (
        <ReceiptModal
          tx={tx}
          payerName={tx.payerName}
          payerEmail={tx.payerEmail}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
