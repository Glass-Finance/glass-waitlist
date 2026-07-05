// import { useState } from "react";
// import {
//   Info, Download, MoreHorizontal, Plus, ChevronDown,
//   Search, X, ArrowLeft, RefreshCw, Zap, Check, AlertTriangle,
// } from "lucide-react";
// import Sidebar from "../../components/dashboard/Sidebar";
// import Topbar from "../../components/dashboard/Topbar";
// import totalMembersIcon     from "../../assets/dashboard/tdesign-member.png";
// import inactiveMembersIcon  from "../../assets/dashboard/inactive-members.png";
// import totalContribIcon     from "../../assets/dashboard/tcontributions.png";
// import activePlansIcon      from "../../assets/dashboard/active-plans.png";
// import TimerIcon            from "../../assets/dashboard/timer.png";
// import RecurringPayment from "../../assets/dashboard/recurring-payment.png";
// import OneTimePayment from "../../assets/dashboard/one-time-payment.png";
// import Background from "../../assets/dashboard/dashbackground.png"

// // ── Data ──────────────────────────────────────────────────────────────────────
// const STATS = [
//   { label: "Total Members",       value: "209",          icon: totalMembersIcon    },
//   { label: "Inactive Members",    value: "12",           icon: inactiveMembersIcon },
//   { label: "Total Contributions", value: "₦ 2,002,490", icon: totalContribIcon    },
//   { label: "Active Plans",        value: "05",           icon: activePlansIcon     },
// ];

// const MY_PAYMENTS = [
//   { member: "School Fees Support",        plan: "Monthly",  planColor: "#d4a017", planBg: "#fff8e7", amount: "₦5,000", due: "Mar 12, 2025", status: "Paid"   },
//   { member: "Infrastructure Development", plan: "One-Time", planColor: "#7c3aed", planBg: "#f3eeff", amount: "₦5,000", due: "Feb 24, 2025", status: "Unpaid" },
//   { member: "End Of Year Party",          plan: "Weekly",   planColor: "#059669", planBg: "#ecfdf5", amount: "₦5,000", due: "Apr 12, 2025", status: "Paid"   },
// ];

// const PLANS = [
//   { name: "Association Dues",           freq: "Monthly",  fColor: "#d4a017", fBg: "#fff8e7", members: "24 / 120", amount: "₦1.2M",    pct: 50, bar: "#CC8400"  },
//   { name: "Infrastructure Development", freq: "One-Time", fColor: "#7c3aed", fBg: "#f3eeff", members: "24 / 120", amount: "₦300,000", pct: 50, bar: "#800080"  },
//   { name: "End Of The Year Party",      freq: "Weekly",   fColor: "#059669", fBg: "#ecfdf5", members: "24 / 120", amount: "₦400,500", pct: 50, bar: "#099DA8"  },
// ];

// const ACTIVITY = [
//   { name: "Joseph Alabi",   action: "paid",                 detail: "₦20,200 for Infrastructure...", time: "5 hours ago", type: "payment",  aColor: "#059669", aBg: "#ecfdf5" },
//   { name: "Grace Adekunle", action: "joined the community", detail: "",                               time: "5 hours ago", type: "member",   aColor: "#002FA7", aBg: "#e6eeff" },
//   { name: "Emeka Nwosu",    action: "paid Event Fee",        detail: "₦15,000",                       time: "5 hours ago", type: "payment",  aColor: "#059669", aBg: "#ecfdf5" },
//   { name: null,             action: "Dues Reminder Sent to", detail: "12 members",                    time: "5 hours ago", type: "reminder", aColor: "#d4a017", aBg: "#fff8e7" },
// ];

// const PAYMENTS = [
//   { name: "Adehayor Okafor", plan: "Associatio...", dot: "#d4a017", amount: "₦5,000", date: "Mar 12, 2025", email: "adebayor@gmail.com", status: "Paid"    },
//   { name: "Chisom Eze",      plan: "Associatio...", dot: "#d4a017", amount: "₦5,000", date: "Mar 12, 2025", email: "chisom@gmail.com",   status: "Paid"    },
//   { name: "Tunde Nwosu",     plan: "Infrastruct...",dot: "#7c3aed", amount: "₦5,000", date: "Mar 12, 2025", email: "tunde@gmail.com",    status: "Pending" },
//   { name: "Blessing Igwe",   plan: "End Of The..", dot: "#059669",  amount: "₦5,000", date: "Mar 12, 2025", email: "blessing@gmail.com", status: "Failed"  },
//   { name: "Ibrahim Momoh",   plan: "Associatio...", dot: "#d4a017", amount: "₦5,000", date: "Mar 12, 2025", email: "ibrahim@gmail.com",  status: "Paid"    },
//   { name: "Habeeb Abayomi",  plan: "End Of The..", dot: "#059669",  amount: "₦5,000", date: "Mar 12, 2025", email: "habeeb@gmail.com",   status: "Failed"  },
//   { name: "Fatima Abdullah", plan: "Infrastruct...",dot: "#7c3aed", amount: "₦5,000", date: "Mar 12, 2025", email: "fatima@gmail.com",   status: "Pending" },
//   { name: "Kune Martins",    plan: "End Of The..", dot: "#059669",  amount: "₦5,000", date: "Mar 12, 2025", email: "kune@gmail.com",     status: "Failed"  },
// ];

// const STATUS_STYLE = {
//   Paid:    { bg: "#ecfdf5", color: "#059669" },
//   Unpaid:  { bg: "#fff1f2", color: "#e11d48" },
//   Pending: { bg: "#fffbeb", color: "#b45309" },
//   Failed:  { bg: "#fff1f2", color: "#e11d48" },
// };

// const FREQUENCIES = ["Monthly", "Weekly", "Quarterly", "Annually", "One-Time"];
// const REMINDERS   = ["Every Day", "Every 3 Days", "Every Week", "Every 2 Weeks"];

// // ── Shared ────────────────────────────────────────────────────────────────────
// const inputCls = "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white outline-none transition-all focus:border-[#002FA7]";

// function ActivityIcon({ type, color }) {
//   if (type === "payment") return (
//     <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
//       <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8"/>
//       <path d="M12 6v2m0 8v2M9 9h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
//     </svg>
//   );
//   if (type === "member") return (
//     <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
//       <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
//       <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8"/>
//     </svg>
//   );
//   return (
//     <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
//       <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
//       <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
//     </svg>
//   );
// }

