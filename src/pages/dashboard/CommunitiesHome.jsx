// // import { useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import { Search, Grid, List, ChevronDown, Users, Clock } from "lucide-react";
// // import GridIcon from "../../assets/grid-icon.png";

// // const COMMUNITIES = [
// //   { tag: "KC", name: "Kings College Alumni", members: 24, role: "Admin",  totalPayments: "₦240,000", overdueMembers: 6,  nextPayment: null,           status: null   },
// //   { tag: "CF", name: "Church Finance",       members: 24, role: "Member", totalPayments: null,        overdueMembers: null, nextPayment: "April 1, 2025", status: "Paid" },
// //   { tag: "CF", name: "Church Finance",       members: 24, role: "Member", totalPayments: null,        overdueMembers: null, nextPayment: "April 1, 2025", status: "Paid" },
// //   { tag: "KC", name: "Kings College Alumni", members: 24, role: "Admin",  totalPayments: "₦240,000", overdueMembers: 6,  nextPayment: null,           status: null   },
// //   { tag: "CF", name: "Church Finance",       members: 24, role: "Member", totalPayments: null,        overdueMembers: null, nextPayment: "April 1, 2025", status: "Paid" },
// //   { tag: "CF", name: "Church Finance",       members: 24, role: "Member", totalPayments: null,        overdueMembers: null, nextPayment: "April 1, 2025", status: "Paid" },
// // ];

// // const SORT_OPTIONS = ["Recently Viewed", "A-Z", "Z-A", "Newest First"];

// // function CommunityCard({ c, onClick }) {
// //   const isAdmin = c.role === "Admin";
// //   return (
// //     <div
// //       onClick={onClick}
// //       className="bg-white rounded-lg border border-gray-100 overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg flex flex-col"
// //       style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}
// //     >
// //       {/* Card top */}
// //       <div className="p-5 flex-1">
// //         <div className="flex items-start justify-between mb-4">
// //           <div className="flex items-center gap-3">
// //             <div className={`w-10 h-10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${isAdmin ? "bg-gradient-to-br from-[#002FA7] to-[#4f6fe5]" : "bg-gradient-to-br from-gray-500 to-gray-400"}`}>
// //               {c.tag}
// //             </div>
// //             <div>
// //               <p className="text-xs font-semibold text-[#000000]">{c.name}</p>
// //               <div className="flex items-center gap-1 mt-0.5">
// //                 <Users size={11} className="text-gray-400" />
// //                 <span className="text-[10px] text-gray-400">{c.members} Members</span>
// //               </div>
// //             </div>
// //           </div>
// //           <span className={`text-xs font-medium px-2.5 py-1 flex-shrink-0 ${isAdmin ? "text-[#002FA7] bg-blue-50 border-1 border-blue-100" : "text-gray-900 bg-gray-50 border border-gray-900"}`}>
// //             {c.role}
// //           </span>
// //         </div>
// //         {/* Placeholder illustration */}
// //         <div className="w-full h-28 rounded-sm bg-gradient-to-br from-[#f0f2f8] to-[#e4e8f4]" />
// //       </div>

// //       {/* Card footer */}
// //       <div className="px-5 py-3 border-t border-gray-50 bg-[#fafbff] flex items-center justify-between">
// //         {isAdmin ? (
// //           <>
// //             <span className="text-xs text-gray-500">Total Payments: <strong className="text-[#000000]">{c.totalPayments}</strong></span>
// //             <span className="text-xs text-gray-500">Overdue: <strong className="text-red-500">{c.overdueMembers}</strong></span>
// //           </>
// //         ) : (
// //           <>
// //             <div className="flex items-center gap-1.5">
// //               <Clock size={12} className="text-gray-400" />
// //               <span className="text-xs text-gray-600">Next: <strong className="text-[#000000]">{c.nextPayment}</strong></span>
// //             </div>
// //             <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{c.status}</span>
// //           </>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// // export default function CommunitiesHome() {
// //   const navigate = useNavigate();
// //   const [view, setView]       = useState("grid");
// //   const [sort, setSort]       = useState("Recently Viewed");
// //   const [sortOpen, setSortOpen] = useState(false);

