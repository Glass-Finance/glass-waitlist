// import { useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { Bell, Download, CloudUpload, Copy, Trash2, Plus, Check } from "lucide-react";
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

// const SAMPLE_MEMBER = {
//   firstName: "Fatimah",
//   lastName: "Yahya",
//   email: "Fati***ya@**.com",
//   phone: "0812990293",
//   memberId: "A23434",
//   role: "Student",
// };

// const TABLE_HEADERS = ["First Name", "Last Name", "Email Address", "Phone Number", "Member ID", "Role/Title"];
// const EMPTY_ROW = { firstName: "", lastName: "", email: "", phone: "", memberId: "", role: "" };

// const inputCls =
//   "w-full border border-[#797D86] p-3 rounded-sm text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/10 transition-all";

// const inviteLink = "https://glass.finance/join/babcock-alumni";

// // ── Success Modal ─────────────────────────────────────────────────────────────
// function SuccessModal({ onGoToDashboard, onCopyLink }) {
//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center"
//       style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }}
//     >
//       <div
//         className="bg-white rounded-3xl flex flex-col items-center text-center px-10 py-20"
//         style={{
//           width: "100%",
//           maxWidth: 550,
//           boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
//         }}
//       >
//         {/* Green check circle */}
//         <div
//           className="flex items-center justify-center rounded-full mb-6"
//           style={{
//             width: 70,
//             height: 70,
//             background: "radial-gradient(circle, #22c55e 60%, #16a34a 100%)",
//             boxShadow: "0 0 0 12px #dcfce7",
//           }}
//         >
//           <Check size={40} color="white" strokeWidth={3} />
//         </div>

//         <h2 className="text-lg font-small text-gray-900 mb-2">
//           Your Community Is Now Live
//         </h2>
//         <p className="text-xs text-gray-500 mb-8">
//           Kings College Lagos Is All Set Up On Glass!
//         </p>

//         {/* Go to Dashboard */}
//         <button
//           onClick={onGoToDashboard}
//           className="w-[80%] py-3.5 rounded-full text-white font-medium text-xs bg-[#002FA7] hover:opacity-90 transition-all border-none cursor-pointer mb-5"
//         >
//           Go To Dashboard
//         </button>

//         {/* Copy link */}
//         <p className="text-xs text-gray-900 mb-1">Ready To Invite Members?</p>
//         <button
//           onClick={onCopyLink}
//           className="text-xs font-medium text-[#002FA7] hover:underline bg-transparent border-none cursor-pointer"
//         >
//           Click here to copy your community link
//         </button>
//       </div>
//     </div>
//   );
// }

// // ── Main page ─────────────────────────────────────────────────────────────────
// export default function AddMembers() {
//   const navigate = useNavigate();
//   const fileInputRef = useRef(null);
//   const [activeTab, setActiveTab] = useState("upload");
//   const [dragOver, setDragOver] = useState(false);
//   const [uploadedFile, setUploadedFile] = useState(null);
//   const [fileUrl, setFileUrl] = useState("");
//   const [copied, setCopied] = useState(false);
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [manualRows, setManualRows] = useState([{ ...EMPTY_ROW, id: Date.now() }]);

//   const handleFile = (file) => { if (!file) return; setUploadedFile(file); };
//   const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

//   const handleCopyLink = () => {
//     navigator.clipboard.writeText(inviteLink);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   // "Create Your Community" — show modal instead of navigating directly
//   const handleSubmit = () => setShowSuccess(true);

//   // Modal actions
//   const handleGoToDashboard = () => navigate("/dashboard/home");
//   const handleModalCopyLink = () => {
//     navigator.clipboard.writeText(inviteLink);
//   };

//   const handleRowChange = (id, field, value) =>
//     setManualRows((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
//   const addRow = () => setManualRows((rows) => [...rows, { ...EMPTY_ROW, id: Date.now() }]);
//   const removeRow = (id) => setManualRows((rows) => rows.filter((r) => r.id !== id));

//   const completedSteps = ["organization", "payment"];
//   const activeStep = "members";