// // ── Modal ─────────────────────────────────────────────────────────────────────
// function StepIndicator({ current }) {
//   const steps = [{ n: 1, label: "Plan Type" }, { n: 2, label: "Plan Details" }, { n: 3, label: "Review" }];
//   return (
//     <div className="flex items-center mb-6">
//       {steps.map((s, i) => {
//         const done = s.n < current, active = s.n === current;
//         return (
//           <div key={s.n} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
//             <div className="flex flex-col items-center gap-1 flex-shrink-0">
//               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-1 transition-all
//                 ${done ? "bg-[#002FA7] border-[#002FA7] text-white" : active ? "border-[#002FA7] text-[#002FA7] bg-white" : "border-gray-300 text-gray-400 bg-white"}`}>
//                 {done ? <Check size={13}/> : s.n}
//               </div>
//               <span className={`text-[11px] whitespace-nowrap ${active ? "font-medium text-[#002FA7]" : done ? "text-gray-600" : "text-gray-400"}`}>{s.label}</span>
//             </div>
//             {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${done ? "bg-[#002FA7]" : "bg-gray-200"}`}/>}
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// function Step1({ value, onChange }) {
//   return (
//     <div>
//       <p className="text-sm text-gray-500 mb-5">Choose the type of plan you want to create</p>
//       <div className="grid grid-cols-2 gap-3 items-center">
//         {[
//           { id: "recurring", icon: RecurringPayment, title: "Recurring", desc: "Members pay on a set schedule." },
//           { id: "one_time",  icon: OneTimePayment, title: "One Time",  desc: "A single payment for one purpose." },
//         ].map(opt => {
//           const sel = value === opt.id;
//           return (
//             <button key={opt.id} onClick={() => onChange(opt.id)}
//               className={`p-6 rounded-xl text-left border-1 transition-all relative cursor-pointer ${sel ? "border-[#002FA7] bg-blue-50" : "border-gray-200 bg-gray-10 hover:border-gray-300"}`}>
//               <div className={`absolute top-3 left-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${sel ? "bg-[#002FA7] border-[#002FA7]" : "border-gray-300 bg-transparent"}`}>
//                 {sel && <Check size={10} color="white" strokeWidth={3}/>}
//               </div>
//               <div className="mt-5 mb-2"><img src={opt.icon} alt={opt.title} className="w-6 h-6 mx-auto" /></div>
//               <p className="text-md font-small text-gray-900 text-center">{opt.title}</p>
//               <p className="text-xs text-gray-500 text-center">{opt.desc}</p>
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// function Step2({ form, onChange }) {
//   return (
//     <div className=" pr-1 space-y-3.5">
//       <div><label className="block text-sm font-medium text-gray-900 mb-1.5">Plan Name</label><input className={inputCls} value={form.name} placeholder="Enter plan name" onChange={e => onChange("name", e.target.value)}/></div>
//       <div><label className="block text-sm font-medium text-gray-900 mb-1.5">Description</label><textarea className={`${inputCls} resize-y`} value={form.description} placeholder="Briefly describe this plan..." rows={3} onChange={e => onChange("description", e.target.value)}/></div>
//       <div className="grid grid-cols-2 gap-3">
//         <div><label className="block text-sm font-medium text-gray-900 mb-1.5">Amount Per Member</label><input type="number" className={inputCls} value={form.amount} placeholder="₦0.00" onChange={e => onChange("amount", e.target.value)}/></div>
//         <div><label className="block text-sm font-medium text-gray-900 mb-1.5">Frequency</label>
//           <select className={inputCls} value={form.frequency} onChange={e => onChange("frequency", e.target.value)}>
//             <option value="" disabled>Select frequency</option>
//             {FREQUENCIES.map(o => <option key={o}>{o}</option>)}
//           </select>
//         </div>
//       </div>
//       <div className="grid grid-cols-2 gap-3">
//         <div><label className="block text-sm font-medium text-gray-900 mb-1.5">Start Date</label><input type="date" className={inputCls} value={form.startDate} onChange={e => onChange("startDate", e.target.value)}/></div>
//         <div><label className="block text-sm font-medium text-gray-900 mb-1.5">Due Date</label><input type="date" className={inputCls} value={form.dueDate} onChange={e => onChange("dueDate", e.target.value)}/></div>
//       </div>
//       <div>
//         <label className="block text-sm font-semibold text-gray-900 mb-1.5">Applies To</label>
//         <select className={inputCls} value={form.appliesTo} onChange={e => onChange("appliesTo", e.target.value)}>
//           <option value="" disabled>All Members (209)</option>
//           {["All Members (209)", "Specific Members", "Member Tier A", "Member Tier B"].map(o => <option key={o}>{o}</option>)}
//         </select>
//         <p className="text-xs text-gray-400 mt-1">You can adjust member assignment after creation.</p>
//       </div>
//       <div>
//         <label className="block text-sm font-semibold text-gray-900 mb-1.5">Set Auto Reminder</label>
//         <select className={inputCls} value={form.reminder} onChange={e => onChange("reminder", e.target.value)}>
//           <option value="" disabled>Select reminder frequency</option>
//           {REMINDERS.map(o => <option key={o}>{o}</option>)}
//         </select>
//         <p className="text-xs text-gray-400 mt-1">Reminders sent via SMS and email to unpaid members.</p>
//       </div>
//     </div>
//   );
// }

// function Step3({ planType, form }) {
//   const rows = [
//     { label: "Plan Name",        value: form.name || "—" },
//     { label: "Plan Type",        value: planType === "recurring" ? "Recurring" : "One Time" },
//     { label: "Amount Per Member",value: form.amount ? `₦${Number(form.amount).toLocaleString()}` : "—" },
//     { label: "Frequency",        value: form.frequency || "—" },
//     { label: "Due Date",         value: form.dueDate || "—" },
//     { label: "Applies To",       value: form.appliesTo || "All Members" },
//     { label: "Description",      value: form.description || "—" },
//   ];
//   return (
//     <div>
//       <div className="rounded-xl border border-gray-200 overflow-hidden mb-3">
//         {rows.map((r, i) => (
//           <div key={r.label} className={`flex justify-between px-4 py-3 text-sm ${i < rows.length - 1 ? "border-b border-gray-100" : ""} ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
//             <span className="text-gray-500 w-36 flex-shrink-0">{r.label}</span>
//             <span className="font-medium text-gray-900 text-right">{r.value}</span>
//           </div>
//         ))}
//       </div>
//       <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-gray-700">
//         Once created, assigned members will receive a notification. You can edit or pause this plan at any time.
//       </div>
//     </div>
//   );
// }

// function CreatePaymentPlanModal({ onClose }) {
//   const [step, setStep]         = useState(1);
//   const [planType, setPlanType] = useState("recurring");
//   const [success, setSuccess]   = useState(false);
//   const [form, setForm]         = useState({ name: "", description: "", amount: "", frequency: "", startDate: "", dueDate: "", appliesTo: "", reminder: "" });
//   const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
//   const canContinue = step === 1 ? !!planType : step === 2 ? !!(form.name && form.amount && form.frequency) : true;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(15,29,110,0.2)] backdrop-blur-sm"
//       onClick={e => e.target === e.currentTarget && onClose()}>
//       <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
//         <div className="flex items-start justify-between px-6 pt-5">
//           <div>
//             <h2 className="text-base font-medium text-[#000000]">Create Payment Plan</h2>
//             <p className="text-xs text-gray-400 mt-0.5">You can edit or pause any plan at any time.</p>
//           </div>
//           <button onClick={onClose} className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer"><X size={14}/></button>
//         </div>
//         <div className="px-6 py-4 flex-1 overflow-hidden flex flex-col">
//           {success ? (
//             <div className="text-center py-10">
//               <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><Check size={24} className="text-green-600" strokeWidth={2.5}/></div>
//               <h3 className="text-lg font-extrabold text-[#002FA7] mb-2">Plan Created Successfully!</h3>
//               <p className="text-sm text-gray-500 mb-6">Members assigned to this plan have been notified.</p>
//               <button onClick={onClose} className="px-8 py-2.5 rounded-full bg-[#002FA7] text-white font-bold text-sm hover:opacity-90 border-none cursor-pointer">Done</button>
//             </div>
//           ) : (
//             <>
//               <StepIndicator current={step}/>
//               <div className="flex-1 overflow-y-auto">
//                 {step === 1 && <Step1 value={planType} onChange={setPlanType}/>}
//                 {step === 2 && <Step2 form={form} onChange={update}/>}
//                 {step === 3 && <Step3 planType={planType} form={form}/>}
//               </div>
//             </>
//           )}
//         </div>
//         {!success && (
//           <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
//             <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
//               className="flex items-center gap-1.5 text-sm font-medium text-[#000000] bg-transparent border-none cursor-pointer hover:opacity-80">
//               <ArrowLeft size={13}/> {step > 1 ? "Back" : "Cancel"}
//             </button>
//             <button onClick={() => step < 3 ? setStep(s => s + 1) : setSuccess(true)} disabled={!canContinue}
//               className={`px-20 py-2.5 rounded-full text-sm font-medium border-none transition-all ${canContinue ? "bg-[#002FA7] text-white hover:opacity-90 cursor-pointer" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
//               {step === 3 ? "Create Plan" : "Continue"}
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// function AddMemberModal({ onClose }) {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(15,29,110,0.2)] backdrop-blur-sm"
//       onClick={e => e.target === e.currentTarget && onClose()}>
//       <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-10 text-center">
//         <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
//           <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
//             <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#002FA7" strokeWidth="1.8" strokeLinecap="round"/>
//             <circle cx="9" cy="7" r="4" stroke="#002FA7" strokeWidth="1.8"/>
//             <line x1="19" y1="8" x2="19" y2="14" stroke="#002FA7" strokeWidth="1.8" strokeLinecap="round"/>
//             <line x1="16" y1="11" x2="22" y2="11" stroke="#002FA7" strokeWidth="1.8" strokeLinecap="round"/>
//           </svg>
//         </div>
//         <h3 className="text-lg font-extrabold text-[#002FA7] mb-2">Add Member</h3>
//         <p className="text-sm text-gray-500 mb-6 leading-relaxed">This feature is coming soon! You'll be able to invite and onboard new members directly from the dashboard.</p>
//         <button onClick={onClose} className="px-8 py-2.5 rounded-full bg-[#002FA7] text-white font-bold text-sm hover:opacity-90 border-none cursor-pointer">Got it</button>
//       </div>
//     </div>
//   );
// }

