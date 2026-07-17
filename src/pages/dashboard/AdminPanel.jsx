import { useState, useRef } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  Search,
  Building2,
  Users,
  CreditCard,
  BarChart2,
  Bell,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  RefreshCw,
  Edit2,
  Wallet,
  SlidersHorizontal,
  Landmark,
  Scale,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import SystemConfig from "./settings/admin/SystemConfig";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "../../utils/errorHandler";
import { toTitleCase } from "../../utils/format";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import { useExportJob } from "../../hooks/useExportJob";
import {
  getAdminCommunities,
  setCommissionOverride,
  getAdminCommunityAccounts,
  reviewCommunityAccount,
  getAdminUsers,
  suspendUser,
  unsuspendUser,
  getAdminPaymentLinks,
  getAdminBalances,
  createAdminNotification,
  getAdminNotificationJobs,
  resolveBankAccount,
  getAdminSettlements,
  getAdminSettlement,
  syncAdminSettlements,
  exportAdminSettlements,
  getAdminReconciliationRuns,
  triggerReconciliationRun,
  triggerFullReconciliationRun,
  getReconciliationRunReport,
  getAdminReconciliationFindings,
  reviewReconciliationFinding,
  resolveReconciliationFinding,
} from "../../api/admin";
import ModalShell from "../../components/dashboard/ModalShell";
// Community-scoped endpoints (not admin.js) -- per backend, most of these
// accept a platform-admin token with the right permissions, the same as a
// community's own owner/admin calling them. Reused directly rather than
// duplicated under /admin.
import { updateCommunitySettings, createCommunityAccount } from "../../api/communities";
import Toggle from "../../components/common/Toggle";
import AccountFormModal from "../../components/dashboard/AccountFormModal";

// ─── Formatters ───────────────────────────────────────────────────────────────

// `minor` controls whether `amount` is in minor units (kobo) and needs
// dividing by 100 — true for most money fields on this backend (e.g.
// commissionCapMinor). The /admin/balances endpoint is the exception: it
// returns already-major-unit decimals (e.g. 1036427.56 meaning ₦1,036,427.56),
// so callers for that data pass { minor: false }.
// `decimals` controls displayed precision — reconciliation/audit figures
// (Balances) should show kobo-level precision so a small discrepancy isn't
// silently rounded away; most other tables stay at whole-naira (decimals: 0).
function fmt(amount, currency = "NGN", { minor = true, decimals = 0 } = {}) {
  if (amount == null) return "—";
  const value = minor ? amount / 100 : amount;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function unwrap(res) {
  const d = res.data?.data;
  return {
    content: Array.isArray(d) ? d : (d?.content ?? []),
    totalElements: d?.totalElements ?? 0,
    totalPages: d?.totalPages ?? 1,
  };
}

const PAGE_SIZE = 20;

// Backend pagination DTOs (CommunityQueryDto, AdminUserQueryDto, and other
// admin query DTOs) all extend a shared PageQueryDto with fields:
// { search, pageNumber, pageSize, sortBy, dir } — NOT `page`/`size`.
// Sending `page`/`size` gets silently ignored, so the backend falls back to
// its own defaults regardless of what's clicked in the UI (looks like
// "pagination is broken" but is really a param-name mismatch).
//
// NOTE ON INDEXING: local React state (`page`, the Pager component) stays
// 0-indexed — that's just UI state and is unaffected by this change.
// The backend's `pageNumber` is 1-indexed, confirmed by a 400 "Illegal
// Argument Entered" (IllegalArgumentException) returned for `pageNumber=0`
// on every admin list endpoint — consistent with a `@Min(1)` validation
// constraint on the shared PageQueryDto. So we add 1 when building the
// request and nothing else needs to change.
function pageParams(page, size = PAGE_SIZE) {
  return { pageNumber: page + 1, pageSize: size };
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  ACTIVE: { bg: "bg-green-50", text: "text-green-700" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-700" },
  PENDING_ONBOARDING: { bg: "bg-amber-50", text: "text-amber-700" },
  SUSPENDED: { bg: "bg-red-50", text: "text-red-700" },
  INACTIVE: { bg: "bg-gray-100", text: "text-gray-500" },
  VERIFIED: { bg: "bg-green-50", text: "text-green-700" },
  // CommunityAccountResponse.status enum (accounts review flow). DISABLED
  // isn't listed here on purpose — it falls through to the default gray
  // badge below, which already reads correctly for a disabled state.
  UNVERIFIED: { bg: "bg-amber-50", text: "text-amber-700" },
  REJECTED: { bg: "bg-red-50", text: "text-red-700" },
  NEED_MORE_INFORMATION: { bg: "bg-orange-50", text: "text-orange-700" },
  DRAFT: { bg: "bg-gray-100", text: "text-gray-500" },
  EXPIRED: { bg: "bg-gray-100", text: "text-gray-500" },
  ARCHIVED: { bg: "bg-gray-100", text: "text-gray-500" },
  PAUSED: { bg: "bg-amber-50", text: "text-amber-700" },
  COMPLETED: { bg: "bg-blue-50", text: "text-blue-700" },
  FAILED: { bg: "bg-red-50", text: "text-red-700" },
  SUCCESS: { bg: "bg-green-50", text: "text-green-700" },
  ONE_TIME: { bg: "bg-blue-50", text: "text-blue-700" },
  RECURRING: { bg: "bg-purple-50", text: "text-purple-700" },
  // Present in the CommunityQueryDto status enum but were missing here,
  // so they fell through to the default gray badge (see screenshot: a
  // DELETED community rendered unstyled). Added so the badge — and the
  // Communities status filter below — can represent every valid status.
  DELETING: { bg: "bg-amber-50", text: "text-amber-700" },
  DELETED: { bg: "bg-gray-100", text: "text-gray-500" },
  // Settlement / reconciliation statuses — the Swagger spec's example
  // values ("PENDING", "NEW", "CRITICAL"...) aren't an exhaustive enum
  // list, so unlisted values still fall back to the default gray badge.
  MATCHED: { bg: "bg-green-50", text: "text-green-700" },
  MISMATCHED: { bg: "bg-red-50", text: "text-red-700" },
  RUNNING: { bg: "bg-blue-50", text: "text-blue-700" },
  NEW: { bg: "bg-amber-50", text: "text-amber-700" },
  REVIEWED: { bg: "bg-blue-50", text: "text-blue-700" },
  RESOLVED: { bg: "bg-green-50", text: "text-green-700" },
  CRITICAL: { bg: "bg-red-50", text: "text-red-700" },
  HIGH: { bg: "bg-red-50", text: "text-red-700" },
  MEDIUM: { bg: "bg-amber-50", text: "text-amber-700" },
  LOW: { bg: "bg-gray-100", text: "text-gray-500" },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-500",
  };
  return (
    <span
      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text} whitespace-nowrap`}
    >
      {(status ?? "—").replace(/_/g, " ")}
    </span>
  );
}

function PagerBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 flex items-center justify-center rounded-lg border-none cursor-pointer bg-white text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-default"
      style={{ border: "1px solid #E0E0EB" }}
    >
      {children}
    </button>
  );
}

function Pager({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i).filter(
    (i) => Math.abs(i - page) <= 2,
  );
  return (
    <div className="flex items-center gap-1">
      <PagerBtn onClick={() => onPage(page - 1)} disabled={page === 0}>
        <ChevronLeft size={13} />
      </PagerBtn>
      {pages.map((i) => (
        <button
          key={i}
          onClick={() => onPage(i)}
          className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-semibold border-none cursor-pointer transition-all ${
            i === page
              ? "bg-brand text-white"
              : "bg-white text-gray-500 hover:bg-gray-100"
          }`}
          style={{ border: i === page ? "none" : "1px solid #E0E0EB" }}
        >
          {i + 1}
        </button>
      ))}
      <PagerBtn
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages - 1}
      >
        <ChevronRight size={13} />
      </PagerBtn>
    </div>
  );
}

