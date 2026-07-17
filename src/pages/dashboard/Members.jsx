import { useMemo, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, ChevronDown, RotateCcw, UserMinus, X, Users, UserX, Clock, ShieldCheck, Copy, Check, UserCheck, Building2, ChevronRight, DollarSign, Download } from "lucide-react";
import { useActiveCommunityId } from "../../hooks/useActiveCommunityId";
import { APP_ORIGIN } from "../../utils/deviceRedirect";
import { useMembersWithPayments } from "../../hooks/useMembersWithPayments";
import { useCommunityMembers, useRoles } from "../../hooks/useCommunityMembers";
import { useJoinRequests, requesterOf, requestStatusOf } from "../../hooks/useJoinRequests";
import { getErrorMessage } from "../../utils/errorHandler";
import LoadingState from "../../components/common/LoadingState";
import ConfirmDialog from "../../components/dashboard/ConfirmDialog";
import { formatNaira, formatDate, toTitleCase } from "../../utils/format";

// Only these three roles should be assignable when inviting members.
const ALLOWED_ROLE_NAMES = new Set(["Community Owner", "Community Admin", "Community Member"]);

const FALLBACK_ROLES = [
  { id: "COMMUNITY_OWNER", name: "Community Owner" },
  { id: "COMMUNITY_ADMIN", name: "Community Admin" },
  { id: "COMMUNITY_MEMBER", name: "Community Member" },
];

const SORT_OPTIONS = ["Recently Paid", "Name A-Z", "Date Joined"];

function memberName(m) {
  if (m.name) return toTitleCase(m.name);
  const first = m.user?.firstName ?? m.firstName ?? "";
  const last = m.user?.lastName ?? m.lastName ?? "";
  const full = `${first} ${last}`.trim();
  return toTitleCase(full || m.user?.email || m.email || "Member");
}
const memberEmail = (m) => m.user?.email ?? m.email ?? "—";
const memberRole = (m) => m.roleCode ?? m.role?.name ?? m.roleName ?? m.role ?? "Member";
// Matches AuthContext's hasAdminCommunity check — roleCode is the stable
// enum value (OWNER/ADMIN/MANAGER/MEMBER/...), not a free-text display name.
const isAdminRole = (m) => ["OWNER", "ADMIN", "MANAGER"].includes((m.roleCode ?? "").toUpperCase());
const memberInitials = (m) => memberName(m).split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";

function statusStyle(paid, total) {
  if (total === 0) return { bg: "#f5f6fa", color: "#6b7280" };
  if (paid === total) return { bg: "#ecfdf5", color: "#059669" };
  if (paid === 0) return { bg: "#fff1f2", color: "#e11d48" };
  return { bg: "#fffbeb", color: "#b45309" };
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-surface-container rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
      <div>
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-[13px] font-semibold text-black">{value}</p>
      </div>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon size={14} style={{ color }} />
      </div>
    </div>
  );
}