// //   return (
// //     <div className="flex flex-col h-full">
// //       {/* Page header */}
// //       <div className="flex items-center justify-between px-7 pt-7 pb-5">
// //         <h1 className="text-lg font-semibold text-[#000000]">Your Communities</h1>
// //         <div className="flex gap-2.5">
// //           <button
// //             onClick={() => navigate("/onboarding/choose-path")}
// //             className="px-4 py-2 rounded-lg border border-[#002FA7] text-[#002FA7] bg-white text-xs font-medium hover:bg-blue-50 transition-all"
// //           >
// //             Join Community
// //           </button>
// //           <button
// //             onClick={() => navigate("/onboarding/choose-path")}
// //             className="px-4 py-2 rounded-lg bg-[#002FA7] text-white text-xs font-medium hover:opacity-90 transition-all"
// //           >
// //             Create Community
// //           </button>
// //         </div>
// //       </div>

// //       {/* Filters row */}
// //       <div className="flex items-center gap-3 px-7 pb-5">
// //         {/* Sort dropdown */}
// //         <div className="relative">
// //           <button
// //             onClick={() => setSortOpen(o => !o)}
// //             className="flex items-center gap-1.5 px-3 py-2 rounded-sm border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all"
// //           >
// //             {sort} <ChevronDown size={13} />
// //           </button>
// //           {sortOpen && (
// //             <div className="absolute top-full mt-1 left-0 bg-white rounded-xl border border-gray-100 shadow-lg z-50 min-w-40 overflow-hidden">
// //               {SORT_OPTIONS.map(opt => (
// //                 <button
// //                   key={opt}
// //                   onClick={() => { setSort(opt); setSortOpen(false); }}
// //                   className={`w-full px-4 py-2.5 text-left text-xs transition-all ${sort === opt ? "bg-blue-50  font-medium" : "text-gray-600 hover:bg-gray-50"}`}
// //                 >
// //                   {opt}
// //                 </button>
// //               ))}
// //             </div>
// //           )}
// //         </div>

// //         {/* View toggle */}
// //         <div className="flex gap-1 ml-auto">
// //           {[{ id: "grid", icon: <Grid size={15} /> }, { id: "list", icon: <List size={15} /> }].map(v => (
// //             <button
// //               key={v.id}
// //               onClick={() => setView(v.id)}
// //               className={`w-8 h-8 rounded-sm border flex items-center justify-center transition-all ${view === v.id ? "bg-blue-50 border-blue-200 text-[#002FA7]" : "border-gray-200 bg-white text-gray-600 hover:text-gray-600"}`}
// //             >
// //               {v.icon}
// //             </button>
// //           ))}
// //         </div>
// //       </div>

// //       {/* Grid */}
// //       <div className={`px-7 pb-10 grid gap-4 ${view === "grid" ? "grid-cols-3" : "grid-cols-1"}`}>
// //         {COMMUNITIES.map((c, i) => (
// //           <CommunityCard key={i} c={c} onClick={() => navigate("/dashboard/admin")} />
// //         ))}
// //       </div>
// //     </div>
// //   );
// // }

// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { ChevronDown, Users, Clock, AlertCircle } from "lucide-react";
// import { useCommunities } from "../../hooks/useCommunities";
// import { useAuth } from "../../store/AuthContext";

// const SORT_OPTIONS = ["Recently Viewed", "A-Z", "Z-A", "Newest First"];

// // Derive 2-letter tag from community name
// function getTag(name = "") {
//   const words = name.trim().split(/\s+/);
//   if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
//   return (words[0][0] + words[1][0]).toUpperCase();
// }

// function formatNaira(amount) {
//   if (amount == null) return "—";
//   return new Intl.NumberFormat("en-NG", {
//     style: "currency",
//     currency: "NGN",
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   })
//     .format(amount)
//     .replace("NGN", "₦");
// }

// function formatDate(dateString) {
//   if (!dateString) return "—";
//   return new Date(dateString).toLocaleDateString("en-NG", {
//     day: "numeric",
//     month: "long",
//     year: "numeric",
//   });
// }