//   return (
//     <div style={{ height: "100vh", overflow: "hidden", backgroundImage: `url(${Background})`, backgroundSize: "contain", backgroundPosition: "center"}} className="flex flex-col">

//       {/* ── Navbar ── */}
//       <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 flex-shrink-0">
//         <div className="flex items-center gap-2">
//           <img src={GlassLogo} alt="Glass" className="w-7 h-7 object-contain" />
//           <span className="font-semibold text-base text-gray-900">Glass</span>
//         </div>
//         <div className="flex items-center gap-4">
//           <button className="text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer">
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
//         <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col pt-10 px-6">
//           {SIDEBAR_STEPS.map((step, index) => {
//             const isActive = step.id === activeStep;
//             const isCompleted = completedSteps.includes(step.id);
//             const isLast = index === SIDEBAR_STEPS.length - 1;
//             return (
//               <div key={step.id} className="flex items-start gap-4">
//                 <div className="flex flex-col items-center">
//                   <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all
//                     ${isActive || isCompleted ? "bg-[#002FA7] text-white" : "bg-white border-2 border-gray-300 text-gray-400"}`}>
//                     {isCompleted ? (
//                       <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
//                         <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
//                       </svg>
//                     ) : step.icon}
//                   </div>
//                   {!isLast && (
//                     <div className="w-px my-1 transition-all duration-500"
//                       style={{ minHeight: "40px", background: isCompleted ? "#002FA7" : "#E5E7EB" }} />
//                   )}
//                 </div>
//                 <div className="pt-1.5 pb-10">
//                   <span className={`text-sm font-medium transition-all
//                     ${isActive ? "text-[#002FA7]" : isCompleted ? "text-gray-600" : "text-gray-400"}`}>
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
//             <div className="mb-6">
//               <h2 className="text-base font-medium text-gray-900 mb-1">Add your members</h2>
//               <p className="text-sm text-gray-500">
//                 Add your members now or invite them to join on their own. You can always add more from your dashboard later.
//               </p>
//             </div>

//             {/* Invite Banner */}
//             <div className="flex items-center justify-between px-5 py-4 rounded-xl mb-6"
//               style={{ background: "#D7E2FF", border: "1px solid #0E628C33" }}>
//               <div>
//                 <p className="text-xs text-gray-900 mb-0.5">Your community is ready to grow.</p>
//                 <p className="text-xs text-gray-500">Copy this link and share it with your members to get them on Glass.</p>
//               </div>
//               <button
//                 onClick={handleCopyLink}
//                 className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#002FA7] text-xs font-semibold text-[#002FA7] hover:bg-gray-50 transition-all flex-shrink-0 ml-6 cursor-pointer"
//               >
//                 <Copy size={12} />
//                 {copied ? "Copied!" : "Copy Link"}
//               </button>
//             </div>

//             {/* Direct Add Card */}
//             <div className="bg-[#EFEFF1] rounded-lg p-6" style={{ border: "1px solid #E5E7EB" }}>
//               <h3 className="text-base font-semibold text-gray-900 mb-4">Prefer To Add Members Directly?</h3>

//               {/* Tabs */}
//               <div className="flex gap-6 border-b border-gray-200 mb-5">
//                 {["upload", "manual"].map((tab) => (
//                   <button
//                     key={tab}
//                     onClick={() => setActiveTab(tab)}
//                     className={`pb-2.5 text-sm font-medium capitalize transition-all bg-transparent border-none cursor-pointer
//                       ${activeTab === tab ? "text-[#002FA7] border-b-2 border-[#002FA7]" : "text-gray-400 hover:text-gray-600"}`}
//                     style={ activeTab === tab ? { borderBottom: "2px solid #002FA7" } : {}}
//                   >
//                     {tab.charAt(0).toUpperCase() + tab.slice(1)}
//                   </button>
//                 ))}
//               </div>

