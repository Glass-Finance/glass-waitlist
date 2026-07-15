import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UserMinus, Phone, MessageCircle, CreditCard, Receipt } from "lucide-react";
import { useActiveCommunityId } from "../../hooks/useActiveCommunityId";
import { useMembersWithPayments, useMemberPaymentLinks } from "../../hooks/useMembersWithPayments";
import { useCommunityMembers } from "../../hooks/useCommunityMembers";
import { useCommunity } from "../../hooks/useCommunity";
import ReceiptDownloadButton from "../../components/common/ReceiptDownloadButton";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import Background from "../../assets/background.webp";
import { formatNaira, formatDate, toTitleCase } from "../../utils/format";

const TABS = ["All Plans", "Payment History", "Contact Details"];

function memberName(m) {
  if (!m) return "Member";
  if (m.name) return toTitleCase(m.name);
  const first = m.user?.firstName ?? m.firstName ?? "";
  const last = m.user?.lastName ?? m.lastName ?? "";
  return toTitleCase(`${first} ${last}`.trim() || m.user?.email || m.email || "Member");
}
const memberEmail = (m) => m?.user?.email ?? m?.email ?? "—";
const memberPhone = (m) => m?.user?.phoneNumber ?? m?.phoneNumber ?? "—";

function StatCard({ label, value }) {
  return (
    <div className="bg-surface-container rounded-xl border border-gray-100 px-4 py-3" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-[13px] font-semibold text-black">{value}</p>
    </div>
  );
}

function PlanCard({ plan, successfulLinkIds }) {
  const isRecurring = !!plan.recurringPlan;
  const s = (plan.status ?? "").toUpperCase();
  const isPaid =
    s === "PAID" ||
    s === "SUCCESSFUL" ||
    (!!plan.paymentLink?.id && successfulLinkIds?.has(plan.paymentLink.id));
  return (
    <div className="bg-surface-container rounded-md border border-gray-100 p-4" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-black pt-0.5">{plan.paymentLink?.title ?? "Plan"}</p>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ color: isPaid ? "#059669" : "#e11d48", background: isPaid ? "#ecfdf5" : "#fff1f2" }}>
          {isPaid ? "Paid" : "Unpaid"}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-md font-semibold text-gray-900">{formatNaira(plan.amount)}</span>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: "#7c3aed", background: "#f3eeff" }}>
          {isRecurring ? plan.recurringPlan?.frequency ?? "Recurring" : "One-Time"}
        </span>
      </div>
      <p className="text-xs text-gray-400">
        Joined {formatDate(plan.cycleStart)} · Due {formatDate(plan.dueAt)}
      </p>
    </div>
  );
}