// // Skeleton card
// function CardSkeleton() {
//   return (
//     <div className="bg-white rounded-lg border border-gray-100 overflow-hidden animate-pulse">
//       <div className="p-5">
//         <div className="flex items-start gap-3 mb-4">
//           <div className="w-10 h-10 bg-gray-200 rounded flex-shrink-0" />
//           <div className="flex-1">
//             <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
//             <div className="h-2.5 bg-gray-100 rounded w-1/2" />
//           </div>
//           <div className="w-14 h-5 bg-gray-100 rounded" />
//         </div>
//         <div className="w-full h-28 bg-gray-100 rounded-sm" />
//       </div>
//       <div className="px-5 py-3 border-t border-gray-50 bg-gray-50 flex justify-between">
//         <div className="h-2.5 bg-gray-200 rounded w-1/3" />
//         <div className="h-2.5 bg-gray-100 rounded w-1/4" />
//       </div>
//     </div>
//   );
// }

// function CommunityCard({ community, onClick }) {
//   // The API may return role as a string or nested object — handle both
//   const role =
//     community.role?.name ?? community.userRole ?? community.role ?? "Member";

//   const isAdmin =
//     typeof role === "string" && role.toLowerCase().includes("admin");

//   const tag = getTag(community.name ?? community.slug ?? "GC");
//   const memberCount = community.memberCount ?? community.membersCount ?? 0;

//   // Admin-specific data
//   const totalPayments =
//     community.totalContributions != null
//       ? formatNaira(community.totalContributions)
//       : (community.totalPayments ?? null);
//   const overdueCount =
//     community.overdueMembers ?? community.overdueCount ?? null;

//   // Member-specific data
//   const nextPayment = community.nextPaymentDate
//     ? formatDate(community.nextPaymentDate)
//     : (community.nextPayment ?? null);
//   const paymentStatus = community.paymentStatus ?? community.status ?? null;

//   return (
//     <div
//       onClick={onClick}
//       className="bg-white rounded-lg border border-gray-100 overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg flex flex-col"
//       style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}
//     >
//       <div className="p-5 flex-1">
//         <div className="flex items-start justify-between mb-4">
//           <div className="flex items-center gap-3">
//             {community.logo ? (
//               <img
//                 src={community.logo}
//                 alt={community.name}
//                 className="w-10 h-10 rounded object-cover flex-shrink-0"
//               />
//             ) : (
//               <div
//                 className={`w-10 h-10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
//                   isAdmin
//                     ? "bg-gradient-to-br from-[#002FA7] to-[#4f6fe5]"
//                     : "bg-gradient-to-br from-gray-500 to-gray-400"
//                 }`}
//               >
//                 {tag}
//               </div>
//             )}
//             <div>
//               <p className="text-xs font-semibold text-[#000000]">
//                 {community.name ?? community.slug}
//               </p>
//               <div className="flex items-center gap-1 mt-0.5">
//                 <Users size={11} className="text-gray-400" />
//                 <span className="text-[10px] text-gray-400">
//                   {memberCount} Members
//                 </span>
//               </div>
//             </div>
//           </div>
//           <span
//             className={`text-xs font-medium px-2.5 py-1 flex-shrink-0 ${
//               isAdmin
//                 ? "text-[#002FA7] bg-blue-50 border border-blue-100"
//                 : "text-gray-900 bg-gray-50 border border-gray-200"
//             }`}
//           >
//             {typeof role === "string"
//               ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
//               : "Member"}
//           </span>
//         </div>
//         {/* Placeholder illustration */}
//         <div className="w-full h-28 rounded-sm bg-gradient-to-br from-[#f0f2f8] to-[#e4e8f4]" />
//       </div>

//       <div className="px-5 py-3 border-t border-gray-50 bg-[#fafbff] flex items-center justify-between">
//         {isAdmin ? (
//           <>
//             <span className="text-xs text-gray-500">
//               Total Payments:{" "}
//               <strong className="text-[#000000]">{totalPayments ?? "—"}</strong>
//             </span>
//             <span className="text-xs text-gray-500">
//               Overdue:{" "}
//               <strong className="text-red-500">{overdueCount ?? "—"}</strong>
//             </span>
//           </>
//         ) : (
//           <>
//             <div className="flex items-center gap-1.5">
//               <Clock size={12} className="text-gray-400" />
//               <span className="text-xs text-gray-600">
//                 Next:{" "}
//                 <strong className="text-[#000000]">{nextPayment ?? "—"}</strong>
//               </span>
//             </div>
//             {paymentStatus && (
//               <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
//                 {paymentStatus}
//               </span>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// export default function CommunitiesHome() {
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const { data: communities = [], isLoading, error } = useCommunities();

