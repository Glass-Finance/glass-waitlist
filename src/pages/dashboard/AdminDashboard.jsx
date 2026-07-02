// import { useState } from "react";
// import {
//   Info, Download, MoreHorizontal, Plus, ChevronDown,
//   Search, X, ArrowLeft, RefreshCw, Zap, Check, AlertTriangle,
// } from "lucide-react";
// import Sidebar from "../../components/dashboard/Sidebar";
// import Topbar from "../../components/dashboard/Topbar";
// import totalMembersIcon     from "../../assets/dashboard/tdesign-member.webp";
// import inactiveMembersIcon  from "../../assets/dashboard/inactive-members.webp";
// import totalContribIcon     from "../../assets/dashboard/tcontributions.webp";
// import activePlansIcon      from "../../assets/dashboard/active-plans.webp";
// import TimerIcon            from "../../assets/dashboard/timer.webp";
// import RecurringPayment from "../../assets/dashboard/recurring-payment.webp";
// import OneTimePayment from "../../assets/dashboard/one-time-payment.webp";
// import Background from "../../assets/dashboard/dashbackground.webp"


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
//               <div className="mt-5 mb-2"><img src={opt.icon} alt={opt.title} className="w-6 h-6 mx-auto" decoding="async" loading="lazy" /></div>
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
//               <h3 className="text-lg font-extrabold text-[#0f1d6e] mb-2">Plan Created Successfully!</h3>
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
//         <h3 className="text-lg font-extrabold text-[#0f1d6e] mb-2">Add Member</h3>
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
//               <img src={s.icon} alt={s.label} className="w-8 h-8 object-contain flex-shrink-0" decoding="async" loading="lazy"/>
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
//                           <img src={TimerIcon} className="w-2.5 h-2.5 object-contain" alt="timer" decoding="async" loading="lazy"/>
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

import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Info, Download, MoreHorizontal, Plus, ChevronDown,
  Search, X, ArrowLeft, Check, AlertTriangle, AlertCircle,
  Loader2,
} from "lucide-react";
import { useCommunityDashboard } from "../../hooks/useCommunityDashboard";
import { usePaymentPlans } from "../../hooks/usePaymentPlans";
import { usePayments, useInitiatePayment } from "../../hooks/usePayments";
import { useAuth } from "../../store/AuthContext";
import totalMembersIcon    from "../../assets/dashboard/tdesign-member.webp";
import inactiveMembersIcon from "../../assets/dashboard/inactive-members.webp";
import totalContribIcon    from "../../assets/dashboard/tcontributions.webp";
import activePlansIcon     from "../../assets/dashboard/active-plans.webp";
import TimerIcon           from "../../assets/dashboard/timer.webp";
import RecurringPayment    from "../../assets/dashboard/recurring-payment.webp";
import OneTimePayment      from "../../assets/dashboard/one-time-payment.webp";
import Background          from "../../assets/dashboard/dashbackground.webp";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatNaira(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount).replace("NGN", "₦");
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
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
  paid:    { bg: "#ecfdf5", color: "#059669", label: "Paid"    },
  success: { bg: "#ecfdf5", color: "#059669", label: "Paid"    },
  unpaid:  { bg: "#fff1f2", color: "#e11d48", label: "Unpaid"  },
  pending: { bg: "#fffbeb", color: "#b45309", label: "Pending" },
  failed:  { bg: "#fff1f2", color: "#e11d48", label: "Failed"  },
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
  if (type === "payment") return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8"/>
      <path d="M12 6v2m0 8v2M9 9h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
  if (type === "member") return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8"/>
    </svg>
  );
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