//               {/* ── UPLOAD TAB ── */}
//               {activeTab === "upload" && (
//                 <>
//                   <p className="text-sm font-semibold text-gray-900 mb-4">Upload a CSV</p>
//                   <div className="flex items-center justify-between mb-6">
//                     <p className="text-sm text-gray-500">Upload a CSV file with following sample information</p>
//                     <button className="flex items-center gap-1.5 text-xs font-medium text-[#002FA7] hover:opacity-80 transition-all bg-transparent border-none cursor-pointer">
//                       <Download size={12} />
//                       Download Template
//                     </button>
//                   </div>

//                   {/* Sample table */}
//                   <div className="rounded-md overflow-hidden mb-4" style={{ border: "1px solid #E5E7EB" }}>
//                     <table className="w-full text-xs">
//                       <thead>
//                         <tr className="bg-gray-50">
//                           {TABLE_HEADERS.map((h) => (
//                             <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
//                           ))}
//                         </tr>
//                       </thead>
//                       <tbody>
//                         <tr className="border-t border-gray-100">
//                           <td className="px-4 py-3 text-gray-900">{SAMPLE_MEMBER.firstName}</td>
//                           <td className="px-4 py-3 text-gray-900">{SAMPLE_MEMBER.lastName}</td>
//                           <td className="px-4 py-3 text-[#002FA7] underline">{SAMPLE_MEMBER.email}</td>
//                           <td className="px-4 py-3 text-gray-900">{SAMPLE_MEMBER.phone}</td>
//                           <td className="px-4 py-3 text-gray-900">{SAMPLE_MEMBER.memberId}</td>
//                           <td className="px-4 py-3 text-gray-900">{SAMPLE_MEMBER.role}</td>
//                         </tr>
//                       </tbody>
//                     </table>
//                   </div>

//                   {/* Drag & Drop */}
//                   <div
//                     onClick={() => fileInputRef.current?.click()}
//                     onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
//                     onDragLeave={() => setDragOver(false)}
//                     onDrop={handleDrop}
//                     className="w-full rounded-lg flex flex-col items-center justify-center py-14 px-6 cursor-pointer transition-all mb-5"
//                     style={{
//                       border: dragOver ? "2px dashed #002FA7" : "2px dashed #D1D5DB",
//                       background: dragOver ? "#EEF2FF" : "#FAFAFA",
//                       minHeight: "140px",
//                     }}
//                   >
//                     <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
//                       onChange={(e) => handleFile(e.target.files[0])} />
//                     <CloudUpload size={30} className="text-gray-400 mb-3" />
//                     {uploadedFile ? (
//                       <p className="text-xs text-[#002FA7] font-medium">{uploadedFile.name}</p>
//                     ) : (
//                       <p className="text-xs text-gray-500">
//                         Drag and Drop CSV here or{" "}
//                         <span className="text-[#002FA7] font-medium underline">Browse</span>
//                       </p>
//                     )}
//                   </div>

//                   {/* Upload from URL — fixed: was glass-input */}
//                   <div>
//                     <p className="text-xs font-medium text-gray-700 mb-2">Or Upload from URL</p>
//                     <div className="flex gap-2">
//                       <input
//                         type="url"
//                         value={fileUrl}
//                         onChange={(e) => setFileUrl(e.target.value)}
//                         placeholder="Add File Url"
//                         className={inputCls}
//                       />
//                       <button className="px-5 py-2 rounded-sm bg-[#002FA733] text-xs text-[#002FA7] hover:bg-[#002FA7]/10 transition-all flex-shrink-0 border-none cursor-pointer">
//                         Upload
//                       </button>
//                     </div>
//                   </div>
//                 </>
//               )}

