import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Search, Filter } from "lucide-react";
import { getPaymentLinkMembers } from "../../../api/payments";
import { exportCommunityObligations } from "../../../api/exports";
import { useExportJob } from "../../../hooks/useExportJob";
import { useEscapeToClose } from "../../../hooks/useKeyboardShortcuts";
import { formatNaira, toTitleCase, formatDate } from "../../../utils/format";
import LoadingState from "../../../components/common/LoadingState";

// ── Plan members modal ────────────────────────────────────────────────────────
export default function PlanMembersModal({ plan, communityId, onClose }) {
  useEscapeToClose(onClose);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState([]);

  const { data: planMembersData, isLoading } = useQuery({
    queryKey: ["plan-members", communityId, plan.id],
    queryFn: async () => {
      const res = await getPaymentLinkMembers(communityId, plan.id, {
        pageSize: 500,
      });
      const raw = res.data?.data;
      return Array.isArray(raw) ? raw : (raw?.content ?? []);
    },
    enabled: !!(communityId && plan.id),
    staleTime: 1000 * 60,
  });

  // This endpoint already returns the authoritative member identity, rolled-up
  // obligation status, and aggregate amounts for this payment link.
  const planMembers = planMembersData ?? [];

  function resolveMember(m) {
    const f = m.firstName ?? "";
    const l = m.lastName ?? "";
    return {
      name: `${f} ${l}`.trim() || null,
      email: m.email ?? null,
      joinedAt: m.joinedAt ?? null,
    };
  }

  function getName(m) {
    const r = resolveMember(m);
    return toTitleCase(r.name ?? r.email ?? "Member");
  }
  function getEmail(m) {
    return resolveMember(m).email ?? "—";
  }
  function getJoinedAt(m) {
    return m.joinedAt ?? null;
  }

  function getStatus(m) {
    return (m.obligationStatus ?? "NONE").toUpperCase();
  }
  function getAmountPaid(m) {
    return m.amountPaid ?? 0;
  }
  function getAmountDue(m) {
    return m.totalAmountDue ?? 0;
  }

  function statusStyle(s) {
    if (s === "PAID")
      return { cls: "bg-[#ecfdf5] text-[#059669]", label: "Paid" };
    if (s === "OVERDUE")
      return { cls: "bg-[#fff1f2] text-[#e11d48]", label: "Overdue" };
    if (s === "DUE")
      return { cls: "bg-[#fffbeb] text-[#b45309]", label: "Due" };
    if (s === "WAIVED")
      return { cls: "bg-[#f5f6fa] text-[#6b7280]", label: "Waived" };
    if (s === "NONE")
      return { cls: "bg-[#f5f6fa] text-[#9ca3af]", label: "N/A" };
    return { cls: "bg-[#fffbeb] text-[#b45309]", label: "Pending" };
  }

  const filtered = planMembers.filter((m) => {
    const q = search.toLowerCase();
    if (
      q &&
      !getName(m).toLowerCase().includes(q) &&
      !getEmail(m).toLowerCase().includes(q)
    )
      return false;
    if (statusFilter === "Paid" && getStatus(m) !== "PAID") return false;
    if (statusFilter === "Unpaid" && getStatus(m) === "PAID") return false;
    if (statusFilter === "Overdue" && getStatus(m) !== "OVERDUE") return false;
    return true;
  });

  const paidCount = planMembers.filter((m) => getStatus(m) === "PAID").length;
  const totalCount = planMembers.length;
  const totalCollected = planMembers.reduce(
    (sum, m) => sum + getAmountPaid(m),
    0,
  );

  // Real backend export job (see useExportJob.js) instead of a client-side
  // CSV -- that silently capped at whatever page of members was already
  // loaded and had no escaping for commas/quotes in names. This does mean
  // it always exports every member on this plan rather than just the
  // current search/selection subset, since the export job has no way to
  // filter by an arbitrary client-side member-id list.
  const { run: runExport, isExporting } = useExportJob();
  function exportCsv() {
    runExport(() =>
      exportCommunityObligations(
        communityId,
        { paymentLinkId: plan.id },
        "CSV",
      ),
    );
  }

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-6 bg-black/20"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-bg rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-black">
              {toTitleCase(plan.name)} — Members
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isLoading
                ? "Loading…"
                : `${paidCount} / ${totalCount} paid · ${formatNaira(totalCollected)} collected`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCsv}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand text-xs font-semibold text-brand hover:bg-blue-50 bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? "Exporting…" : "Export CSV"}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-surface-container-border flex-1 max-w-xs focus-within:ring-1 focus-within:ring-[var(--color-brand)]">
            <Search size={12} className="text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members…"
              className="flex-1 bg-transparent border-none outline-none text-xs text-gray-600 placeholder-gray-400"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 bg-white cursor-pointer"
            >
              <Filter size={12} /> Filter
              {statusFilter && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
              )}
            </button>
            {filterOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setFilterOpen(false)}
                />
                <div className="absolute left-0 top-full mt-2 bg-white rounded-xl border border-surface-container-border shadow-lg z-20 p-4 w-52">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white mb-3"
                  >
                    <option value="">All</option>
                    <option>Paid</option>
                    <option>Unpaid</option>
                    <option>Overdue</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setStatusFilter("");
                        setFilterOpen(false);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-500 cursor-pointer bg-white"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setFilterOpen(false)}
                      className="flex-1 px-3 py-2 rounded-lg bg-brand text-white text-xs font-semibold border-none cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0">
              <tr className="border-y border-gray-100 bg-gray-50">
                <th className="px-5 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={
                      selected.length === filtered.length && filtered.length > 0
                    }
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? filtered.map((m) => m.memberId ?? getName(m))
                          : [],
                      )
                    }
                  />
                </th>
                {[
                  "Member",
                  "Email",
                  "Status",
                  "Paid",
                  "Total Due",
                  "Date Joined",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7}>
                    <LoadingState className="py-10" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-4">
                    <div className="border-2 border-dashed border-gray-200 rounded-lg py-3 px-3 text-center">
                      <span className="text-xs text-gray-400">
                        {planMembers.length === 0
                          ? "No members enrolled in this plan"
                          : "No members match your filter"}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((m, i) => {
                  const key = m.memberId ?? i;
                  const s = statusStyle(getStatus(m));
                  return (
                    <tr
                      key={key}
                      className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(key)}
                          onChange={() =>
                            setSelected((p) =>
                              p.includes(key)
                                ? p.filter((x) => x !== key)
                                : [...p, key],
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-brand whitespace-nowrap">
                        {getName(m)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {getEmail(m)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-800">
                        {formatNaira(getAmountPaid(m))}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatNaira(getAmountDue(m))}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(getJoinedAt(m))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!isLoading && planMembers.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Showing {filtered.length} of {planMembers.length} members
            </span>
            {statusFilter && (
              <button
                onClick={() => setStatusFilter("")}
                className="text-xs font-semibold text-brand bg-transparent border-none cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dropdown menu item ────────────────────────────────────────────────────────
