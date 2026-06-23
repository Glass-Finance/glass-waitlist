// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Bell } from "lucide-react";
// import GlassLogo from "../../assets/Glass.png";
// import Background from "../../assets/background.png";

// const SIDEBAR_STEPS = [
//   {
//     id: "organization",
//     label: "Organization Profile",
//     icon: (
//       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
//         <circle cx="12" cy="7" r="4" />
//       </svg>
//     ),
//   },
//   {
//     id: "payment",
//     label: "Payment Profile",
//     icon: (
//       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//         <rect x="2" y="5" width="20" height="14" rx="2" />
//         <line x1="2" y1="10" x2="22" y2="10" />
//       </svg>
//     ),
//   },
//   {
//     id: "members",
//     label: "Members",
//     icon: (
//       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
//         <circle cx="9" cy="7" r="4" />
//         <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
//         <path d="M16 3.13a4 4 0 0 1 0 7.75" />
//       </svg>
//     ),
//   },
// ];

// // Accurate Paystack logo using their real brand colors
// function PaystackLogo() {
//   return (
//     <div className="flex items-center gap-2.5">
//       {/* Paystack icon — teal/green stacked lines */}
//       <div className="flex flex-col gap-[3px] justify-center" style={{ width: "32px", height: "32px" }}>
//         <div className="rounded-full" style={{ height: "7px", background: "#00C3F7" }} />
//         <div className="rounded-full" style={{ height: "7px", background: "#0BA4DB" }} />
//         <div className="rounded-full w-3/4" style={{ height: "7px", background: "#0BA4DB", opacity: 0.5 }} />
//       </div>
//       <span className="text-xl font-bold tracking-tight" style={{ color: "#111827", fontFamily: "var(--font-sans)" }}>
//         paystack
//       </span>
//     </div>
//   );
// }

// export default function PaymentProfile() {
//   const navigate = useNavigate();
//   const [connected, setConnected] = useState(false);
//   const [connecting, setConnecting] = useState(false);

//   const handleConnect = () => {
//     setConnecting(true);
//     setTimeout(() => {
//       setConnecting(false);
//       setConnected(true);
//     }, 1500);
//   };

//   const activeStep = "payment";
//   const completedSteps = ["organization"];

//   return (
//     <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F0F0F2]" style={{ backgroundImage: `url(${Background})`, backgroundSize: "contain", backgroundPosition: "center" }}>

//       {/* ── Navbar ── */}
//       <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 flex-shrink-0">
//         <div className="flex items-center gap-2">
//           <img src={GlassLogo} alt="Glass" className="w-7 h-7 object-contain" />
//           <span className="font-semibold text-base text-gray-900">Glass</span>
//         </div>
//         <div className="flex items-center gap-4">
//           <button className="text-gray-400 hover:text-gray-600 transition-colors">
//             <Bell size={20} />
//           </button>
//           <div className="text-right">
//             <p className="text-sm font-semibold text-gray-900">Amina Agrawal</p>
//             <p className="text-xs text-gray-500">amina@gmail.com</p>
//           </div>
//         </div>
//       </header>

//       {/* ── Body ── */}
//       <div className="flex flex-1 overflow-hidden">

//         {/* ── Sidebar ── */}
//         <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col pt-10 px-6 h-full">
//           {SIDEBAR_STEPS.map((step, index) => {
//             const isActive = step.id === activeStep;
//             const isCompleted = completedSteps.includes(step.id);
//             const isLast = index === SIDEBAR_STEPS.length - 1;

//             return (
//               <div key={step.id} className="flex items-start gap-4">
//                 <div className="flex flex-col items-center">
//                   <div
//                     className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all
//                       ${isActive || isCompleted
//                         ? "bg-[#002FA7] text-white"
//                         : "bg-white border-2 border-gray-300 text-gray-400"
//                       }`}
//                   >
//                     {isCompleted ? (
//                       <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
//                         <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
//                       </svg>
//                     ) : (
//                       step.icon
//                     )}
//                   </div>
//                   {!isLast && (
//                     <div
//                       className="w-px my-1 transition-all duration-500"
//                       style={{
//                         minHeight: "40px",
//                         background: isCompleted ? "#002FA7" : "#E5E7EB",
//                       }}
//                     />
//                   )}
//                 </div>
//                 <div className="pt-1.5 pb-10">
//                   <span
//                     className={`text-sm font-medium transition-all
//                       ${isActive ? "text-[#002FA7]"
//                         : isCompleted ? "text-gray-600"
//                         : "text-gray-400"
//                       }`}
//                   >
//                     {step.label}
//                   </span>
//                 </div>
//               </div>
//             );
//           })}
//         </aside>

//         {/* ── Main ── */}
//         <main className="flex-1 overflow-y-auto py-10 px-12">
//           <div className="w-full max-w-4xl">