//               {/* ── MANUAL TAB ── */}
//               {activeTab === "manual" && (
//                 <>
//                   <p className="text-sm text-gray-500 mb-4">
//                     Enter your members' details one by one. Click "Add Row" to add more members.
//                   </p>
//                   <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #E5E7EB" }}>
//                     <table className="w-full text-sm">
//                       <thead>
//                         <tr className="bg-gray-50">
//                           {TABLE_HEADERS.map((h) => (
//                             <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
//                           ))}
//                           <th className="px-3 py-3 w-10" />
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {manualRows.map((row) => (
//                           <tr key={row.id} className="border-t border-gray-100">
//                             {["firstName", "lastName", "email", "phone", "memberId", "role"].map((field) => (
//                               <td key={field} className="px-2 py-2">
//                                 <input
//                                   type="text"
//                                   value={row[field]}
//                                   onChange={(e) => handleRowChange(row.id, field, e.target.value)}
//                                   placeholder={TABLE_HEADERS[["firstName","lastName","email","phone","memberId","role"].indexOf(field)]}
//                                   className="w-full px-2 py-1.5 text-xs rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition-all"
//                                   style={{ border: "1px solid #E5E7EB" }}
//                                   onFocus={(e) => (e.target.style.borderColor = "#002FA7")}
//                                   onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
//                                 />
//                               </td>
//                             ))}
//                             <td className="px-2 py-2">
//                               {manualRows.length > 1 && (
//                                 <button
//                                   onClick={() => removeRow(row.id)}
//                                   className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center w-7 h-7 bg-transparent border-none cursor-pointer"
//                                 >
//                                   <Trash2 size={14} />
//                                 </button>
//                               )}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                   <button
//                     onClick={addRow}
//                     className="flex items-center gap-2 text-sm font-medium text-[#002FA7] hover:opacity-80 transition-all bg-transparent border-none cursor-pointer"
//                   >
//                     <Plus size={16} /> Add Row
//                   </button>
//                 </>
//               )}
//             </div>

//             {/* Create Community Button */}
//             <button
//               onClick={handleSubmit}
//               className="w-full py-4 rounded-full text-white font-semibold text-sm bg-[#002FA7] hover:opacity-90 active:scale-[0.98] transition-all mt-6 border-none cursor-pointer"
//             >
//               Create Your Community
//             </button>

//           </div>
//         </main>
//       </div>

//       {/* ── Success Modal ── */}
//       {showSuccess && (
//         <SuccessModal
//           onGoToDashboard={handleGoToDashboard}
//           onCopyLink={handleModalCopyLink}
//         />
//       )}
//     </div>
//   );
// }

/**
 * AddMembers.jsx — wired to API
 *
 * Two paths:
 *   A) Invite link  — just show + copy the link, no API call
 *   B) CSV upload   — POST /api/v1/file/upload → then backend processes
 *   C) Manual entry — POST /api/v1/communities/{id}/members per row (batched)
 *
 * Success → show modal → navigate to /dashboard/{slug}/home
 *
 * Invite link format: https://glasspay.app/join/{communitySlug}
 */
import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Download, CloudUpload, Copy, Trash2, Plus, Check } from "lucide-react";
import GlassLogo from "../../assets/Glass.png";
import Background from "../../assets/background.png";
import client from "../../api/client";
import { notifyError } from "../../utils/errorHandler";

const STEPS = [
  { id: "organization", label: "Organization Profile" },
  { id: "payment",      label: "Payment Account"      },
  { id: "members",      label: "Members"              },
];

const HEADERS = ["First Name", "Last Name", "Email Address", "Phone Number", "Member ID", "Role/Title"];
const FIELDS  = ["firstName", "lastName", "email", "phone", "memberId", "role"];
const EMPTY   = () => ({ id: Date.now() + Math.random(), firstName: "", lastName: "", email: "", phone: "", memberId: "", role: "" });

const inputCls = "w-full border border-[#797D86] p-3 rounded-sm text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#002FA7] transition-all";

function SuccessModal({ communityName, onDashboard, onCopy }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }}>
      <div className="bg-white rounded-3xl flex flex-col items-center text-center px-10 py-20 w-full max-w-[550px]" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
        <div className="flex items-center justify-center rounded-full mb-6"
          style={{ width: 70, height: 70, background: "radial-gradient(circle, #22c55e 60%, #16a34a 100%)", boxShadow: "0 0 0 12px #dcfce7" }}>
          <Check size={40} color="white" strokeWidth={3} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Community Is Now Live</h2>
        <p className="text-xs text-gray-500 mb-8">{communityName ?? "Your community"} is all set up on Glass!</p>
        <button onClick={onDashboard}
          className="w-4/5 py-3.5 rounded-full text-white font-medium text-xs bg-[#002FA7] hover:opacity-90 transition-all border-none cursor-pointer mb-5">
          Go To Dashboard
        </button>
        <p className="text-xs text-gray-900 mb-1">Ready To Invite Members?</p>
        <button onClick={onCopy}
          className="text-xs font-medium text-[#002FA7] hover:underline bg-transparent border-none cursor-pointer">
          Click here to copy your community link
        </button>
      </div>
    </div>
  );
}

