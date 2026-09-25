import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, Inbox } from "lucide-react";
import LoadingState from "../../components/common/LoadingState";
import { useKycAttempts } from "../../hooks/useKyc";
import { kycStatusStyle, idTypeLabel } from "../../utils/kycStatus";
import { formatDate } from "../../utils/format";
import { getErrorMessage } from "../../utils/errorHandler";

// Dashboard counterpart to the member app's attempt-history page — same data
// and filters, admin chrome (mirrors VerifyIdentityHistory.jsx there).
const STATUS_FILTERS = [
  { value: "", label: "All Status" },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ERROR", label: "Error" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REVOKED", label: "Revoked" },
];

function StatusBadge({ status }) {
  const { label, cls } = kycStatusStyle(status);
  return (
    <span className={`inline-block text-xs font-semibold rounded-md py-0.5 px-2.5 ${cls}`}>
      {label}
    </span>
  );
}

function Dropdown({ value, onChange, options }) {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-surface-container-border rounded-lg pl-3 pr-8 py-2 text-sm text-[#111] outline-none cursor-pointer min-w-[130px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
      />
      <span className="sr-only">{current.label}</span>
    </div>
  );
}

export default function VerifyIdentityHistory() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const params = {
    pageNumber: 1,
    pageSize: 50,
    ...(statusFilter ? { status: statusFilter } : {}),
  };
  const { data, isLoading, isError, error, refetch } = useKycAttempts(params);
  const attempts = data?.content ?? [];

  return (
    <div className="relative flex flex-col min-h-full bg-cover bg-center bg-no-repeat bg-mobile-auth-default">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-7 pt-7 pb-5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/dashboard/verify-identity")}
            aria-label="Back to identity verification"
            className="w-9 h-9 rounded-full bg-white border border-surface-container-border cursor-pointer flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft size={17} strokeWidth={2} className="text-[#111]" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-[#000000] m-0">Verification History</h1>
            <p className="text-xs text-gray-400 mt-0.5 m-0">
              Your past identity verification attempts.
            </p>
          </div>
        </div>
        <Dropdown value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTERS} />
      </div>

      <div className="px-4 md:px-7 pb-10 flex flex-col gap-3 w-full max-w-[640px]">
        {isLoading && <LoadingState label="Loading your verification history…" className="py-10" />}

        {isError && (
          <div className="border border-surface-container-border bg-white rounded-xl p-5 text-center">
            <p className="text-sm text-danger m-0 mb-3">
              {getErrorMessage(error, "Couldn't load history.")}
            </p>
            <button
              onClick={() => refetch()}
              className="text-sm font-semibold text-brand bg-transparent border-none cursor-pointer p-0"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && attempts.length === 0 && (
          <div className="border border-surface-container-border bg-white rounded-xl p-8 flex flex-col items-center text-center">
            <div className="w-[52px] h-[52px] rounded-full bg-stacked-container flex items-center justify-center mb-2">
              <Inbox size={22} className="text-[#9CA3AF]" />
            </div>
            <p className="text-sm font-semibold text-[#374151] m-0">No attempts yet</p>
            <p className="text-[13px] text-[#9CA3AF] m-0 mt-1">
              Your identity verification attempts will appear here.
            </p>
          </div>
        )}

        {!isLoading && !isError && attempts.length > 0 && (
          <div className="bg-surface-container rounded-xl border border-surface-container-border overflow-hidden">
            {attempts.map((a, i) => (
              <div
                key={a.id}
                className={`flex items-center justify-between gap-3 py-3.5 px-5 bg-white ${
                  i < attempts.length - 1 ? "border-b border-stacked-container" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#111] m-0">{idTypeLabel(a.idType)}</p>
                  <p className="text-xs text-[#999] mt-0.5 mx-0 mb-0">
                    Started {formatDate(a.createdAt)}
                    {a.submittedAt ? ` · Submitted ${formatDate(a.submittedAt)}` : ""}
                  </p>
                  {a.decisionReason && (
                    <p className="text-xs text-[#6B7280] mt-1 mx-0 mb-0 leading-snug">
                      {a.decisionReason}
                    </p>
                  )}
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