// // ── Shared dashboard content ──────────────────────────────────────────────────
// function DashboardContent({ isPaying }) {
//   const [search, setSearch]               = useState("");
//   const [paymentPlanOpen, setPaymentPlanOpen] = useState(false);
//   const [addMemberOpen, setAddMemberOpen]     = useState(false);
//   const [alertVisible, setAlertVisible]   = useState(true);

//   const filtered = PAYMENTS.filter(p =>
//     p.name.toLowerCase().includes(search.toLowerCase()) ||
//     p.plan.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <main className="flex-1 px-6 py-5 overflow-y-auto" style={{ backgroundImage: `url(${Background})`, backgroundSize: "contain", backgroundPosition: "center" }}>

//       {/* Page header */}
//       <div className="flex items-start justify-between mb-5">
//         <div>
//           <h1 className="text-xl font-bold text-black">Dashboard</h1>
//           <p className="text-sm text-gray-400 mt-0.5">A full picture of your community's financial activity.</p>
//         </div>
//         <div className="flex gap-2.5">
//           <button onClick={() => setPaymentPlanOpen(true)}
//             className="px-4 py-2 rounded text-xs font-medium text-black bg-white border border-[#efeff1] hover:bg-gray-50 transition-all cursor-pointer">
//             Create Payment Plan
//           </button>
//           <button onClick={() => setAddMemberOpen(true)}
//             className="px-4 py-2 rounded text-xs font-medium text-white bg-[#002FA7] flex items-center gap-1.5 hover:opacity-90 transition-all border-none cursor-pointer">
//             <Plus size={14}/> Add Member
//           </button>
//         </div>
//       </div>

//       {/* Alert — paying only */}
//       {isPaying && alertVisible && (
//         <div className="flex items-start justify-between px-4 py-4 rounded-md mb-5 bg-[#D7E2FF] border border-blue-100">
//           <div className="flex items-start gap-6 ">
//             <AlertTriangle size={30} className="text-[#002FA7] flex-shrink-0 mt-1 border-[1.4px] p-1"/>
//             <div>
//               <p className="text-[13px] font-medium text-gray-800">Your School Fees Support payment is due in 3 days</p>
//               <p className="text-xs text-gray-500 mt-1">₦5,000 due Apr 1, 2025 · <span className="text-[#002FA7] font-medium">Auto-Pay is off</span></p>
//             </div>
//           </div>
//           <div className="flex items-center gap-2 ml-4 flex-shrink-0">
//             <button className="px-4 py-2 rounded-sm text-xs font-semibold text-[#002FA7] hover:opacity-90 border cursor-pointer">Pay Now</button>
//             <button onClick={() => setAlertVisible(false)} className="text-[#002FA7] hover:text-[#002FA7]/80 bg-transparent border-none cursor-pointer"><X size={20}/></button>
//           </div>
//         </div>
//       )}

//       {/* Stats */}
//       <div className="grid grid-cols-4 gap-3 mb-5">
//         {STATS.map(s => (
//           <div key={s.label} className="bg-[#EFEFF1] rounded-xl px-4 py-4 border border-[#eef0f8]" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
//             <div className="flex items-center justify-between mb-3">
//               <span className="text-sm text-gray-500 font-bold">{s.label}</span>
//               <Info size={14} className="text-[#002FA7]"/>
//             </div>
//             <div className="flex items-center gap-2.5">
//               <img src={s.icon} alt={s.label} className="w-8 h-8 object-contain flex-shrink-0"/>
//               <span className="text-[15px] font-bold text-black">{s.value}</span>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Your Payments — paying only */}
//       {isPaying && (
//         <div className="bg-[#F4F5F5]/60 rounded-xl border border-[#eef0f8] p-5 mb-5" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
//           <div className="flex items-center justify-between mb-4">
//             <span className="text-sm font-medium text-black">Your Payments</span>
//             <div className="flex gap-2">
//               <button className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 cursor-pointer">Sort ↕</button>
//               <button className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 cursor-pointer">Filter</button>
//             </div>
//           </div>
//           <table className="w-full text-sm border-collapse text-left">
//             <thead>
//               <tr className="border-b border-gray-100">
//                 {["Members", "Plan", "Amount", "Due Date", "Status", "Action"].map(h => (
//                   <th key={h} className="p-2 text-left text-xs text-gray-400">{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {MY_PAYMENTS.map((row, i) => {
//                 const s = STATUS_STYLE[row.status];
//                 return (
//                   <tr key={i} className="border-b border-gray-50 bg-gray-100">
//                     <td className="py-3 text-xs text-gray-800 ">{row.member}</td>
//                     <td className="py-3">
//                       <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: row.planColor, background: row.planBg }}>{row.plan}</span>
//                     </td>
//                     <td className="py-3 text-xs text-black">{row.amount}</td>
//                     <td className="py-3 text-xs text-gray-500">{row.due}</td>
//                     <td className="py-3">
//                       <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: s.color, background: s.bg }}>{row.status}</span>
//                     </td>
//                     <td className="py-3">
//                       <button className="text-xs font-semibold text-[#002FA7] hover:underline bg-transparent border-none cursor-pointer">Pay Now</button>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Payment Plans + Recent Activity */}
//       <div className="grid grid-cols-2 gap-3 mb-5">

