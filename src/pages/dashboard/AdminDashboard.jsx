import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Download,
  MoreHorizontal,
  Plus,
  ChevronDown,
  Search,
  X,
  AlertCircle,
  Clock,
  Wallet,
  Activity,
  Receipt,
} from "lucide-react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useCommunityDashboard } from "../../hooks/useCommunityDashboard";
import { usePaymentPlans } from "../../hooks/usePaymentPlans";
import { useCommunityMembers } from "../../hooks/useCommunityMembers";
import { useCommunityAccount } from "../../hooks/useCommunityAccount";
import {
  usePayments,
  useManagePayments,
  usePendingPaymentVerification,
} from "../../hooks/usePayments";
import { useAuth } from "../../store/AuthContext";
import { useExportJob } from "../../hooks/useExportJob";
import { exportCommunityTransactions } from "../../api/exports";
import EmptyState from "../../components/common/EmptyState";
import ReceiptDownloadButton from "../../components/common/ReceiptDownloadButton";
import AutoPayPrompt from "../../components/common/AutoPayPrompt";
import { toTitleCase, formatDate } from "../../utils/format";
import totalMembersIcon from "../../assets/dashboard/tdesign-member.webp";
import inactiveMembersIcon from "../../assets/dashboard/inactive-members.webp";
import totalContribIcon from "../../assets/dashboard/tcontributions.webp";
import activePlansIcon from "../../assets/dashboard/active-plans.webp";
import TimerIcon from "../../assets/dashboard/timer.webp";
import WarnSignIcon from "../../assets/dashboard/warn-sign.webp";
import { formatNaira, timeAgo, statusStyle, freqStyle } from "./admin-dashboard/helpers";
import { Skeleton, ActivityIcon } from "./admin-dashboard/SkeletonUI";
import { AdminPaymentModal } from "../../components/dashboard/AdminPaymentModal";
import AddMemberModal from "./admin-dashboard/AddMemberModal";
import GettingStartedChecklist from "./admin-dashboard/sections/GettingStartedChecklist";
import DashboardStats from "./admin-dashboard/sections/DashboardStats";

