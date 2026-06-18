import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Grid, List, ChevronDown, Users, Clock } from "lucide-react";
import GridIcon from "../../assets/grid-icon.png";

const COMMUNITIES = [
  { tag: "KC", name: "Kings College Alumni", members: 24, role: "Admin",  totalPayments: "₦240,000", overdueMembers: 6,  nextPayment: null,           status: null   },
  { tag: "CF", name: "Church Finance",       members: 24, role: "Member", totalPayments: null,        overdueMembers: null, nextPayment: "April 1, 2025", status: "Paid" },
  { tag: "CF", name: "Church Finance",       members: 24, role: "Member", totalPayments: null,        overdueMembers: null, nextPayment: "April 1, 2025", status: "Paid" },
  { tag: "KC", name: "Kings College Alumni", members: 24, role: "Admin",  totalPayments: "₦240,000", overdueMembers: 6,  nextPayment: null,           status: null   },
  { tag: "CF", name: "Church Finance",       members: 24, role: "Member", totalPayments: null,        overdueMembers: null, nextPayment: "April 1, 2025", status: "Paid" },
  { tag: "CF", name: "Church Finance",       members: 24, role: "Member", totalPayments: null,        overdueMembers: null, nextPayment: "April 1, 2025", status: "Paid" },
];

const SORT_OPTIONS = ["Recently Viewed", "A-Z", "Z-A", "Newest First"];

function CommunityCard({ c, onClick }) {
  const isAdmin = c.role === "Admin";
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-100 overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg flex flex-col"
      style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}
    >
      {/* Card top */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${isAdmin ? "bg-gradient-to-br from-[#002FA7] to-[#4f6fe5]" : "bg-gradient-to-br from-gray-500 to-gray-400"}`}>
              {c.tag}
            </div>
            <div>
              <p className="text-xs font-semibold text-[#000000]">{c.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Users size={11} className="text-gray-400" />
                <span className="text-[10px] text-gray-400">{c.members} Members</span>
              </div>
            </div>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 flex-shrink-0 ${isAdmin ? "text-[#002FA7] bg-blue-50 border-1 border-blue-100" : "text-gray-900 bg-gray-50 border border-gray-900"}`}>
            {c.role}
          </span>
        </div>
        {/* Placeholder illustration */}
        <div className="w-full h-28 rounded-sm bg-gradient-to-br from-[#f0f2f8] to-[#e4e8f4]" />
      </div>

      {/* Card footer */}
      <div className="px-5 py-3 border-t border-gray-50 bg-[#fafbff] flex items-center justify-between">
        {isAdmin ? (
          <>
            <span className="text-xs text-gray-500">Total Payments: <strong className="text-[#000000]">{c.totalPayments}</strong></span>
            <span className="text-xs text-gray-500">Overdue: <strong className="text-red-500">{c.overdueMembers}</strong></span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-gray-400" />
              <span className="text-xs text-gray-600">Next: <strong className="text-[#000000]">{c.nextPayment}</strong></span>
            </div>
            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{c.status}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function CommunitiesHome() {
  const navigate = useNavigate();
  const [view, setView]       = useState("grid");
  const [sort, setSort]       = useState("Recently Viewed");
  const [sortOpen, setSortOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-7 pt-7 pb-5">
        <h1 className="text-lg font-semibold text-[#000000]">Your Communities</h1>
        <div className="flex gap-2.5">
          <button
            onClick={() => navigate("/onboarding/choose-path")}
            className="px-4 py-2 rounded-lg border border-[#002FA7] text-[#002FA7] bg-white text-xs font-medium hover:bg-blue-50 transition-all"
          >
            Join Community
          </button>
          <button
            onClick={() => navigate("/onboarding/choose-path")}
            className="px-4 py-2 rounded-lg bg-[#002FA7] text-white text-xs font-medium hover:opacity-90 transition-all"
          >
            Create Community
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 px-7 pb-5">
        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            {sort} <ChevronDown size={13} />
          </button>
          {sortOpen && (
            <div className="absolute top-full mt-1 left-0 bg-white rounded-xl border border-gray-100 shadow-lg z-50 min-w-40 overflow-hidden">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => { setSort(opt); setSortOpen(false); }}
                  className={`w-full px-4 py-2.5 text-left text-xs transition-all ${sort === opt ? "bg-blue-50  font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 ml-auto">
          {[{ id: "grid", icon: <Grid size={15} /> }, { id: "list", icon: <List size={15} /> }].map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`w-8 h-8 rounded-sm border flex items-center justify-center transition-all ${view === v.id ? "bg-blue-50 border-blue-200 text-[#002FA7]" : "border-gray-200 bg-white text-gray-600 hover:text-gray-600"}`}
            >
              {v.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className={`px-7 pb-10 grid gap-4 ${view === "grid" ? "grid-cols-3" : "grid-cols-1"}`}>
        {COMMUNITIES.map((c, i) => (
          <CommunityCard key={i} c={c} onClick={() => navigate("/dashboard/admin")} />
        ))}
      </div>
    </div>
  );
}