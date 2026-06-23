// import { useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { Bell, Upload } from "lucide-react";
// import GlassLogo from "../../assets/Glass.png";

// const CATEGORIES = [
//   "Alumni Association",
//   "Faith Community",
//   "Professional Association",
//   "Student Club",
//   "University Club",
//   "NGO / Non-profit",
//   "Sports Club",
//   "Other",
// ];

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

// export default function OrganizationProfile() {
//   const navigate = useNavigate();
//   const fileInputRef = useRef(null);
//   const [dragOver, setDragOver] = useState(false);
//   const [logo, setLogo] = useState(null);
//   const [form, setForm] = useState({
//     communityName: "",
//     description: "",
//     category: "",
//     brandColor: "",
//   });

//   const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
//   const handleFile = (file) => { if (!file) return; setLogo(URL.createObjectURL(file)); };
//   const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };
//   const handleSubmit = (e) => { e.preventDefault(); navigate("/onboarding/payment-profile"); };

//   return (
//     <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F0F0F2]">

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
//             const isActive = step.id === "organization";
//             const isLast = index === SIDEBAR_STEPS.length - 1;
//             return (
//               <div key={step.id} className="flex items-start gap-4">
//                 {/* Left: circle + line */}
//                 <div className="flex flex-col items-center">
//                   {/* Circle */}
//                   <div
//                     className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all
//                       ${isActive
//                         ? "bg-[#002FA7] text-white"
//                         : "bg-white border-2 border-gray-300 text-gray-400"
//                       }`}
//                   >
//                     {step.icon}
//                   </div>
//                   {/* Connector line */}
//                   {!isLast && (
//                     <div className="w-px bg-gray-200 flex-1 my-1" style={{ minHeight: "40px" }} />
//                   )}
//                 </div>
//                 {/* Label */}
//                 <div className="pt-1.5 pb-10">
//                   <span
//                     className={`text-sm font-medium transition-all
//                       ${isActive ? "text-[#002FA7]" : "text-gray-400"}`}
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
//           <form onSubmit={handleSubmit} className="w-full max-w-4xl">

//             {/* Heading */}
//             <div className="mb-8">
//               <h2 className="text-xl font-bold text-gray-900 mb-1">
//                 Tell us about your community
//               </h2>
//               <p className="text-sm text-gray-500">
//                 This is how your community will appear to members on Glass.
//               </p>
//             </div>

//             {/* Row 1 — Name + Description */}
//             <div className="grid grid-cols-2 gap-5 mb-5">
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-sm font-medium text-gray-700">Community Name</label>
//                 <input
//                   type="text"
//                   name="communityName"
//                   value={form.communityName}
//                   onChange={handleChange}
//                   placeholder="e.g. Babcock University Alumni Association"
//                   className="border-0.5 border-gray-300 p-3 rounded-xl"
//                 />
//               </div>
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-sm font-medium text-gray-700">Description</label>
//                 <input
//                   type="text"
//                   name="description"
//                   value={form.description}
//                   onChange={handleChange}
//                   placeholder="Briefly describe what your community is about"
//                   className="border-0.5 border-gray-300 p-3 rounded-xl"
//                 />
//               </div>
//             </div>

//             {/* Row 2 — Category + Brand Color */}
//             <div className="grid grid-cols-2 gap-5 mb-5">
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-sm font-medium text-gray-700">Category</label>
//                 <select
//                   name="category"
//                   value={form.category}
//                   onChange={handleChange}
//                   className="border-0.5 border-gray-300 p-3 rounded-xl"
//                 >
//                   <option value="" disabled>Select a category</option>
//                   {CATEGORIES.map((cat) => (
//                     <option key={cat} value={cat}>{cat}</option>
//                   ))}
//                 </select>
//               </div>
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-sm font-medium text-gray-700">
//                   Brand Color{" "}
//                   <span className="text-gray-400 font-normal">(optional)</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="brandColor"
//                   value={form.brandColor}
//                   onChange={handleChange}
//                   placeholder="e.g. #002FA7"
//                   className="glass-input"
//                 />
//               </div>
//             </div>

