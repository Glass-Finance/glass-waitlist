import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Check, Copy, CheckCheck, Share2 } from "lucide-react";
import { useActiveCommunityId } from "../../hooks/useActiveCommunityId";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useCommunityTransactionDetail } from "../../hooks/useCommunityTransactionDetail";
import ReceiptModal from "../../components/common/ReceiptModal";
import LoadingState from "../../components/common/LoadingState";
import { formatNaira, toTitleCase } from "../../utils/format";
import { transactionStatusStyle } from "../../utils/transactionStatus";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";

function StatusPill({ status }) {
  const { label, ...s } = transactionStatusStyle(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold ${s.cls}`}
    >
      {label === "Success" && (
        <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${s.dotCls}`}>
          <Check size={11} color="#fff" strokeWidth={3} />
        </span>
      )}
      {s.text}
    </span>
  );
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Row({ label, children, last }) {
  return (
    <div
      className={`flex items-start justify-between gap-4 py-3.5 ${last ? "border-none" : "border-b border-stacked-container"}`}
    >
      <span className="text-sm text-gray-500 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right break-words max-w-[62%]">
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
  const [copied, copy] = useCopyToClipboard(1500);
  const [shareOpen, setShareOpen] = useState(false);

  function copyReference() {
    copy(tx?.reference);
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
        <div className="bg-surface-container rounded-xl border border-surface-container-border shadow-[0_1px_4px_rgba(0,47,167,0.05)]">
          <LoadingState className="py-16" />
        </div>
      ) : error || !tx ? (
        <p className="text-xs text-red-500">Couldn't load this transaction.</p>
      ) : (
        <div className="max-w-xl flex flex-col gap-4">
          {/* Amount card */}
          <div
            className="bg-surface-container rounded-xl border border-surface-container-border px-8 py-9 flex flex-col items-center gap-3 shadow-[0_1px_4px_rgba(0,47,167,0.05)]"
          >
            <p className="text-4xl font-bold text-gray-900 tracking-[-0.5px]">
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
            className="bg-surface-container rounded-xl border border-surface-container-border px-6 py-4 shadow-[0_1px_4px_rgba(0,47,167,0.05)]"
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
            {tx.payerName && (
              <Row label="Member">
                <span className="inline-flex items-center gap-2 justify-end">
                  {tx.payerPhoto ? (
                    <img src={tx.payerPhoto} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-[#7C3AED] to-brand">
                      {getInitials(tx.payerName)}
                    </span>
                  )}
                  {toTitleCase(tx.payerName)}
                </span>
              </Row>
            )}
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
              <span className="break-all">{tx.reference ?? tx.id}</span>{" "}
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
                <span className="inline-block bg-[#D7E2FF] text-brand text-xs font-semibold rounded-full px-3 py-1">
                  {tx.initiatedBy}
                </span>
              </Row>
            )}
          </div>

          <button
            onClick={() => setShareOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold cursor-pointer bg-white border-[1.5px] border-brand text-brand"
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