// ── Dashboard content ─────────────────────────────────────────────────────────
function DashboardContent({ isPaying, communityId }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch]           = useState("");
  const [sortDir, setSortDir]         = useState("desc"); // desc = Recent, asc = Oldest
  const [alertVisible, setAlertVisible] = useState(true);

  const { balances, members, transactions, activity, isLoading, error } =
    useCommunityDashboard(communityId);
  const { plans, isLoading: plansLoading } = usePaymentPlans(communityId);

  // Paying admin's own dues, as a member of this community
  const { data: myPayments } = usePayments();
  const initiatePayment = useInitiatePayment();
  const myUpcoming = myPayments?.upcoming ?? [];

  async function handlePayMine(item) {
    try {
      const res = await initiatePayment.mutateAsync({
        paymentLinkId: item.paymentLinkId,
        payload: { email: myPayments?.user?.email },
      });
      const url = res.data?.data?.authorizationUrl;
      if (url) window.location.href = url;
    } catch {
      // Surfaced via initiatePayment.error in the table below
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const activePlanCount = plans.filter((p) => p.status === "ACTIVE").length;
  const stats = useMemo(() => [
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
  ], [isLoading, plansLoading, members, balances, activePlanCount]);

  // ── Filter payments by search ─────────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          (t.memberName ?? t.description ?? "").toLowerCase().includes(q) ||
          (t.planName ?? "").toLowerCase().includes(q) ||
          (t.email ?? "").toLowerCase().includes(q)
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
            onClick={() => navigate(`/dashboard/payments?community=${communityId ?? ""}`)}
            className="px-4 py-2 rounded text-xs font-medium text-black bg-white border border-[#efeff1] hover:bg-gray-50 transition-all cursor-pointer"
          >
            Create Payment Plan
          </button>
          <button
            onClick={() => navigate(`/dashboard/members?community=${communityId ?? ""}`)}
            className="px-4 py-2 rounded text-xs font-medium text-white bg-[#1C2B8A] flex items-center gap-1.5 hover:opacity-90 transition-all border-none cursor-pointer"
          >
            <Plus size={14}/> Add Member
          </button>
        </div>
      </div>

      {/* Alert — paying admin with an unpaid obligation */}
      {isPaying && alertVisible && (() => {
        const due = myUpcoming.filter(o => (o.status ?? "").toUpperCase() !== "PAID")[0];
        if (!due) return null;
        const daysLeft = due.dueDate
          ? Math.ceil((new Date(due.dueDate) - new Date()) / 86400000)
          : null;
        return (
          <div className="flex items-start justify-between px-4 py-4 rounded-md mb-5 bg-[#D7E2FF] border border-blue-100">
            <div className="flex items-start gap-6">
              <AlertTriangle size={18} className="text-[#002FA7] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-medium text-gray-800">
                  Your {due.name} payment{daysLeft != null ? ` is due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}` : " is due soon"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatNaira(due.amount)}{due.dueDate ? ` due ${new Date(due.dueDate).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <button
                onClick={() => handlePayMine(due)}
                disabled={initiatePayment.isPending}
                className="px-4 py-2 rounded-sm text-xs font-semibold text-[#002FA7] border cursor-pointer disabled:opacity-50"
              >
                Pay Now
              </button>
              <button
                onClick={() => setAlertVisible(false)}
                className="text-[#002FA7] bg-transparent border-none cursor-pointer"
              >
                <X size={20}/>
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
              <span className="text-xs text-gray-500 font-medium">{s.label}</span>
              <Info size={13} className="text-[#002FA7]"/>
            </div>
            <div className="flex items-center gap-2.5">
              <img src={s.icon} alt={s.label} className="w-7 h-7 object-contain flex-shrink-0" decoding="async" loading="lazy"/>
              {isLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <span className="text-[13px] font-semibold text-black">{s.value}</span>
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
            <span className="text-sm font-medium text-black">Your Payments</span>
          </div>
          {myUpcoming.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Nothing due right now.</p>
          ) : (
            <table className="w-full text-sm border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Plan", "Amount", "Due Date", "Status", "Action"].map((h) => (
                    <th key={h} className="p-2 text-left text-xs text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myUpcoming.map((row) => {
                  const s = statusStyle(row.status === "PAID" ? "paid" : "unpaid");
                  return (
                    <tr key={row.id} className="border-b border-gray-50 bg-gray-100">
                      <td className="py-3 text-xs text-gray-800">{row.name}</td>
                      <td className="py-3 text-xs text-black">{formatNaira(row.amount)}</td>
                      <td className="py-3 text-xs text-gray-500">
                        {row.dueDate ? new Date(row.dueDate).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="py-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: s.color, background: s.bg }}>
                          {s.label}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handlePayMine(row)}
                          disabled={initiatePayment.isPending}
                          className="text-xs font-semibold text-[#002FA7] hover:underline bg-transparent border-none cursor-pointer disabled:opacity-50"
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
            <span className="text-sm font-medium text-black">Payment Plans</span>
            <button
              onClick={() => navigate(`/dashboard/payments?community=${communityId ?? ""}`)}
              className="text-xs font-medium text-[#002FA7] bg-transparent border-none cursor-pointer hover:underline"
            >
              Manage All
            </button>
          </div>

          {plansLoading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : plans.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No payment plans yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {plans.map((p) => {
                const pct = p.pct;
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
                      {p.paidCount} / {p.totalCount} members paid
                    </p>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#7c3aed]"
                        style={{ width: `${pct}%` }}
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
            <p className="text-xs text-gray-400 text-center py-6">No recent activity.</p>
          ) : (
            recentActivity.map((a, i) => {
              const event = a.event ?? "";
              const failed = a.result === "FAILED";
              const isPmt = event.includes("PAYMENT");
              const aColor = failed ? "#e11d48" : isPmt ? "#059669" : "#002FA7";
              const aBg    = failed ? "#fff1f2" : isPmt ? "#ecfdf5"  : "#e6eeff";
              const type   = isPmt ? "payment" : event.includes("MEMBER") ? "member" : undefined;
              const actorName = [a.actor?.firstName, a.actor?.lastName].filter(Boolean).join(" ");
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
                        <strong className="text-[#002FA7] font-semibold">{actorName} </strong>
                      )}
                      {a.description ?? event.replaceAll("_", " ").toLowerCase() ?? "activity"}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="1.8"/>
                        <path d="M12 6v6l4 2" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/>
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
            <Download size={12}/> Export CSV
          </button>
        </div>

        <div className="flex items-center justify-between px-5 py-3 gap-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-[#eef0f8] w-72">
            <Search size={12} className="text-gray-400 flex-shrink-0"/>
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
              onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-500 bg-white font-medium text-gray-500 cursor-pointer hover:bg-gray-50"
            >
              {sortDir === "desc" ? "Recent" : "Oldest"} <ChevronDown size={11} className={sortDir === "asc" ? "rotate-180" : ""}/>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-y border-[#eef0f8] bg-gray-50">
                {["Member", "Plan", "Amount", "Date", "Email", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-xs text-gray-400 whitespace-nowrap">
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
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
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
                        {tx.memberName ?? tx.userName ?? "—"}
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
                        {tx.email ?? tx.memberEmail ?? "—"}
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
                            <img src={TimerIcon} className="w-2.5 h-2.5 object-contain" alt="Send reminder" decoding="async" loading="lazy"/>
                          </button>
                          <button
                            disabled
                            title="More options — coming soon"
                            className="w-7 h-7 rounded-full border border-[#e0e3f0] bg-white flex items-center justify-center text-gray-400 cursor-not-allowed opacity-40"
                          >
                            <MoreHorizontal size={12}/>
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
        return JSON.parse(localStorage.getItem("glass_community") ?? "{}").slug ??
               JSON.parse(localStorage.getItem("glass_community") ?? "{}").id ??
               null;
      } catch { return null; }
    })();

  return <DashboardContent isPaying={false} communityId={communityId} />;
}

export function PayingAdminDashboard() {
  const [searchParams] = useSearchParams();
  const communityId =
    searchParams.get("community") ??
    (() => {
      try {
        return JSON.parse(localStorage.getItem("glass_community") ?? "{}").slug ??
               JSON.parse(localStorage.getItem("glass_community") ?? "{}").id ??
               null;
      } catch { return null; }
    })();

  return <DashboardContent isPaying={true} communityId={communityId} />;
}