//             {/* Row 3 — Logo Upload */}
//             <div className="flex flex-col gap-1.5 mb-8">
//               <label className="text-sm font-medium text-gray-700">Community Logo</label>
//               <div
//                 onClick={() => fileInputRef.current?.click()}
//                 onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
//                 onDragLeave={() => setDragOver(false)}
//                 onDrop={handleDrop}
//                 className={`w-full rounded-xl flex flex-col items-center justify-center py-12 px-6 cursor-pointer transition-all
//                   ${dragOver ? "border-[#002FA7] bg-[#EEF0FF]" : "bg-[#FAFAFA]"}`}
//                 style={{
//                   minHeight: "180px",
//                   border: dragOver ? "2px dashed #002FA7" : "2px dashed #C2C2C2",
//                 }}
//               >
//                 <input
//                   ref={fileInputRef}
//                   type="file"
//                   accept="image/png,image/jpeg"
//                   className="hidden"
//                   onChange={(e) => handleFile(e.target.files[0])}
//                 />
//                 {logo ? (
//                   <img src={logo} alt="preview" className="h-16 object-contain mb-2" />
//                 ) : (
//                   <Upload size={28} className="text-gray-400 mb-3" />
//                 )}
//                 <p className="text-sm text-gray-500 text-center">
//                   <span className="font-medium underline text-[#002FA7] cursor-pointer">Upload</span>{" "}
//                   or Drag and Drop Logo Here
//                 </p>
//                 <p className="text-xs text-gray-400 mt-1">(PNG or JPG, max 2MB.)</p>
//               </div>
//             </div>

//             {/* Next Button */}
//             <button
//               type="submit"
//               className="w-full py-4 rounded-full text-white font-semibold text-sm bg-[#002FA7] hover:opacity-90 active:scale-[0.98] transition-all"
//               onClick={handleSubmit}
//             >
//               Next
//             </button>

//           </form>
//         </main>
//       </div>
//     </div>
//   );
// }

// import { useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { Bell, Upload } from "lucide-react";
// import GlassLogo from "../../assets/Glass.png";
// import Background from "../../assets/background.png";

// const CATEGORIES = [
//   "Alumni Association",
//   "Faith Community",
//   "Professional Association",
//   "Student Club",
//   "University Club",
//   "NGO / Non-profit",
//   "Sports Club",
//   "Other",
// ];

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

// // Reusable input style — proper border that always shows
// const inputCls =
//   "w-full border border-gray-300 bg-[#F0F0F2] p-3 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/10 transition-all";

// export default function OrganizationProfile() {
//   const navigate = useNavigate();
//   const fileInputRef = useRef(null);
//   const [dragOver, setDragOver] = useState(false);
//   const [logo, setLogo] = useState(null);
//   const [form, setForm] = useState({
//     communityName: "",
//     description: "",
//     category: "",
//     brandColor: "",
//   });

//   const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
//   const handleFile = (file) => { if (!file) return; setLogo(URL.createObjectURL(file)); };
//   const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };
//   const handleSubmit = (e) => { e.preventDefault(); navigate("/onboarding/payment-profile"); };

//   return (
//     // Use fixed height + overflow-hidden to prevent any page scroll
//     <div style={{ height: "100vh", overflow: "hidden", backgroundImage: `url(${Background})`, backgroundSize: "contain", backgroundPosition: "center" }} className="flex flex-col bg-[#F0F0F2]">

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

//       {/* ── Body: sidebar + main, fills remaining height exactly ── */}
//       <div className="flex flex-1 overflow-hidden">

//         {/* ── Sidebar ── */}
//         <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col pt-10 px-6">
//           {SIDEBAR_STEPS.map((step, index) => {
//             const isActive = step.id === "organization";
//             const isLast = index === SIDEBAR_STEPS.length - 1;
//             return (
//               <div key={step.id} className="flex items-start gap-4">
//                 <div className="flex flex-col items-center">
//                   <div
//                     className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all
//                       ${isActive
//                         ? "bg-[#002FA7] text-white"
//                         : "bg-white border-2 border-gray-300 text-gray-400"
//                       }`}
//                   >
//                     {step.icon}
//                   </div>
//                   {!isLast && (
//                     <div className="w-px bg-gray-200 flex-1 my-1" style={{ minHeight: "40px" }} />
//                   )}
//                 </div>
//                 <div className="pt-1.5 pb-10">
//                   <span className={`text-sm font-medium transition-all ${isActive ? "text-[#002FA7]" : "text-gray-400"}`}>
//                     {step.label}
//                   </span>
//                 </div>
//               </div>
//             );
//           })}
//         </aside>

//         {/* ── Main: scrollable only inside this column ── */}
//         <main className="flex-1 overflow-y-auto py-10 px-12 flex flex-col items-center">
//           <form onSubmit={handleSubmit} className="w-full max-w-4xl">

//             {/* Heading */}
//             <div className="mb-8">
//               <h2 className="text-xl font-bold text-gray-900 mb-1">
//                 Tell us about your community
//               </h2>
//               <p className="text-sm text-gray-500">
//                 This is how your community will appear to members on Glass.
//               </p>
//             </div>