function TableShell({ isLoading, isEmpty, error, emptyIcon, emptyLabel = "No results found", children }) {
  const is403 = error?.response?.status === 403;
  return (
    <div
      className="bg-surface-container rounded-2xl overflow-hidden"
      style={{ border: "1px solid #E0E0EB" }}
    >
      {isLoading ? (
        <LoadingState className="py-16" />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <p className="text-xs font-semibold text-red-500">
            {is403 ? "Access denied" : "Failed to load"}
          </p>
          <p className="text-xs text-gray-400">
            {is403
              ? "Platform admin rights required to view this data."
              : getErrorMessage(error)}
          </p>
        </div>
      ) : isEmpty ? (
        <EmptyState icon={emptyIcon} title={emptyLabel} className="py-16" />
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </div>
  );
}

function SectionHeader({ title, desc, count, isFetching, right }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
          {count > 0 && (
            <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {count.toLocaleString()}
            </span>
          )}
          {isFetching && (
            <RefreshCw size={12} className="text-gray-300 animate-spin" />
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      {right && (
        <div className="flex items-center gap-2 flex-shrink-0">{right}</div>
      )}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder = "Search…", width = 200 }) {
  return (
    <div className="relative">
      <Search
        size={12}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8 pr-4 py-2 rounded-lg text-xs text-gray-700 placeholder-gray-400 outline-none"
        style={{ border: "1px solid #D0D0D0", width, background: "#fff" }}
        onFocus={(e) => (e.target.style.borderColor = "var(--color-brand)")}
        onBlur={(e) => (e.target.style.borderColor = "#D0D0D0")}
      />
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-lg text-xs text-gray-700 outline-none cursor-pointer"
      style={{ border: "1px solid #D0D0D0", background: "#fff" }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function useDebounce(setter, delay = 350) {
  const ref = useRef(null);
  return (val) => {
    clearTimeout(ref.current);
    ref.current = setTimeout(() => setter(val), delay);
  };
}

function TableFooter({ totalElements, noun, page, totalPages, onPage }) {
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-[11px] text-gray-400">
        {totalElements.toLocaleString()} {noun}
        {totalElements !== 1 ? "s" : ""}
      </p>
      <Pager page={page} totalPages={totalPages} onPage={onPage} />
    </div>
  );
}

// ─── Communities ─────────────────────────────────────────────────────────────

function CommissionModal({ community, onClose }) {
  const queryClient = useQueryClient();
  const [useDefault, setUseDefault] = useState(!community.commissionRate);
  const [rate, setRate] = useState(String(community.commissionRate ?? ""));
  const [cap, setCap] = useState(
    community.commissionCapMinor
      ? String(Math.round(community.commissionCapMinor / 100))
      : "",
  );

  const mutation = useMutation({
    mutationFn: (payload) =>
      setCommissionOverride(community.slug ?? community.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-communities"] });
      onClose();
    },
    meta: { successMessage: "Commission updated" },
  });

  function submit(e) {
    e.preventDefault();
    mutation.mutate(
      useDefault
        ? { rate: null, capMinor: null }
        : {
            rate: Number(rate) || 0,
            capMinor: cap ? Math.round(Number(cap) * 100) : 0,
          },
    );
  }

  const f = { border: "1px solid #D0D0D0" };
  const ff = { borderColor: "var(--color-brand)" };

  return (
    <ModalShell
      title="Commission Override"
      subtitle={community.name}
      onClose={onClose}
    >
      <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={useDefault}
            onChange={(e) => setUseDefault(e.target.checked)}
            className="w-4 h-4 accent-brand"
          />
          <span className="text-xs font-semibold text-gray-700">
            Use platform default rate
          </span>
        </label>

        {!useDefault && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Rate{" "}
                <span className="font-normal text-gray-400">
                  (basis points — 100 bps = 1%)
                </span>
              </label>
              <input
                type="number"
                min="0"
                max="10000"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-xs text-gray-800 outline-none transition-colors"
                style={f}
                onFocus={(e) => Object.assign(e.target.style, ff)}
                onBlur={(e) => Object.assign(e.target.style, f)}
                placeholder="e.g. 150 for 1.5%"
              />
              {Number(rate) > 0 && (
                <p className="text-[10px] text-gray-400 mt-1">
                  = {(Number(rate) / 100).toFixed(2)}%
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Cap{" "}
                <span className="font-normal text-gray-400">
                  (₦, leave blank for no cap)
                </span>
              </label>
              <input
                type="number"
                min="0"
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-xs text-gray-800 outline-none transition-colors"
                style={f}
                onFocus={(e) => Object.assign(e.target.style, ff)}
                onBlur={(e) => Object.assign(e.target.style, f)}
                placeholder="e.g. 500"
              />
            </div>
          </>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer border-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer border-none"
            style={{ background: "var(--color-brand)" }}
          >
            {mutation.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Check size={12} />
            )}
            {mutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// Platform-admin editor for the same two settings a community owner
// controls from Settings -> Member Access (updateCommunitySettings accepts
// the same payload regardless of which role's token calls it).
function CommunitySettingsModal({ community, onClose }) {
  const queryClient = useQueryClient();
  const [requiresMemberApproval, setRequiresMemberApproval] = useState(
    !!community.requiresMemberApproval,
  );
  const [publicVisible, setPublicVisible] = useState(!!community.publicVisible);

  const mutation = useMutation({
    mutationFn: (payload) =>
      updateCommunitySettings(community.slug ?? community.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-communities"] });
      onClose();
    },
    meta: { successMessage: "Community settings updated" },
  });

  function submit(e) {
    e.preventDefault();
    mutation.mutate({ requiresMemberApproval, publicVisible });
  }

  return (
    <ModalShell
      title="Joining & Visibility"
      subtitle={community.name}
      onClose={onClose}
    >
      <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-1">
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="min-w-0 pr-4">
            <p className="text-xs font-medium text-gray-900 m-0">Require approval to join</p>
            <p className="text-[11px] text-gray-400 mt-0.5 m-0">
              New join requests wait for admin approval instead of joining instantly.
            </p>
          </div>
          <Toggle on={requiresMemberApproval} onChange={setRequiresMemberApproval} showLabel />
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="min-w-0 pr-4">
            <p className="text-xs font-medium text-gray-900 m-0">Show in Discover</p>
            <p className="text-[11px] text-gray-400 mt-0.5 m-0">
              List this community in the public Discover Communities search.
            </p>
          </div>
          <Toggle on={publicVisible} onChange={setPublicVisible} showLabel />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer border-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer border-none"
            style={{ background: "var(--color-brand)" }}
          >
            {mutation.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Check size={12} />
            )}
            {mutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function CommunitiesSection() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const [editingCommission, setEditingCommission] = useState(null);
  const [editingSettings, setEditingSettings] = useState(null);
  const debouncedSet = useDebounce((v) => {
    setDebouncedSearch(v);
    setPage(0);
  });

  const params = {
    ...pageParams(page),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status !== "ALL" ? { status } : {}),
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-communities", params],
    queryFn: () => getAdminCommunities(params).then(unwrap),
    staleTime: 60_000,
    placeholderData: (p) => p,
  });

  const items = data?.content ?? [];

  return (
    <div>
      <SectionHeader
        title="Communities"
        desc="All communities registered on the platform."
        count={data?.totalElements ?? 0}
        isFetching={isFetching && !isLoading}
        right={
          <>
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                debouncedSet(v);
              }}
              placeholder="Search communities…"
              width={220}
            />
            <FilterSelect
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(0);
              }}
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "PENDING_ONBOARDING", label: "Pending Onboarding" },
                { value: "SUSPENDED", label: "Suspended" },
                { value: "DELETING", label: "Deleting" },
                { value: "DELETED", label: "Deleted" },
              ]}
            />
          </>
        }
      />

      <TableShell
        isLoading={isLoading}
        isEmpty={items.length === 0}
        error={error}
        emptyIcon={Building2}
        emptyLabel="No communities found"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-stacked-container)" }}>
              {[
                "Community",
                "Status",
                "Commission",
                "Members",
                "Created",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((c, i) => (
              <tr
                key={c.id}
                className="group hover:bg-gray-50 transition-colors"
                style={{
                  borderBottom:
                    i < items.length - 1 ? "1px solid #F9FAFB" : "none",
                }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {c.logo?.url ? (
                      <img
                        src={c.logo.url}
                        alt=""
                        className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-brand-tint flex items-center justify-center text-brand font-bold text-[10px] flex-shrink-0">
                        {(c.name ?? "C")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-[12px] font-semibold text-gray-900 leading-tight">
                        {c.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {c.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3">
                  {c.commissionRate > 0 ? (
                    <div>
                      <span className="text-[11px] font-semibold text-gray-800">
                        {(c.commissionRate / 100).toFixed(2)}%
                      </span>
                      {c.commissionCapMinor > 0 && (
                        <span className="text-[10px] text-gray-400 ml-1.5">
                          cap {fmt(c.commissionCapMinor)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400">
                      Platform default
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12px] text-gray-700">
                    {c.metrics?.totalMembers ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-[11px] text-gray-500">
                    {fmtDate(c.createdAt)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => setEditingSettings(c)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer border-none"
                    >
                      <SlidersHorizontal size={11} /> Settings
                    </button>
                    <button
                      onClick={() => setEditingCommission(c)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-brand bg-brand-tint hover:bg-[#d0dcff] transition-all cursor-pointer border-none"
                    >
                      <Edit2 size={11} /> Commission
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <TableFooter
        totalElements={data?.totalElements ?? 0}
        noun="community"
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPage={setPage}
      />
      {editingCommission && (
        <CommissionModal
          community={editingCommission}
          onClose={() => setEditingCommission(null)}
        />
      )}
      {editingSettings && (
        <CommunitySettingsModal
          community={editingSettings}
          onClose={() => setEditingSettings(null)}
        />
      )}
    </div>
  );
}

// Two steps: pick which community this account belongs to (there's no
// active-community context on this page, unlike the owner-side settings
// page this form was extracted from), then the same bank-details form.
function CreateCommunityAccountModal({ onClose }) {
  const queryClient = useQueryClient();
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [saveError, setSaveError] = useState("");
  const debouncedSet = useDebounce(setDebouncedSearch);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-communities", "picker", debouncedSearch],
    queryFn: () =>
      getAdminCommunities({
        pageNumber: 0,
        pageSize: 8,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      }).then(unwrap),
    enabled: !selectedCommunity,
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: (payload) =>
      createCommunityAccount(selectedCommunity.slug ?? selectedCommunity.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-accounts"] });
      onClose();
    },
    meta: { successMessage: "Payout account created" },
    onError: (err) => setSaveError(getErrorMessage(err, "Couldn't create the account.")),
  });

  if (selectedCommunity) {
    return (
      <AccountFormModal
        title="Create Payout Account"
        subtitle={`For ${selectedCommunity.name} — the community's own owner can still manage it afterward.`}
        onClose={onClose}
        onSave={(payload) => create.mutate(payload)}
        isSaving={create.isPending}
        saveError={saveError}
      />
    );
  }

  const items = data?.content ?? [];

  return (
    <ModalShell title="Create Payout Account" subtitle="Choose a community" onClose={onClose}>
      <div className="px-6 py-5">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            debouncedSet(v);
          }}
          placeholder="Search communities…"
          width="100%"
        />
        <div className="mt-3 max-h-64 overflow-y-auto flex flex-col gap-1">
          {isLoading ? (
            <LoadingState className="py-4" />
          ) : items.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No communities found</p>
          ) : (
            items.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCommunity(c)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left bg-transparent hover:bg-gray-50 transition-colors cursor-pointer border-none"
              >
                {c.logo?.url ? (
                  <img src={c.logo.url} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-brand-tint flex items-center justify-center text-brand font-bold text-[10px] flex-shrink-0">
                    {(c.name ?? "C")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-gray-900 leading-tight truncate">{c.name}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{c.slug}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </ModalShell>
  );
}

const REVIEW_DECISIONS = [
  {
    value: "ACCEPT",
    label: "Accept",
    Icon: ShieldCheck,
    activeStyle: { background: "#ECFDF5", borderColor: "#059669", color: "#059669" },
  },
  {
    value: "REQUEST_INFO",
    label: "Request Info",
    Icon: HelpCircle,
    activeStyle: { background: "#FFFBEB", borderColor: "#B45309", color: "#B45309" },
  },
  {
    value: "REJECT",
    label: "Reject",
    Icon: ShieldAlert,
    activeStyle: { background: "#FEF2F2", borderColor: "#e11d48", color: "#e11d48" },
  },
];

function ReviewAccountModal({ account, onClose, onSubmit, submitting }) {
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "resolve-account",
      account.settlementBankCode,
      account.accountNumber,
    ],
    queryFn: () =>
      resolveBankAccount(
        account.settlementBankCode,
        account.accountNumber,
      ).then((r) => r.data?.data),
    staleTime: 0, // always re-check live, never cache a stale Paystack lookup
  });
  const nameMatches =
    data?.accountName &&
    data.accountName.trim().toLowerCase() ===
      account.accountName?.trim().toLowerCase();

  const [decision, setDecision] = useState(null);
  const [comment, setComment] = useState("");
  const commentRequired = decision === "REJECT" || decision === "REQUEST_INFO";

  const f = { border: "1px solid #D0D0D0" };
  const chosen = REVIEW_DECISIONS.find((d) => d.value === decision);

  return (
    <ModalShell
      title="Review Payout Account"
      subtitle={account.accountNumber}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!decision) return;
          onSubmit({ decision, comment: comment.trim() || undefined });
        }}
        className="px-6 py-5 flex flex-col gap-4"
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 size={14} className="animate-spin" /> Checking with
            Paystack…
          </div>
        ) : error ? (
          <p className="text-xs text-red-500">
            Couldn't resolve this account with Paystack. Double-check the
            account number and bank code before deciding.
          </p>
        ) : (
          <div
            className="rounded-lg p-4"
            style={{ background: nameMatches ? "#ECFDF5" : "#FEF2F2" }}
          >
            <p className="text-xs text-gray-500 mb-1">On file:</p>
            <p className="text-sm font-semibold text-gray-900 mb-3">
              {account.accountName}
            </p>
            <p className="text-xs text-gray-500 mb-1">Paystack says:</p>
            <p
              className={`text-sm font-semibold ${nameMatches ? "text-green-700" : "text-red-600"}`}
            >
              {data?.accountName ?? "—"}
            </p>
            {!nameMatches && (
              <p className="text-[11px] text-red-500 mt-2">
                Names don't match — confirm this is really the same account
                before accepting.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Decision
          </label>
          <div className="grid grid-cols-3 gap-2">
            {REVIEW_DECISIONS.map(({ value, label, Icon, activeStyle }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDecision(value)}
                className="flex flex-col items-center gap-1 py-2.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all border"
                style={
                  decision === value
                    ? activeStyle
                    : { background: "#fff", borderColor: "var(--color-surface-container-border)", color: "#6b7280" }
                }
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {decision && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Comment{commentRequired ? "" : " (optional)"}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              required={commentRequired}
              className="w-full px-3 py-2.5 rounded-lg text-xs text-gray-800 outline-none resize-none transition-colors"
              style={f}
              onFocus={(e) => (e.target.style.borderColor = chosen?.activeStyle.borderColor ?? "var(--color-brand)")}
              onBlur={(e) => Object.assign(e.target.style, f)}
              placeholder={
                decision === "REJECT"
                  ? "Why is this account being rejected?"
                  : decision === "REQUEST_INFO"
                    ? "What information is needed from the community?"
                    : "Optional note for this decision"
              }
            />
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer border-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              !decision ||
              submitting ||
              isLoading ||
              (commentRequired && !comment.trim())
            }
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer border-none"
            style={{ background: chosen?.activeStyle.borderColor ?? "#9CA3AF" }}
          >
            {submitting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : chosen ? (
              <chosen.Icon size={12} />
            ) : null}
            {submitting ? "Submitting…" : chosen ? `Confirm ${chosen.label}` : "Choose a decision"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

function AccountsSection() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // UNVERIFIED, not PENDING, is the queue that actually needs admin
  // attention -- PENDING means account creation itself is still stuck in
  // processing, which per backend rarely shows up in practice.
  const [status, setStatus] = useState("UNVERIFIED");
  const [page, setPage] = useState(0);
  const [reviewingAccount, setReviewingAccount] = useState(null);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const debouncedSet = useDebounce((v) => {
    setDebouncedSearch(v);
    setPage(0);
  });

  const params = {
    ...pageParams(page),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status !== "ALL" ? { status } : {}),
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-community-accounts", params],
    queryFn: () => getAdminCommunityAccounts(params).then(unwrap),
    staleTime: 60_000,
    placeholderData: (p) => p,
  });

  const review = useMutation({
    mutationFn: ({ communityId, accountId, decision, comment }) =>
      reviewCommunityAccount(communityId, accountId, { decision, comment }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-community-accounts"] }),
    meta: {
      successMessage: (vars) =>
        vars.decision === "ACCEPT"
          ? "Account accepted"
          : vars.decision === "REJECT"
            ? "Account rejected"
            : "More information requested",
    },
  });

  const items = data?.content ?? [];

  return (
    <div>
      <SectionHeader
        title="Payout Accounts"
        desc="Community settlement accounts. Verify after Paystack manual activation."
        count={data?.totalElements ?? 0}
        isFetching={isFetching && !isLoading}
        right={
          <>
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                debouncedSet(v);
              }}
              placeholder="Search accounts…"
            />
            <FilterSelect
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(0);
              }}
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "PENDING", label: "Pending" },
                { value: "UNVERIFIED", label: "Unverified" },
                { value: "NEED_MORE_INFORMATION", label: "Needs Info" },
                { value: "ACTIVE", label: "Active" },
                { value: "REJECTED", label: "Rejected" },
                { value: "DISABLED", label: "Disabled" },
              ]}
            />
            <button
              onClick={() => setCreatingAccount(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-brand hover:opacity-90 transition-all cursor-pointer border-none flex-shrink-0"
            >
              <Wallet size={12} /> Create Account
            </button>
          </>
        }
      />

      <TableShell
        isLoading={isLoading}
        isEmpty={items.length === 0}
        error={error}
        emptyIcon={CreditCard}
        emptyLabel="No payout accounts found"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-stacked-container)" }}>
              {[
                "Bank",
                "Account Number",
                "Account Name",
                "Status",
                "Default",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((a, i) => (
              <tr
                key={a.id}
                className="group hover:bg-gray-50 transition-colors"
                style={{
                  borderBottom:
                    i < items.length - 1 ? "1px solid #F9FAFB" : "none",
                }}
              >
                <td className="px-4 py-3">
                  <p className="text-[12px] font-semibold text-gray-900">
                    {a.settlementBank}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {a.settlementBankCode}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12px] text-gray-700 font-mono">
                    {a.accountNumber}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12px] text-gray-700">
                    {a.accountName}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-4 py-3">
                  {a.defaultAccount && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                      Default
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {/* PENDING means account creation itself didn't finish
                      processing -- there's nothing yet for a human to
                      review. UNVERIFIED is the real "awaiting a decision"
                      state (per backend, 2026-07-14): new account, not yet
                      approved by an admin or verified on Paystack. */}
                  {a.status === "UNVERIFIED" && (
                    <button
                      onClick={() => setReviewingAccount(a)}
                      disabled={review.isPending}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg text-[11px] font-semibold text-brand bg-blue-50 hover:bg-blue-100 transition-all cursor-pointer border-none disabled:opacity-40"
                    >
                      <ShieldCheck size={11} /> Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <TableFooter
        totalElements={data?.totalElements ?? 0}
        noun="account"
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPage={setPage}
      />
      {reviewingAccount && (
        <ReviewAccountModal
          account={reviewingAccount}
          onClose={() => setReviewingAccount(null)}
          submitting={review.isPending}
          onSubmit={({ decision, comment }) => {
            review.mutate(
              {
                communityId: reviewingAccount.communityId,
                accountId: reviewingAccount.id,
                decision,
                comment,
              },
              { onSuccess: () => setReviewingAccount(null) },
            );
          }}
        />
      )}
      {creatingAccount && (
        <CreateCommunityAccountModal onClose={() => setCreatingAccount(false)} />
      )}
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────

function SuspendModal({ user, onClose }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: (payload) => suspendUser(user.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    meta: { successMessage: "User suspended" },
  });

  const f = { border: "1px solid #D0D0D0" };

  return (
    <ModalShell title="Suspend User" subtitle={user.email} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ reason });
        }}
        className="px-6 py-5 flex flex-col gap-4"
      >
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
            className="w-full px-3 py-2.5 rounded-lg text-xs text-gray-800 outline-none resize-none transition-colors"
            style={f}
            onFocus={(e) => (e.target.style.borderColor = "#e11d48")}
            onBlur={(e) => Object.assign(e.target.style, f)}
            placeholder="Why is this user being suspended?"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer border-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !reason.trim()}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer border-none"
            style={{ background: "#e11d48" }}
          >
            {mutation.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <ShieldAlert size={12} />
            )}
            {mutation.isPending ? "Suspending…" : "Suspend"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function UnsuspendModal({ user, onClose, onConfirm, unsuspending }) {
  return (
    <ModalShell title="Unsuspend User" subtitle={user.email} onClose={onClose}>
      <div className="px-6 py-5 flex flex-col gap-4">
        <p className="text-xs text-gray-600 leading-relaxed">
          This restores <strong>{user.email}</strong>'s access to the
          Platform. They'll be able to sign in and use their Account again.
        </p>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer border-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={unsuspending}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer border-none"
            style={{ background: "#15803d" }}
          >
            {unsuspending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <ShieldCheck size={12} />
            )}
            {unsuspending ? "Unsuspending…" : "Unsuspend"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function UsersSection() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [enabledFilter, setEnabledFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [suspending, setSuspending] = useState(null);
  const [unsuspending, setUnsuspending] = useState(null);
  const debouncedSet = useDebounce((v) => {
    setDebouncedSearch(v);
    setPage(0);
  });

  const params = {
    ...pageParams(page),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(enabledFilter !== "ALL" ? { enabled: enabledFilter === "ACTIVE" } : {}),
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-users", params],
    queryFn: () => getAdminUsers(params).then(unwrap),
    staleTime: 60_000,
    placeholderData: (p) => p,
  });

  const unsuspend = useMutation({
    mutationFn: (userId) => unsuspendUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setUnsuspending(null);
    },
    meta: { successMessage: "User unsuspended" },
  });

  const items = data?.content ?? [];

  return (
    <div>
      <SectionHeader
        title="Users"
        desc="All registered platform users."
        count={data?.totalElements ?? 0}
        isFetching={isFetching && !isLoading}
        right={
          <>
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                debouncedSet(v);
              }}
              placeholder="Search users…"
              width={220}
            />
            <FilterSelect
              value={enabledFilter}
              onChange={(v) => {
                setEnabledFilter(v);
                setPage(0);
              }}
              options={[
                { value: "ALL", label: "All users" },
                { value: "ACTIVE", label: "Active" },
                { value: "SUSPENDED", label: "Suspended" },
              ]}
            />
          </>
        }
      />

      <TableShell
        isLoading={isLoading}
        isEmpty={items.length === 0}
        error={error}
        emptyIcon={Users}
        emptyLabel="No users found"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-stacked-container)" }}>
              {[
                "User",
                "Role",
                "Status",
                "Verified",
                "Last Login",
                "Communities",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((u, i) => (
              <tr
                key={u.id}
                className="group hover:bg-gray-50 transition-colors"
                style={{
                  borderBottom:
                    i < items.length - 1 ? "1px solid #F9FAFB" : "none",
                }}
              >
                <td className="px-4 py-3">
                  <p className="text-[12px] font-semibold text-gray-900 leading-tight">
                    {[u.userData?.firstName, u.userData?.lastName]
                      .filter(Boolean)
                      .map((s) => toTitleCase(s.trim()))
                      .join(" ") || "—"}
                  </p>
                  <p className="text-[11px] text-gray-400">{u.email}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {u.isPlatformAdmin ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-tint text-brand">
                      Platform Admin
                    </span>
                  ) : u.platformRole ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {u.platformRole}
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400">User</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.enabled ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                  >
                    {u.enabled ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`text-[11px] font-medium ${u.emailVerified ? "text-green-600" : "text-gray-400"}`}
                  >
                    {u.emailVerified ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-[11px] text-gray-500">
                    {fmtDateTime(u.lastLoginAt)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12px] text-gray-600">
                    {u.metrics?.totalRelatedCommunities ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.enabled ? (
                    <button
                      onClick={() => setSuspending(u)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-all cursor-pointer border-none"
                    >
                      <ShieldAlert size={11} /> Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => setUnsuspending(u)}
                      disabled={unsuspend.isPending}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg text-[11px] font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-all cursor-pointer border-none disabled:opacity-40"
                    >
                      <ShieldCheck size={11} /> Unsuspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <TableFooter
        totalElements={data?.totalElements ?? 0}
        noun="user"
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPage={setPage}
      />
      {suspending && (
        <SuspendModal user={suspending} onClose={() => setSuspending(null)} />
      )}
      {unsuspending && (
        <UnsuspendModal
          user={unsuspending}
          onClose={() => setUnsuspending(null)}
          onConfirm={() => unsuspend.mutate(unsuspending.id)}
          unsuspending={unsuspend.isPending}
        />
      )}
    </div>
  );
}

// ─── Payment Links ─────────────────────────────────────────────────────────────

function PaymentLinksSection() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [page, setPage] = useState(0);
  const debouncedSet = useDebounce((v) => {
    setDebouncedSearch(v);
    setPage(0);
  });

  const params = {
    ...pageParams(page),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status !== "ALL" ? { status } : {}),
    ...(type !== "ALL" ? { paymentType: type } : {}),
    includeMetrics: true,
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-payment-links", params],
    queryFn: () => getAdminPaymentLinks(params).then(unwrap),
    staleTime: 60_000,
    placeholderData: (p) => p,
  });

  const items = data?.content ?? [];

  return (
    <div>
      <SectionHeader
        title="Payment Links"
        desc="All payment links across all communities."
        count={data?.totalElements ?? 0}
        isFetching={isFetching && !isLoading}
        right={
          <>
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                debouncedSet(v);
              }}
              placeholder="Search payment links…"
              width={220}
            />
            <FilterSelect
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(0);
              }}
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "DRAFT", label: "Draft" },
                { value: "PAUSED", label: "Paused" },
                { value: "EXPIRED", label: "Expired" },
                { value: "ARCHIVED", label: "Archived" },
              ]}
            />
            <FilterSelect
              value={type}
              onChange={(v) => {
                setType(v);
                setPage(0);
              }}
              options={[
                { value: "ALL", label: "All types" },
                { value: "ONE_TIME", label: "One-time" },
                { value: "RECURRING", label: "Recurring" },
              ]}
            />
          </>
        }
      />

      <TableShell
        isLoading={isLoading}
        isEmpty={items.length === 0}
        error={error}
        emptyIcon={Wallet}
        emptyLabel="No payment links found"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-stacked-container)" }}>
              {[
                "Title",
                "Community",
                "Type",
                "Amount",
                "Collected",
                "Paid / Total",
                "Status",
                "Created",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((l, i) => (
              <tr
                key={l.id}
                className="hover:bg-gray-50 transition-colors"
                style={{
                  borderBottom:
                    i < items.length - 1 ? "1px solid #F9FAFB" : "none",
                }}
              >
                <td className="px-4 py-3 max-w-[180px]">
                  <p className="text-[12px] font-semibold text-gray-900 truncate">
                    {l.title}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono truncate">
                    {l.referenceCode}
                  </p>
                </td>
                <td className="px-4 py-3 max-w-[140px]">
                  <p className="text-[11px] text-gray-600 truncate">
                    {l.community?.name}
                  </p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={l.paymentType} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-[12px] text-gray-700">
                    {fmt(l.amount, l.currency)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-[12px] text-gray-700">
                    {fmt(l.metrics?.amountCollected, l.currency)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {l.metrics?.audienceSize > 0 ? (
                    <span className="text-[11px] text-gray-600">
                      {l.metrics.membersFullyPaid} / {l.metrics.audienceSize}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={l.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-[11px] text-gray-500">
                    {fmtDate(l.createdAt)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <TableFooter
        totalElements={data?.totalElements ?? 0}
        noun="payment link"
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPage={setPage}
      />
    </div>
  );
}

// ─── Balances ─────────────────────────────────────────────────────────────────

function BalancesSection() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-balances"],
    queryFn: () => getAdminBalances({}).then((r) => r.data?.data),
    staleTime: 60_000,
  });

  const balances = data?.balances ?? [];
  const currency = data?.currency ?? "NGN";

  return (
    <div>
      <SectionHeader
        title="Platform Balances"
        desc="Aggregate ledger balances across all communities."
        isFetching={isFetching && !isLoading}
        right={
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-all cursor-pointer border-none"
            style={{ border: "1px solid #E0E0EB" }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />

      {isLoading ? (
        <LoadingState className="py-20" />
      ) : error ? (
        <p className="text-xs text-red-500 text-center py-10">
          {error.message}
        </p>
      ) : (
        <>
          {/* Residual / reconciliation — /admin/balances returns already
              major-unit decimals (e.g. 0.00 = ₦0.00), not kobo, so minor
              is false here. Shown to 2dp since this is a reconciliation
              figure — rounding to whole naira could hide a real
              discrepancy that should surface as "Out of balance". */}
          <div
            className="bg-surface-container rounded-2xl p-5 mb-4 flex items-center justify-between"
            style={{ border: "1px solid #E0E0EB" }}
          >
            <div>
              <p className="text-xs text-gray-400 mb-1">Platform Residual</p>
              <p className="text-2xl font-bold text-gray-900">
                {fmt(data?.residual, currency, { minor: false, decimals: 2 })}
              </p>
            </div>
            <span
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full ${data?.reconciles ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
            >
              {data?.reconciles ? "Reconciled" : "Out of balance"}
            </span>
          </div>

          {/* Balance entries — same major-unit + 2dp treatment as above */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {balances.map((b) => (
              <div
                key={b.code}
                className="bg-surface-container rounded-2xl p-5"
                style={{ border: "1px solid #E0E0EB" }}
              >
                <p className="text-[10px] text-gray-400 font-mono mb-1">
                  {b.code}
                </p>
                <p className="text-[15px] font-bold text-gray-900 mb-0.5">
                  {fmt(b.amount, b.currency ?? currency, {
                    minor: false,
                    decimals: 2,
                  })}
                </p>
                <p className="text-xs text-gray-500">{b.displayName}</p>
              </div>
            ))}
          </div>

          {data?.to && (
            <p className="text-[11px] text-gray-400 text-right mt-3">
              As of {fmtDate(data.to)}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Settlements ─────────────────────────────────────────────────────────────

function SettlementDetailModal({ settlementId, onClose }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-settlement", settlementId],
    queryFn: () => getAdminSettlement(settlementId).then((r) => r.data?.data),
    staleTime: 30_000,
  });
  const transactions = data?.transactions ?? [];

  return (
    <ModalShell title="Settlement" subtitle={data?.gatewaySettlementId} onClose={onClose}>
      <div className="p-6 max-h-[70vh] overflow-y-auto">
        {isLoading ? (
          <LoadingState className="py-10" />
        ) : error ? (
          <p className="text-xs text-red-500">{getErrorMessage(error)}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white rounded-xl p-3" style={{ border: "1px solid #E0E0EB" }}>
                <p className="text-[10px] text-gray-400 mb-0.5">Gross</p>
                <p className="text-sm font-bold text-gray-900">{fmt(data.gross, data.currency)}</p>
              </div>
              <div className="bg-white rounded-xl p-3" style={{ border: "1px solid #E0E0EB" }}>
                <p className="text-[10px] text-gray-400 mb-0.5">Net</p>
                <p className="text-sm font-bold text-gray-900">{fmt(data.net, data.currency)}</p>
              </div>
              <div className="bg-white rounded-xl p-3" style={{ border: "1px solid #E0E0EB" }}>
                <p className="text-[10px] text-gray-400 mb-0.5">Fees + Deductions</p>
                <p className="text-sm font-bold text-gray-900">{fmt((data.fees ?? 0) + (data.deductions ?? 0), data.currency)}</p>
              </div>
              <div className="bg-white rounded-xl p-3" style={{ border: "1px solid #E0E0EB" }}>
                <p className="text-[10px] text-gray-400 mb-0.5">Variance</p>
                <p className={`text-sm font-bold ${data.variance ? "text-red-600" : "text-gray-900"}`}>
                  {fmt(data.variance, data.currency)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-900">
                Matched Transactions ({data.matchedTransactionCount ?? transactions.length})
              </p>
              <StatusBadge status={data.status} />
            </div>

            {data.failureReason && (
              <p className="text-xs text-red-500 mb-3">{data.failureReason}</p>
            )}

            {transactions.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No transactions linked to this settlement.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {transactions.map((t) => (
                  <div key={t.id} className="bg-white rounded-lg p-3 flex items-center justify-between gap-3" style={{ border: "1px solid #E0E0EB" }}>
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-gray-700 truncate">{t.reference}</p>
                      <p className="text-[10px] text-gray-400">{fmtDateTime(t.paidAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {t.matched ? (
                        <ShieldCheck size={13} className="text-green-600" />
                      ) : (
                        <ShieldAlert size={13} className="text-red-500" />
                      )}
                      <span className="text-xs font-semibold text-gray-900">{fmt(t.net, t.currency)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}

function SettlementsSection() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const [openSettlementId, setOpenSettlementId] = useState(null);
  const csvExport = useExportJob();
  const debouncedSet = useDebounce((v) => {
    setDebouncedSearch(v);
    setPage(0);
  });

  const params = {
    ...pageParams(page),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status !== "ALL" ? { status } : {}),
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-settlements", params],
    queryFn: () => getAdminSettlements(params).then(unwrap),
    staleTime: 30_000,
    placeholderData: (p) => p,
  });

  const sync = useMutation({
    mutationFn: () => syncAdminSettlements({}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-settlements"] }),
    meta: { successMessage: "Settlement sync queued — new settlements will appear shortly." },
  });

  const items = data?.content ?? [];

  return (
    <div>
      <SectionHeader
        title="Settlements"
        desc="Gateway settlement batches and their matched transactions."
        count={data?.totalElements ?? 0}
        isFetching={isFetching && !isLoading}
        right={
          <>
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); debouncedSet(v); }}
              placeholder="Search settlements…"
            />
            <FilterSelect
              value={status}
              onChange={(v) => { setStatus(v); setPage(0); }}
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "PENDING", label: "Pending" },
                { value: "MATCHED", label: "Matched" },
                { value: "MISMATCHED", label: "Mismatched" },
              ]}
            />
            <button
              onClick={() => csvExport.run(() => exportAdminSettlements(params))}
              disabled={csvExport.isExporting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-all cursor-pointer border-none disabled:opacity-50"
              style={{ border: "1px solid #E0E0EB" }}
            >
              <Download size={12} /> {csvExport.isExporting ? "Exporting…" : "Export"}
            </button>
            <button
              onClick={() => sync.mutate()}
              disabled={sync.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-brand hover:opacity-90 transition-all cursor-pointer border-none disabled:opacity-50"
            >
              <RefreshCw size={12} className={sync.isPending ? "animate-spin" : ""} /> Sync Now
            </button>
          </>
        }
      />

      <TableShell
        isLoading={isLoading}
        isEmpty={items.length === 0}
        error={error}
        emptyIcon={Landmark}
        emptyLabel="No settlements found"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-stacked-container)" }}>
              {["Settlement", "Gross", "Fees", "Net", "Status", "Variance", "Settled At"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((s, i) => (
              <tr
                key={s.id}
                onClick={() => setOpenSettlementId(s.id)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                style={{ borderBottom: i < items.length - 1 ? "1px solid #F9FAFB" : "none" }}
              >
                <td className="px-4 py-3">
                  <p className="text-[12px] font-mono text-gray-700">{s.gatewaySettlementId ?? s.id}</p>
                  <p className="text-[10px] text-gray-400">{s.matchedTransactionCount ?? 0} txns</p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">{fmt(s.gross, s.currency)}</td>
                <td className="px-4 py-3 text-xs text-gray-700">{fmt((s.fees ?? 0) + (s.deductions ?? 0), s.currency)}</td>
                <td className="px-4 py-3 text-xs font-semibold text-gray-900">{fmt(s.net, s.currency)}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className={`px-4 py-3 text-xs ${s.variance ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                  {fmt(s.variance, s.currency)}
                </td>
                <td className="px-4 py-3 text-[11px] text-gray-500 whitespace-nowrap">{fmtDateTime(s.settledAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <TableFooter
        totalElements={data?.totalElements ?? 0}
        noun="settlement"
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPage={setPage}
      />

      {openSettlementId && (
        <SettlementDetailModal settlementId={openSettlementId} onClose={() => setOpenSettlementId(null)} />
      )}
    </div>
  );
}

// ─── Reconciliation ──────────────────────────────────────────────────────────

function ReconciliationRunsTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-reconciliation-runs", page],
    queryFn: () => getAdminReconciliationRuns(pageParams(page)).then(unwrap),
    staleTime: 30_000,
    placeholderData: (p) => p,
    refetchInterval: 10_000, // runs are async -- keep the list current without a manual refresh while one is in flight
  });

  const runPassOne = useMutation({
    mutationFn: () => triggerReconciliationRun(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-reconciliation-runs"] }),
    meta: { successMessage: "Pass-1 reconciliation run started." },
  });
  const runFull = useMutation({
    mutationFn: () => triggerFullReconciliationRun({}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-reconciliation-runs"] }),
    meta: { successMessage: "Full reconciliation run started." },
  });

  const items = data?.content ?? [];
  const busy = runPassOne.isPending || runFull.isPending;

  return (
    <div className="mb-8">
      <SectionHeader
        title="Reconciliation Runs"
        desc="Internal ledger reconciliation against gateway settlements."
        count={data?.totalElements ?? 0}
        isFetching={isFetching && !isLoading}
        right={
          <>
            <button
              onClick={() => runPassOne.mutate()}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
              style={{ border: "1px solid #E0E0EB" }}
            >
              <RefreshCw size={12} className={runPassOne.isPending ? "animate-spin" : ""} /> Run Pass 1
            </button>
            <button
              onClick={() => runFull.mutate()}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-brand hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={12} className={runFull.isPending ? "animate-spin" : ""} /> Run Full
            </button>
          </>
        }
      />

      <TableShell
        isLoading={isLoading}
        isEmpty={items.length === 0}
        error={error}
        emptyIcon={Scale}
        emptyLabel="No reconciliation runs yet"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-stacked-container)" }}>
              {["Run", "Status", "Window", "Residual", "Reconciles", "Findings", "Reports"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: i < items.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                <td className="px-4 py-3">
                  <p className="text-[12px] font-semibold text-gray-900">{(r.runType ?? "").replace(/_/g, " ")}</p>
                  <p className="text-[10px] text-gray-400">{fmtDateTime(r.startedAt)}</p>
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-[11px] text-gray-500 whitespace-nowrap">
                  {fmtDate(r.windowFrom)} – {fmtDate(r.windowTo)}
                </td>
                <td className={`px-4 py-3 text-xs ${r.residual ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                  {fmt(r.residual, "NGN", { minor: false, decimals: 2 })}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.reconciles ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {r.reconciles ? "Reconciled" : "Out of balance"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">
                  {r.findingsTotal ?? 0}
                  {r.findingsNew > 0 && (
                    <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      {r.findingsNew} new
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {r.csvReport?.url && (
                      <a href={r.csvReport.url} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-brand hover:underline">CSV</a>
                    )}
                    {r.pdfReport?.url && (
                      <a href={r.pdfReport.url} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-brand hover:underline">PDF</a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <TableFooter totalElements={data?.totalElements ?? 0} noun="run" page={page} totalPages={data?.totalPages ?? 1} onPage={setPage} />
    </div>
  );
}

function FindingReviewModal({ finding, mode, onClose }) {
  const queryClient = useQueryClient();
  const [annotation, setAnnotation] = useState("");

  const review = useMutation({
    mutationFn: () => reviewReconciliationFinding(finding.id, { annotation }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reconciliation-findings"] });
      onClose();
    },
    meta: { successMessage: "Finding marked reviewed." },
  });
  const resolve = useMutation({
    mutationFn: () => resolveReconciliationFinding(finding.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reconciliation-findings"] });
      onClose();
    },
    meta: { successMessage: "Finding resolved." },
  });

  const isResolve = mode === "resolve";

  return (
    <ModalShell title={isResolve ? "Resolve Finding" : "Review Finding"} subtitle={finding.findingKey} onClose={onClose}>
      <div className="p-6">
        <div className="bg-white rounded-xl p-3 mb-4" style={{ border: "1px solid #E0E0EB" }}>
          <p className="text-xs font-semibold text-gray-900 mb-1">{(finding.findingType ?? "").replace(/_/g, " ")}</p>
          <p className="text-xs text-gray-500 mb-2">{finding.summary}</p>
          <div className="flex items-center gap-2">
            <StatusBadge status={finding.severity} />
            <StatusBadge status={finding.status} />
          </div>
        </div>

        {!isResolve && (
          <>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Annotation (optional)</label>
            <textarea
              value={annotation}
              onChange={(e) => setAnnotation(e.target.value)}
              rows={3}
              placeholder="Notes for this review…"
              className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-xs outline-none focus:border-brand mb-4 transition-all resize-none"
            />
          </>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-gray-700 cursor-pointer transition-colors"
            style={{ background: "var(--color-stacked-container)" }}
          >
            Cancel
          </button>
          <button
            onClick={() => (isResolve ? resolve.mutate() : review.mutate())}
            disabled={review.isPending || resolve.isPending}
            className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-white cursor-pointer transition-colors disabled:opacity-50"
            style={{ background: "var(--color-brand)" }}
          >
            {review.isPending || resolve.isPending ? "Saving…" : isResolve ? "Resolve" : "Mark Reviewed"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ReconciliationFindingsTable() {
  const [status, setStatus] = useState("NEW");
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState(null); // { finding, mode: "review" | "resolve" }

  const params = {
    ...pageParams(page),
    ...(status !== "ALL" ? { status } : {}),
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-reconciliation-findings", params],
    queryFn: () => getAdminReconciliationFindings(params).then(unwrap),
    staleTime: 30_000,
    placeholderData: (p) => p,
  });

  const items = data?.content ?? [];

  return (
    <div>
      <SectionHeader
        title="Findings"
        desc="Discrepancies surfaced by reconciliation runs."
        count={data?.totalElements ?? 0}
        isFetching={isFetching && !isLoading}
        right={
          <FilterSelect
            value={status}
            onChange={(v) => { setStatus(v); setPage(0); }}
            options={[
              { value: "ALL", label: "All statuses" },
              { value: "NEW", label: "New" },
              { value: "REVIEWED", label: "Reviewed" },
              { value: "RESOLVED", label: "Resolved" },
            ]}
          />
        }
      />

      <TableShell
        isLoading={isLoading}
        isEmpty={items.length === 0}
        error={error}
        emptyIcon={ShieldCheck}
        emptyLabel="No findings — everything reconciles"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-stacked-container)" }}>
              {["Finding", "Severity", "Amount", "Variance", "Status", "Occurred", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((f, i) => (
              <tr key={f.id} className="group" style={{ borderBottom: i < items.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                <td className="px-4 py-3">
                  <p className="text-[12px] font-semibold text-gray-900">{(f.findingType ?? "").replace(/_/g, " ")}</p>
                  <p className="text-[10px] text-gray-400 truncate max-w-xs">{f.summary}</p>
                </td>
                <td className="px-4 py-3"><StatusBadge status={f.severity} /></td>
                <td className="px-4 py-3 text-xs text-gray-700">{fmt(f.amount, f.currency)}</td>
                <td className={`px-4 py-3 text-xs ${f.variance ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                  {fmt(f.variance, f.currency)}
                </td>
                <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                <td className="px-4 py-3 text-[11px] text-gray-500 whitespace-nowrap">{fmtDateTime(f.occurredAt)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {f.status !== "RESOLVED" && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 justify-end transition-opacity">
                      <button
                        onClick={() => setModal({ finding: f, mode: "review" })}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-gray-600 bg-white hover:bg-gray-50 cursor-pointer"
                        style={{ border: "1px solid #E0E0EB" }}
                      >
                        Review
                      </button>
                      <button
                        onClick={() => setModal({ finding: f, mode: "resolve" })}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-green-700 bg-green-50 hover:bg-green-100 cursor-pointer border-none"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <TableFooter totalElements={data?.totalElements ?? 0} noun="finding" page={page} totalPages={data?.totalPages ?? 1} onPage={setPage} />

      {modal && (
        <FindingReviewModal finding={modal.finding} mode={modal.mode} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function ReconciliationSection() {
  return (
    <div>
      <ReconciliationRunsTable />
      <ReconciliationFindingsTable />
    </div>
  );
}

// ─── Notifications ─────────────────────────────────────────────────────────────

const NOTIF_TYPES = [
  "ACCOUNT_VERIFICATION",
  "PAYMENT_DUE",
  "PAYMENT_RECEIVED",
  "PAYMENT_FAILED",
  "INVITE_SENT",
  "INVITE_ACCEPTED",
  "GENERAL_ANNOUNCEMENT",
];
const NOTIF_CHANNELS = ["IN_APP", "EMAIL", "SMS", "PUSH"];

function SendNotificationModal({ onClose }) {
  const queryClient = useQueryClient();
  const [targetMode, setTargetMode] = useState("emails");
  const [targets, setTargets] = useState("");
  const [notificationType, setNotificationType] = useState(
    "GENERAL_ANNOUNCEMENT",
  );
  const [channels, setChannels] = useState(["IN_APP"]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: (payload) => createAdminNotification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notification-jobs"] });
      onClose();
    },
    meta: { successMessage: "Notification queued" },
  });

  function toggleChannel(ch) {
    setChannels((cs) =>
      cs.includes(ch) ? cs.filter((c) => c !== ch) : [...cs, ch],
    );
  }

  function submit(e) {
    e.preventDefault();
    const list = targets
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    mutation.mutate({
      notificationType,
      channels,
      title,
      message,
      ...(targetMode === "emails" ? { emails: list } : { userIds: list }),
    });
  }

  const f = { border: "1px solid #D0D0D0" };
  const ff = { borderColor: "var(--color-brand)" };

  return (
    <ModalShell title="Send Notification" onClose={onClose}>
      <form
        onSubmit={submit}
        className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto"
      >
        {/* Target mode */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Recipients
          </label>
          <div className="flex gap-2 mb-2">
            {[
              { val: "emails", label: "By Email" },
              { val: "userIds", label: "By User ID" },
            ].map(({ val, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => setTargetMode(val)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  targetMode === val
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <textarea
            value={targets}
            onChange={(e) => setTargets(e.target.value)}
            rows={3}
            required
            className="w-full px-3 py-2.5 rounded-lg text-xs text-gray-800 outline-none resize-none font-mono transition-colors"
            style={f}
            onFocus={(e) => Object.assign(e.target.style, ff)}
            onBlur={(e) => Object.assign(e.target.style, f)}
            placeholder={
              targetMode === "emails"
                ? "user@example.com, another@example.com"
                : "uuid1, uuid2"
            }
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Type
          </label>
          <select
            value={notificationType}
            onChange={(e) => setNotificationType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-xs text-gray-700 outline-none"
            style={f}
          >
            {NOTIF_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Channels */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Channels
          </label>
          <div className="flex gap-2 flex-wrap">
            {NOTIF_CHANNELS.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => toggleChannel(ch)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  channels.includes(ch)
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-lg text-xs text-gray-800 outline-none transition-colors"
            style={f}
            onFocus={(e) => Object.assign(e.target.style, ff)}
            onBlur={(e) => Object.assign(e.target.style, f)}
            placeholder="Notification title"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
            className="w-full px-3 py-2.5 rounded-lg text-xs text-gray-800 outline-none resize-none transition-colors"
            style={f}
            onFocus={(e) => Object.assign(e.target.style, ff)}
            onBlur={(e) => Object.assign(e.target.style, f)}
            placeholder="Notification body…"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer border-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || channels.length === 0}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer border-none"
            style={{ background: "var(--color-brand)" }}
          >
            {mutation.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Bell size={12} />
            )}
            {mutation.isPending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

const JOB_COLORS = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-700" },
  COMPLETED: { bg: "bg-green-50", text: "text-green-700" },
  FAILED: { bg: "bg-red-50", text: "text-red-700" },
  PARTIAL: { bg: "bg-orange-50", text: "text-orange-700" },
};

function NotificationsSection() {
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const params = pageParams(page);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-notification-jobs", params],
    queryFn: () => getAdminNotificationJobs(params).then(unwrap),
    staleTime: 30_000,
    placeholderData: (p) => p,
  });

  const items = data?.content ?? [];

  return (
    <div>
      <SectionHeader
        title="Notifications"
        desc="Platform-sent notification jobs and delivery status."
        count={data?.totalElements ?? 0}
        isFetching={isFetching && !isLoading}
        right={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer border-none"
            style={{ background: "var(--color-brand)" }}
          >
            <Bell size={12} /> Send Notification
          </button>
        }
      />

      <TableShell
        isLoading={isLoading}
        isEmpty={items.length === 0}
        error={error}
        emptyIcon={Bell}
        emptyLabel="No notifications found"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-stacked-container)" }}>
              {[
                "Type",
                "Channels",
                "Recipients",
                "Delivered",
                "Failed",
                "Status",
                "Created",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((j, i) => {
              const sc = JOB_COLORS[j.status] ?? {
                bg: "bg-gray-100",
                text: "text-gray-500",
              };
              return (
                <tr
                  key={j.jobId}
                  className="hover:bg-gray-50 transition-colors"
                  style={{
                    borderBottom:
                      i < items.length - 1 ? "1px solid #F9FAFB" : "none",
                  }}
                >
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-gray-700 font-medium">
                      {(j.notificationType ?? "—").replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-gray-500">
                      {(j.channels ?? []).join(", ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] text-gray-700">
                      {j.recipientCount ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-medium text-green-600">
                      {j.deliveredCount ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[12px] font-medium ${(j.failedCount ?? 0) > 0 ? "text-red-500" : "text-gray-400"}`}
                    >
                      {j.failedCount ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[11px] text-gray-500">
                      {fmtDate(j.createdAt)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableShell>

      <TableFooter
        totalElements={data?.totalElements ?? 0}
        noun="job"
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPage={setPage}
      />
      {showCreate && (
        <SendNotificationModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "communities", label: "Communities", Icon: Building2 },
  { id: "accounts", label: "Accounts", Icon: Wallet },
  { id: "users", label: "Users", Icon: Users },
  { id: "payment-links", label: "Payment Links", Icon: CreditCard },
  { id: "balances", label: "Balances", Icon: BarChart2 },
  { id: "settlements", label: "Settlements", Icon: Landmark },
  { id: "reconciliation", label: "Reconciliation", Icon: Scale },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "system-config", label: "System Config", Icon: SlidersHorizontal },
];

export default function AdminPanel() {
  usePageTitle("Admin Panel");
  const [activeTab, setActiveTab] = useState("communities");

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 min-h-full">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900 mb-1">Platform Admin</h1>
        <p className="text-xs text-gray-400">
          Glass internal operations — not visible to community owners.
        </p>
      </div>

      <div className="overflow-x-auto mb-8">
        <div
          className="flex gap-1 bg-stacked-container rounded-xl p-1 w-fit"
          style={{ border: "1px solid #f0f0f0" }}
        >
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all cursor-pointer border-none ${
                  active
                    ? "bg-white text-gray-900 shadow-sm"
                    : "bg-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "communities" && <CommunitiesSection />}
      {activeTab === "accounts" && <AccountsSection />}
      {activeTab === "users" && <UsersSection />}
      {activeTab === "payment-links" && <PaymentLinksSection />}
      {activeTab === "balances" && <BalancesSection />}
      {activeTab === "settlements" && <SettlementsSection />}
      {activeTab === "reconciliation" && <ReconciliationSection />}
      {activeTab === "notifications" && <NotificationsSection />}
      {activeTab === "system-config" && <SystemConfig />}
    </div>
  );
}