//         {/* Payment Plans */}
//         <div className="rounded-xl border border-[#eef0f8] p-4 bg-[#D7E2FF]" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
//           <div className="flex items-center justify-between mb-4">
//             <span className="text-sm font-medium text-black">Payment Plans</span>
//             <button className="text-xs font-medium text-[#002FA7] bg-transparent border-none cursor-pointer hover:underline">Manage All</button>
//           </div>
//           <div className="flex flex-col gap-3">
//             {PLANS.map(p => (
//               <div key={p.name} className="bg-[#F4F5F5]/60 rounded-xl p-4 border border-blue-100/60">
//                 <div className="flex items-center justify-between mb-1.5">
//                   <div className="flex items-center gap-2 min-w-0">
//                     <span className="text-sm font-medium text-black truncate">{p.name}</span>
//                     <span className="text-[10px] font-normal px-2 py-0.5 rounded-full flex-shrink-0" style={{ color: p.fColor, background: p.fBg }}>{p.freq}</span>
//                   </div>
//                   <span className="text-sm font-bold text-gray-800 flex-shrink-0 ml-2">{p.amount}</span>
//                 </div>
//                 <p className="text-[11px] text-gray-400 mb-2">{p.members} members paid</p>
//                 <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
//                   <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.bar }}/>
//                 </div>
//                 <p className="text-[11px] text-gray-400 text-right mt-1">{p.pct}% Collected</p>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Recent Activity */}
//         <div className="bg-[EFEFF1]/90 rounded-xl border border-[#eef0f8] p-4" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
//           <span className="text-sm font-medium text-black block mb-4">Recent Activity</span>
//           {ACTIVITY.map((a, i) => (
//             <div key={i} className={`flex items-start gap-3 py-3 ${i < ACTIVITY.length - 1 ? "border-b border-gray-50" : ""}`}>
//               <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: a.aBg }}>
//                 <ActivityIcon type={a.type} color={a.aColor}/>
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="text-xs text-gray-700 leading-relaxed">
//                   {a.name && <strong className="text-[#002FA7] font-bold">{a.name} </strong>}
//                   {a.action}{a.detail && <> <strong className="text-black">{a.detail}</strong></>}
//                 </p>
//                 <div className="flex items-center gap-1 mt-1">
//                   <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
//                     <circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="1.8"/>
//                     <path d="M12 6v6l4 2" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/>
//                   </svg>
//                   <span className="text-[11px] text-gray-400">{a.time}</span>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Member Payments */}
//       <div className="bg-[#EFEFF1] rounded-xl border border-[#eef0f8]" style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}>
//         <div className="flex items-center justify-between px-5 pt-4 pb-0">
//           <span className="text-sm font-medium">Member Payments</span>
//           <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#002FA7] bg-white text-xs text-[#002FA7] hover:bg-gray-50 cursor-pointer">
//             <Download size={12}/> Export CSV
//           </button>
//         </div>
//         <div className="flex items-center justify-between px-5 py-3 gap-3">
//           <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-[#eef0f8] w-72">
//             <Search size={12} className="text-gray-400 flex-shrink-0"/>
//             <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members, payments, receipts..."
//               className="flex-1 bg-transparent border-none outline-none text-xs text-gray-600 placeholder-gray-400"/>
//           </div>
//           <div className="flex items-center gap-1.5 text-xs ">
//             Sort by:
//             <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-500 bg-white font-medium text-gray-500 cursor-pointer">
//               Recent <ChevronDown size={11}/>
//             </button>
//           </div>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm border-collapse">
//             <thead>
//               <tr className="border-y border-[#eef0f8] bg-gray-50">
//                 {["Members", "Plan", "Amount", "Date", "Email", "Status", "Actions"].map(h => (
//                   <th key={h} className="px-5 py-2.5 text-left text-xs text-gray-400 whitespace-nowrap">{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {filtered.map((row, i) => {
//                 const s = STATUS_STYLE[row.status];
//                 return (
//                   <tr key={i} className="border-b border-[#f3f4f8] hover:bg-[#fafbff] transition-colors cursor-default"
//                     onMouseEnter={e => e.currentTarget.style.background = "#fafbff"}
//                     onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
//                     <td className="px-5 py-3 text-sm font-medium text-[#002FA7] cursor-pointer">{row.name}</td>
//                     <td className="px-5 py-3">
//                       <div className="flex items-center gap-1.5">
//                         <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.dot }}/>
//                         <span className="text-sm text-black">{row.plan}</span>
//                       </div>
//                     </td>
//                     <td className="px-5 py-3 text-sm text-black">{row.amount}</td>
//                     <td className="px-5 py-3 text-sm text-black">{row.date}</td>
//                     <td className="px-5 py-3 text-sm text-black">{row.email}</td>
//                     <td className="px-5 py-3">
//                       <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: s.color, background: s.bg }}>{row.status}</span>

//                     </td>
//                     <td className="px-5 py-3">
//                       <div className="flex items-center gap-2">
//                         <button className="w-7 h-7 rounded-full border border-[#e0e3f0] bg-white flex items-center justify-center hover:bg-gray-50 cursor-pointer">
//                           <img src={TimerIcon} className="w-2.5 h-2.5 object-contain" alt="timer"/>
//                         </button>
//                         <button className="w-7 h-7 rounded-full border border-[#e0e3f0] bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer">
//                           <MoreHorizontal size={12}/>
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {paymentPlanOpen && <CreatePaymentPlanModal onClose={() => setPaymentPlanOpen(false)}/>}
//       {addMemberOpen   && <AddMemberModal         onClose={() => setAddMemberOpen(false)}  />}
//     </main>
//   );
// }

// // ── Exports ───────────────────────────────────────────────────────────────────

// // Non-paying admin: just the page content, no layout wrapper
// export default function AdminDashboard() {
//   return <DashboardContent isPaying={false} />;
// }

// // Paying admin: just the page content, no layout wrapper
// export function PayingAdminDashboard() {
//   return <DashboardContent isPaying={true} />;
// }