//             {/* Row 1 — Name + Description */}
//             <div className="grid grid-cols-2 gap-5 mb-5">
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-sm font-medium text-gray-700">Community Name</label>
//                 <input
//                   type="text"
//                   name="communityName"
//                   value={form.communityName}
//                   onChange={handleChange}
//                   placeholder="e.g. Babcock University Alumni Association"
//                   className={inputCls}
//                 />
//               </div>
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-sm font-medium text-gray-700">Description</label>
//                 <input
//                   type="text"
//                   name="description"
//                   value={form.description}
//                   onChange={handleChange}
//                   placeholder="Briefly describe what your community is about"
//                   className={inputCls}
//                 />
//               </div>
//             </div>

//             {/* Row 2 — Category + Brand Color */}
//             <div className="grid grid-cols-2 gap-5 mb-5">
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-sm font-medium text-gray-700">Category</label>
//                 <select
//                   name="category"
//                   value={form.category}
//                   onChange={handleChange}
//                   className={inputCls}
//                 >
//                   <option value="" disabled>Select a category</option>
//                   {CATEGORIES.map((cat) => (
//                     <option key={cat} value={cat}>{cat}</option>
//                   ))}
//                 </select>
//               </div>
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-sm font-medium text-gray-700">
//                   Brand Color{" "}
//                   <span className="text-gray-400 font-normal">(optional)</span>
//                 </label>
//                 {/* Fix: was using className="glass-input" which doesn't exist */}
//                 <input
//                   type="text"
//                   name="brandColor"
//                   value={form.brandColor}
//                   onChange={handleChange}
//                   placeholder="e.g. #002FA7"
//                   className={inputCls}
//                 />
//               </div>
//             </div>

//             {/* Row 3 — Logo Upload */}
//             <div className="flex flex-col gap-1.5 mb-8">
//               <label className="text-sm font-medium text-gray-700">Community Logo</label>
//               <div
//                 onClick={() => fileInputRef.current?.click()}
//                 onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
//                 onDragLeave={() => setDragOver(false)}
//                 onDrop={handleDrop}
//                 className={`w-full rounded-xl flex flex-col items-center justify-center py-12 px-6 cursor-pointer transition-all bg-[#F0F0F2] `}
//                 style={{
//                   minHeight: "200px",
//                   background: dragOver ? "#EFEFF1" : "#FAFAFA",
//                   border: dragOver ? "1.5px dashed #002FA7" : "1.5px dashed #C2C2C2",
//                 }}
//               >
//                 <input
//                   ref={fileInputRef}
//                   type="file"
//                   accept="image/png,image/jpeg"
//                   className="hidden"
//                   onChange={(e) => handleFile(e.target.files[0])}
//                 />
//                 {logo ? (
//                   <img src={logo} alt="preview" className="h-16 object-contain mb-2" />
//                 ) : (
//                   <Upload size={28} className="text-gray-400 mb-3" />
//                 )}
//                 <p className="text-sm text-gray-500 text-center">
//                   <span className="font-medium underline text-[#002FA7] cursor-pointer">Upload</span>{" "}
//                   or Drag and Drop Logo Here
//                 </p>
//                 <p className="text-xs text-gray-400 mt-1">(PNG or JPG, max 2MB.)</p>
//               </div>
//             </div>
//             {/* Next Button */}
//             <button
//               type="submit"
//               className="w-[50%] py-4 rounded-full text-white font-semibold text-sm bg-[#002FA7] hover:opacity-90 active:scale-[0.98] transition-all border-none cursor-pointer mx-auto block"
//             >
//               Next
//             </button>
//           </form>
//         </main>
//       </div>
//     </div>
//   );
// }




/**
 * OrganizationProfile.jsx — wired to API
 *
 * Flow:
 *   1. Upload logo file → POST /api/v1/file/upload (fileCategory=COMMUNITY_LOGO)
 *      → returns { data: { id, url } }
 *   2. Create community → POST /api/v1/communities
 *      → returns { data: { id, slug, name, ... } }
 *   3. Store communityId + slug in router state, navigate to PaymentProfile
 */
import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Upload } from "lucide-react";
import GlassLogo from "../../assets/Glass.png";
import Background from "../../assets/background.png";
import client from "../../api/client";

const CATEGORIES = [
  "Alumni Association", "Faith Community", "Professional Association",
  "Student Club", "University Club", "NGO / Non-profit", "Sports Club", "Other",
];

const STEPS = [
  { id: "organization", label: "Organization Profile" },
  { id: "payment",      label: "Payment Profile"      },
  { id: "members",      label: "Members"              },
];

const inputCls =
  "w-full border border-gray-300 bg-[#F0F0F2] p-3 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/10 transition-all";

function StepIcon({ id }) {
  const icons = {
    organization: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>,
    payment:      <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>,
    members:      <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  };
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {icons[id]}
    </svg>
  );
}