//             {/* Heading */}
//             <div className="mb-8">
//               <h2 className="text-md font-semibold text-gray-900 mb-1">
//                 Set up your payment profile
//               </h2>
//               <p className="text-sm text-gray-500">
//                 This is how Glass will collect and manage dues on behalf of your community.
//               </p>
//             </div>

//             {/* Paystack Card */}
//             <div className="bg-[#EFEFF1] rounded-lg px-6 py-4" style={{ border: "1px solid #E5E7EB", width: 800 }}>

//               {/* Logo row + connected badge */}
//               <div className="flex items-center justify-between mb-5">
//                 <PaystackLogo />
//                 {connected && (
//                   <div className="flex items-center gap-1.5">
//                     <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
//                     <span className="text-sm font-semibold text-green-600">Connected</span>
//                   </div>
//                 )}
//               </div>

//               {/* Description */}
//               <div className="mb-5">
//                 <p className="text-sm font-semibold text-gray-900 mb-2">
//                   Connect your payment account
//                 </p>
//                 <p className="text-sm text-gray-500">
//                   Glass uses Paystack to receive and manage your community's payments securely.
//                 </p>
//               </div>
//             </div>
//             <div className="mt-8 max-w-4xl flex item-center justify-center gap-4">
//               {/* Connect button — unconnected state */}
//               {!connected && (
//                 <button
//                   onClick={handleConnect}
//                   disabled={connecting}
//                   className="py-3.5 rounded-full text-white font-medium text-xs bg-[#002FA7] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
//                   style={{width: "50%"}}
//                 >
//                   {connecting ? "Connecting..." : "Connect Paystack"}
//                 </button>
//               )}

//               {/* Continue button — connected state */}
//               {connected && (
//                 <button
//                   onClick={() => navigate("/onboarding/members")}
//                   className="py-3.5 rounded-full text-white font-medium text-xs bg-[#002FA7] hover:opacity-90 active:scale-[0.98] transition-all"
//                   style={{width: "50%"}}
//                 >
//                   Continue
//                 </button>
//               )}
// </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }


/**
 * PaymentProfile.jsx — wired to API
 *
 * Flow:
 *   1. User selects bank + enters account number
 *   2. Resolve account → GET /api/v1/finance/resolve-account?bankCode=&accountNumber=
 *      → shows account name for confirmation
 *   3. Save → POST /api/v1/communities/{communityId}/account
 *      { settlementBank, settlementBankCode, accountNumber }
 *   4. Navigate to AddMembers with communityId/slug in state
 *
 * Banks list → GET /api/v1/finance/banks (fetched on mount)
 */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, ChevronDown } from "lucide-react";
import GlassLogo from "../../assets/Glass.png";
import Background from "../../assets/background.png";
import client from "../../api/client";

const STEPS = [
  { id: "organization", label: "Organization Profile" },
  { id: "payment",      label: "Payment Profile"      },
  { id: "members",      label: "Members"              },
];

const inputCls =
  "w-full border border-gray-300 bg-[#F0F0F2] p-3 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/10 transition-all";

function StepIcon({ id, completed }) {
  if (completed) return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {id === "organization" && <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
      {id === "payment"      && <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>}
      {id === "members"      && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>}
    </svg>
  );
}

function PaystackLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex flex-col gap-[3px]" style={{ width: 32, height: 32 }}>
        <div className="rounded-full" style={{ height: 7, background: "#00C3F7" }} />
        <div className="rounded-full" style={{ height: 7, background: "#0BA4DB" }} />
        <div className="rounded-full w-3/4" style={{ height: 7, background: "#0BA4DB", opacity: 0.5 }} />
      </div>
      <span className="text-xl font-bold tracking-tight text-gray-900">paystack</span>
    </div>
  );
}

