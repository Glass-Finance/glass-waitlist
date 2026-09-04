import { useMemo, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { Plus, Wallet, ListChecks, Clock, XCircle } from "lucide-react";
import { useActiveCommunityId } from "../../hooks/useActiveCommunityId";
import { usePaymentPlans } from "../../hooks/usePaymentPlans";
import { getErrorMessage, notifyError } from "../../utils/errorHandler";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import SuccessBadge from "../../components/common/SuccessBadge";
import PaymentPlanIllustration from "./admin-dashboard/sections/PaymentPlanIllustration";
import StatCard from "../../components/dashboard/StatCard";
import { formatNaira } from "../../utils/format";
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
  const [successMessage, setSuccessMessage] = useState(null);
  const [tab, setTab] = useState("All Plans");

  function flashSuccess(message) {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 1800);
  }

  const planPlans = usePaymentPlans(communityId);
  const { plans, isLoading: plansLoading, error: plansError } = planPlans;
  // Per the Figma empty state (mirrors Members.jsx's same fix): the page
  // header and tabs don't show at all when there are no plans yet at all --
  // distinct from filtered.length === 0 below, which is just the current
  // tab filter matching nothing and still needs the header/tabs to change it.
  const isEmpty = !plansLoading && !plansError && plans.length === 0;

  const filtered = useMemo(() => {
    if (tab === "Recurring") return plans.filter((p) => p.type === "RECURRING");
    if (tab === "One Time") return plans.filter((p) => p.type !== "RECURRING");
    return plans;
  }, [plans, tab]);

  const stats = useMemo(
    () => ({
      collected: plans.reduce(
        (sum, plan) => sum + (plan.amountCollected ?? 0),
        0,
      ),
      active: plans.filter((p) => p.status === "ACTIVE").length,
      yetToPay: plans.reduce((sum, plan) => sum + (plan.unpaidCount ?? 0), 0),
      failed: plans.filter((p) => p.status === "EXPIRED").length,
    }),
    [plans],
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
      flashSuccess("Plan Updated!");
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
      flashSuccess("Reminder Sent!");
    } catch (err) {
      notifyError(err, { context: "Send reminder" });
    }
  }

  async function handleDuplicate(paymentLinkId, payload) {
    try {
      await planPlans.duplicate.mutateAsync({ paymentLinkId, payload });
      setDuplicatingPlan(null);
      flashSuccess("Plan Duplicated!");
    } catch (err) {
      notifyError(err, { context: "Duplicate payment plan" });
    }
  }

  return (
    <div className="px-4 md:px-6 py-6 overflow-y-auto h-full">
      {/* Header */}
      {!isEmpty && (
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
      )}

      {/* Stats -- only when there are plans (mirrors Members.jsx's same
          fix). auto-fit/minmax rather than a fixed 2/lg:4 breakpoint, so
          "Total Amount Collected" (the longest label) doesn't wrap onto two
          lines the moment the row is squeezed to 4-across; see
          DashboardStats.jsx for the same fix on the Dashboard page's row. */}
      {plans.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3 mb-5">
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
      )}

      {/* Tabs */}
      {!isEmpty && (
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
      )}

      {/* Plan cards */}
      {plansLoading ? (
        <LoadingState className="py-10" />
      ) : plans.length === 0 ? (
        <EmptyState
          illustrationNode={<PaymentPlanIllustration />}
          title="No payment plans yet"
          subtitle="Create your first payment plan to start collecting dues from your members."
          action={() => setCreateOpen(true)}
          actionLabel={
            <>
              <Plus size={14} /> Create Collection
            </>
          }
          className="py-10"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No plans match this filter"
          className="py-10"
        />
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

      {successMessage && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/20">
          <div className="bg-surface-bg rounded-2xl p-8 shadow-2xl">
            <SuccessBadge message={successMessage} />
          </div>
        </div>
      )}
    </div>
  );
}