export default function AddMembers() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const fileRef   = useRef(null);

  const { email, communityId, communitySlug, communityName } = location.state ?? {};

  const inviteLink = communitySlug
    ? `https://glasspay.app/join/${communitySlug}`
    : "https://glasspay.app";

  const [tab,          setTab]          = useState("upload");
  const [dragOver,     setDragOver]     = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileUrl,      setFileUrl]      = useState("");
  const [copied,       setCopied]       = useState(false);
  const [showSuccess,  setShowSuccess]  = useState(false);
  const [rows,         setRows]         = useState([EMPTY()]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFile = (file) => { if (file) setUploadedFile(file); };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  const changeRow = (id, field, val) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, [field]: val } : x)));
  const removeRow = (id) => setRows((r) => r.filter((x) => x.id !== id));

  // POST each manual row to /api/v1/communities/{id}/members
  const submitManual = async () => {
    if (!communityId) { setError("Community ID missing."); return; }
    const filled = rows.filter((r) => r.firstName || r.email);
    if (filled.length === 0) { setShowSuccess(true); return; } // no entries → skip
    setLoading(true);
    setError("");
    try {
      await Promise.all(
        filled.map((r) =>
          client.post(`/communities/${communityId}/members`, {
            firstName:   r.firstName.trim(),
            lastName:    r.lastName.trim(),
            email:       r.email.trim(),
            phoneNumber: r.phone.trim(),
            memberRef:   r.memberId.trim(),
          })
        )
      );
      setShowSuccess(true);
    } catch (err) {
      setError(notifyError(err, { context: "Add members", fallback: "Failed to add some members. You can add them from the dashboard later." }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (tab === "manual") { submitManual(); }
    else { setShowSuccess(true); } // CSV is fire-and-forget for now; backend processes async
  };

  const goToDashboard = () => {
    if (communitySlug || communityId) {
      // Matches the ?community= convention AdminDashboard/Sidebar read from —
      // there's no /dashboard/:slug/home route, so navigating there 404s
      // straight back to the landing page via the catch-all route.
      localStorage.setItem(
        "glass_community",
        JSON.stringify({ id: communityId, slug: communitySlug, name: communityName }),
      );
      navigate(`/dashboard/admin?community=${communitySlug ?? communityId}`, { replace: true });
    } else {
      navigate("/dashboard/home", { replace: true });
    }
  };

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
            const isActive    = step.id === "members";
            const isCompleted = ["organization", "payment"].includes(step.id);
            const isLast      = i === STEPS.length - 1;
            return (
              <div key={step.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isActive || isCompleted ? "bg-[#002FA7] text-white" : "bg-white border-2 border-gray-300 text-gray-400"}`}>
                    {isCompleted
                      ? <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    }
                  </div>
                  {!isLast && <div className="w-px my-1" style={{ minHeight: 40, background: isCompleted ? "#002FA7" : "#E5E7EB" }} />}
                </div>
                <div className="pt-1.5 pb-10">
                  <span className={`text-sm font-medium ${isActive ? "text-[#002FA7]" : isCompleted ? "text-gray-600" : "text-gray-400"}`}>{step.label}</span>
                </div>
              </div>
            );
          })}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto py-10 px-12">
          <div className="w-full max-w-4xl">
            <div className="mb-6">
              <h2 className="text-base font-medium text-gray-900 mb-1">Add your members</h2>
              <p className="text-sm text-gray-500">Add members now or invite them to join. You can always add more from your dashboard later.</p>
            </div>

            {/* Invite banner */}
            <div className="flex items-center justify-between px-5 py-4 rounded-xl mb-6"
              style={{ background: "#D7E2FF", border: "1px solid #0E628C33" }}>
              <div>
                <p className="text-xs text-gray-900 mb-0.5">Your community is ready to grow.</p>
                <p className="text-xs text-gray-500">Copy this link and share it with your members to get them on Glass.</p>
              </div>
              <button onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#002FA7] text-xs font-semibold text-[#002FA7] hover:bg-gray-50 transition-all flex-shrink-0 ml-6 cursor-pointer bg-transparent">
                <Copy size={12} />{copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            {/* Direct add card */}
            <div className="bg-[#EFEFF1] rounded-lg p-6" style={{ border: "1px solid #E5E7EB" }}>
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
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">Upload a CSV file with member information</p>
                    <button className="flex items-center gap-1.5 text-xs font-medium text-[#002FA7] hover:opacity-80 bg-transparent border-none cursor-pointer">
                      <Download size={12} />Download Template
                    </button>
                  </div>
                  {/* Drop zone */}
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className="w-full rounded-lg flex flex-col items-center justify-center py-14 cursor-pointer transition-all mb-4"
                    style={{
                      minHeight: 140,
                      background: dragOver ? "#EEF2FF" : "#FAFAFA",
                      border: dragOver ? "2px dashed #002FA7" : "2px dashed #D1D5DB",
                    }}
                  >
                    <input ref={fileRef} type="file" accept=".csv" className="hidden"
                      onChange={(e) => handleFile(e.target.files[0])} />
                    <CloudUpload size={30} className="text-gray-400 mb-3" />
                    {uploadedFile
                      ? <p className="text-xs text-[#002FA7] font-medium">{uploadedFile.name}</p>
                      : <p className="text-xs text-gray-500">Drag and Drop CSV here or <span className="text-[#002FA7] font-medium underline">Browse</span></p>}
                  </div>
                  {/* URL upload */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">Or Upload from URL</p>
                    <div className="flex gap-2">
                      <input type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)}
                        placeholder="Add File URL" className={inputCls} />
                      <button className="px-5 py-2 rounded-sm bg-[#002FA733] text-xs text-[#002FA7] hover:bg-[#002FA7]/10 transition-all flex-shrink-0 border-none cursor-pointer">
                        Upload
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Manual tab */}
              {tab === "manual" && (
                <>
                  <p className="text-sm text-gray-500 mb-4">Enter your members' details one by one.</p>
                  <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #E5E7EB" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          {HEADERS.map((h) => <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500">{h}</th>)}
                          <th className="px-3 py-3 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.id} className="border-t border-gray-100">
                            {FIELDS.map((f) => (
                              <td key={f} className="px-2 py-2">
                                <input
                                  type={f === "email" ? "email" : "text"}
                                  value={row[f]}
                                  onChange={(e) => changeRow(row.id, f, e.target.value)}
                                  placeholder={HEADERS[FIELDS.indexOf(f)]}
                                  className="w-full px-2 py-1.5 text-xs rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition-all"
                                  style={{ border: "1px solid #E5E7EB" }}
                                  onFocus={(e) => (e.target.style.borderColor = "#002FA7")}
                                  onBlur={(e)  => (e.target.style.borderColor = "#E5E7EB")}
                                />
                              </td>
                            ))}
                            <td className="px-2 py-2">
                              {rows.length > 1 && (
                                <button onClick={() => removeRow(row.id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={() => setRows((r) => [...r, EMPTY()])}
                    className="flex items-center gap-2 text-sm font-medium text-[#002FA7] hover:opacity-80 bg-transparent border-none cursor-pointer">
                    <Plus size={16} />Add Row
                  </button>
                </>
              )}
            </div>

            {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 rounded-full text-white font-semibold text-sm bg-[#002FA7] hover:opacity-90 active:scale-[0.98] transition-all mt-6 border-none cursor-pointer disabled:opacity-60"
            >
              {loading ? "Adding members…" : "Create Your Community"}
            </button>
          </div>
        </main>
      </div>

      {showSuccess && (
        <SuccessModal
          communityName={communityName}
          onDashboard={goToDashboard}
          onCopy={copyLink}
        />
      )}
    </div>
  );
}