export default function MemberDetail() {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const communityId = useActiveCommunityId();
  const [tab, setTab] = useState("All Plans");

  const { members, isLoading } = useMembersWithPayments(communityId);
  const { removeMember } = useCommunityMembers(communityId);
  const { data: community } = useCommunity(communityId);
  const member = members.find((m) => String(m.id) === String(memberId));
  // Audience-aware: only the payment links that actually target this member
  // (ALL_MEMBERS, their group, or explicit selection), unlike planCount on
  // `member` above which assumes every active community plan applies to
  // every member.
  const { paymentLinks: memberPaymentLinks } = useMemberPaymentLinks(communityId, member?.id);

  function handleRemove() {
    if (!member) return;
    if (!window.confirm(`Remove ${memberName(member)} from this community?`)) return;
    removeMember.mutate(member.id, {
      onSuccess: () => navigate(`/dashboard/members?community=${communityId}`),
    });
  }

  // Loading/not-found states share the same page background as the
  // fully-loaded page below -- returning early with a bare white background
  // caused a visible flash before the textured background popped in.
  const pageBgStyle = {
    backgroundImage: `url(${Background})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  if (isLoading) {
    return (
      <div className="px-4 md:px-6 py-6 h-full" style={pageBgStyle}>
        <LoadingState className="py-6" />
      </div>
    );
  }
  if (!member) {
    return (
      <div className="px-4 md:px-6 py-6 h-full" style={pageBgStyle}>
        <p className="text-xs text-gray-400">Member not found.</p>
      </div>
    );
  }

  const successStatuses = new Set(["SUCCESS", "SUCCESSFUL", "PAID"]);
  const successfulTxs = member.transactions.filter((t) =>
    successStatuses.has((t.status ?? "").toUpperCase())
  );
  const totalPaid = successfulTxs.reduce((sum, t) => sum + (t.amount ?? t.amountPaid ?? 0), 0);

  // Payment link IDs that have at least one successful transaction —
  // used to show plan cards as Paid when the backend hasn't updated obligation.status
  const successfulLinkIds = new Set(
    successfulTxs.map((t) => t.paymentLink?.id).filter(Boolean)
  );

  // Distinct plans (one card per payment link, latest obligation for that
  // link). Obligations carry the per-cycle amount/due-date/paid-status, but
  // lag behind plan creation, so any ACTIVE payment link that actually
  // targets this member (per the audience-aware memberId-filtered fetch
  // above) and has no obligation yet still gets a card — synthesized
  // directly from the payment link, shown as Unpaid until an obligation or
  // transaction says otherwise.
  const obligationsByLinkId = new Map(member.obligations.map((o) => [o.paymentLink?.id, o]));
  const syntheticPlans = memberPaymentLinks
    .filter((link) => (link.status ?? "").toUpperCase() === "ACTIVE" && !obligationsByLinkId.has(link.id))
    .map((link) => ({
      id: link.id,
      paymentLink: { id: link.id, title: link.title },
      amount: link.amount,
      status: undefined,
      recurringPlan: link.recurringPlan,
      cycleStart: link.startAt,
      dueAt: link.dueAt,
    }));
  const distinctPlans = [...obligationsByLinkId.values(), ...syntheticPlans];

  return (
    <div
      className="px-4 md:px-6 py-6 overflow-y-auto h-full"
      style={pageBgStyle}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-bold text-black">
            <button
              onClick={() => navigate(`/dashboard/members?community=${communityId}`)}
              className="text-gray-400 font-medium bg-transparent border-none p-0 cursor-pointer hover:text-gray-600 hover:underline"
            >
              Members
            </button>
            <span className="text-gray-300 mx-1">›</span> {memberName(member)}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">A full picture of the members of your community</p>
        </div>
        <button
          onClick={handleRemove}
          disabled={removeMember.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-medium text-white hover:opacity-90 transition-all border-none cursor-pointer disabled:opacity-50"
          style={{ background: "#E53E3E" }}
        >
          <UserMinus size={14} /> Remove Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Amount Paid" value={formatNaira(totalPaid)} />
        <StatCard label="Active Plans" value={String(distinctPlans.length)} />
        <StatCard label="Plans Yet to pay" value={String(member.totalCount - member.paidCount)} />
        <StatCard label="Failed Payments" value={String(member.failedCount)} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-stacked-container rounded-md p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-[13px] rounded transition-all cursor-pointer border-none font-medium ${tab === t ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-800"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "All Plans" && (
        distinctPlans.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No plans assigned yet"
            subtitle="This member isn't enrolled in any payment plans in this community yet."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {distinctPlans.map((plan) => <PlanCard key={plan.id} plan={plan} successfulLinkIds={successfulLinkIds} />)}
          </div>
        )
      )}

      {tab === "Payment History" && (
        <div className="bg-surface-container rounded-xl border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm font-medium text-black">Member Payments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-y border-gray-100">
                  {["Plan", "Amount", "Status", "Method", "Date", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {member.transactions.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState icon={Receipt} title="No payments yet" subtitle="This member's payment history will show up here once they make their first payment." /></td></tr>
                ) : (
                  member.transactions.map((t) => {
                    const statusLabel = (t.status ?? "pending").charAt(0).toUpperCase() + (t.status ?? "pending").slice(1).toLowerCase();
                    const isPaid = ["success", "successful", "paid"].includes(statusLabel.toLowerCase());
                    return (
                      <tr key={t.id} className="border-b border-gray-50">
                        <td className="px-5 py-3 text-sm font-medium text-black">{t.paymentLink?.title ?? t.description ?? "—"}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">{formatNaira(t.amount)}</td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: isPaid ? "#059669" : "#dc2626", background: isPaid ? "#ecfdf5" : "#fff1f2" }}>
                            {isPaid ? "Paid" : statusLabel}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500">{t.channel ?? "—"}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{formatDate(t.paidAt ?? t.createdAt)}</td>
                        <td className="px-5 py-3">
                          <ReceiptDownloadButton
                            tx={{
                              amount: t.amount,
                              description: t.paymentLink?.title ?? t.description,
                              communityName: community?.name,
                              date: t.paidAt ?? t.createdAt,
                              channel: t.channel,
                              reference: t.internalReference ?? t.id,
                              status: t.status,
                            }}
                            payerName={memberName(member)}
                            disabled={!isPaid}
                            iconSize={11}
                            title={isPaid ? "Download receipt" : "Receipts are only available for successful payments"}
                            buttonClassName={`w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center ${isPaid ? "text-gray-500 hover:bg-gray-50 cursor-pointer" : "text-gray-300 cursor-not-allowed"}`}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Contact Details" && (
        <div className="bg-surface-container rounded-xl border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-y border-gray-100">
                  {["Name", "Phone", "Email", "Date Joined", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-5 py-3 text-sm font-semibold text-[#002FA7]">{memberName(member)}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{memberPhone(member)}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{memberEmail(member)}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{formatDate(member.joinedAt ?? member.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      <a href={`tel:${memberPhone(member)}`} title="Call" className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50"><Phone size={11} /></a>
                      <a href={`mailto:${memberEmail(member)}`} title="Message" className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50"><MessageCircle size={11} /></a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