function DashboardContent({ isPaying, communityId }) {
  usePageTitle("Community Dashboard");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { run: runExport, isExporting } = useExportJob();
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState("desc");
  const [alertVisible, setAlertVisible] = useState(true);
  const [payingItem, setPayingItem] = useState(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [gsDismissed, setGsDismissed] = useState(() => {
    try {
      return localStorage.getItem(`gs_done_${communityId}`) === "1";
    } catch {
      return false;
    }
  });

  const {
    balances,
    members,
    transactions,
    obligations,
    activity,
    community,
    isLoading,
    error,
  } = useCommunityDashboard(communityId);
  const { plans, isLoading: plansLoading } = usePaymentPlans(communityId);
  // The Payment Plans widget below is an at-a-glance preview, not the full
  // list (that's Payments.jsx, which has its own status filters/badges) --
  // archived/expired plans no longer need attention and would otherwise
  // clutter it indefinitely.
  const visiblePlans = plans.filter(
    (p) => p.status !== "ARCHIVED" && p.status !== "EXPIRED",
  );

  // Paying admin's own dues, as a member of this community -- scoped to
  // whichever community this dashboard is currently showing, not whatever
  // community the admin last visited as a member (see usePayments.js).
  const { data: myPayments } = usePayments(communityId);
  const myUpcoming = myPayments?.upcoming ?? [];
  const { data: myAuthorisations } = useManagePayments();
  // Catches payers who came back from Paystack without hitting the callback
  // page — verifies the stored pending reference so Paid shows immediately.
  usePendingPaymentVerification();

  // "Your Payments" table controls — small local list, so sort/filter run
  // client-side rather than round-tripping to the server.
  const [myPaymentsSort, setMyPaymentsSort] = useState("desc"); // desc = soonest due first
  const [myPaymentsFilter, setMyPaymentsFilter] = useState(null); // null | "paid" | "unpaid"
  const [myPaymentsFilterOpen, setMyPaymentsFilterOpen] = useState(false);

  const myUpcomingFiltered = useMemo(() => {
    let rows = [...myUpcoming];
    if (myPaymentsFilter) {
      rows = rows.filter((row) => {
        const isPaid = row.status === "PAID" || row.status === "SUCCESSFUL";
        return myPaymentsFilter === "paid" ? isPaid : !isPaid;
      });
    }
    rows.sort((a, b) => {
      const ta = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const tb = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return myPaymentsSort === "desc" ? ta - tb : tb - ta;
    });
    return rows;
  }, [myUpcoming, myPaymentsFilter, myPaymentsSort]);

  // Auto-pay is "on" for a recurring plan when a non-revoked authorisation
  // consent exists for it — same match rule as settings/finance/AutoPay.jsx.
  function hasActiveAutoPay(item) {
    return (myAuthorisations ?? []).some((auth) =>
      auth.consents.some(
        (c) =>
          !c.revoked &&
          c.paymentLinkTitle === item.name &&
          c.communityName === item.communityName,
      ),
    );
  }

  // Open the confirmation modal instead of calling the API directly
  function handlePayMine(item) {
    setPayingItem(item);
  }

  // ── Getting started checklist ─────────────────────────────────────────────
  const { account: payoutAccount, isLoading: payoutLoading } =
    useCommunityAccount(communityId);
  const gsHasPlans = plans.length > 0;
  const gsHasMembers = (members?.total ?? 0) > 0;
  // A submitted account isn't necessarily a *usable* one -- it still needs
  // to clear ACTIVE/VERIFIED on our side (see errorHandler.js's rewrite of
  // "community account is not active" for the other end of this same gap).
  // Treating any submitted account as "done" hid that pending/rejected
  // state entirely: the checklist showed a green check and the whole card
  // disappeared once dismissed, with nothing telling the owner their
  // account was still being reviewed until they hit a wall trying to
  // create a payment plan.
  const payoutAccountStatus = payoutAccount?.status?.toUpperCase() ?? null;
  const gsHasPayoutAccount = ["ACTIVE", "VERIFIED"].includes(payoutAccountStatus);
  const gsPayoutAccountRejected = ["FAILED", "REJECTED"].includes(payoutAccountStatus);
  const gsPayoutAccountPending = !!payoutAccount && !gsHasPayoutAccount && !gsPayoutAccountRejected;
  const showGettingStarted =
    !isLoading &&
    !plansLoading &&
    !payoutLoading &&
    !gsDismissed &&
    (!gsHasPlans || !gsHasMembers || !gsHasPayoutAccount);

  function dismissGs() {
    setGsDismissed(true);
    try {
      localStorage.setItem(`gs_done_${communityId}`, "1");
    } catch {}
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const activePlanCount = plans.filter((p) => p.status === "ACTIVE").length;
  const stats = useMemo(
    () => [
      {
        label: "Total Members",
        value: isLoading ? "—" : String(members?.total ?? 0),
        icon: totalMembersIcon,
      },
      {
        label: "Inactive Members",
        value: isLoading ? "—" : String(members?.inactive ?? 0),
        icon: inactiveMembersIcon,
      },
      {
        label: "Overdue Members",
        value: isLoading ? "—" : String(members?.overdue ?? 0),
        icon: inactiveMembersIcon,
      },
      {
        label: "Total Contributions",
        value: isLoading ? "—" : formatNaira(balances?.totalContributions ?? 0),
        icon: totalContribIcon,
      },
      {
        label: "Active Plans",
        value: plansLoading ? "—" : String(activePlanCount),
        icon: activePlansIcon,
      },
    ],
    [isLoading, plansLoading, members, balances, activePlanCount],
  );

  // ── Member name lookup — transactions only carry email, not full name ────────
  // Build two maps (by member ID and by user ID) so we can resolve the display
  // name regardless of which ID the transaction's member object contains.
  const memberNameMap = useMemo(() => {
    const byMemberId = {};
    const byUserId = {};
    for (const m of members.list ?? []) {
      const first = m.user?.firstName ?? m.firstName ?? "";
      const last = m.user?.lastName ?? m.lastName ?? "";
      const raw = `${first} ${last}`.trim() || m.user?.email || m.email || null;
      const name = raw ? raw.replace(/\b\w/g, (c) => c.toUpperCase()) : null;
      if (!name) continue;
      if (m.id) byMemberId[String(m.id)] = name;
      if (m.user?.id) byUserId[String(m.user.id)] = name;
    }
    return { byMemberId, byUserId };
  }, [members.list]);

  function resolveMemberName(tx) {
    // 1. Try the members list (most reliable — has proper first/last name)
    const mid = tx.member?.id ?? tx.memberId;
    if (mid && memberNameMap.byMemberId[String(mid)])
      return memberNameMap.byMemberId[String(mid)];
    const uid = tx.member?.user?.id ?? tx.user?.id ?? tx.userId;
    if (uid && memberNameMap.byUserId[String(uid)])
      return memberNameMap.byUserId[String(uid)];
    // 2. Fall back to whatever name fields the transaction itself carries
    const u = tx.member?.user ?? tx.user ?? tx.payer ?? tx.member ?? {};
    const f = u.firstName ?? tx.firstName ?? "";
    const l = u.lastName ?? tx.lastName ?? "";
    const full = `${f} ${l}`.trim();
    return full ? full.replace(/\b\w/g, (c) => c.toUpperCase()) : null;
  }

  // ── Per-plan metrics computed from obligations + transactions ────────────────
  const planMetrics = useMemo(() => {
    const SUCCESS_STATUSES = new Set(["SUCCESS", "SUCCESSFUL", "PAID"]);

    // The backend doesn't always flip obligation.status to PAID immediately
    // after a payment is verified — cross-reference successful transactions
    // too, so a member who's actually paid isn't miscounted as unpaid just
    // because their obligation record lags behind.
    const paidObligationIds = new Set();
    const paidLinkMemberKeys = new Set(); // `${paymentLinkId}::${memberId}`, for txs with no obligationId
    for (const tx of transactions) {
      if (!SUCCESS_STATUSES.has((tx.status ?? "").toUpperCase())) continue;
      if (tx.obligationId) paidObligationIds.add(String(tx.obligationId));
      const planId = tx.paymentLink?.id;
      const mid = String(
        tx.member?.id ?? tx.member?.user?.id ?? tx.user?.id ?? "",
      );
      if (planId && mid) paidLinkMemberKeys.add(`${planId}::${mid}`);
    }

    const byPlan = {};

    // Track paid members as a unique-member set — a member with multiple
    // paid obligations on the same recurring plan is still only 1 paid
    // member, not 2. (This is what caused "2/1 members paid" earlier.)
    for (const ob of obligations) {
      const planId = ob.paymentLink?.id;
      if (!planId) continue;
      if (!byPlan[planId]) {
        byPlan[planId] = {
          collected: 0,
          seenMemberIds: new Set(),
          paidMemberIds: new Set(),
        };
      }

      const mid = String(
        ob.member?.id ?? ob.member?.user?.id ?? ob.user?.id ?? ob.id ?? "",
      );
      byPlan[planId].seenMemberIds.add(mid);

      const s = (ob.status ?? "").toUpperCase();
      const isPaid =
        SUCCESS_STATUSES.has(s) ||
        paidObligationIds.has(String(ob.id)) ||
        (planId && mid && paidLinkMemberKeys.has(`${planId}::${mid}`));
      if (isPaid && mid) byPlan[planId].paidMemberIds.add(mid);
    }

    // Transactions tell us the real amount collected — dedupe by
    // plan+member so a member's repeat successful transactions on the same
    // plan (see Payments.jsx's PlanCard metrics for why those can occur)
    // aren't double-counted.
    const countedPlanMemberPaymentsDashboard = new Set();
    for (const tx of transactions) {
      const planId = tx.paymentLink?.id;
      if (!planId) continue;
      if (!byPlan[planId]) {
        byPlan[planId] = {
          collected: 0,
          seenMemberIds: new Set(),
          paidMemberIds: new Set(),
        };
      }
      if (!SUCCESS_STATUSES.has((tx.status ?? "").toUpperCase())) continue;

      const mid = String(
        tx.member?.id ?? tx.member?.user?.id ?? tx.user?.id ?? "",
      );
      const dedupeKey = mid ? `${planId}::${mid}` : `${planId}::${tx.id}`;
      if (countedPlanMemberPaymentsDashboard.has(dedupeKey)) continue;
      countedPlanMemberPaymentsDashboard.add(dedupeKey);

      byPlan[planId].collected += tx.amount ?? 0;
    }

    const result = {};
    for (const [id, m] of Object.entries(byPlan)) {
      result[id] = {
        collected: m.collected,
        paidCount: m.paidMemberIds.size,
        totalCount: m.seenMemberIds.size,
      };
    }
    return result;
  }, [obligations, transactions]);

  // ── Filter payments by search ─────────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        const name = (resolveMemberName(t) ?? "").toLowerCase();
        const plan = (
          t.planName ??
          t.paymentLink?.title ??
          t.description ??
          ""
        ).toLowerCase();
        const email = (
          t.member?.user?.email ??
          t.user?.email ??
          t.payer?.email ??
          t.member?.email ??
          t.email ??
          ""
        ).toLowerCase();
        return name.includes(q) || plan.includes(q) || email.includes(q);
      });
    }
    return [...list].sort((a, b) => {
      const ta = new Date(a.createdAt ?? a.date ?? 0).getTime();
      const tb = new Date(b.createdAt ?? b.date ?? 0).getTime();
      return sortDir === "desc" ? tb - ta : ta - tb;
    });
  }, [transactions, search, sortDir, memberNameMap]);

  // ── Recent activity — real audit-log feed (event/description/actor/result) ──
  const recentActivity = activity.list;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm text-gray-500">
          Couldn't load dashboard data. Please refresh.
        </p>
      </div>
    );
  }

  return (
    <>
      <main className="flex-1 px-4 md:px-6 py-5 overflow-y-auto">
        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-bold text-black">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              A full picture of your community's financial activity.
            </p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() =>
                navigate(`/dashboard/payments?community=${communityId ?? ""}`)
              }
              className="px-4 py-2 rounded text-xs font-medium text-black bg-white border border-[#efeff1] hover:bg-gray-50 transition-all cursor-pointer"
            >
              Create Payment Plan
            </button>
            <button
              onClick={() => setAddMemberOpen(true)}
              className="px-4 py-2 rounded text-xs font-medium text-white bg-brand flex items-center gap-1.5 hover:opacity-90 transition-all border-none cursor-pointer"
            >
              <Plus size={14} /> Add Member
            </button>
          </div>
        </div>

        {/* Getting started checklist — shown until both a plan and members exist */}
        {showGettingStarted && (
          <GettingStartedChecklist
            communityId={communityId}
            hasPlans={gsHasPlans}
            hasMembers={gsHasMembers}
            hasPayoutAccount={gsHasPayoutAccount}
            payoutAccountRejected={gsPayoutAccountRejected}
            payoutAccountPending={gsPayoutAccountPending}
            onDismiss={dismissGs}
            onAddMember={() => setAddMemberOpen(true)}
          />
        )}

        {/* Alert — paying admin with an unpaid obligation */}
        {isPaying &&
          alertVisible &&
          (() => {
            const dueList = myUpcoming.filter(
              (o) => (o.status ?? "").toUpperCase() !== "PAID",
            );
            const due = dueList[0];
            if (!due) return null;
            const othersDue = dueList.length - 1;
            const daysLeft = due.dueDate
              ? Math.ceil((new Date(due.dueDate) - new Date()) / 86400000)
              : null;
            return (
              <div className="flex items-start justify-between px-4 py-4 rounded-md mb-5 bg-[#D7E2FF] border border-blue-100">
                <div className="flex items-start gap-6">
                  <img
                    src={WarnSignIcon}
                    alt=""
                    className="w-[26px] h-[26px] object-contain flex-shrink-0 mt-1.5"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-gray-800">
                      Your {toTitleCase(due.name)} payment
                      {daysLeft != null
                        ? ` is due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
                        : " is due soon"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatNaira(due.amount)}
                      {due.dueDate
                        ? ` due ${new Date(due.dueDate).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}`
                        : ""}
                      {due.type === "recurring" && (
                        <>
                          {" · "}
                          <span className="text-brand font-medium">
                            Auto-Pay is {hasActiveAutoPay(due) ? "on" : "off"}
                          </span>
                        </>
                      )}
                    </p>
                    {othersDue > 0 && (
                      <p className="text-xs text-brand font-medium mt-1">
                        + {othersDue} other payment{othersDue === 1 ? "" : "s"} due
                        — see Your Payments below.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => handlePayMine(due)}
                    className="px-4 py-2 rounded-sm text-xs font-semibold text-brand border cursor-pointer"
                  >
                    Pay Now
                  </button>
                  <button
                    onClick={() => setAlertVisible(false)}
                    className="text-brand bg-transparent border-none cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            );
          })()}

        {/* Stats */}
        <DashboardStats stats={stats} isLoading={isLoading} />

        {/* Your Payments — paying admin's own dues in this community */}
        {isPaying && (
          <div
            className="bg-surface-container rounded-xl border border-surface-container-border p-5 mb-5 shadow-[0_1px_4px_rgba(0,47,167,0.05)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-black">
                Your Payments
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setMyPaymentsSort((d) => (d === "desc" ? "asc" : "desc"))
                  }
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 cursor-pointer"
                >
                  Sort
                  <ChevronDown
                    size={11}
                    className={myPaymentsSort === "asc" ? "rotate-180" : ""}
                  />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setMyPaymentsFilterOpen((o) => !o)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 cursor-pointer"
                  >
                    Filter <ChevronDown size={11} />
                  </button>
                  {myPaymentsFilterOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-surface-container-border shadow-lg z-20 min-w-[110px] overflow-hidden">
                      {[
                        { key: null, label: "All" },
                        { key: "unpaid", label: "Unpaid" },
                        { key: "paid", label: "Paid" },
                      ].map((opt) => (
                        <button
                          key={String(opt.key)}
                          onClick={() => {
                            setMyPaymentsFilter(opt.key);
                            setMyPaymentsFilterOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs cursor-pointer border-none ${
                            myPaymentsFilter === opt.key
                              ? "bg-blue-50 font-medium text-brand"
                              : "bg-transparent text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {myUpcomingFiltered.length === 0 ? (
              <EmptyState icon={Clock} title="Nothing due right now" className="py-4" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-[#F3F4F6]">
                      {[
                        "Plan",
                        "Frequency",
                        "Amount",
                        "Due Date",
                        "Status",
                        "Action",
                      ].map((h) => (
                        <th
                          key={h}
                          className="p-2 text-left text-xs font-normal text-gray-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myUpcomingFiltered.map((row) => {
                      const isPaid =
                        row.status === "PAID" || row.status === "SUCCESSFUL";
                      const s = statusStyle(isPaid ? "paid" : "unpaid");
                      const f = freqStyle(row);
                      return (
                        <tr key={row.id} className="border-b border-gray-50">
                          <td className="py-3 px-2 text-xs font-medium text-gray-800">
                            {toTitleCase(row.name)}
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${f.cls}`}
                            >
                              {f.label}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-xs text-black">
                            {formatNaira(row.amount)}
                          </td>
                          <td className="py-3 px-2 text-xs text-gray-500">
                            {row.dueDate
                              ? new Date(row.dueDate).toLocaleDateString(
                                  "en-NG",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}
                            >
                              {s.label}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            {isPaid ? (
                              <button
                                disabled
                                className="px-4 py-1.5 rounded text-xs font-semibold text-gray-300 border border-gray-200 bg-white cursor-not-allowed"
                              >
                                Pay Now
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePayMine(row)}
                                className="px-4 py-1.5 rounded text-xs font-semibold text-brand border border-brand bg-white hover:bg-blue-50 cursor-pointer transition-all"
                              >
                                Pay Now
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payment Plans + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
          {/* Payment Plans */}
          <div
            className="rounded-xl border border-surface-container-border p-4 bg-[#D7E2FF] shadow-[0_1px_4px_rgba(0,47,167,0.05)]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-black">
                Payment Plans
              </span>
              <button
                onClick={() =>
                  navigate(`/dashboard/payments?community=${communityId ?? ""}`)
                }
                className="text-xs font-medium text-brand bg-transparent border-none cursor-pointer hover:underline"
              >
                Manage All
              </button>
            </div>

            {plansLoading ? (
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : visiblePlans.length === 0 ? (
              <EmptyState icon={Wallet} title="No payment plans yet" className="py-6" />
            ) : (
              <div className="flex flex-col gap-3">
                {visiblePlans.map((p, idx) => {
                  const cm = planMetrics[p.id] ?? {};
                  const paidCount = cm.paidCount ?? p.paidCount ?? 0;
                  const totalCount =
                    cm.totalCount > 0
                      ? cm.totalCount
                      : p.totalCount > 0
                        ? p.totalCount
                        : members.total;
                  const collected = cm.collected ?? p.amountCollected ?? 0;
                  const expected =
                    p.amount > 0 && totalCount > 0
                      ? p.amount * totalCount
                      : (p.expectedAmount ?? 0);
                  const pct =
                    expected > 0
                      ? Math.min(100, Math.round((collected / expected) * 100))
                      : 0;
                  const BAR_COLOR_CLASSES = [
                    "bg-[#d4a017]",
                    "bg-[#7c3aed]",
                    "bg-[#099DA8]",
                    "bg-[#059669]",
                    "bg-brand",
                    "bg-[#e11d48]",
                  ];
                  const barColorCls = BAR_COLOR_CLASSES[idx % BAR_COLOR_CLASSES.length];
                  return (
                    <div
                      key={p.id}
                      className="bg-surface-container rounded-xl p-4 border border-blue-100/60"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium text-black truncate">
                            {toTitleCase(p.name)}
                          </span>
                          <span className="text-[10px] font-normal px-2 py-0.5 rounded-full flex-shrink-0 text-[#7c3aed] bg-[#f3eeff]">
                            {p.frequency ?? p.type ?? "—"}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-800 flex-shrink-0 ml-2">
                          {formatNaira(p.amount)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mb-2">
                        {paidCount} / {totalCount} members paid
                      </p>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColorCls}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 text-right mt-1">
                        {pct}% Collected
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div
            className="bg-surface-container rounded-xl border border-surface-container-border p-4 shadow-[0_1px_4px_rgba(0,47,167,0.05)]"
          >
            <span className="text-sm font-medium text-black block mb-4">
              Recent Activity
            </span>

            {activity.isLoading ? (
              <div className="flex flex-col gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-3 w-3/4 mb-1.5" />
                      <Skeleton className="h-2.5 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <EmptyState icon={Activity} title="No recent activity" className="py-6" />
            ) : (
              recentActivity.map((a, i) => {
                const event = a.event ?? "";
                const failed = a.result === "FAILED";
                const isPmt = event.includes("PAYMENT");
                const aColor = failed
                  ? "#e11d48"
                  : isPmt
                    ? "#059669"
                    : "var(--color-brand)";
                const aBgCls = failed ? "bg-[#fff1f2]" : isPmt ? "bg-[#ecfdf5]" : "bg-brand-tint";
                const type = isPmt
                  ? "payment"
                  : event.includes("MEMBER")
                    ? "member"
                    : undefined;
                const actorName = toTitleCase(
                  [a.actor?.firstName, a.actor?.lastName]
                    .filter(Boolean)
                    .join(" "),
                );
                return (
                  <div
                    key={a.id ?? i}
                    className={`flex items-start gap-3 py-3 ${i < recentActivity.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center ${aBgCls}`}
                    >
                      <ActivityIcon type={type} color={aColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {actorName && !a.description?.startsWith(actorName) && (
                          <strong className="text-brand font-semibold">
                            {actorName}{" "}
                          </strong>
                        )}
                        {a.description ??
                          event.replaceAll("_", " ").toLowerCase() ??
                          "activity"}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="#9ca3af"
                            strokeWidth="1.8"
                          />
                          <path
                            d="M12 6v6l4 2"
                            stroke="#9ca3af"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="text-[11px] text-gray-400">
                          {timeAgo(a.occurredAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Member Payments table */}
        <div
          className="bg-surface-container rounded-xl border border-surface-container-border shadow-[0_1px_4px_rgba(0,47,167,0.05)]"
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-0">
            <span className="text-sm font-medium">Member Payments</span>
            <button
              onClick={() =>
                runExport(() =>
                  exportCommunityTransactions(communityId, {}, "CSV"),
                )
              }
              disabled={isExporting || !communityId}
              title="Export all transactions for this community as CSV"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-xs text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={12} /> {isExporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3 gap-2">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-surface-container-border w-full sm:flex-1 sm:min-w-0 sm:max-w-xs">
              <Search size={12} className="text-gray-400 flex-shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members, payments, receipts..."
                className="flex-1 bg-transparent border-none outline-none text-xs text-gray-600 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs self-end sm:self-auto">
              Sort by:
              <button
                onClick={() =>
                  setSortDir((d) => (d === "desc" ? "asc" : "desc"))
                }
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-500 bg-white font-medium text-gray-500 cursor-pointer hover:bg-gray-50"
              >
                {sortDir === "desc" ? "Recent" : "Oldest"}{" "}
                <ChevronDown
                  size={11}
                  className={sortDir === "asc" ? "rotate-180" : ""}
                />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-y border-hairline bg-[#F9F9FB]">
                  <th className="px-5 py-2.5 text-left text-xs font-normal text-gray-400 whitespace-nowrap">
                    Member
                  </th>
                  <th className="px-5 py-2.5 text-left text-xs font-normal text-gray-400 whitespace-nowrap">
                    Plan
                  </th>
                  <th className="px-5 py-2.5 text-left text-xs font-normal text-gray-400 whitespace-nowrap">
                    Amount
                  </th>
                  <th className="hidden md:table-cell px-5 py-2.5 text-left text-xs font-normal text-gray-400 whitespace-nowrap">
                    Date
                  </th>
                  <th className="hidden lg:table-cell px-5 py-2.5 text-left text-xs font-normal text-gray-400 whitespace-nowrap">
                    Email
                  </th>
                  <th className="px-5 py-2.5 text-left text-xs font-normal text-gray-400 whitespace-nowrap">
                    Status
                  </th>
                  <th className="hidden sm:table-cell px-5 py-2.5 text-left text-xs font-normal text-gray-400 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#f3f4f8]">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-5 py-3">
                          <Skeleton className="h-3 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState icon={Receipt} title="No transactions found" className="py-10" />
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx, i) => {
                    const s = statusStyle(tx.status ?? "pending");
                    const isPaid = ["success", "successful", "paid"].includes(
                      (tx.status ?? "").toLowerCase(),
                    );
                    return (
                      <tr
                        key={tx.id ?? i}
                        onClick={() =>
                          tx.id &&
                          navigate(`/dashboard/transactions/${tx.id}?community=${communityId ?? ""}`)
                        }
                        className={`border-b border-[#f3f4f8] hover:bg-[#fafbff] transition-colors ${tx.id ? "cursor-pointer" : "cursor-default"}`}
                      >
                        <td className="px-5 py-3 text-xs font-medium text-brand">
                          {resolveMemberName(tx) ??
                            tx.member?.user?.email ??
                            tx.user?.email ??
                            tx.email ??
                            "—"}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#d4a017]" />
                            <span className="text-xs text-black">
                              {toTitleCase(tx.planName ?? tx.description) ??
                                "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-black">
                          {formatNaira(tx.amount)}
                        </td>
                        <td className="hidden md:table-cell px-5 py-3 text-xs text-black">
                          {formatDate(tx.paidAt ?? tx.createdAt)}
                        </td>
                        <td className="hidden lg:table-cell px-5 py-3 text-xs text-black">
                          {tx.member?.user?.email ??
                            tx.user?.email ??
                            tx.payer?.email ??
                            tx.member?.email ??
                            tx.email ??
                            "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}
                          >
                            {s.label}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell px-5 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <ReceiptDownloadButton
                              tx={{
                                amount: tx.amount,
                                description: tx.planName ?? tx.description,
                                communityName: community?.name,
                                communityLogo: community?.logo,
                                date: tx.paidAt ?? tx.createdAt,
                                channel: tx.channel,
                                reference: tx.internalReference ?? tx.id,
                                status: tx.status,
                                payerPhoto: tx.member?.profileImage?.url ?? tx.user?.profileImage?.url ?? null,
                                feeMinor:
                                  tx.feeMinor ??
                                  tx.fee ??
                                  (tx.amountPaid != null && tx.amount != null && tx.amountPaid > tx.amount
                                    ? tx.amountPaid - tx.amount
                                    : null),
                              }}
                              payerName={resolveMemberName(tx)}
                              payerEmail={tx.member?.user?.email ?? tx.user?.email ?? tx.email}
                              disabled={!isPaid}
                              iconSize={11}
                              title={isPaid ? "Download receipt" : "Receipts are only available for successful payments"}
                              buttonClassName={`w-7 h-7 rounded-full border border-[#e0e3f0] bg-white flex items-center justify-center ${isPaid ? "text-gray-500 hover:bg-gray-50 cursor-pointer" : "text-gray-300 cursor-not-allowed opacity-40"}`}
                            />
                            <button
                              disabled
                              title="Send reminder — coming soon"
                              className="w-7 h-7 rounded-full border border-[#e0e3f0] bg-white flex items-center justify-center cursor-not-allowed opacity-40"
                            >
                              <img
                                src={TimerIcon}
                                className="w-2.5 h-2.5 object-contain"
                                alt="Send reminder"
                              />
                            </button>
                            <button
                              disabled
                              title="More options — coming soon"
                              className="w-7 h-7 rounded-full border border-[#e0e3f0] bg-white flex items-center justify-center text-gray-400 cursor-not-allowed opacity-40"
                            >
                              <MoreHorizontal size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Payment confirmation modal */}
      {payingItem && (
        <AdminPaymentModal
          item={payingItem}
          onClose={() => setPayingItem(null)}
        />
      )}

      {/* Add member modal */}
      {addMemberOpen && (
        <AddMemberModal
          communityId={communityId}
          communitySlug={community?.slug}
          onClose={() => setAddMemberOpen(false)}
        />
      )}
    </>
  );
}

// ── Exports ───────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [searchParams] = useSearchParams();
  // Read communityId from URL ?community= or fall back to localStorage
  const communityId =
    searchParams.get("community") ??
    (() => {
      try {
        return (
          JSON.parse(localStorage.getItem("glass_community") ?? "{}").slug ??
          JSON.parse(localStorage.getItem("glass_community") ?? "{}").id ??
          null
        );
      } catch {
        return null;
      }
    })();

  return <DashboardContent isPaying={false} communityId={communityId} />;
}

export function PayingAdminDashboard() {
  const [searchParams] = useSearchParams();
  const communityId =
    searchParams.get("community") ??
    (() => {
      try {
        return (
          JSON.parse(localStorage.getItem("glass_community") ?? "{}").slug ??
          JSON.parse(localStorage.getItem("glass_community") ?? "{}").id ??
          null
        );
      } catch {
        return null;
      }
    })();

  return <DashboardContent isPaying={true} communityId={communityId} />;
}
