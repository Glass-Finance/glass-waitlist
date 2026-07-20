import { useMemo, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useQuery } from "@tanstack/react-query";
import { Plus, Wallet, ListChecks, Clock, XCircle } from "lucide-react";
import { useActiveCommunityId } from "../../hooks/useActiveCommunityId";
import { usePaymentPlans } from "../../hooks/usePaymentPlans";
import { getErrorMessage, notifyError } from "../../utils/errorHandler";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import StatCard from "../../components/dashboard/StatCard";
import { formatNaira } from "../../utils/format";
import {
  getCommunityObligations,
  getCommunityTransactions,
} from "../../api/transactions";
import { TABS, BAR_COLOR_CLASSES } from "./payments/constants";
import CreatePlanModal from "./payments/CreatePlanModal";
import EditPlanModal from "./payments/EditPlanModal";
import SendReminderModal from "./payments/SendReminderModal";
import PlanMembersModal from "./payments/PlanMembersModal";
import DuplicatePlanModal from "./payments/DuplicatePlanModal";
import PlanCard from "./payments/PlanCard";

export default function Payments() {
  usePageTitle("Payments");
  const communityId = useActiveCommunityId();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [viewingMembersPlan, setViewingMembersPlan] = useState(null);
  const [remindingPlan, setRemindingPlan] = useState(null);
  const [duplicatingPlan, setDuplicatingPlan] = useState(null);
  const [tab, setTab] = useState("All Plans");

  const planPlans = usePaymentPlans(communityId);
  const { plans, isLoading: plansLoading } = planPlans;

  // Obligations — who is enrolled in each plan and whether they've paid
  const { data: obligations = [] } = useQuery({
    queryKey: ["community", communityId, "obligations"],
    queryFn: async () => {
      const res = await getCommunityObligations(communityId);
      const data = res.data?.data;
      return Array.isArray(data) ? data : (data?.content ?? []);
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: "always",
  });

  // Transactions — actual amounts collected per plan
  const { data: transactions = [] } = useQuery({
    queryKey: ["community", communityId, "transactions"],
    queryFn: async () => {
      const res = await getCommunityTransactions(communityId);
      const data = res.data?.data;
      return Array.isArray(data) ? data : (data?.content ?? []);
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: "always",
  });

  const planMetrics = useMemo(() => {
    const SUCCESS = new Set(["SUCCESS", "SUCCESSFUL", "PAID"]);

    // The backend doesn't always update obligation.status to PAID
    // immediately after a payment is verified — cross-reference successful
    // transactions too, so paidCount doesn't lag behind collected.
    const paidObligationIds = new Set();
    const paidLinkMemberKeys = new Set(); // `${paymentLinkId}::${memberId}`, for txs with no obligationId
    for (const tx of transactions) {
      if (!SUCCESS.has((tx.status ?? "").toUpperCase())) continue;
      if (tx.obligationId) paidObligationIds.add(String(tx.obligationId));
      const planId = tx.paymentLink?.id;
      const mid = String(
        tx.member?.id ?? tx.member?.user?.id ?? tx.user?.id ?? "",
      );
      if (planId && mid) paidLinkMemberKeys.add(`${planId}::${mid}`);
    }

    const byPlan = {};

    // Track paid members as a unique-member set (paidMemberIds), not a
    // running counter — a member with 2 paid obligations on the same
    // recurring plan (e.g. 2 past cycles) is still only 1 paid member.
    // This is what was causing "2/1 members paid": paidCount was
    // incrementing per obligation while totalCount stayed unique-member.
    for (const ob of obligations) {
      const planId = ob.paymentLink?.id;
      if (!planId) continue;
      if (!byPlan[planId])
        byPlan[planId] = {
          collected: 0,
          memberIds: new Set(),
          paidMemberIds: new Set(),
        };
      const mid = String(
        ob.member?.id ?? ob.member?.user?.id ?? ob.user?.id ?? ob.id ?? "",
      );
      if (mid) byPlan[planId].memberIds.add(mid);
      const s = (ob.status ?? "").toUpperCase();
      const isPaid =
        s === "PAID" ||
        s === "SUCCESSFUL" ||
        paidObligationIds.has(String(ob.id)) ||
        (planId && mid && paidLinkMemberKeys.has(`${planId}::${mid}`));
      if (isPaid && mid) byPlan[planId].paidMemberIds.add(mid);
    }

    // A member can end up with multiple SUCCESSFUL transaction rows for the
    // same plan — a known bug where payment initiation doesn't always send a
    // real obligationId, so the backend can't recognize an existing obligation
    // and lets the member pay again on retry. Each row is a genuine charge, but
    // for display purposes a member should only ever be counted once toward
    // "collected" for a given plan — otherwise a single member's repeat
    // payments can make collected exceed what's even possible for the plan.
    const countedPlanMemberPayments = new Set(); // `${planId}::${memberId}`
    for (const tx of transactions) {
      const planId = tx.paymentLink?.id;
      if (!planId) continue;
      if (!byPlan[planId])
        byPlan[planId] = {
          collected: 0,
          memberIds: new Set(),
          paidMemberIds: new Set(),
        };
      if (!SUCCESS.has((tx.status ?? "").toUpperCase())) continue;

      const mid = String(
        tx.member?.id ?? tx.member?.user?.id ?? tx.user?.id ?? "",
      );
      const dedupeKey = mid ? `${planId}::${mid}` : `${planId}::${tx.id}`;
      if (countedPlanMemberPayments.has(dedupeKey)) continue;
      countedPlanMemberPayments.add(dedupeKey);

      byPlan[planId].collected += tx.amount ?? 0;
    }

    const result = {};
    for (const [id, m] of Object.entries(byPlan)) {
      result[id] = {
        collected: m.collected,
        paidCount: m.paidMemberIds.size,
        totalCount: m.memberIds.size,
      };
    }

    return result;
  }, [obligations, transactions]);

  const filtered = useMemo(() => {
    if (tab === "Recurring") return plans.filter((p) => p.type === "RECURRING");
    if (tab === "One Time") return plans.filter((p) => p.type !== "RECURRING");
    return plans;
  }, [plans, tab]);

  const stats = useMemo(
    () => ({
      // Use computed collected from transactions (list endpoint metrics are empty)
      collected: Object.values(planMetrics).reduce(
        (sum, m) => sum + (m.collected ?? 0),
        0,
      ),
      active: plans.filter((p) => p.status === "ACTIVE").length,
      yetToPay: plans.reduce((sum, p) => {
        const cm = planMetrics[p.id] ?? {};
        const total = cm.totalCount ?? 0;
        const paid = cm.paidCount ?? 0;
        return sum + Math.max(0, total - paid);
      }, 0),
      failed: plans.filter((p) => p.status === "EXPIRED").length,
    }),
    [plans, planMetrics],
  );

  async function handleCreate(payload) {
    try {
      await planPlans.create.mutateAsync(payload);
      return true;
    } catch (err) {
      notifyError(err, { context: "Create payment plan" });
      return false;
    }
  }

  async function handleSaveEdit(paymentLinkId, payload) {
    try {
      await planPlans.update.mutateAsync({ paymentLinkId, payload });
      setEditingPlan(null);
    } catch (err) {
      notifyError(err, { context: "Update payment plan" });
    }
  }

  async function handleSendReminder(payload) {
    try {
      await planPlans.sendReminder.mutateAsync({
        paymentLinkId: remindingPlan.id,
        payload,
      });
      setRemindingPlan(null);
    } catch (err) {
      notifyError(err, { context: "Send reminder" });
    }
  }

  async function handleDuplicate(paymentLinkId, payload) {
    try {
      await planPlans.duplicate.mutateAsync({ paymentLinkId, payload });
      setDuplicatingPlan(null);
    } catch (err) {
      notifyError(err, { context: "Duplicate payment plan" });
    }
  }

  return (
    <div className="px-4 md:px-6 py-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-black">Payments</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            A full picture of all payments created in your community.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 rounded text-xs font-medium text-white bg-brand flex items-center gap-1.5 hover:opacity-90 transition-all border-none cursor-pointer"
        >
          <Plus size={13} /> Create Payment Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard
          icon={Wallet}
          label="Total Amount Collected"
          value={formatNaira(stats.collected)}
          iconCls="text-brand bg-brand-tint"
        />
        <StatCard
          icon={ListChecks}
          label="Active Plans"
          value={String(stats.active)}
          iconCls="text-success bg-success-tint"
        />
        <StatCard
          icon={Clock}
          label="Yet to pay"
          value={String(stats.yetToPay)}
          iconCls="text-[#b45309] bg-[#FFF8E7]"
        />
        <StatCard
          icon={XCircle}
          label="Failed Payments"
          value={String(stats.failed)}
          iconCls="text-danger bg-danger-tint"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-stacked-container rounded-md p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs rounded transition-all cursor-pointer border-none font-medium
              ${tab === t ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-800"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      {plansLoading ? (
        <LoadingState className="py-10" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wallet} title="No payment plans yet" className="py-10" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              planPlans={planPlans}
              barColorCls={BAR_COLOR_CLASSES[i % BAR_COLOR_CLASSES.length]}
              onEdit={setEditingPlan}
              onViewMembers={setViewingMembersPlan}
              onSendReminder={setRemindingPlan}
              onDuplicate={setDuplicatingPlan}
              metrics={planMetrics[plan.id]}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {createOpen && (
        <CreatePlanModal
          communityId={communityId}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
          creating={planPlans.create.isPending}
          createError={
            planPlans.create.error
              ? getErrorMessage(planPlans.create.error)
              : null
          }
        />
      )}
      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          communityId={communityId}
          onClose={() => setEditingPlan(null)}
          onSave={handleSaveEdit}
          saving={planPlans.update.isPending}
        />
      )}
      {viewingMembersPlan && (
        <PlanMembersModal
          plan={viewingMembersPlan}
          communityId={communityId}
          onClose={() => setViewingMembersPlan(null)}
        />
      )}
      {remindingPlan && (
        <SendReminderModal
          plan={remindingPlan}
          onClose={() => setRemindingPlan(null)}
          onSend={handleSendReminder}
          sending={planPlans.sendReminder.isPending}
        />
      )}
      {duplicatingPlan && (
        <DuplicatePlanModal
          plan={duplicatingPlan}
          onClose={() => setDuplicatingPlan(null)}
          onDuplicate={handleDuplicate}
          duplicating={planPlans.duplicate.isPending}
        />
      )}
    </div>
  );
}
