import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus, AlertCircle } from "lucide-react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useCommunityDashboard } from "../../hooks/useCommunityDashboard";
import { usePaymentPlans } from "../../hooks/usePaymentPlans";
import { useCommunityAccount } from "../../hooks/useCommunityAccount";
import {
  usePayments,
  useManagePayments,
  usePendingPaymentVerification,
} from "../../hooks/usePayments";
import { useExportJob } from "../../hooks/useExportJob";
import { exportCommunityTransactions } from "../../api/exports";
import totalMembersIcon from "../../assets/dashboard/tdesign-member.webp";
import inactiveMembersIcon from "../../assets/dashboard/inactive-members.webp";
import totalContribIcon from "../../assets/dashboard/tcontributions.webp";
import activePlansIcon from "../../assets/dashboard/active-plans.webp";
import { formatNaira } from "./admin-dashboard/helpers";
import { AdminPaymentModal } from "../../components/dashboard/AdminPaymentModal";
import AddMemberModal from "./admin-dashboard/AddMemberModal";
import GettingStartedChecklist from "./admin-dashboard/sections/GettingStartedChecklist";
import DashboardStats from "./admin-dashboard/sections/DashboardStats";
import UnpaidObligationAlert from "./admin-dashboard/sections/UnpaidObligationAlert";
import YourPaymentsSection from "./admin-dashboard/sections/YourPaymentsSection";
import PaymentPlansCard from "./admin-dashboard/sections/PaymentPlansCard";
import RecentActivityCard from "./admin-dashboard/sections/RecentActivityCard";
import MemberPaymentsSection from "./admin-dashboard/sections/MemberPaymentsSection";

function DashboardContent({ isPaying, communityId }) {
  usePageTitle("Community Dashboard");
  const navigate = useNavigate();
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
        {isPaying && alertVisible && (
          <UnpaidObligationAlert
            myUpcoming={myUpcoming}
            onPayNow={handlePayMine}
            onDismiss={() => setAlertVisible(false)}
            hasActiveAutoPay={hasActiveAutoPay}
          />
        )}

        {/* Stats */}
        <DashboardStats stats={stats} isLoading={isLoading} />

        {/* Your Payments — paying admin's own dues in this community */}
        {isPaying && (
          <YourPaymentsSection
            rows={myUpcomingFiltered}
            sortDir={myPaymentsSort}
            onToggleSort={() =>
              setMyPaymentsSort((d) => (d === "desc" ? "asc" : "desc"))
            }
            filter={myPaymentsFilter}
            filterOpen={myPaymentsFilterOpen}
            onToggleFilterOpen={() => setMyPaymentsFilterOpen((o) => !o)}
            onFilterSelect={(key) => {
              setMyPaymentsFilter(key);
              setMyPaymentsFilterOpen(false);
            }}
            onPayNow={handlePayMine}
          />
        )}

        {/* Payment Plans + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
          <PaymentPlansCard
            plans={visiblePlans}
            plansLoading={plansLoading}
            planMetrics={planMetrics}
            membersTotal={members.total}
            onManageAll={() =>
              navigate(`/dashboard/payments?community=${communityId ?? ""}`)
            }
          />
          <RecentActivityCard
            isLoading={activity.isLoading}
            items={recentActivity}
          />
        </div>

        {/* Member Payments table */}
        <MemberPaymentsSection
          transactions={filteredTransactions}
          isLoading={isLoading}
          search={search}
          onSearchChange={setSearch}
          sortDir={sortDir}
          onToggleSort={() =>
            setSortDir((d) => (d === "desc" ? "asc" : "desc"))
          }
          onExport={() =>
            runExport(() => exportCommunityTransactions(communityId, {}, "CSV"))
          }
          isExporting={isExporting}
          communityId={communityId}
          resolveMemberName={resolveMemberName}
          community={community}
          onRowClick={(txId) =>
            navigate(`/dashboard/transactions/${txId}?community=${communityId ?? ""}`)
          }
        />
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