export default function PaymentProfile() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const { email, communityId, communitySlug, communityName } = location.state ?? {};

  const [banks,       setBanks]       = useState([]);
  const [bankCode,    setBankCode]    = useState("");
  const [bankName,    setBankName]    = useState("");
  const [accNumber,   setAccNumber]   = useState("");
  const [accName,     setAccName]     = useState("");
  const [resolving,   setResolving]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  // Fetch banks on mount
  useEffect(() => {
    client.get("/api/v1/finance/banks")
      .then(({ data }) => { if (data.success) setBanks(data.data ?? []); })
      .catch(() => {});
  }, []);

  // Auto-resolve when both bank + 10-digit account are set
  useEffect(() => {
    if (!bankCode || accNumber.length !== 10) { setAccName(""); return; }
    const timer = setTimeout(async () => {
      setResolving(true);
      setError("");
      try {
        const { data } = await client.get("/api/v1/finance/resolve-account", {
          params: { bankCode, accountNumber: accNumber },
        });
        if (data.success) setAccName(data.data?.accountName ?? "");
        else setError("Could not resolve account. Check the number and try again.");
      } catch {
        setError("Could not resolve account. Check the number and try again.");
      } finally {
        setResolving(false);
      }
    }, 700); // debounce
    return () => clearTimeout(timer);
  }, [bankCode, accNumber]);

  const handleBankChange = (e) => {
    const selected = banks.find((b) => b.code === e.target.value);
    setBankCode(selected?.code ?? "");
    setBankName(selected?.name ?? "");
    setAccName("");
  };

  const handleSave = async () => {
    if (!accName)   { setError("Please resolve a valid account first."); return; }
    if (!communityId) { setError("Community ID missing — go back and retry."); return; }
    setSaving(true);
    setError("");
    try {
      await client.post(`/api/v1/communities/${communityId}/account`, {
        settlementBank:     bankName,
        settlementBankCode: bankCode,
        accountNumber:      accNumber,
      });
      navigate("/onboarding/members", {
        state: { email, communityId, communitySlug, communityName },
      });
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to save account. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () =>
    navigate("/onboarding/members", {
      state: { email, communityId, communitySlug, communityName },
    });

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "100vh", backgroundImage: `url(${Background})`, backgroundSize: "contain", backgroundPosition: "center" }}
    >
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={GlassLogo} alt="Glass" className="w-7 h-7 object-contain" />
          <span className="font-semibold text-base text-gray-900">Glass</span>
        </div>
        <div className="flex items-center gap-4">
          <Bell size={20} className="text-gray-400" />
          <p className="text-sm text-gray-600">{email}</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col pt-10 px-6">
          {STEPS.map((step, i) => {
            const isActive    = step.id === "payment";
            const isCompleted = step.id === "organization";
            const isLast      = i === STEPS.length - 1;
            return (
              <div key={step.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isActive || isCompleted ? "bg-[#002FA7] text-white" : "bg-white border-2 border-gray-300 text-gray-400"}`}>
                    <StepIcon id={step.id} completed={isCompleted} />
                  </div>
                  {!isLast && <div className="w-px my-1" style={{ minHeight: 40, background: isCompleted ? "#002FA7" : "#E5E7EB" }} />}
                </div>
                <div className="pt-1.5 pb-10">
                  <span className={`text-sm font-medium ${isActive ? "text-[#002FA7]" : isCompleted ? "text-gray-600" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto py-10 px-12">
          <div className="w-full max-w-3xl">
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Set up your payment profile</h2>
              <p className="text-sm text-gray-500">
                Add your community's bank account so Glass knows where to settle collected dues.
              </p>
            </div>

            {/* Paystack header card */}
            <div className="bg-[#EFEFF1] rounded-lg px-6 py-5 mb-6" style={{ border: "1px solid #E5E7EB" }}>
              <div className="flex items-center justify-between mb-4">
                <PaystackLogo />
                {accName && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-sm font-semibold text-green-600">Account verified</span>
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Connect your settlement account</p>
              <p className="text-sm text-gray-500">
                Glass uses Paystack to receive and settle your community's payments. Enter your bank account below.
              </p>
            </div>

            {/* Bank + account number */}
            <div className="grid grid-cols-2 gap-5 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Bank</label>
                <div className="relative">
                  <select
                    value={bankCode}
                    onChange={handleBankChange}
                    className={inputCls + " appearance-none pr-8"}
                  >
                    <option value="" disabled>Select bank</option>
                    {banks.map((b) => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Account Number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={accNumber}
                  onChange={(e) => { setAccNumber(e.target.value.replace(/\D/g, "")); setAccName(""); }}
                  placeholder="10-digit account number"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Resolved account name */}
            {(resolving || accName) && (
              <div className="mb-5 px-4 py-3 rounded-xl flex items-center gap-2"
                style={{ background: accName ? "#ecfdf5" : "#f9fafb", border: `1px solid ${accName ? "#86efac" : "#e5e7eb"}` }}>
                {resolving
                  ? <span className="text-sm text-gray-500">Verifying account…</span>
                  : <><div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                      <span className="text-sm font-semibold text-green-700">{accName}</span></>
                }
              </div>
            )}

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <div className="flex gap-4 justify-center mt-8">
              <button
                onClick={handleSave}
                disabled={saving || resolving || !accName}
                className="py-3.5 px-12 rounded-full text-white font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all border-none cursor-pointer disabled:opacity-50"
                style={{ background: "#002FA7" }}
              >
                {saving ? "Saving…" : "Continue"}
              </button>
              <button
                onClick={handleSkip}
                className="py-3.5 px-10 rounded-full font-medium text-sm border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
              >
                Skip for now
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}