export default function OrganizationProfile() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const fileRef    = useRef(null);

  const email      = location.state?.email ?? "";
  const isPaying   = location.state?.isPaying ?? true;

  const [dragOver,  setDragOver]  = useState(false);
  const [logoFile,  setLogoFile]  = useState(null);   // File object
  const [logoUrl,   setLogoUrl]   = useState(null);   // preview URL
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);

  const [form, setForm] = useState({
    communityName: "", description: "", category: "", slug: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (file) => {
    if (!file) return;
    setLogoFile(file);
    setLogoUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.communityName.trim()) { setError("Community name is required."); return; }
    if (!form.category)             { setError("Please select a category.");   return; }

    setLoading(true);
    try {
      // 1. Upload logo (optional — skip if no file selected)
      let logoFileId = undefined;
      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        fd.append("fileCategory", "COMMUNITY_LOGO");
        const uploadRes = await client.post("/api/v1/file/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        logoFileId = uploadRes.data?.data?.id;
      }

      // 2. Auto-generate slug from name if not provided
      const slug = form.slug.trim() ||
        form.communityName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      // 3. Create community
      const createRes = await client.post("/api/v1/communities", {
        name:        form.communityName.trim(),
        slug,
        description: form.description.trim(),
        category:    [form.category],
        publicVisible: true,
        requiresMemberApproval: false,
        ...(logoFileId ? { logoFileId } : {}),
      });

      const community = createRes.data?.data;
      if (!community?.id) throw new Error("Community creation failed.");

      navigate("/onboarding/payment-profile", {
        state: { email, isPaying, communityId: community.id, communitySlug: community.slug, communityName: community.name },
      });

    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "100vh", backgroundImage: `url(${Background})`, backgroundSize: "contain", backgroundPosition: "center" }}
    >
      {/* Navbar */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={GlassLogo} alt="Glass" className="w-7 h-7 object-contain" />
          <span className="font-semibold text-base text-gray-900">Glass</span>
        </div>
        <div className="flex items-center gap-4">
          <Bell size={20} className="text-gray-400" />
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{email}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col pt-10 px-6">
          {STEPS.map((step, i) => {
            const isActive    = step.id === "organization";
            const isCompleted = false;
            const isLast      = i === STEPS.length - 1;
            return (
              <div key={step.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isActive ? "bg-[#002FA7] text-white" : "bg-white border-2 border-gray-300 text-gray-400"}`}>
                    {isCompleted
                      ? <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : <StepIcon id={step.id} />}
                  </div>
                  {!isLast && <div className="w-px my-1" style={{ minHeight: 40, background: isCompleted ? "#002FA7" : "#E5E7EB" }} />}
                </div>
                <div className="pt-1.5 pb-10">
                  <span className={`text-sm font-medium ${isActive ? "text-[#002FA7]" : "text-gray-400"}`}>{step.label}</span>
                </div>
              </div>
            );
          })}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto py-10 px-12 flex flex-col items-center">
          <form onSubmit={handleSubmit} className="w-full max-w-4xl">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Tell us about your community</h2>
              <p className="text-sm text-gray-500">This is how your community will appear to members on Glass.</p>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Community Name *</label>
                <input type="text" name="communityName" value={form.communityName} onChange={handleChange}
                  placeholder="e.g. Babcock University Alumni Association" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <input type="text" name="description" value={form.description} onChange={handleChange}
                  placeholder="Briefly describe what your community is about" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Category *</label>
                <select name="category" value={form.category} onChange={handleChange} className={inputCls}>
                  <option value="" disabled>Select a category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Community URL slug <span className="text-gray-400 font-normal">(optional — auto-generated)</span></label>
                <input type="text" name="slug" value={form.slug} onChange={handleChange}
                  placeholder="e.g. babcock-alumni" className={inputCls} />
              </div>
            </div>

            {/* Logo upload */}
            <div className="flex flex-col gap-1.5 mb-8">
              <label className="text-sm font-medium text-gray-700">Community Logo</label>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className="w-full rounded-xl flex flex-col items-center justify-center py-12 px-6 cursor-pointer transition-all"
                style={{
                  minHeight: 200,
                  background: dragOver ? "#EEF2FF" : "#FAFAFA",
                  border: dragOver ? "2px dashed #002FA7" : "2px dashed #C2C2C2",
                }}
              >
                <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])} />
                {logoUrl
                  ? <img src={logoUrl} alt="preview" className="h-16 object-contain mb-2" />
                  : <Upload size={28} className="text-gray-400 mb-3" />}
                <p className="text-sm text-gray-500 text-center">
                  <span className="font-medium underline text-[#002FA7]">Upload</span> or Drag and Drop Logo Here
                </p>
                <p className="text-xs text-gray-400 mt-1">(PNG or JPG, max 2MB.)</p>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-1/2 mx-auto block py-4 rounded-full text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all border-none cursor-pointer disabled:opacity-60"
              style={{ background: "#002FA7" }}
            >
              {loading ? "Creating community..." : "Next"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}

