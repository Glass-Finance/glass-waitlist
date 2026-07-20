import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Search, Filter, Users } from "lucide-react";
import { getPaymentLinkMembers } from "../../../api/payments";
import { getCommunityMembers } from "../../../api/communities";
import { getCommunityObligations, getCommunityTransactions } from "../../../api/transactions";
import { exportCommunityObligations } from "../../../api/exports";
import { useExportJob } from "../../../hooks/useExportJob";
import { formatNaira, toTitleCase, formatDate } from "../../../utils/format";
import LoadingState from "../../../components/common/LoadingState";
import EmptyState from "../../../components/common/EmptyState";

// ── Plan members modal ────────────────────────────────────────────────────────
export default function PlanMembersModal({ plan, communityId, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState([]);

  // Plan-specific obligation statuses
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

  // Community members — for reliable name + email resolution. Explicitly
  // overrides getCommunityMembers' default ACTIVE-only filter: this modal
  // needs to show paid/unpaid status for every member ever on this plan,
  // including ones who've since gone overdue/inactive — filtering them out
  // here was why they silently disappeared from the paid/unpaid list.
  const { data: communityMembersData } = useQuery({
    queryKey: ["community", communityId, "members", "all-statuses"],
    queryFn: async () => {
      const res = await getCommunityMembers(communityId, { status: undefined });
      const data = res.data?.data;
      return Array.isArray(data) ? data : (data?.content ?? []);
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 5,
  });

  // Obligations — authoritative source for paid/due status per member
  // Uses the same cache key as the main Payments page so no extra request.
  const { data: allObligations = [] } = useQuery({
    queryKey: ["community", communityId, "obligations"],
    queryFn: async () => {
      const res = await getCommunityObligations(communityId);
      const data = res.data?.data;
      return Array.isArray(data) ? data : (data?.content ?? []);
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 2,
  });

  // Transactions — same cache key as the main page, so no extra request.
  const { data: allTransactions = [] } = useQuery({
    queryKey: ["community", communityId, "transactions"],
    queryFn: async () => {
      const res = await getCommunityTransactions(communityId);
      const data = res.data?.data;
      return Array.isArray(data) ? data : (data?.content ?? []);
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 2,
  });

  // The backend doesn't always flip obligation.status to PAID immediately
  // after a payment is verified — the plan cards' planMetrics already
  // cross-reference successful transactions for exactly this reason, and
  // without the same cross-reference here the modal shows a just-paid member
  // as Pending / ₦0 collected while the card outside already counts them.
  // Same matching rules as planMetrics: by obligationId when the transaction
  // carries one, else by plan + member identity.
  const planTx = useMemo(() => {
    const SUCCESS = new Set(["SUCCESS", "SUCCESSFUL", "PAID"]);
    const paidObligationIds = new Set();
    const byKey = {};
    const seenMembers = new Set();
    for (const tx of allTransactions) {
      if (!SUCCESS.has((tx.status ?? "").toUpperCase())) continue;
      if (tx.obligationId) paidObligationIds.add(String(tx.obligationId));
      if (String(tx.paymentLink?.id) !== String(plan.id)) continue;
      const keys = [
        tx.member?.id,
        tx.member?.userId,
        tx.member?.user?.id,
        tx.user?.id,
        tx.member?.email,
        tx.user?.email,
      ]
        .filter(Boolean)
        .map(String);
      if (!keys.length) continue;
      // A member can have multiple SUCCESSFUL rows for one plan (repeat-
      // payment bug, see planMetrics) — count the first per member.
      if (keys.some((k) => seenMembers.has(k))) continue;
      keys.forEach((k) => seenMembers.add(k));
      const info = { amount: tx.amount ?? 0 };
      for (const k of keys) byKey[k] = info;
    }
    return { paidObligationIds, byKey };
  }, [allTransactions, plan.id]);

  // Build memberId / userId → { name, email, joinedAt } lookup. Also track
  // every ID this community currently knows about (any status) so only
  // genuinely-removed members get filtered out below — overdue/inactive
  // members must still show up in the paid/unpaid breakdown.
  // getCommunityMembers returns a flat shape: cm.userId (not cm.user.id).
  const { memberLookup, knownMemberIds } = useMemo(() => {
    const byMemberId = {};
    const byUserId = {};
    const knownIds = new Set();
    for (const m of communityMembersData ?? []) {
      const first = m.user?.firstName ?? m.firstName ?? "";
      const last = m.user?.lastName ?? m.lastName ?? "";
      const name = `${first} ${last}`.trim() || null;
      const email = m.user?.email ?? m.email ?? null;
      const info = {
        name,
        email,
        joinedAt: m.joinedAt ?? m.member?.joinedAt ?? null,
      };
      // cm.id = community membership ID; cm.userId = user's global ID (flat field)
      const userId = m.userId ?? m.user?.id ?? null;
      if (m.id) {
        byMemberId[String(m.id)] = info;
        knownIds.add(String(m.id));
      }
      if (userId) {
        byUserId[String(userId)] = info;
        knownIds.add(String(userId));
      }
    }
    return { memberLookup: { byMemberId, byUserId }, knownMemberIds: knownIds };
  }, [communityMembersData]);

  // Show every member still known to the community — including
  // overdue/inactive ones — and only filter out members who've actually
  // been removed (and so no longer appear in communityMembersData at all).
  const planMembers = useMemo(() => {
    const all = planMembersData ?? [];
    if (!communityMembersData) return all; // don't filter while community list is loading
    return all.filter((m) => {
      const mid = String(m.member?.id ?? m.memberId ?? "");
      const uid = String(m.member?.user?.id ?? m.user?.id ?? m.userId ?? "");
      return knownMemberIds.has(mid) || knownMemberIds.has(uid);
    });
  }, [planMembersData, communityMembersData, knownMemberIds]);

  // Build a lookup for obligation status keyed by every reachable ID for this plan.
  // Obligations use ob.member.userId (flat) not ob.member.user.id (nested).
  // Plan members carry communityMemberId, so we bridge via communityMembersData:
  //   communityMemberId → userId → obligation info
  const obligationByMemberId = useMemo(() => {
    // Step 1: communityMemberId → userId (cm.userId is flat, not cm.user.id)
    const cmToUser = {};
    for (const cm of communityMembersData ?? []) {
      const userId = cm.userId ?? cm.user?.id ?? "";
      if (cm.id && userId) cmToUser[String(cm.id)] = String(userId);
    }

    // Step 2: index obligations by userId and email
    const map = {};
    for (const ob of allObligations) {
      if (String(ob.paymentLink?.id) !== String(plan.id)) continue;
      // ob.member.userId is a flat field (not ob.member.user.id)
      const userId = String(
        ob.member?.userId ?? ob.member?.user?.id ?? ob.user?.id ?? "",
      );
      const email = ob.member?.email ?? ob.user?.email ?? "";
      const status = (ob.status ?? "PENDING").toUpperCase();
      // Upgrade to PAID when a successful transaction settles this
      // obligation but the backend hasn't flipped its status yet.
      const paidByTx =
        planTx.paidObligationIds.has(String(ob.id)) ||
        Boolean(
          (ob.member?.id && planTx.byKey[String(ob.member.id)]) ||
            (userId && planTx.byKey[userId]) ||
            (email && planTx.byKey[email]),
        );
      const txAmount =
        (ob.member?.id && planTx.byKey[String(ob.member.id)]?.amount) ||
        (userId && planTx.byKey[userId]?.amount) ||
        (email && planTx.byKey[email]?.amount) ||
        0;
      const info = {
        status: paidByTx && status !== "PAID" ? "PAID" : status,
        amountPaid: Math.max(ob.amountPaid ?? ob.paidAmount ?? 0, txAmount),
        amountDue: ob.amount ?? ob.amountDue ?? plan.amount ?? 0,
      };
      if (userId) map[userId] = info;
      if (email) map[email] = info;
    }

    // Step 3: add communityMemberId entries so plan members can match directly
    for (const [cmId, userId] of Object.entries(cmToUser)) {
      if (map[userId]) map[cmId] = map[userId];
    }

    return map;
  }, [allObligations, communityMembersData, plan.id, plan.amount, planTx]);

  function getObligationInfo(m) {
    const mid = String(m.member?.id ?? m.memberId ?? "");
    const uid = String(m.member?.user?.id ?? m.user?.id ?? m.userId ?? "");
    // Use the plan member's own email (flat field) as well as the lookup email
    const email =
      m.email ??
      memberLookup.byMemberId[mid]?.email ??
      memberLookup.byUserId[uid]?.email ??
      "";
    return (
      (mid && obligationByMemberId[mid]) ||
      (uid && obligationByMemberId[uid]) ||
      (email && obligationByMemberId[email]) ||
      null
    );
  }

  function resolveMember(m) {
    const mid = String(m.member?.id ?? m.memberId ?? "");
    const uid = String(m.member?.user?.id ?? m.user?.id ?? m.userId ?? "");
    const fromLookup =
      (mid && memberLookup.byMemberId[mid]) ||
      (uid && memberLookup.byUserId[uid]);
    if (fromLookup) return fromLookup;
    // Flat plan-member response: firstName/lastName/email at the top level
    const u = m.member?.user ?? m.user ?? m.member ?? {};
    const f = u.firstName ?? m.firstName ?? "";
    const l = u.lastName ?? m.lastName ?? "";
    return {
      name: `${f} ${l}`.trim() || null,
      email: u.email ?? m.email ?? null,
      joinedAt: m.member?.joinedAt ?? m.joinedAt ?? null,
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
    return (
      resolveMember(m).joinedAt ?? m.member?.joinedAt ?? m.joinedAt ?? null
    );
  }

  // Successful transaction for this member on this plan, if any — covers
  // members whose payment went through but whose obligation either hasn't
  // been status-flipped yet or was never linked (the N/A rows).
  function getTxInfo(m) {
    const mid = String(m.member?.id ?? m.memberId ?? "");
    const uid = String(m.member?.user?.id ?? m.user?.id ?? m.userId ?? "");
    const email =
      m.email ??
      memberLookup.byMemberId[mid]?.email ??
      memberLookup.byUserId[uid]?.email ??
      "";
    return (
      (mid && planTx.byKey[mid]) ||
      (uid && planTx.byKey[uid]) ||
      (email && planTx.byKey[email]) ||
      null
    );
  }

  function getStatus(m) {
    const ob = getObligationInfo(m);
    if (ob) return ob.status;
    if (getTxInfo(m)) return "PAID";
    const raw =
      m.obligationStatus ??
      m.obligation?.status ??
      m.member?.obligationStatus ??
      m.paymentStatus ??
      m.status ??
      "PENDING";
    return raw.toUpperCase();
  }
  function getAmountPaid(m) {
    const ob = getObligationInfo(m);
    const txAmount = getTxInfo(m)?.amount ?? 0;
    if (ob) return Math.max(ob.amountPaid, txAmount);
    return Math.max(
      m.amountPaid ?? m.paidAmount ?? m.obligation?.amountPaid ?? 0,
      txAmount,
    );
  }
  function getAmountDue(m) {
    const ob = getObligationInfo(m);
    if (ob) return ob.amountDue;
    return m.amount ?? m.amountDue ?? m.obligation?.amount ?? plan.amount ?? 0;
  }

  function statusStyle(s) {
    if (s === "PAID") return { cls: "bg-[#ecfdf5] text-[#059669]", label: "Paid" };
    if (s === "OVERDUE")
      return { cls: "bg-[#fff1f2] text-[#e11d48]", label: "Overdue" };
    if (s === "DUE") return { cls: "bg-[#fffbeb] text-[#b45309]", label: "Due" };
    if (s === "WAIVED")
      return { cls: "bg-[#f5f6fa] text-[#6b7280]", label: "Waived" };
    if (s === "NONE") return { cls: "bg-[#f5f6fa] text-[#9ca3af]", label: "N/A" };
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
      exportCommunityObligations(communityId, { paymentLinkId: plan.id }, "CSV"),
    );
  }

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-6 bg-[rgba(15,29,110,0.2)] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
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
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-surface-container-border flex-1 max-w-xs">
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
                          ? filtered.map((m) => m.id ?? getName(m))
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
                  <td colSpan={7}>
                    <EmptyState
                      icon={Users}
                      title={
                        planMembers.length === 0
                          ? "No members enrolled in this plan"
                          : "No members match your filter"
                      }
                      className="py-10"
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((m, i) => {
                  const key = m.id ?? i;
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
