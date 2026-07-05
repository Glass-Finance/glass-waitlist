import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, UserMinus, Phone, MessageCircle, Download } from "lucide-react";
import { useActiveCommunityId } from "../../hooks/useActiveCommunityId";
import { useMembersWithPayments } from "../../hooks/useMembersWithPayments";
import { useCommunityMembers } from "../../hooks/useCommunityMembers";
import Background from "../../assets/background.png";

const TABS = ["All Plans", "Payment History", "Contact Details"];

function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount ?? 0).replace("NGN", "₦");
}
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
}

function memberName(m) {
  if (!m) return "Member";
  if (m.name) return m.name;
  const first = m.user?.firstName ?? m.firstName ?? "";
  const last = m.user?.lastName ?? m.lastName ?? "";
  return `${first} ${last}`.trim() || m.user?.email || m.email || "Member";
}
const memberEmail = (m) => m?.user?.email ?? m?.email ?? "—";
const memberPhone = (m) => m?.user?.phoneNumber ?? m?.phoneNumber ?? "—";

function StatCard({ label, value }) {
  return (
    <div className="bg-[#EFEFF1E5] rounded-xl border border-gray-100 px-4 py-3.5" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-base font-bold text-black">{value}</p>
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
    <div className="bg-[#EFEFF1E5] rounded-md border border-gray-100 p-4" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-black pt-0.5">{plan.paymentLink?.title ?? "Plan"}</p>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ color: isPaid ? "#059669" : "#e11d48", background: isPaid ? "#ecfdf5" : "#fff1f2" }}>
          {isPaid ? "Paid" : "Unpaid"}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base font-extrabold text-gray-900">{formatNaira(plan.amount)}</span>
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
  const member = members.find((m) => String(m.id) === String(memberId));

  function handleRemove() {
    if (!member) return;
    if (!window.confirm(`Remove ${memberName(member)} from this community?`)) return;
    removeMember.mutate(member.id, {
      onSuccess: () => navigate(`/dashboard/members?community=${communityId}`),
    });
  }

  if (isLoading) {
    return <div className="px-6 py-6 text-xs text-gray-400">Loading…</div>;
  }
  if (!member) {
    return <div className="px-6 py-6 text-xs text-gray-400">Member not found.</div>;
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

  // Distinct plans (one card per payment link, latest obligation for that link)
  const distinctPlans = Array.from(
    new Map(member.obligations.map((o) => [o.paymentLink?.id, o])).values()
  );

  return (
    <div
      className="px-6 py-6 overflow-y-auto h-full"
      style={{
        backgroundImage: `url(${Background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex items-start justify-between mb-1">
        <button onClick={() => navigate(`/dashboard/members?community=${communityId}`)} className="flex items-center gap-1.5 text-xs text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-600 mb-1">
          <ChevronLeft size={12} /> Members
        </button>
      </div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-black">
            <span className="text-gray-400 font-medium">Members</span>
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
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Amount Paid" value={formatNaira(totalPaid)} />
        <StatCard label="Active Plans" value={String(member.planCount)} />
        <StatCard label="Plans Yet to pay" value={String(member.totalCount - member.paidCount)} />
        <StatCard label="Failed Payments" value={String(member.failedCount)} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#EFEFF1] rounded-md p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-[13px] rounded transition-all cursor-pointer border-none font-medium ${tab === t ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-800"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "All Plans" && (
        distinctPlans.length === 0 ? (
          <p className="text-xs text-gray-400 py-8 text-center">No plans assigned yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {distinctPlans.map((plan) => <PlanCard key={plan.id} plan={plan} successfulLinkIds={successfulLinkIds} />)}
          </div>
        )
      )}

      {tab === "Payment History" && (
        <div className="bg-[#EFEFF1E5] rounded-xl border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
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
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-xs text-gray-400">No payments yet.</td></tr>
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
                          <button disabled title="Download receipt — coming soon" className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-300 cursor-not-allowed"><Download size={11} /></button>
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
        <div className="bg-[#EFEFF1E5] rounded-xl border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
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
