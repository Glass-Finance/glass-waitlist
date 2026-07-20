import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Check, Copy, CheckCheck, Share2 } from "lucide-react";
import { useTransactionDetail } from "../../hooks/useTransactionDetail";
import { useAuth } from "../../store/AuthContext";
import GlassLogoGlow from "../../components/memberApp/GlassLogoGlow";
import PageLoadingState from "../../components/memberApp/PageLoadingState";
import ReceiptModal from "../../components/common/ReceiptModal";
import { formatNaira, toTitleCase } from "../../utils/format";
import { transactionStatusStyle } from "../../utils/transactionStatus";

function StatusPill({ status }) {
  const { label, ...s } = transactionStatusStyle(status);
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg py-1.5 px-3.5 ${s.cls}`}>
      {label === "Success" && (
        <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${s.dotCls}`}>
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
      className={`flex items-start justify-between gap-4 py-3.5 ${last ? "border-none" : "border-b border-stacked-container"}`}
    >
      <span className="text-sm text-[#6B7280] flex-shrink-0 pt-px">{label}</span>
      <span className="text-sm font-semibold text-[#111827] text-right break-words max-w-[62%]">
        {children}
      </span>
    </div>
  );
}

export default function TransactionDetail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactionId } = useParams();
  const { data: tx, isLoading, error } = useTransactionDetail(transactionId);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const payerName = toTitleCase(
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "",
  );

  function copyReference() {
    if (!tx?.reference) return;
    navigator.clipboard?.writeText(tx.reference).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div
      className="relative overflow-hidden min-h-screen pb-10 max-w-[430px] mx-auto"
    >
      <GlassLogoGlow />
      {/* Header */}
      <div className="flex items-center gap-2.5 pt-5 px-4 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.1)] flex-shrink-0"
        >
          <ChevronLeft size={18} color="#374151" />
        </button>
        <h1 className="text-lg font-semibold text-[#111] m-0 flex-1 text-center mr-9">
          Transaction Details
        </h1>
      </div>

      {isLoading ? (
        <PageLoadingState label="Loading transaction…" />
      ) : error || !tx ? (
        <div className="py-10 px-5 text-center">
          <p className="text-sm text-danger">Couldn't load this transaction.</p>
        </div>
      ) : (
        <div className="py-0 px-4 flex flex-col gap-3">
          {/* Amount card */}
          <div className="bg-white rounded-2xl pt-7 px-5 pb-7 shadow-[0_1px_6px_rgba(0,0,0,0.06)] flex flex-col items-center gap-3">
            <p className="text-[34px] font-bold text-[#111827] m-0 tracking-[-0.5px]">
              {formatNaira(tx.amount, { decimals: 2 })}
            </p>
            <StatusPill status={tx.status} />
            <p className="text-[13px] text-[#9CA3AF] m-0">
              {tx.date
                ? new Date(tx.date).toLocaleString("en-NG", {
                    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                  }).replace(",", " •")
                : "—"}
            </p>
          </div>

          {/* Details card */}
          <div className="bg-white rounded-2xl pt-[18px] px-5 pb-[18px] shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
            <p className="text-[15px] font-semibold text-[#111] mt-0 mx-0 mb-1.5">
              Transaction Details
            </p>

            <Row label="Community:">
              <span className="flex items-center gap-2">
                {tx.communityLogo?.url && (
                  <img
                    src={tx.communityLogo.url}
                    alt=""
                    className="w-8 h-8 object-cover"
                  />
                )}
                {tx.communityName ?? "—"}
              </span>
            </Row>
            <Row label="Plan:" last={!tx.transactionType && !tx.channel}>
              {toTitleCase(tx.planName ?? tx.description) ?? "—"}
            </Row>
            {(tx.transactionType || tx.channel) && (
              <Row label="Transaction Type:">
                {toTitleCase(tx.transactionType ?? tx.channel)}
              </Row>
            )}
            <Row label="Dues Amount:">{formatNaira(tx.amount)}</Row>
            {/* Always shown, never conditional -- transparency about the
                fee is the point, so the row itself never disappears. The
                value can still be "—" though: Glass's fee is set
                per-community (there's a platform-admin override for it),
                not a fixed rate, so there's no formula to fall back on --
                asserting a specific ₦0.00 when we don't have the real
                number would be a false claim, the opposite of transparent. */}
            <Row label="Transaction Fee:">
              {tx.feeMinor != null ? formatNaira(tx.feeMinor, { decimals: 2 }) : "—"}
            </Row>
            <Row label="Transaction ID:" last={!tx.initiatedBy}>
              <span className="break-all">{tx.reference ?? tx.id}</span>{" "}
              <span className="inline-flex align-middle">
                <button
                  onClick={copyReference}
                  className="bg-transparent border-none cursor-pointer p-0.5 text-[#9CA3AF] flex"
                  aria-label="Copy transaction ID"
                >
                  {copied ? <CheckCheck size={13} color="#15803d" /> : <Copy size={13} />}
                </button>
              </span>
            </Row>
            {tx.initiatedBy && (
              <Row label="Initiated by:" last>
                <span className="inline-block bg-[#D7E2FF] text-brand text-xs font-semibold rounded-full py-[3px] px-3">
                  {tx.initiatedBy}
                </span>
              </Row>
            )}
          </div>

          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-0 rounded-xl bg-white border-[1.5px] border-brand text-brand text-sm font-semibold cursor-pointer"
          >
            <Share2 size={15} />
            Share Receipt
          </button>
        </div>
      )}

      {shareOpen && tx && (
        <ReceiptModal
          tx={tx}
          payerName={payerName}
          payerEmail={user?.email}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