function FilterPanel({ planOptions, filters, onApply, onClose }) {
  const [plan, setPlan] = useState(filters.plan ?? "");
  const [status, setStatus] = useState(filters.status ?? "");
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 bg-white rounded-xl border border-gray-100 shadow-lg z-20 p-4 w-64">
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white">
              <option value="">All plans</option>
              {planOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white">
              <option value="">All statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
          <button
            onClick={() => { onApply({ plan, status }); onClose(); }}
            className="px-3 py-2 rounded-lg bg-brand text-white text-xs font-semibold border-none cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}

function EmptyState({ onAddMember, onCreatePlan }) {
  const steps = [
    {
      icon: <Check size={15} />,
      iconStyle: { background: "#ecfdf5", color: "#059669" },
      title: "Community Created",
      subtitle: "Your community is live and ready",
      done: true,
      action: null,
    },
    {
      icon: <Users size={15} />,
      iconStyle: { background: "var(--color-brand)", color: "#ffffff" },
      title: "Add Your First Members",
      subtitle: "Invite Via Link, CSV Upload, or Manually",
      done: false,
      action: onAddMember,
    },
    {
      icon: <DollarSign size={15} />,
      iconStyle: { background: "var(--color-brand)", color: "#ffffff" },
      title: "Create A Payment Plan",
      subtitle: "Set Up Dues and Start Collecting",
      done: false,
      action: onCreatePlan,
    },
  ];

  return (
    <div className="flex flex-col items-center py-14 px-6">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: "#E6EEFF" }}>
        <Building2 size={38} style={{ color: "var(--color-brand)" }} />
      </div>
      <h2 className="text-xl font-bold text-gray-900 text-center mb-2 max-w-sm">
        Your Community Is Set Up. Let's Get It Moving.
      </h2>
      <p className="text-sm text-gray-400 text-center mb-8 max-w-sm">
        Your dashboard will come alive once you add members and create payment plans. Start with the steps below.
      </p>
      <div className="w-full max-w-lg flex flex-col gap-2">
        {steps.map((step, i) => (
          <button
            key={i}
            onClick={step.action ?? undefined}
            disabled={!step.action}
            className={`w-full bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4 text-left transition-colors
              ${step.action ? "cursor-pointer hover:bg-blue-50/30" : "cursor-default"}`}
            style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={step.iconStyle}>
              {step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${step.done ? "text-gray-400" : "text-gray-900"}`}>{step.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{step.subtitle}</p>
            </div>
            {!step.done && <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Members() {
  usePageTitle("Members");
  const navigate = useNavigate();
  const communityId = useActiveCommunityId();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ plan: "", status: "" });
  const [sort, setSort] = useState("Recently Paid");
  const [sortOpen, setSortOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [removingMember, setRemovingMember] = useState(null);

  const { members, obligations, isLoading, error } = useMembersWithPayments(communityId);
  const { inviteMember, removeMember } = useCommunityMembers(communityId);
  // Summary only — approving/rejecting (with full requester detail) lives on
  // the Join Requests page, so the review logic exists in exactly one place.
  const { requests: allJoinRequests } = useJoinRequests(communityId);
  const pendingJoinRequests = allJoinRequests.filter(
    (r) => requestStatusOf(r) === "PENDING",
  );
  const { data: rolesData } = useRoles();
  const filteredRoles = rolesData ? rolesData.filter((r) => ALLOWED_ROLE_NAMES.has(r.name)) : [];
  const usingFallbackRoles = !filteredRoles.length;
  const roles = usingFallbackRoles ? FALLBACK_ROLES : filteredRoles;

  const planOptions = useMemo(
    () => [...new Set(obligations.map((o) => o.paymentLink?.title).filter(Boolean))],
    [obligations]
  );

  const filtered = useMemo(() => {
    let list = members.filter((m) =>
      memberName(m).toLowerCase().includes(search.toLowerCase()) ||
      memberEmail(m).toLowerCase().includes(search.toLowerCase())
    );
    if (filters.plan) {
      list = list.filter((m) => m.obligations.some((o) => o.paymentLink?.title === filters.plan));
    }
    if (filters.status) {
      list = list.filter((m) => {
        if (filters.status === "Paid") return m.totalCount > 0 && m.paidCount === m.totalCount;
        if (filters.status === "Unpaid") return m.paidCount === 0;
        return m.paidCount > 0 && m.paidCount < m.totalCount;
      });
    }
    const sorted = [...list];
    if (sort === "Name A-Z") sorted.sort((a, b) => memberName(a).localeCompare(memberName(b)));
    else if (sort === "Date Joined") sorted.sort((a, b) => new Date(b.joinedAt ?? b.createdAt ?? 0) - new Date(a.joinedAt ?? a.createdAt ?? 0));
    else sorted.sort((a, b) => new Date(b.lastPaymentDate ?? 0) - new Date(a.lastPaymentDate ?? 0));
    return sorted;
  }, [members, search, filters, sort]);

  const stats = {
    total: members.length,
    active: members.filter((m) => (m.status ?? "ACTIVE").toUpperCase() === "ACTIVE").length,
    inactive: members.filter((m) => (m.status ?? "").toUpperCase() === "INACTIVE").length,
    admins: members.filter(isAdminRole).length,
  };

  async function handleAdd(payload) {
    try {
      await inviteMember.mutateAsync(payload);
      return true;
    } catch {
      return false;
    }
  }

  function handleRemove(member) {
    setRemovingMember(member);
  }

  function toggleSelect(id) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function exportCsv() {
    const rows = (selected.length ? filtered.filter((m) => selected.includes(m.id)) : filtered);
    // A name/email containing a comma or quote (rare but real — "Doe, Jr.")
    // was previously written straight into the CSV unescaped, silently
    // corrupting the column structure for that and every following row.
    const csvField = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = "Name,Email,Plans,Paid,Total,Date Joined\n";
    const body = rows
      .map((m) =>
        [memberName(m), memberEmail(m), m.planCount, m.paidCount, m.totalCount, formatDate(m.joinedAt ?? m.createdAt)]
          .map(csvField)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "members.csv";
    // Revoking the object URL synchronously right after click() is a known
    // footgun -- some browsers (Firefox especially) haven't finished
    // processing the download yet, so the blob gets invalidated before it's
    // actually read, silently failing the export. Appending to the DOM
    // before clicking (not required in Chrome, but Firefox is more
    // reliable with it) and deferring the revoke fixes both.
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const activeChips = [
    filters.plan ? { key: "plan", label: filters.plan } : null,
    filters.status ? { key: "status", label: filters.status } : null,
  ].filter(Boolean);

  return (
    <div className="px-4 md:px-6 py-6 overflow-y-auto h-full">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-black">Members</h1>
          <p className="text-sm text-gray-400 mt-0.5">A full picture of the members of your community</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex-shrink-0 px-4 py-2 rounded text-xs font-medium text-white bg-brand flex items-center gap-1.5 hover:opacity-90 transition-all border-none cursor-pointer">
          <Plus size={13} /> Add Member
        </button>
      </div>

      {/* Pending join requests — compact summary; the full review flow
          (requester details, approve/reject) lives on the Join Requests page. */}
      {pendingJoinRequests.length > 0 && (() => {
        const names = pendingJoinRequests.slice(0, 3).map((r) => requesterOf(r).name);
        const extra = pendingJoinRequests.length - names.length;
        const preview =
          names.join(", ") + (extra > 0 ? ` and ${extra} other${extra === 1 ? "" : "s"}` : "");
        return (
          <button
            onClick={() => navigate("/dashboard/join-requests")}
            className="w-full flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl border border-amber-100 mb-5 text-left cursor-pointer transition-shadow hover:shadow-md"
            style={{ background: "#FFFBEB", boxShadow: "0 1px 4px rgba(180,83,9,0.07)" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Clock size={15} style={{ color: "#b45309" }} className="flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold m-0" style={{ color: "#b45309" }}>
                  {pendingJoinRequests.length} pending join{" "}
                  {pendingJoinRequests.length === 1 ? "request" : "requests"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 m-0 truncate">{preview}</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-brand flex-shrink-0">
              Review <ChevronRight size={13} />
            </span>
          </button>
        );
      })()}

      {/* Empty state — shown instead of stats + table when community has no members yet */}
      {!isLoading && !error && members.length === 0 && (
        <EmptyState
          onAddMember={() => setModalOpen(true)}
          onCreatePlan={() => navigate("/dashboard/payments")}
        />
      )}

      {/* Stats — only when there are members */}
      {members.length > 0 && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={Users} label="Total Members" value={String(stats.total)} color="var(--color-brand)" bg="#E6EEFF" />
        <StatCard icon={UserX} label="Active Members" value={String(stats.active)} color="#dc2626" bg="#FFE9EC" />
        <StatCard icon={Clock} label="Inactive" value={String(stats.inactive)} color="#b45309" bg="#FFF8E7" />
        <StatCard icon={ShieldCheck} label="Admins" value={String(stats.admins)} color="#7c3aed" bg="#F3EEFF" />
      </div>
      )}

      {members.length > 0 && <div className="bg-surface-container rounded-xl border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm font-medium text-black">Member Payments</span>
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand text-xs font-semibold text-brand hover:bg-blue-50 transition-all bg-white cursor-pointer">
            <Download size={13} /> Export Csv
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 pb-3 gap-2">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 w-full sm:flex-1 sm:min-w-0 sm:max-w-xs">
            <Search size={12} className="text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members…" className="flex-1 bg-transparent border-none outline-none text-xs text-gray-600 placeholder-gray-400" />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="relative">
              <button onClick={() => setFilterOpen((o) => !o)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 bg-white cursor-pointer">
                <Filter size={12} /> Filter
              </button>
              {filterOpen && (
                <FilterPanel planOptions={planOptions} filters={filters} onApply={setFilters} onClose={() => setFilterOpen(false)} />
              )}
            </div>
            <div className="relative">
              <button onClick={() => setSortOpen((o) => !o)} className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 cursor-pointer">
                Sort by: {sort} <ChevronDown size={11} />
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-gray-100 shadow-lg z-20 overflow-hidden min-w-[150px]">
                    {SORT_OPTIONS.map((o) => (
                      <button key={o} onClick={() => { setSort(o); setSortOpen(false); }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 bg-transparent border-none cursor-pointer">
                        {o}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="flex items-center gap-2 px-5 pb-3">
            {activeChips.map((chip) => (
              <span key={chip.key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-700">
                {chip.label}
                <button onClick={() => setFilters((f) => ({ ...f, [chip.key]: "" }))} className="bg-transparent border-none cursor-pointer p-0 flex items-center">
                  <X size={10} className="text-gray-400" />
                </button>
              </span>
            ))}
            <button onClick={() => setFilters({ plan: "", status: "" })} className="text-xs font-semibold text-brand bg-transparent border-none cursor-pointer">
              Clear All
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-y border-gray-100">
                <th className="hidden sm:table-cell px-5 py-2.5 w-8">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={(e) => setSelected(e.target.checked ? filtered.map((m) => m.id) : [])} />
                </th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">Members</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">Plans</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">Status</th>
                <th className="hidden md:table-cell px-5 py-2.5 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">Date</th>
                <th className="hidden lg:table-cell px-5 py-2.5 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">Email</th>
                <th className="hidden lg:table-cell px-5 py-2.5 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">Date Joined</th>
                <th className="hidden sm:table-cell px-5 py-2.5 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8}><LoadingState className="py-8" /></td></tr>
              ) : error ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-xs text-red-500">Couldn't load members.</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-xs text-gray-400">No members found.</td></tr>
              ) : (
                filtered.map((m) => {
                  const s = statusStyle(m.paidCount, m.totalCount);
                  return (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                      <td className="hidden sm:table-cell px-5 py-3">
                        <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggleSelect(m.id)} />
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => navigate(`/dashboard/members/${m.id}?community=${communityId}`)} className="text-xs font-semibold text-brand hover:underline bg-transparent border-none cursor-pointer p-0">
                          {memberName(m)}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600">{m.planCount}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: s.color, background: s.bg }}>
                          {m.paidCount}/{m.totalCount} Paid
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-5 py-3 text-xs text-gray-500">{formatDate(m.lastPaymentDate)}</td>
                      <td className="hidden lg:table-cell px-5 py-3 text-xs text-gray-500">{memberEmail(m)}</td>
                      <td className="hidden lg:table-cell px-5 py-3 text-xs text-gray-500">{formatDate(m.joinedAt ?? m.createdAt)}</td>
                      <td className="hidden sm:table-cell px-5 py-3">
                        <div className="flex gap-1.5">
                          <button disabled title="Resend reminder — coming soon" aria-label="Resend reminder — coming soon" className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-300 cursor-not-allowed"><RotateCcw size={11} /></button>
                          <button onClick={() => handleRemove(m)} title="Remove member" aria-label="Remove member" className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50"><UserMinus size={11} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>}

      {modalOpen && (
        <AddMemberModal
          onClose={() => setModalOpen(false)}
          onAdd={handleAdd}
          adding={inviteMember.isPending}
          error={inviteMember.error ? getErrorMessage(inviteMember.error) : null}
          roles={roles}
          rolesUnavailable={usingFallbackRoles}
          inviteLink={communityId ? `${APP_ORIGIN}/member/join?community=${communityId}` : null}
        />
      )}

      {removingMember && (
        <ConfirmDialog
          title="Remove Member"
          subtitle={memberEmail(removingMember)}
          description={`This removes ${memberName(removingMember)} from this community. They'll lose access to community payment plans and dashboard data tied to this community; this can't be undone.`}
          confirmLabel="Remove"
          confirmingLabel="Removing…"
          confirming={removeMember.isPending}
          onClose={() => setRemovingMember(null)}
          onConfirm={() =>
            removeMember.mutate(removingMember.id, {
              onSuccess: () => setRemovingMember(null),
            })
          }
        />
      )}
    </div>
  );
}

function AddMemberModal({ onClose, onAdd, adding, error, roles, rolesUnavailable, inviteLink }) {
  const [email, setEmail] = useState("");
  const defaultRole = roles.find((r) => r.name === "Community Member") ?? roles[0];
  const [roleId, setRoleId] = useState(defaultRole?.id ?? "");
  const [billingExempt, setBillingExempt] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const ok = await onAdd({ email: email.trim(), roleId, billingExempt });
    if (ok) onClose();
  }

  function copyInviteLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  const isReady = email.trim() && !rolesUnavailable;
  const isNotRegistered = error?.toLowerCase().includes("registered");

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-6 bg-[rgba(15,29,110,0.2)] backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-black">Invite Member</h2>
            <p className="text-xs text-gray-400 mt-0.5">An invite email will be sent to their address.</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 bg-transparent cursor-pointer"><X size={14} /></button>
        </div>

        <div className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@email.com"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-brand bg-white"
            >
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {rolesUnavailable && (
              <p className="text-xs text-red-500 mt-1.5">Couldn't load roles from the server — try closing and reopening this dialog.</p>
            )}
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={billingExempt} onChange={(e) => setBillingExempt(e.target.checked)} />
            Exempt from billing
          </label>
        </div>

        {error && (
          <div className="mt-3">
            <p className="text-xs text-red-500">{error}</p>
            {isNotRegistered && inviteLink && (
              <div className="mt-2.5 rounded-lg p-3" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
                <p className="text-xs text-gray-700 mb-2">
                  Share your community link so they can register and join:
                </p>
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-xs text-brand truncate font-medium">{inviteLink}</span>
                  <button
                    type="button"
                    onClick={copyInviteLink}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand border-none cursor-pointer flex-shrink-0 hover:opacity-90"
                  >
                    {linkCopied ? <Check size={11} /> : <Copy size={11} />}
                    {linkCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={adding || !isReady}
          className="w-full mt-4 px-4 py-2 rounded bg-brand text-white text-xs font-medium hover:opacity-90 transition-all border-none cursor-pointer disabled:opacity-50"
        >
          {adding ? "Sending…" : "Send Invite"}
        </button>
      </form>
    </div>
  );
}