//   const [sort, setSort] = useState("Recently Viewed");
//   const [sortOpen, setSortOpen] = useState(false);
//   const [view, setView] = useState("grid");

//   // Sort communities client-side
//   const sorted = [...communities].sort((a, b) => {
//     if (sort === "A-Z") return (a.name ?? "").localeCompare(b.name ?? "");
//     if (sort === "Z-A") return (b.name ?? "").localeCompare(a.name ?? "");
//     if (sort === "Newest First")
//       return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0);
//     // Recently Viewed — keep API order
//     return 0;
//   });

//   function handleCommunityClick(community) {
//     const id = community.slug ?? community.id;
//     // Store selected community so AdminDashboard can read it
//     localStorage.setItem("glass_community", JSON.stringify(community));
//     navigate(`/dashboard/admin?community=${id}`);
//   }

//   return (
//     <div className="flex flex-col h-full">
//       {/* Page header */}
//       <div className="flex items-center justify-between px-7 pt-7 pb-5">
//         <div>
//           <h1 className="text-lg font-semibold text-[#000000]">
//             Your Communities
//           </h1>
//           {user?.firstName && (
//             <p className="text-xs text-gray-400 mt-0.5">
//               Welcome back, {user.firstName}
//             </p>
//           )}
//         </div>
//         <div className="flex gap-2.5">
//           <button
//             onClick={() => navigate("/onboarding/choose-path")}
//             className="px-4 py-2 rounded-lg border border-[#002FA7] text-[#002FA7] bg-white text-xs font-medium hover:bg-blue-50 transition-all"
//           >
//             Join Community
//           </button>
//           <button
//             onClick={() => navigate("/onboarding/choose-path")}
//             className="px-4 py-2 rounded-lg bg-[#002FA7] text-white text-xs font-medium hover:opacity-90 transition-all"
//           >
//             Create Community
//           </button>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="flex items-center gap-3 px-7 pb-5">
//         <div className="relative">
//           <button
//             onClick={() => setSortOpen((o) => !o)}
//             className="flex items-center gap-1.5 px-3 py-2 rounded-sm border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all"
//           >
//             {sort} <ChevronDown size={13} />
//           </button>
//           {sortOpen && (
//             <div className="absolute top-full mt-1 left-0 bg-white rounded-xl border border-gray-100 shadow-lg z-50 min-w-40 overflow-hidden">
//               {SORT_OPTIONS.map((opt) => (
//                 <button
//                   key={opt}
//                   onClick={() => {
//                     setSort(opt);
//                     setSortOpen(false);
//                   }}
//                   className={`w-full px-4 py-2.5 text-left text-xs transition-all ${
//                     sort === opt
//                       ? "bg-blue-50 font-medium"
//                       : "text-gray-600 hover:bg-gray-50"
//                   }`}
//                 >
//                   {opt}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="flex gap-1 ml-auto">
//           {[
//             {
//               id: "grid",
//               icon: (
//                 <svg
//                   width="15"
//                   height="15"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                 >
//                   <rect x="3" y="3" width="7" height="7" />
//                   <rect x="14" y="3" width="7" height="7" />
//                   <rect x="3" y="14" width="7" height="7" />
//                   <rect x="14" y="14" width="7" height="7" />
//                 </svg>
//               ),
//             },
//             {
//               id: "list",
//               icon: (
//                 <svg
//                   width="15"
//                   height="15"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                 >
//                   <line x1="3" y1="6" x2="21" y2="6" />
//                   <line x1="3" y1="12" x2="21" y2="12" />
//                   <line x1="3" y1="18" x2="21" y2="18" />
//                 </svg>
//               ),
//             },
//           ].map((v) => (
//             <button
//               key={v.id}
//               onClick={() => setView(v.id)}
//               className={`w-8 h-8 rounded-sm border flex items-center justify-center transition-all ${
//                 view === v.id
//                   ? "bg-blue-50 border-blue-200 text-[#002FA7]"
//                   : "border-gray-200 bg-white text-gray-600"
//               }`}
//             >
//               {v.icon}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Error */}
//       {error && (
//         <div className="mx-7 mb-5 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-100">
//           <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
//           <p className="text-sm text-red-500">
//             Couldn't load communities. Please refresh.
//           </p>
//         </div>
//       )}