import { useState, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Info,
  Download,
  MoreHorizontal,
  Plus,
  ChevronDown,
  Search,
  X,
  ArrowLeft,
  Check,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Landmark,
  Copy,
  UploadCloud,
  Link as LinkIcon,
  FileSpreadsheet,
} from "lucide-react";
import { useCommunityDashboard } from "../../hooks/useCommunityDashboard";
import { usePaymentPlans } from "../../hooks/usePaymentPlans";
import { useCommunityMembers, useRoles } from "../../hooks/useCommunityMembers";
import { APP_ORIGIN } from "../../utils/deviceRedirect";
import {
  usePayments,
  useInitiatePayment,
  useManagePayments,
} from "../../hooks/usePayments";
import { useAuth } from "../../store/AuthContext";
import { getErrorMessage } from "../../utils/errorHandler";
import totalMembersIcon from "../../assets/dashboard/tdesign-member.png";
import inactiveMembersIcon from "../../assets/dashboard/inactive-members.png";
import totalContribIcon from "../../assets/dashboard/tcontributions.png";
import activePlansIcon from "../../assets/dashboard/active-plans.png";
import TimerIcon from "../../assets/dashboard/timer.png";
import RecurringPayment from "../../assets/dashboard/recurring-payment.png";
import OneTimePayment from "../../assets/dashboard/one-time-payment.png";
import Background from "../../assets/dashboard/dashbackground.png";

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(dateString) {
  if (!dateString) return "";
  const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const STATUS_STYLE = {
  paid: { bg: "#ecfdf5", color: "#059669", label: "Paid" },
  success: { bg: "#ecfdf5", color: "#059669", label: "Paid" },
  successful: { bg: "#ecfdf5", color: "#059669", label: "Paid" },
  unpaid: { bg: "#fff1f2", color: "#e11d48", label: "Unpaid" },
  pending: { bg: "#fffbeb", color: "#b45309", label: "Pending" },
  initiated: { bg: "#fffbeb", color: "#b45309", label: "Pending" },
  failed: { bg: "#fff1f2", color: "#e11d48", label: "Failed" },
};

function statusStyle(status = "") {
  return STATUS_STYLE[status.toLowerCase()] ?? STATUS_STYLE.pending;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

// ── Activity icon ─────────────────────────────────────────────────────────────
function ActivityIcon({ type, color }) {
  if (type === "payment")
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
        <path
          d="M12 6v2m0 8v2M9 9h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  if (type === "member")
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8" />
      </svg>
    );
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Admin payment confirmation modal ──────────────────────────────────────────
function AdminPaymentModal({ item, onClose }) {
  const initiatePayment = useInitiatePayment();
  const { data: authorisations } = useManagePayments();
  const [error, setError] = useState("");

  const savedMethod = (authorisations ?? []).find(
    (a) => (a.status ?? "").toUpperCase() === "ACTIVE",
  );
  const isRecurring = item.type === "recurring";
  const communityInitials = (item.communityName ?? "C")
    .slice(0, 2)
    .toUpperCase();

  async function handlePay() {
    setError("");
    try {
      // Store current URL so /payment/callback can send the admin back here
      sessionStorage.setItem(
        "paymentReturnTo",
        window.location.pathname + window.location.search,
      );
      const res = await initiatePayment.mutateAsync({
        paymentLinkId: item.paymentLinkId,
        payload: {
          idempotencyKey: crypto.randomUUID(),
          amount: item.amount,
          savePaymentMethod: isRecurring,
          ...(item.obligationId ? { obligationId: item.obligationId } : {}),
        },
      });
      const url = res.data?.data?.authorizationUrl;
      if (url) {
        window.location.href = url;
      } else {
        onClose();
      }
    } catch (err) {
      setError(
        getErrorMessage(err, "Could not start payment. Please try again."),
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-2xl"
        style={{ width: 560, maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100"
              style={{ background: "#f0f4ff" }}
            >
              {item.logo?.url ? (
                <img
                  src={item.logo.url}
                  alt=""
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <span className="text-[11px] font-bold text-[#002FA7]">
                  {communityInitials}
                </span>
              )}
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">
                Paying to
              </p>
              <p className="text-[15px] font-semibold text-gray-900 leading-tight">
                {item.communityName ?? "Community"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer bg-transparent border-none transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Amount hero ── */}
        <div
          className="px-7 py-8 text-center"
          style={{
            background: "linear-gradient(135deg, #002FA7 0%, #002FA7 100%)",
          }}
        >
          <p className="text-[12px] text-blue-200 uppercase tracking-widest mb-2 font-medium">
            Amount Due
          </p>
          <p className="text-[42px] font-bold text-white leading-none mb-3">
            {formatNaira(item.amount)}
          </p>
          <span
            className="inline-block text-[11px] font-semibold px-4 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
          >
            {isRecurring ? "Recurring Payment" : "One-Time Payment"}
          </span>
        </div>

        {/* ── Plan details ── */}
        <div className="px-7 py-6 border-b border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Plan Details
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Plan Name</span>
              <span className="text-sm font-medium text-gray-900">
                {item.name ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Schedule</span>
              <span
                className="text-[11px] font-semibold px-3 py-0.5 rounded-full"
                style={{ background: "#EEF1FB", color: "#002FA7" }}
              >
                {isRecurring ? "Recurring" : "One-Time"}
              </span>
            </div>
            {item.dueDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Due Date</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(item.dueDate).toLocaleDateString("en-NG", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-[17px] font-bold text-gray-900">
                {formatNaira(item.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Payment method ── */}
        <div className="px-7 py-5 border-b border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Payment Method
          </p>
          {savedMethod ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#EEF2FF" }}
              >
                <Landmark size={16} className="text-[#002FA7]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {savedMethod.bank ?? "Bank"} ●●●● {savedMethod.last4}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Saved payment method
                </p>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 rounded-xl border border-dashed border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                You'll select your payment method on the next screen.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-7 py-5 bg-gray-50 flex items-center justify-between gap-3">
          {error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : (
            <p className="text-xs text-gray-400">
              You'll be redirected to complete payment securely.
            </p>
          )}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePay}
              disabled={initiatePayment.isPending}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-60 border-none transition-opacity flex items-center gap-2"
              style={{ background: "#002FA7" }}
            >
              {initiatePayment.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Processing…
                </>
              ) : (
                `Pay ${formatNaira(item.amount)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Member modal ──────────────────────────────────────────────────────────
const ALLOWED_ROLE_NAMES = new Set(["Community Member", "Community Admin", "Community Manager"]);
const FALLBACK_ROLES = [{ id: "member", name: "Community Member" }];
const CSV_TEMPLATE = "First Name,Last Name,Email Address,Phone Number,Member ID,Role/Title\nFatimah,Yahya,Fatimah@example.com,0812990293,A23434,Student";

function AddMemberModal({ onClose, communityId }) {
  const [tab, setTab] = useState("upload");
  const [linkCopied, setLinkCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvRows, setCsvRows] = useState([]);
  const [csvError, setCsvError] = useState("");
  const [uploading, setUploading] = useState(false);

  // URL upload state
  const [fileUrl, setFileUrl] = useState("");
  const [urlStage, setUrlStage] = useState("idle"); // idle | fetching | complete
  const [urlProgress, setUrlProgress] = useState(0);
  const [urlFileInfo, setUrlFileInfo] = useState(null);
  const [urlCsvText, setUrlCsvText] = useState(null);

  // Manual tab state
  const [emails, setEmails] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [billingExempt, setBillingExempt] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");

  const fileRef = useRef(null);

  const inviteLink = communityId ? `${APP_ORIGIN}/member/join?community=${communityId}` : "";
  const { inviteMember } = useCommunityMembers(communityId);
  const { data: rolesData } = useRoles();
  const roles = (rolesData ?? []).filter((r) => ALLOWED_ROLE_NAMES.has(r.name));
  const finalRoles = roles.length ? roles : FALLBACK_ROLES;
  const defaultRole = finalRoles.find((r) => r.name === "Community Member") ?? finalRoles[0];
  const [roleId, setRoleId] = useState(defaultRole?.id ?? "");

  const inputCls = "w-full border border-[#797D86] p-3 rounded-sm text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#002FA7] transition-all";

  function copyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "members-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function parseCSV(text) {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    return lines.slice(1).map((line) => {
      const [firstName, lastName, email, phone, memberId, role] = line.split(",").map((s) => s?.trim() ?? "");
      return { firstName, lastName, email, phone, memberId, role };
    }).filter((r) => r.email);
  }

  function handleFile(file) {
    if (!file || !file.name.endsWith(".csv")) { setCsvError("Please upload a .csv file."); return; }
    setCsvError("");
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setCsvRows(parseCSV(e.target.result));
    reader.readAsText(file);
  }

  function handleDrop(e) { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }

  async function handleUrlUpload() {
    const url = fileUrl.trim();
    if (!url) return;
    setCsvError("");
    setUrlStage("fetching");
    setUrlProgress(8);
    const tick = setInterval(() => setUrlProgress((p) => (p < 88 ? p + Math.random() * 18 : p)), 250);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Couldn't download a file from that URL.");
      const text = await res.text();
      clearInterval(tick);
      setUrlProgress(100);
      const sizeKb = new Blob([text]).size / 1024;
      const name = url.split("/").pop() || "file.csv";
      setUrlFileInfo({ name, sizeLabel: sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(sizeKb))} KB` });
      setUrlCsvText(text);
      setCsvRows(parseCSV(text));
      setUrlStage("complete");
    } catch {
      clearInterval(tick);
      setUrlStage("idle");
      setUrlProgress(0);
      setCsvError("Failed to fetch CSV from URL.");
    }
  }

  function clearUrlUpload() {
    setUrlStage("idle"); setUrlProgress(0); setUrlFileInfo(null);
    setUrlCsvText(null); setFileUrl(""); setCsvRows([]);
  }

  async function handleUploadCSV() {
    if (!csvRows.length) return;
    setUploading(true);
    for (const row of csvRows) {
      if (!row.email) continue;
      try { await inviteMember.mutateAsync({ email: row.email, roleId: finalRoles[0]?.id ?? "", billingExempt: false }); }
      catch { /* skip failed rows */ }
    }
    setUploading(false);
    setCsvRows([]); setCsvFile(null); clearUrlUpload();
  }

  function commitEmailChip() {
    const val = emailInput.trim().replace(/[,;]+$/, "");
    if (val && !emails.includes(val)) setEmails((arr) => [...arr, val]);
    setEmailInput("");
  }
  function handleEmailKeyDown(e) {
    if (e.key === "Enter" || e.key === "," || e.key === " ") { e.preventDefault(); commitEmailChip(); }
    else if (e.key === "Backspace" && !emailInput && emails.length > 0) setEmails((arr) => arr.slice(0, -1));
  }

  async function handleSendInvite() {
    if (emails.length === 0) return;
    setManualError("");
    setManualLoading(true);
    try {
      const results = await Promise.allSettled(
        emails.map((em) => inviteMember.mutateAsync({ email: em, roleId, billingExempt }))
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      if (succeeded === 0) throw results.find((r) => r.status === "rejected")?.reason ?? new Error("Failed to send invites.");
      setEmails([]); setPhoneNumbers(""); onClose();
    } catch (err) {
      setManualError(err?.response?.data?.description ?? err?.message ?? "Failed to send invites.");
    } finally {
      setManualLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,29,110,0.2)] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#EFEFEF] rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-7 pb-4">
          <div>
            <h2 className="text-base font-medium text-gray-900 mb-1">Add your members</h2>
            <p className="text-sm text-gray-500">Add your members now or invite them to join on their own. You can always add more from your dashboard later.</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 bg-white cursor-pointer flex-shrink-0 ml-4">
            <X size={14} />
          </button>
        </div>

        <div className="px-8 pb-8 flex flex-col gap-5">
          {/* Invite link banner */}
          <div className="flex items-center justify-between px-5 py-4 rounded-xl"
            style={{ background: "#D7E2FF", border: "1px solid #0E628C33" }}>
            <div>
              <p className="text-xs text-gray-900 mb-0.5">Your community is ready to grow.</p>
              <p className="text-xs text-gray-500">Copy this link and share it with your members to get them on Glass.</p>
            </div>
            <button onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#002FA7] text-xs font-semibold text-[#002FA7] hover:bg-white transition-all flex-shrink-0 ml-6 cursor-pointer bg-transparent">
              <Copy size={12} />{linkCopied ? "Copied!" : "Copy Link"}
            </button>
          </div>

          {/* Direct add card */}
          <div className="bg-white rounded-lg p-6" style={{ border: "1px solid #E5E7EB" }}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Prefer To Add Members Directly?</h3>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-200 mb-5">
              {["upload", "manual"].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className="pb-2.5 text-sm font-medium capitalize bg-transparent border-none cursor-pointer transition-all"
                  style={{ color: tab === t ? "#002FA7" : "#9ca3af", borderBottom: tab === t ? "2px solid #002FA7" : "2px solid transparent" }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Upload tab */}
            {tab === "upload" && (
              <>
                <p className="text-sm font-semibold text-gray-900 mb-4">Upload a CSV</p>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">Upload a CSV file with following sample information</p>
                  <button onClick={downloadTemplate}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#002FA7] hover:opacity-80 bg-transparent border-none cursor-pointer">
                    <Download size={12} />Download Template
                  </button>
                </div>

                <div className="rounded-md overflow-hidden mb-4" style={{ border: "1px solid #E5E7EB" }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        {["First Name", "Last Name", "Email Address", "Phone Number", "Member ID", "Role/Title"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-gray-100">
                        {["Fatimah", "Yahya", "Fati***ya@**.com", "0812990293", "A23434", "Student"].map((cell, i) => (
                          <td key={i} className={`px-4 py-3 ${i === 2 ? "text-[#002FA7] underline" : "text-gray-900"}`}>{cell}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className="w-full rounded-lg flex flex-col items-center justify-center py-14 cursor-pointer transition-all mb-5"
                  style={{ minHeight: 140, background: dragOver ? "#EEF2FF" : "#FAFAFA", border: dragOver ? "2px dashed #002FA7" : "2px dashed #D1D5DB" }}
                >
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                  <UploadCloud size={30} className="text-gray-400 mb-3" />
                  {csvFile
                    ? <p className="text-xs text-[#002FA7] font-medium">{csvFile.name} — {csvRows.length} rows</p>
                    : <p className="text-xs text-gray-500">Drag and Drop CSV here or <span className="text-[#002FA7] font-medium underline">Browse</span></p>}
                  {csvError && <p className="text-xs text-red-500 mt-2">{csvError}</p>}
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Or Upload from URL</p>
                  <div className="flex gap-2">
                    <input type="url" value={fileUrl}
                      onChange={(e) => { setFileUrl(e.target.value); if (urlStage !== "idle") clearUrlUpload(); }}
                      placeholder="Add File URL" className={inputCls}
                      disabled={urlStage === "fetching"} />
                    <button onClick={handleUrlUpload} disabled={!fileUrl.trim() || urlStage === "fetching" || uploading}
                      className="px-5 py-2 rounded-sm bg-[#002FA733] text-xs text-[#002FA7] hover:bg-[#002FA7]/10 transition-all flex-shrink-0 border-none cursor-pointer disabled:opacity-50">
                      Upload
                    </button>
                  </div>

                  {urlStage === "fetching" && (
                    <div className="mt-3 rounded-lg flex flex-col items-center justify-center py-10"
                      style={{ border: "2px dashed #002FA7", background: "#EEF2FF" }}>
                      <div className="relative w-16 h-16 mb-3">
                        <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                          <circle cx="32" cy="32" r="28" fill="none" stroke="#E0E3F0" strokeWidth="6" />
                          <circle cx="32" cy="32" r="28" fill="none" stroke="#002FA7" strokeWidth="6"
                            strokeDasharray={2 * Math.PI * 28}
                            strokeDashoffset={2 * Math.PI * 28 * (1 - urlProgress / 100)}
                            strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.2s linear" }} />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-900">
                          {Math.round(urlProgress)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">Uploading File...</p>
                      <button onClick={clearUrlUpload}
                        className="px-4 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all bg-white border border-gray-300 cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  )}

                  {urlStage === "complete" && urlFileInfo && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg px-4 py-3" style={{ border: "1px solid #E5E7EB" }}>
                      <FileSpreadsheet size={20} className="text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-900 truncate">{urlFileInfo.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          {urlFileInfo.sizeLabel} • <Check size={11} className="text-green-600" /> <span className="text-green-600 font-medium">Complete</span>
                        </p>
                      </div>
                      <button onClick={clearUrlUpload} aria-label="Remove file"
                        className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer flex-shrink-0">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {csvRows.length > 0 && (
                  <button onClick={handleUploadCSV} disabled={uploading}
                    className="w-full py-3.5 rounded-full text-white font-semibold text-sm bg-[#002FA7] hover:opacity-90 active:scale-[0.98] transition-all mt-5 border-none cursor-pointer disabled:opacity-60">
                    {uploading ? "Sending invites…" : `Send Invites to ${csvRows.length} Members`}
                  </button>
                )}
              </>
            )}

            {/* Manual tab */}
            {tab === "manual" && (
              <>
                <p className="text-sm font-medium text-gray-900 mb-2">Enter Email(s):</p>
                <div className="rounded-lg p-3 flex flex-wrap items-center gap-2 mb-5"
                  style={{ minHeight: 60, border: "1px solid #E5E7EB", background: "#fff" }}>
                  {emails.map((em, i) => (
                    <span key={em + i} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full text-sm text-gray-800" style={{ background: "#F3F4F6" }}>
                      <span className="w-6 h-6 rounded-full bg-[#D7E2FF] text-[#002FA7] text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                        {em.charAt(0).toUpperCase()}
                      </span>
                      {em}
                      <button onClick={() => setEmails((arr) => arr.filter((_, idx) => idx !== i))}
                        aria-label={`Remove ${em}`}
                        className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer flex items-center justify-center">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={handleEmailKeyDown}
                    onBlur={commitEmailChip}
                    placeholder={emails.length === 0 ? "Type an email and press Enter" : ""}
                    className="flex-1 min-w-[160px] outline-none text-sm bg-transparent border-none py-1"
                  />
                </div>

                <p className="text-sm font-medium text-gray-900 mb-2">
                  Enter Phone Number(s) <span className="text-gray-400 font-normal">(Optional):</span>
                </p>
                <input
                  type="text"
                  value={phoneNumbers}
                  onChange={(e) => setPhoneNumbers(e.target.value)}
                  placeholder="Enter Phone Number"
                  className={`${inputCls} mb-5`}
                />

                <p className="text-sm font-medium text-gray-900 mb-2">Role:</p>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className={`${inputCls} mb-4`}
                >
                  {finalRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>

                <label className="flex items-center gap-2 text-sm text-gray-600 mb-5 cursor-pointer">
                  <input type="checkbox" checked={billingExempt} onChange={(e) => setBillingExempt(e.target.checked)} />
                  Exempt from billing
                </label>

                {manualError && <p className="text-xs text-red-500 mb-3">{manualError}</p>}

                <div className="flex justify-end">
                  <button onClick={handleSendInvite} disabled={emails.length === 0 || manualLoading}
                    className="px-6 py-3.5 rounded-full text-white font-semibold text-sm bg-[#002FA7] hover:opacity-90 active:scale-[0.98] transition-all border-none cursor-pointer disabled:opacity-50">
                    {manualLoading ? "Sending…" : "Send Invite"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard content ─────────────────────────────────────────────────────────
function DashboardContent({ isPaying, communityId }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState("desc"); // desc = Recent, asc = Oldest
  const [alertVisible, setAlertVisible] = useState(true);
  const [payingItem, setPayingItem] = useState(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const { balances, members, transactions, obligations, activity, isLoading, error } =
    useCommunityDashboard(communityId);
  const { plans, isLoading: plansLoading } = usePaymentPlans(communityId);

  // Paying admin's own dues, as a member of this community
  const { data: myPayments } = usePayments();
  const myUpcoming = myPayments?.upcoming ?? [];

  // Open the confirmation modal instead of calling the API directly
  function handlePayMine(item) {
    setPayingItem(item);
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
      const last  = m.user?.lastName  ?? m.lastName  ?? "";
      const name  = `${first} ${last}`.trim() || m.user?.email || m.email || null;
      if (!name) continue;
      if (m.id)        byMemberId[String(m.id)] = name;
      if (m.user?.id)  byUserId[String(m.user.id)] = name;
    }
    return { byMemberId, byUserId };
  }, [members.list]);

  function resolveMemberName(tx) {
    // 1. Try the members list (most reliable — has proper first/last name)
    const mid = tx.member?.id ?? tx.memberId;
    if (mid && memberNameMap.byMemberId[String(mid)]) return memberNameMap.byMemberId[String(mid)];
    const uid = tx.member?.user?.id ?? tx.user?.id ?? tx.userId;
    if (uid && memberNameMap.byUserId[String(uid)]) return memberNameMap.byUserId[String(uid)];
    // 2. Fall back to whatever name fields the transaction itself carries
    const u = tx.member?.user ?? tx.user ?? tx.payer ?? tx.member ?? {};
    const f = u.firstName ?? tx.firstName ?? "";
    const l = u.lastName  ?? tx.lastName  ?? "";
    const full = `${f} ${l}`.trim();
    return full || null;
  }

  // ── Per-plan metrics computed from obligations + transactions ────────────────
  // getCommunityPaymentLinks doesn't populate raw.metrics, so paidCount /
  // totalCount / pct are all 0 from shapePlan. We recompute them here from the
  // obligations (audience size + paid status) and transactions (amount collected).
  const planMetrics = useMemo(() => {
    const SUCCESS_STATUSES = new Set(["SUCCESS", "SUCCESSFUL", "PAID"]);
    const byPlan = {};

    // Obligations tell us who's in each plan and whether they've paid
    for (const ob of obligations) {
      const planId = ob.paymentLink?.id;
      if (!planId) continue;
      if (!byPlan[planId]) byPlan[planId] = { collected: 0, paidCount: 0, seenMemberIds: new Set() };

      const mid = String(ob.member?.id ?? ob.member?.user?.id ?? ob.user?.id ?? ob.id ?? Math.random());
      if (!byPlan[planId].seenMemberIds.has(mid)) {
        byPlan[planId].seenMemberIds.add(mid);
      }

      const s = (ob.status ?? "").toUpperCase();
      if (s === "PAID" || s === "SUCCESSFUL") byPlan[planId].paidCount++;
    }

    // Transactions tell us the real amount collected
    for (const tx of transactions) {
      const planId = tx.paymentLink?.id;
      if (!planId) continue;
      if (!byPlan[planId]) byPlan[planId] = { collected: 0, paidCount: 0, seenMemberIds: new Set() };
      if (SUCCESS_STATUSES.has((tx.status ?? "").toUpperCase())) {
        byPlan[planId].collected += tx.amount ?? 0;
      }
    }

    // Freeze member sets into counts
    const result = {};
    for (const [id, m] of Object.entries(byPlan)) {
      result[id] = { collected: m.collected, paidCount: m.paidCount, totalCount: m.seenMemberIds.size };
    }
    return result;
  }, [obligations, transactions]);

  // ── Filter payments by search ─────────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          (t.memberName ?? t.description ?? "").toLowerCase().includes(q) ||
          (t.planName ?? "").toLowerCase().includes(q) ||
          (t.email ?? "").toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      const ta = new Date(a.createdAt ?? a.date ?? 0).getTime();
      const tb = new Date(b.createdAt ?? b.date ?? 0).getTime();
      return sortDir === "desc" ? tb - ta : ta - tb;
    });
  }, [transactions, search, sortDir]);

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
      <main
        className="flex-1 px-6 py-5 overflow-y-auto"
        style={{
          backgroundImage: `url(${Background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Page header */}
        <div className="flex items-start justify-between mb-5">
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
              className="px-4 py-2 rounded text-xs font-medium text-white bg-[#002FA7] flex items-center gap-1.5 hover:opacity-90 transition-all border-none cursor-pointer"
            >
              <Plus size={14} /> Add Member
            </button>
          </div>
        </div>

        {/* Alert — paying admin with an unpaid obligation */}
        {isPaying &&
          alertVisible &&
          (() => {
            const due = myUpcoming.filter(
              (o) => (o.status ?? "").toUpperCase() !== "PAID",
            )[0];
            if (!due) return null;
            const daysLeft = due.dueDate
              ? Math.ceil((new Date(due.dueDate) - new Date()) / 86400000)
              : null;
            return (
              <div className="flex items-start justify-between px-4 py-4 rounded-md mb-5 bg-[#D7E2FF] border border-blue-100">
                <div className="flex items-start gap-6">
                  <AlertTriangle
                    size={18}
                    className="text-[#002FA7] flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-gray-800">
                      Your {due.name} payment
                      {daysLeft != null
                        ? ` is due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
                        : " is due soon"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatNaira(due.amount)}
                      {due.dueDate
                        ? ` due ${new Date(due.dueDate).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => handlePayMine(due)}
                    className="px-4 py-2 rounded-sm text-xs font-semibold text-[#002FA7] border cursor-pointer"
                  >
                    Pay Now
                  </button>
                  <button
                    onClick={() => setAlertVisible(false)}
                    className="text-[#002FA7] bg-transparent border-none cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            );
          })()}

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl px-4 py-3 border border-[#eef0f8]"
              style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-medium">
                  {s.label}
                </span>
                <Info size={13} className="text-[#002FA7]" />
              </div>
              <div className="flex items-center gap-2.5">
                <img
                  src={s.icon}
                  alt={s.label}
                  className="w-7 h-7 object-contain flex-shrink-0"
                />
                {isLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <span className="text-[13px] font-semibold text-black">
                    {s.value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Your Payments — paying admin's own dues in this community */}
        {isPaying && (
          <div
            className="bg-[#F4F5F5]/60 rounded-xl border border-[#eef0f8] p-5 mb-5"
            style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-black">
                Your Payments
              </span>
            </div>
            {myUpcoming.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                Nothing due right now.
              </p>
            ) : (
              <table className="w-full text-sm border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Plan", "Amount", "Due Date", "Status", "Action"].map(
                      (h) => (
                        <th
                          key={h}
                          className="p-2 text-left text-xs text-gray-400"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {myUpcoming.map((row) => {
                    const s = statusStyle(
                      (row.status === "PAID" || row.status === "SUCCESSFUL") ? "paid" : "unpaid",
                    );
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-gray-50 bg-gray-100"
                      >
                        <td className="py-3 text-xs text-gray-800">
                          {row.name}
                        </td>
                        <td className="py-3 text-xs text-black">
                          {formatNaira(row.amount)}
                        </td>
                        <td className="py-3 text-xs text-gray-500">
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
                        <td className="py-3">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ color: s.color, background: s.bg }}
                          >
                            {s.label}
                          </span>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handlePayMine(row)}
                            className="text-xs font-semibold text-[#002FA7] hover:underline bg-transparent border-none cursor-pointer"
                          >
                            Pay Now
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Payment Plans + Recent Activity */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Payment Plans */}
          <div
            className="rounded-xl border border-[#eef0f8] p-4 bg-[#D7E2FF]"
            style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-black">
                Payment Plans
              </span>
              <button
                onClick={() =>
                  navigate(`/dashboard/payments?community=${communityId ?? ""}`)
                }
                className="text-xs font-medium text-[#002FA7] bg-transparent border-none cursor-pointer hover:underline"
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
            ) : plans.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                No payment plans yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {plans.map((p, idx) => {
                  const cm = planMetrics[p.id] ?? {};
                  const paidCount  = cm.paidCount  ?? p.paidCount  ?? 0;
                  const totalCount = cm.totalCount  > 0 ? cm.totalCount : (p.totalCount > 0 ? p.totalCount : members.total);
                  const collected  = cm.collected   ?? p.amountCollected ?? 0;
                  const expected   = p.amount > 0 && totalCount > 0 ? p.amount * totalCount : p.expectedAmount ?? 0;
                  const pct        = expected > 0 ? Math.min(100, Math.round((collected / expected) * 100)) : 0;
                  const BAR_COLORS = ["#d4a017", "#7c3aed", "#099DA8", "#059669", "#002FA7", "#e11d48"];
                  const barColor   = BAR_COLORS[idx % BAR_COLORS.length];
                  return (
                    <div
                      key={p.id}
                      className="bg-[#F4F5F5]/60 rounded-xl p-4 border border-blue-100/60"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium text-black truncate">
                            {p.name}
                          </span>
                          <span
                            className="text-[10px] font-normal px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ color: "#7c3aed", background: "#f3eeff" }}
                          >
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
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: barColor }}
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
            className="bg-white rounded-xl border border-[#eef0f8] p-4"
            style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}
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
              <p className="text-xs text-gray-400 text-center py-6">
                No recent activity.
              </p>
            ) : (
              recentActivity.map((a, i) => {
                const event = a.event ?? "";
                const failed = a.result === "FAILED";
                const isPmt = event.includes("PAYMENT");
                const aColor = failed
                  ? "#e11d48"
                  : isPmt
                    ? "#059669"
                    : "#002FA7";
                const aBg = failed ? "#fff1f2" : isPmt ? "#ecfdf5" : "#e6eeff";
                const type = isPmt
                  ? "payment"
                  : event.includes("MEMBER")
                    ? "member"
                    : undefined;
                const actorName = [a.actor?.firstName, a.actor?.lastName]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <div
                    key={a.id ?? i}
                    className={`flex items-start gap-3 py-3 ${i < recentActivity.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: aBg }}
                    >
                      <ActivityIcon type={type} color={aColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {actorName && !a.description?.startsWith(actorName) && (
                          <strong className="text-[#002FA7] font-semibold">
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
          className="bg-[#EFEFF1] rounded-xl border border-[#eef0f8]"
          style={{ boxShadow: "0 1px 4px rgba(0,47,167,0.05)" }}
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-0">
            <span className="text-sm font-medium">Member Payments</span>
            <button
              disabled
              title="Export CSV — coming soon"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-xs text-gray-400 cursor-not-allowed"
            >
              <Download size={12} /> Export CSV
            </button>
          </div>

          <div className="flex items-center justify-between px-5 py-3 gap-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-[#eef0f8] w-72">
              <Search size={12} className="text-gray-400 flex-shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members, payments, receipts..."
                className="flex-1 bg-transparent border-none outline-none text-xs text-gray-600 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
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
                <tr className="border-y border-[#eef0f8] bg-gray-50">
                  {[
                    "Member",
                    "Plan",
                    "Amount",
                    "Date",
                    "Email",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-2.5 text-left text-xs text-gray-400 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
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
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm text-gray-400"
                    >
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx, i) => {
                    const s = statusStyle(tx.status ?? "pending");
                    return (
                      <tr
                        key={tx.id ?? i}
                        className="border-b border-[#f3f4f8] hover:bg-[#fafbff] transition-colors cursor-default"
                      >
                        <td className="px-5 py-3 text-xs font-medium text-[#002FA7]">
                          {resolveMemberName(tx) ?? (tx.member?.user?.email ?? tx.user?.email ?? tx.email ?? "—")}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#d4a017]" />
                            <span className="text-xs text-black">
                              {tx.planName ?? tx.description ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-black">
                          {formatNaira(tx.amount)}
                        </td>
                        <td className="px-5 py-3 text-xs text-black">
                          {formatDate(tx.createdAt ?? tx.date)}
                        </td>
                        <td className="px-5 py-3 text-xs text-black">
                          {tx.member?.user?.email ?? tx.user?.email ?? tx.payer?.email ?? tx.member?.email ?? tx.email ?? "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ color: s.color, background: s.bg }}
                          >
                            {s.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
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
