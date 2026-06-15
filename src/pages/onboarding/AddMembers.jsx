import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Download, CloudUpload, Copy, Trash2, Plus } from "lucide-react";
import GlassLogo from "../../assets/Glass.png";

const SIDEBAR_STEPS = [
  {
    id: "organization",
    label: "Organization Profile",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: "payment",
    label: "Payment Profile",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    id: "members",
    label: "Members",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const SAMPLE_MEMBER = {
  firstName: "Fatimah",
  lastName: "Yahya",
  email: "Fati***ya@**.com",
  phone: "0812990293",
  memberId: "A23434",
  role: "Student",
};

const TABLE_HEADERS = ["First Name", "Last Name", "Email Address", "Phone Number", "Member ID", "Role/Title"];

const EMPTY_ROW = { firstName: "", lastName: "", email: "", phone: "", memberId: "", role: "" };

export default function AddMembers() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const urlInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [copied, setCopied] = useState(false);
  // eslint-disable-next-line react-hooks/purity
  const [manualRows, setManualRows] = useState([{ ...EMPTY_ROW, id: Date.now() }]);
  const inviteLink = "https://glass.finance/join/babcock-alumni";

  const handleFile = (file) => { if (!file) return; setUploadedFile(file); };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };
  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleSubmit = () => navigate("/dashboard/home");

  // Manual tab handlers
  const handleRowChange = (id, field, value) => {
    setManualRows((rows) => rows.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };
  const addRow = () => setManualRows((rows) => [...rows, { ...EMPTY_ROW, id: Date.now() }]);
  const removeRow = (id) => setManualRows((rows) => rows.filter((r) => r.id !== id));

  const completedSteps = ["organization", "payment"];
  const activeStep = "members";

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F0F0F2]">

      {/* ── Navbar ── */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={GlassLogo} alt="Glass" className="w-7 h-7 object-contain" />
          <span className="font-semibold text-base text-gray-900">Glass</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-gray-600 transition-colors"><Bell size={20} /></button>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">Amina Agrawal</p>
            <p className="text-xs text-gray-500">amina@gmail.com</p>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col pt-10 px-6 h-full">
          {SIDEBAR_STEPS.map((step, index) => {
            const isActive = step.id === activeStep;
            const isCompleted = completedSteps.includes(step.id);
            const isLast = index === SIDEBAR_STEPS.length - 1;
            return (
              <div key={step.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isActive || isCompleted ? "bg-[#002FA7] text-white" : "bg-white border-2 border-gray-300 text-gray-400"}`}>
                    {isCompleted ? (
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : step.icon}
                  </div>
                  {!isLast && (
                    <div className="w-px my-1 transition-all duration-500" style={{ minHeight: "40px", background: isCompleted ? "#002FA7" : "#E5E7EB" }} />
                  )}
                </div>
                <div className="pt-1.5 pb-10">
                  <span className={`text-sm font-medium transition-all ${isActive ? "text-[#002FA7]" : isCompleted ? "text-gray-600" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 overflow-y-auto py-10 px-12">
          <div className="w-full max-w-4xl">

            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Add your members</h2>
              <p className="text-sm text-gray-500">
                Add your members now or invite them to join on their own. You can always add more from your dashboard later.
              </p>
            </div>

            {/* Invite Banner */}
            <div className="flex items-center justify-between px-5 py-4 rounded-xl mb-6" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-0.5">Your community is ready to grow.</p>
                <p className="text-sm text-gray-500">Copy this link and share it with your members to get them on Glass.</p>
              </div>
              <button onClick={handleCopyLink} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex-shrink-0 ml-6">
                <Copy size={14} />
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            {/* Direct Add Card */}
            <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E5E7EB" }}>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Prefer To Add Members Directly?</h3>

              {/* Tabs */}
              <div className="flex gap-6 border-b border-gray-200 mb-5">
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`pb-2.5 text-sm font-semibold transition-all ${activeTab === "upload" ? "text-[#002FA7] border-b-2 border-[#002FA7]" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Upload
                </button>
                <button
                  onClick={() => setActiveTab("manual")}
                  className={`pb-2.5 text-sm font-semibold transition-all ${activeTab === "manual" ? "text-[#002FA7] border-b-2 border-[#002FA7]" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Manual
                </button>
              </div>

              {/* ── UPLOAD TAB ── */}
              {activeTab === "upload" && (
                <>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Upload a CSV</p>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">Upload a CSV file with following sample information</p>
                    <button className="flex items-center gap-1.5 text-sm font-medium text-[#002FA7] hover:opacity-80 transition-all">
                      <Download size={14} />
                      Download Template
                    </button>
                  </div>

                  {/* Sample table */}
                  <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #E5E7EB" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          {TABLE_HEADERS.map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-gray-100">
                          <td className="px-4 py-3 text-gray-900">{SAMPLE_MEMBER.firstName}</td>
                          <td className="px-4 py-3 text-gray-900">{SAMPLE_MEMBER.lastName}</td>
                          <td className="px-4 py-3 text-[#002FA7] underline">{SAMPLE_MEMBER.email}</td>
                          <td className="px-4 py-3 text-gray-900">{SAMPLE_MEMBER.phone}</td>
                          <td className="px-4 py-3 text-gray-900">{SAMPLE_MEMBER.memberId}</td>
                          <td className="px-4 py-3 text-gray-900">{SAMPLE_MEMBER.role}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Drag & Drop */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`w-full rounded-xl flex flex-col items-center justify-center py-10 px-6 cursor-pointer transition-all mb-5 ${dragOver ? "bg-[#EEF2FF]" : "bg-[#FAFAFA]"}`}
                    style={{ border: dragOver ? "2px dashed #002FA7" : "2px dashed #D1D5DB", minHeight: "140px" }}
                  >
                    <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                    <CloudUpload size={30} className="text-gray-400 mb-3" />
                    {uploadedFile ? (
                      <p className="text-sm text-[#002FA7] font-medium">{uploadedFile.name}</p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Drag and Drop CSV here or{" "}
                        <span className="text-[#002FA7] font-medium underline">Browse</span>
                      </p>
                    )}
                  </div>

                  {/* Upload from URL */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Or Upload from URL</p>
                    <div className="flex gap-2">
                      <input
                        ref={urlInputRef}
                        type="url"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        placeholder="Add File Url"
                        className="glass-input flex-1"
                      />
                      <button className="px-5 py-3 rounded-xl text-sm font-semibold text-white bg-[#002FA7] hover:opacity-90 transition-all flex-shrink-0">
                        Upload
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── MANUAL TAB ── */}
              {activeTab === "manual" && (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Enter your members' details one by one. Click "Add Row" to add more members.
                  </p>

                  {/* Manual table */}
                  <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #E5E7EB" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          {TABLE_HEADERS.map((h) => (
                            <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                          ))}
                          {/* delete col */}
                          <th className="px-3 py-3 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {manualRows.map((row) => (
                          <tr key={row.id} className="border-t border-gray-100">
                            {["firstName", "lastName", "email", "phone", "memberId", "role"].map((field) => (
                              <td key={field} className="px-2 py-2">
                                <input
                                  type="text"
                                  value={row[field]}
                                  onChange={(e) => handleRowChange(row.id, field, e.target.value)}
                                  placeholder={TABLE_HEADERS[["firstName","lastName","email","phone","memberId","role"].indexOf(field)]}
                                  className="w-full px-2 py-1.5 text-xs rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition-all"
                                  style={{ border: "1px solid #E5E7EB" }}
                                  onFocus={(e) => (e.target.style.borderColor = "#002FA7")}
                                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                                />
                              </td>
                            ))}
                            <td className="px-2 py-2">
                              {manualRows.length > 1 && (
                                <button
                                  onClick={() => removeRow(row.id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center w-7 h-7"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add row */}
                  <button
                    onClick={addRow}
                    className="flex items-center gap-2 text-sm font-medium text-[#002FA7] hover:opacity-80 transition-all"
                  >
                    <Plus size={16} />
                    Add Row
                  </button>
                </>
              )}
            </div>

            {/* Create Community Button */}
            <button
              onClick={handleSubmit}
              className="w-full py-4 rounded-full text-white font-semibold text-sm bg-[#002FA7] hover:opacity-90 active:scale-[0.98] transition-all mt-6"
            >
              Create Your Community
            </button>

          </div>
        </main>
      </div>
    </div>
  );
}