//       {/* Grid / List */}
//       <div
//         className={`px-7 pb-10 grid gap-4 ${
//           view === "grid" ? "grid-cols-3" : "grid-cols-1"
//         }`}
//       >
//         {isLoading ? (
//           Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
//         ) : sorted.length === 0 ? (
//           <div className="col-span-3 flex flex-col items-center justify-center py-20 gap-3">
//             <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
//               <Users size={24} className="text-[#002FA7]" />
//             </div>
//             <p className="text-sm font-medium text-gray-700">
//               No communities yet
//             </p>
//             <p className="text-xs text-gray-400 text-center max-w-xs">
//               Create or join a community to get started.
//             </p>
//           </div>
//         ) : (
//           sorted.map((community, i) => (
//             <CommunityCard
//               key={community.id ?? community.slug ?? i}
//               community={community}
//               onClick={() => handleCommunityClick(community)}
//             />
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Users,
  Clock,
  AlertCircle,
  Grid,
  List,
} from "lucide-react";
import { useCommunitiesWithMetrics } from "../../hooks/useCommunities";
import { useAuth } from "../../store/AuthContext";
import { resolveIsPayingAdmin } from "../../utils/communityRole";
import Background from "../../assets/background.png";

const SORT_OPTIONS = ["Recently Viewed", "A-Z", "Z-A", "Newest First"];

