import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, ChevronDown, RotateCcw, MoreHorizontal, X, Users, UserX, Clock, ShieldCheck } from "lucide-react";
import { useActiveCommunityId } from "../../hooks/useActiveCommunity";
import { useMembersWithPayments } from "../../hooks/useMembersWithPayments";
import { useCommunityMembers, useRoles } from "../../hooks/useCommunityMembers";
import { getErrorMessage } from "../../utils/errorHandler";

const FALLBACK_ROLES = [
  { id: "MEMBER", name: "Member" },
  { id: "ADMIN", name: "Admin" },
];

const SORT_OPTIONS = ["Recently Paid", "Name A-Z", "Date Joined"];

function memberName(m) {
  if (m.name) return m.name;
  const first = m.user?.firstName ?? m.firstName ?? "";
  const last = m.user?.lastName ?? m.lastName ?? "";
  const full = `${first} ${last}`.trim();
  return full || m.user?.email || m.email || "Member";
}
const memberEmail = (m) => m.user?.email ?? m.email ?? "—";
const memberRole = (m) => m.role?.name ?? m.roleName ?? m.role ?? "Member";
const memberInitials = (m) => memberName(m).split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";

function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount ?? 0).replace("NGN", "₦");
}
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
}

function statusStyle(paid, total) {
  if (total === 0) return { bg: "#f5f6fa", color: "#6b7280" };
  if (paid === total) return { bg: "#ecfdf5", color: "#059669" };
  if (paid === 0) return { bg: "#fff1f2", color: "#e11d48" };
  return { bg: "#fffbeb", color: "#b45309" };
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center justify-between" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
      <div>
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-base font-bold text-[#0f1d6e]">{value}</p>
      </div>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon size={16} style={{ color }} />
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
      <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-gray-100 shadow-lg z-20 p-4 w-64">
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
            className="px-3 py-2 rounded-lg bg-[#002FA7] text-white text-xs font-semibold border-none cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}

export default function Members() {
  const navigate = useNavigate();
  const communityId = useActiveCommunityId();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ plan: "", status: "" });
  const [sort, setSort] = useState("Recently Paid");
  const [sortOpen, setSortOpen] = useState(false);
  const [selected, setSelected] = useState([]);

  const { members, obligations, isLoading, error } = useMembersWithPayments(communityId);
  const { addMember, removeMember } = useCommunityMembers(communityId);
  const { data: rolesData } = useRoles();
  const roles = rolesData?.length ? rolesData : FALLBACK_ROLES;

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
    admins: members.filter((m) => memberRole(m).toLowerCase() === "admin").length,
  };

  async function handleAdd(payload) {
    try {
      await addMember.mutateAsync(payload);
      return true;
    } catch {
      return false;
    }
  }

  function handleRemove(member) {
    if (!window.confirm(`Remove ${memberName(member)} from this community?`)) return;
    removeMember.mutate(member.id);
  }

  function toggleSelect(id) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function exportCsv() {
    const rows = (selected.length ? filtered.filter((m) => selected.includes(m.id)) : filtered);
    const header = "Name,Email,Plans,Paid,Total,Date Joined\n";
    const body = rows.map((m) => `${memberName(m)},${memberEmail(m)},${m.planCount},${m.paidCount},${m.totalCount},${formatDate(m.joinedAt ?? m.createdAt)}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "members.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const activeChips = [
    filters.plan ? { key: "plan", label: filters.plan } : null,
    filters.status ? { key: "status", label: filters.status } : null,
  ].filter(Boolean);

  return (
    <div className="px-6 py-6 overflow-y-auto h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-[#0f1d6e]">Members</h1>
          <p className="text-sm text-gray-400 mt-0.5">A full picture of the members of your community</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="px-4 py-2 rounded-lg bg-[#002FA7] text-white text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition-all border-none cursor-pointer">
          <Plus size={14} /> Add Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard icon={Users} label="Total Members" value={String(stats.total)} color="#002FA7" bg="#E6EEFF" />
        <StatCard icon={UserX} label="Active Members" value={String(stats.active)} color="#dc2626" bg="#FFE9EC" />
        <StatCard icon={Clock} label="Inactive" value={String(stats.inactive)} color="#b45309" bg="#FFF8E7" />
        <StatCard icon={ShieldCheck} label="Admins" value={String(stats.admins).padStart(2, "0")} color="#7c3aed" bg="#F3EEFF" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm font-bold text-[#0f1d6e]">Member Payments</span>
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all bg-white cursor-pointer">
            Export Csv
          </button>
        </div>

        <div className="flex items-center justify-between px-5 pb-3 gap-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 w-72">
            <Search size={12} className="text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members…" className="flex-1 bg-transparent border-none outline-none text-xs text-gray-600 placeholder-gray-400" />
          </div>
          <div className="flex items-center gap-2">
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
            <button onClick={() => setFilters({ plan: "", status: "" })} className="text-xs font-semibold text-[#002FA7] bg-transparent border-none cursor-pointer">
              Clear All
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-y border-gray-100">
                <th className="px-5 py-2.5 w-8">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={(e) => setSelected(e.target.checked ? filtered.map((m) => m.id) : [])} />
                </th>
                {["Members", "Plans", "Status", "Date", "Email", "Date Joined", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-xs text-gray-400">Loading…</td></tr>
              ) : error ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-xs text-red-500">Couldn't load members.</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-xs text-gray-400">No members found.</td></tr>
              ) : (
                filtered.map((m) => {
                  const s = statusStyle(m.paidCount, m.totalCount);
                  return (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                      <td className="px-5 py-3">
                        <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggleSelect(m.id)} />
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => navigate(`/dashboard/members/${m.id}?community=${communityId}`)} className="text-sm font-semibold text-[#002FA7] hover:underline bg-transparent border-none cursor-pointer p-0">
                          {memberName(m)}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{m.planCount}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: s.color, background: s.bg }}>
                          {m.paidCount}/{m.totalCount} Paid
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{formatDate(m.lastPaymentDate)}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{memberEmail(m)}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{formatDate(m.joinedAt ?? m.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          <button title="Resend reminder" className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50"><RotateCcw size={11} /></button>
                          <button onClick={() => handleRemove(m)} title="Remove member" className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50"><MoreHorizontal size={11} /></button>
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

      {modalOpen && (
        <AddMemberModal
          onClose={() => setModalOpen(false)}
          onAdd={handleAdd}
          adding={addMember.isPending}
          error={addMember.error ? getErrorMessage(addMember.error) : null}
          roles={roles}
        />
      )}
    </div>
  );
}

function AddMemberModal({ onClose, onAdd, adding, error, roles }) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [billingExempt, setBillingExempt] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const ok = await onAdd({ email: email.trim(), roleId, billingExempt });
    if (ok) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(15,29,110,0.2)] backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-base font-extrabold text-[#0f1d6e]">Add Member</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 bg-transparent cursor-pointer"><X size={14} /></button>
        </div>

        <div className="flex flex-col gap-3.5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@email.com"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#002FA7]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Role</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#002FA7] bg-white"
            >
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={billingExempt} onChange={(e) => setBillingExempt(e.target.checked)} />
            Exempt from billing
          </label>
        </div>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <button
          type="submit"
          disabled={adding || !email.trim()}
          className="w-full mt-5 px-4 py-2.5 rounded-lg bg-[#002FA7] text-white text-sm font-semibold hover:opacity-90 transition-all border-none cursor-pointer disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add Member"}
        </button>
      </form>
    </div>
  );
}