// Derive 2-letter tag from community name
function getTag(name = "") {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatNaira(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("NGN", "₦");
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden animate-pulse">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-2.5 bg-gray-100 rounded w-1/2" />
          </div>
          <div className="w-14 h-5 bg-gray-100 rounded" />
        </div>
        <div className="w-full h-28 bg-gray-100 rounded-sm" />
      </div>
      <div className="px-5 py-3 border-t border-gray-50 bg-gray-50 flex justify-between">
        <div className="h-2.5 bg-gray-200 rounded w-1/3" />
        <div className="h-2.5 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  );
}

// ── Community card ───────────────────────────────────────────────────────────
function CommunityCard({ community, onClick }) {
  // memberRole comes straight from the API: e.g. "ADMIN" | "MEMBER" | "OWNER"
  const role = community.memberRole ?? "MEMBER";
  const isAdmin =
    role.toUpperCase() === "ADMIN" ||
    role.toUpperCase() === "OWNER" ||
    community.owned;

  const tag = getTag(community.name ?? community.slug ?? "GC");
  // The rich metrics object (totalMembers, overdueMembers, collectedAmount,
  // etc.) is only populated on the single-community detail endpoint, not
  // on this list — so it's usually {} here. Don't show "0 Members" as if
  // it were a real count; fall back to "—" like Collected/Outstanding do.
  const metrics = community.metrics ?? {};
  const memberCount = metrics.totalMembers ?? metrics.activeMembers ?? null;

  // Admin-facing stats from metrics
  const totalCollected = metrics.collectedAmount;
  const outstanding = metrics.outstandingAmount;

  // Member-facing data — not in the metrics object, so these are placeholders
  // until a per-member obligation endpoint is wired in. Hide rather than fake.
  const memberStatus = community.memberStatus; // ACTIVE | SUSPENDED | EXITED etc.

  const logoUrl = community.logo?.url ?? null;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-100 overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg flex flex-col"
      style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}
    >
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={community.name}
                className="w-10 h-10 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div
                className={`w-10 h-10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                  isAdmin
                    ? "bg-gradient-to-br from-[#002FA7] to-[#4f6fe5]"
                    : "bg-gradient-to-br from-gray-500 to-gray-400"
                }`}
              >
                {tag}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-[#000000]">
                {community.name ?? community.slug}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Users size={11} className="text-gray-400" />
                <span className="text-[10px] text-gray-400">
                  {memberCount != null ? `${memberCount} Members` : "— Members"}
                </span>
              </div>
            </div>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 flex-shrink-0 ${
              isAdmin
                ? "text-[#002FA7] bg-blue-50 border border-blue-100"
                : "text-gray-900 bg-gray-50 border border-gray-200"
            }`}
          >
            {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
          </span>
        </div>

        {/* Placeholder illustration / logo banner */}
        <div className="w-full h-28 rounded-sm bg-gradient-to-br from-[#f0f2f8] to-[#e4e8f4]" />
      </div>

      <div className="px-5 py-3 border-t border-gray-50 bg-[#fafbff] flex items-center justify-between">
        {isAdmin ? (
          <>
            <span className="text-xs text-gray-500">
              Collected:{" "}
              <strong className="text-[#000000]">
                {totalCollected != null ? formatNaira(totalCollected) : "—"}
              </strong>
            </span>
            <span className="text-xs text-gray-500">
              Outstanding:{" "}
              <strong className="text-red-500">
                {outstanding != null && outstanding > 0 ? formatNaira(outstanding) : "—"}
              </strong>
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-gray-400" />
              <span className="text-xs text-gray-600">
                Status:{" "}
                <strong className="text-[#000000]">
                  {memberStatus ?? "—"}
                </strong>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CommunitiesHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, error } = useCommunitiesWithMetrics();

  if (user?.email?.toLowerCase() === "glasspayhq@gmail.com") {
    navigate("/dashboard/admin-panel", { replace: true });
    return null;
  }

  const communities = data?.communities ?? [];

  const [sort, setSort] = useState("Recently Viewed");
  const [sortOpen, setSortOpen] = useState(false);
  const [view, setView] = useState("grid");

  const sorted = [...communities].sort((a, b) => {
    if (sort === "A-Z") return (a.name ?? "").localeCompare(b.name ?? "");
    if (sort === "Z-A") return (b.name ?? "").localeCompare(a.name ?? "");
    if (sort === "Newest First")
      return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0);
    return 0; // Recently Viewed — keep API order
  });

  async function handleCommunityClick(community) {
    const id = community.slug ?? community.id;
    localStorage.setItem("glass_community", JSON.stringify(community));
    const isPaying = await resolveIsPayingAdmin(id);
    navigate(`/dashboard/${isPaying ? "admin/paying" : "admin"}?community=${id}`);
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundImage: `url(${Background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-7 pt-7 pb-5">
        <div>
          <h1 className="text-lg font-semibold text-[#000000]">
            Your Communities
          </h1>
          {user?.firstName && (
            <p className="text-xs text-gray-400 mt-0.5">
              Welcome back, {user.firstName}
            </p>
          )}
        </div>
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

      {/* Filters */}
      <div className="flex items-center gap-3 px-4 md:px-7 pb-5">
        <div className="relative">
          <button
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            {sort} <ChevronDown size={13} />
          </button>
          {sortOpen && (
            <div className="absolute top-full mt-1 left-0 bg-white rounded-xl border border-gray-100 shadow-lg z-50 min-w-40 overflow-hidden">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setSort(opt);
                    setSortOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-xs transition-all ${
                    sort === opt
                      ? "bg-blue-50 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-1 ml-auto">
          {[
            { id: "grid", icon: <Grid size={15} /> },
            { id: "list", icon: <List size={15} /> },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`w-8 h-8 rounded-sm border flex items-center justify-center transition-all ${
                view === v.id
                  ? "bg-blue-50 border-blue-200 text-[#002FA7]"
                  : "border-gray-200 bg-white text-gray-600"
              }`}
            >
              {v.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 md:mx-7 mb-5 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-100">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-500">
            Couldn't load communities. Please refresh.
          </p>
        </div>
      )}

      {/* Grid / List */}
      <div
        className={`px-4 md:px-7 pb-10 grid gap-4 ${
          view === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        }`}
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : sorted.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
              <Users size={24} className="text-[#002FA7]" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              No communities yet
            </p>
            <p className="text-xs text-gray-400 text-center max-w-xs">
              Create or join a community to get started.
            </p>
          </div>
        ) : (
          sorted.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              onClick={() => handleCommunityClick(community)}
            />
          ))
        )}
      </div>
    </div>
  );
}
