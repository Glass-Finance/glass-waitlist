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
 * Invite link format: {APP_ORIGIN}/member/join?community={communitySlug}
 */
import { useState, useEffect, useRef } from "react";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import { useNavigate, useLocation } from "react-router-dom";
import Papa from "papaparse";
import { Bell, Download, CloudUpload, Copy, Check, X, FileSpreadsheet, ArrowLeft } from "lucide-react";
import GlassLogo from "../../assets/Glass.webp";
import { notifyError } from "../../utils/errorHandler";
import { APP_ORIGIN } from "../../utils/deviceRedirect";
import { toastProgress, toastSuccess } from "../../utils/toast";
import { useRoles } from "../../hooks/useCommunityMembers";
import { bulkCreateCommunityInvites } from "../../api/invites";
import { readOnboardingProgress, clearOnboardingProgress } from "../../utils/onboardingProgress";
import { ONBOARDING_STEPS } from "../../utils/onboardingSteps";

// Confirmed against the live backend (GET /roles/community, 2026-07-12):
// only these three roles actually exist -- COMMUNITY_OWNER, COMMUNITY_ADMIN,
// COMMUNITY_MEMBER. "Admin" and "Treasurer" never matched anything real, so
// this dropdown silently only ever offered "Community Member" no matter how
// many roles the backend returned. Matches the same allowlist Members.jsx
// uses for consistency between the two places a role gets assigned.
const ALLOWED_ROLE_NAMES = new Set(["Community Owner", "Community Admin", "Community Member"]);
const FALLBACK_ROLES = [{ id: "", name: "Community Member" }];

const COMPLETED_STEP_IDS = ["choose-path", "paying-member", "organization", "payment"];

const HEADERS = ["First Name", "Last Name", "Email Address", "Phone Number", "Member ID", "Role/Title"];
const SAMPLE_ROW = ["Muhammed", "Dorachinma", "Muha***med@**.com", "0812990293", "A23434", "Student"];

const inputCls = "w-full border border-[#797D86] p-3 rounded-sm text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-brand transition-all";

function downloadTemplate() {
  const sample = ["Ada", "Okafor", "ada@example.com", "08031234567", "M001", "Member"];
  const csv = `${HEADERS.join(",")}\n${sample.join(",")}\n`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "glass-member-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsvText(text) {
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
  return data;
}

async function parseCsvFile(file) {
  const text = await file.text();
  return parseCsvText(text);
}

async function parseCsvFromUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Couldn't download a file from that URL.");
  return parseCsvText(await res.text());
}

// Maps a parsed CSV row (using our template's headers, tolerant of a few
// common variants) to the real addCommunityMember payload — {email, roleId}
// is the only confirmed shape (api/communities.js); name/phone/member-ref
// columns are accepted in the template for the admin's own reference but
// aren't part of that contract, so they're dropped before submission.
// "Role/Title" is a free-text label in the CSV but the backend wants a
// roleId, so it's resolved against the community's actual roles by name.
function csvRowToMember(row, roles, defaultRoleId) {
  const get = (...keys) => {
    for (const k of keys) {
      const v = row[k];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  };
  const roleLabel = get("Role/Title", "Role", "Title", "role");
  const matchedRole = roles?.find((r) => r.name?.toLowerCase() === roleLabel.toLowerCase());

  return {
    email: get("Email Address", "Email", "email"),
    roleId: matchedRole?.id ?? defaultRoleId,
  };
}

function SuccessModal({ communityName, onDashboard, onCopy }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
      <div className="bg-white rounded-3xl flex flex-col items-center text-center px-10 py-20 w-full max-w-[550px] shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-center rounded-full mb-6 w-[70px] h-[70px] bg-[radial-gradient(circle,#22c55e_60%,#16a34a_100%)] shadow-[0_0_0_12px_#dcfce7]">
          <Check size={40} color="white" strokeWidth={3} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Community Is Now Live</h2>
        <p className="text-xs text-gray-500 mb-8">{communityName ?? "Your community"} is all set up on Glass!</p>
        <button onClick={onDashboard}
          className="w-4/5 py-3.5 rounded-full text-white font-medium text-xs bg-brand hover:opacity-90 transition-all border-none cursor-pointer mb-5">
          Go To Dashboard
        </button>
        <p className="text-xs text-gray-900 mb-1">Ready To Invite Members?</p>
        <button onClick={onCopy}
          className="text-xs font-medium text-brand hover:underline bg-transparent border-none cursor-pointer">
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
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const roles = rolesData ? rolesData.filter((r) => ALLOWED_ROLE_NAMES.has(r.name)) : [];
  const finalRoles = roles.length ? roles : FALLBACK_ROLES;

  // Same fallback as PaymentProfile.jsx -- location.state doesn't survive a
  // reload or forced re-login, and the community already exists on the
  // backend by this point.
  const { email, isPaying, communityId, communitySlug, communityName } =
    location.state ?? readOnboardingProgress();

  const handleBack = () => {
    navigate("/onboarding/payment-profile", {
      state: { email, isPaying, communityId, communitySlug, communityName },
    });
  };

  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [billingExempt,  setBillingExempt]  = useState(false);

  // Set default to "Community Member" once roles resolve
  useEffect(() => {
    if (finalRoles.length && !selectedRoleId) {
      const memberRole =
        finalRoles.find((r) => r.name === "Community Member") ?? finalRoles[0];
      if (memberRole?.id) setSelectedRoleId(memberRole.id);
    }
  }, [finalRoles]); // eslint-disable-line react-hooks/exhaustive-deps

  // /join/{slug} isn't a route this app has ever had — it fell through to
  // the catch-all and silently redirected to the public homepage, so this
  // link has never actually worked. /member/join is the real entry point;
  // ?community= (read by useJoinCommunityParam) tells it which community
  // to file a join request for once the visitor registers or signs in.
  //
  // window.location.origin instead of a hardcoded domain — confirmed live
  // that "app.glasspay.app" (used in the other invite-link generator)
  // doesn't resolve at all (DNS_PROBE_FINISHED_NXDOMAIN, not just a wrong
  // route). Using the origin actually being viewed from means this can
  // never point at a dead domain in dev, staging, or prod.
  const inviteLink = communitySlug
    ? `${APP_ORIGIN}/member/join?community=${communitySlug}`
    : APP_ORIGIN;

  const [tab,          setTab]          = useState("upload");
  const [dragOver,     setDragOver]     = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileUrl,      setFileUrl]      = useState("");
  const [copied, copy] = useCopyToClipboard();
  const [showSuccess,  setShowSuccess]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  // Manual tab — chip-based email entry instead of a full per-row table.
  // No name/role fields are collected here, so these go through the same
  // bulk-add endpoint as an {email}-only (+ optional phone) member record.
  const [emails,      setEmails]      = useState([]);
  const [emailInput,  setEmailInput]  = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState("");

  // URL upload — a simulated progress sequence (the underlying fetch+parse
  // has no natural byte-level progress signal worth wiring up for a CSV
  // that's typically tiny) so the wait doesn't feel like nothing's happening.
  const [urlStage,    setUrlStage]    = useState("idle"); // idle | fetching | complete
  const [urlProgress, setUrlProgress] = useState(0);
  const [urlFileInfo, setUrlFileInfo] = useState(null); // { name, sizeLabel }
  const [urlCsvText,  setUrlCsvText]  = useState(null);

  // Guards handleUrlUpload's post-fetch state updates if this page unmounts
  // (e.g. the user navigates away) while a URL fetch is still in flight.
  const unmountedRef = useRef(false);
  useEffect(() => () => { unmountedRef.current = true; }, []);

  const copyLink = () => copy(inviteLink);

  const handleFile = (file) => { if (file) setUploadedFile(file); };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  function commitEmailChip() {
    const val = emailInput.trim().replace(/[,;]+$/, "");
    if (val && !emails.includes(val)) setEmails((arr) => [...arr, val]);
    setEmailInput("");
  }
  function handleEmailKeyDown(e) {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      commitEmailChip();
    } else if (e.key === "Backspace" && !emailInput && emails.length > 0) {
      setEmails((arr) => arr.slice(0, -1));
    }
  }
  const removeEmailChip = (i) => setEmails((arr) => arr.filter((_, idx) => idx !== i));

  async function handleUrlUpload() {
    const url = fileUrl.trim();
    if (!url) return;
    setError("");
    setUrlStage("fetching");
    setUrlProgress(8);
    const tick = setInterval(() => {
      setUrlProgress((p) => (p < 88 ? p + Math.random() * 18 : p));
    }, 250);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Couldn't download a file from that URL.");
      const text = await res.text();
      clearInterval(tick);
      if (unmountedRef.current) return;
      setUrlProgress(100);
      const sizeKb = new Blob([text]).size / 1024;
      const name = url.split("/").pop() || "file.csv";
      setUrlFileInfo({
        name,
        sizeLabel: sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(sizeKb))} KB`,
      });
      setUrlCsvText(text);
      setUrlStage("complete");
    } catch (err) {
      clearInterval(tick);
      if (unmountedRef.current) return;
      setUrlStage("idle");
      setUrlProgress(0);
      setError(notifyError(err, { context: "Upload from URL" }));
    }
  }
  function clearUrlUpload() {
    setUrlStage("idle");
    setUrlProgress(0);
    setUrlFileInfo(null);
    setUrlCsvText(null);
    setFileUrl("");
  }

  async function handleSendInvite() {
    if (emails.length === 0) return;
    setError("");
    setLoading(true);
    try {
      if (!communityId) { setError("Community ID missing — go back and retry."); return; }
      if (!selectedRoleId) { setError("Roles are still loading — please wait a moment."); return; }
      const toastId = toastProgress("Sending invites…", "Usually takes 5–10 seconds");
      await bulkCreateCommunityInvites(communityId, {
        invites: emails.map((email) => ({ email, roleId: selectedRoleId, billingExempt })),
      });
      toastSuccess(`${emails.length} invite${emails.length === 1 ? "" : "s"} sent`, { id: toastId });
      setEmails([]);
      setPhoneNumbers("");
      setShowSuccess(true);
    } catch (err) {
      setError(notifyError(err, { context: "Send invites", fallback: "Failed to send invites. You can add members from the dashboard later." }));
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      let members;
      if (uploadedFile) {
        members = (await parseCsvFile(uploadedFile)).map((row) => csvRowToMember(row, rolesData, selectedRoleId));
      } else if (urlCsvText) {
        members = parseCsvText(urlCsvText).map((row) => csvRowToMember(row, rolesData, selectedRoleId));
      } else if (fileUrl.trim()) {
        members = (await parseCsvFromUrl(fileUrl.trim())).map((row) => csvRowToMember(row, rolesData, selectedRoleId));
      } else {
        members = [];
      }

      const filled = members.filter((m) => m.email);
      if (filled.length === 0) { setShowSuccess(true); return; }
      if (!communityId) { setError("Community ID missing — go back and retry."); return; }

      const toastId = toastProgress("Sending invites…", "Usually takes 5–10 seconds");
      await bulkCreateCommunityInvites(communityId, {
        invites: filled.map((m) => ({ email: m.email, roleId: m.roleId })),
      });
      toastSuccess(`${filled.length} invite${filled.length === 1 ? "" : "s"} sent`, { id: toastId });
      setShowSuccess(true);
    } catch (err) {
      setError(notifyError(err, { context: "Send invites", fallback: "Failed to send invites. You can invite members from the dashboard later." }));
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    // Onboarding is done -- nothing left to recover, and keeping this
    // around risks bleeding into a later, unrelated community's setup.
    clearOnboardingProgress();
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
      className="flex flex-col overflow-hidden h-screen bg-contain bg-center bg-page-default"
    >
      <header className="flex items-center justify-between px-8 py-4 bg-surface-container border-b border-outline-on-surface flex-shrink-0">
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
        <aside className="w-64 flex-shrink-0 bg-surface-container border-r border-outline-on-surface flex flex-col pt-10 px-6">
          {ONBOARDING_STEPS.map((step, i) => {
            const isActive    = step.id === "members";
            const isCompleted = COMPLETED_STEP_IDS.includes(step.id);
            const isLast      = i === ONBOARDING_STEPS.length - 1;
            return (
              <div key={step.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted
                        ? "bg-brand text-white"
                        : isActive
                          ? "bg-white border-2 border-brand text-brand"
                          : "bg-white border border-outline-on-surface text-gray-400"
                    }`}
                    style={isActive && !isCompleted ? { boxShadow: "0 0 0 4px rgba(0,47,167,0.15)" } : undefined}
                  >
                    {isCompleted
                      ? <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          {step.id === "organization" && <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
                          {step.id === "payment"      && <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>}
                          {step.id === "members"      && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}
                        </svg>
                    }
                  </div>
                  {!isLast && <div className={`w-px my-1 min-h-10 ${isCompleted ? "bg-brand" : "bg-outline-on-surface"}`} />}
                </div>
                <div className="pt-1.5 pb-10">
                  <span className={`text-sm font-medium ${isActive ? "text-[#000000]" : isCompleted ? "text-gray-600" : "text-gray-400"}`}>{step.label}</span>
                </div>
              </div>
            );
          })}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto py-10 px-12">
          <div className="w-full max-w-4xl">
            <div className="mb-6">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer mb-4 -ml-1 p-0"
              >
                <ArrowLeft size={15} />
                Back
              </button>
              <h2 className="text-base font-medium text-gray-900 mb-1">Add your members</h2>
              <p className="text-sm text-gray-500">Add members now or invite them to join. You can always add more from your dashboard later.</p>
            </div>

            {/* Invite banner */}
            <div className="flex items-center justify-between px-5 py-4 rounded-xl mb-6 bg-[#D7E2FF] border border-[#0E628C33]">
              <div>
                <p className="text-xs text-gray-900 mb-0.5">Your community is ready to grow.</p>
                <p className="text-xs text-gray-500">Copy this link and share it with your members to get them on Glass.</p>
              </div>
              <button onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-brand text-xs font-semibold text-brand hover:bg-gray-50 transition-all flex-shrink-0 ml-6 cursor-pointer bg-transparent">
                <Copy size={12} />{copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            {/* Direct add card */}
            <div className="bg-stacked-container rounded-lg p-6 border border-[#E5E7EB]">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Prefer To Add Members Directly?</h3>

              {/* Tabs */}
              <div className="flex gap-6 border-b border-gray-200 mb-5">
                {["upload", "manual"].map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`pb-2.5 text-sm font-medium capitalize bg-transparent cursor-pointer transition-all border-x-0 border-t-0 border-b-2 ${tab === t ? "text-brand border-b-brand" : "text-[#9ca3af] border-b-transparent"}`}>
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
                    <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs font-medium text-brand hover:opacity-80 bg-transparent border-none cursor-pointer">
                      <Download size={12} />Download Template
                    </button>
                  </div>

                  {/* Sample table */}
                  <div className="rounded-md overflow-hidden mb-4 border border-[#E5E7EB]">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          {HEADERS.map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-gray-100">
                          {SAMPLE_ROW.map((cell, i) => (
                            <td key={i} className={`px-4 py-3 ${i === 2 ? "text-brand underline" : "text-gray-900"}`}>{cell}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Drop zone */}
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`w-full rounded-lg flex flex-col items-center justify-center py-14 cursor-pointer transition-all mb-5 min-h-[140px] border-2 border-dashed ${dragOver ? "bg-[#EEF2FF] border-brand" : "bg-[#FAFAFA] border-[#D1D5DB]"}`}
                  >
                    <input ref={fileRef} type="file" accept=".csv" className="hidden"
                      onChange={(e) => handleFile(e.target.files[0])} />
                    <CloudUpload size={30} className="text-gray-400 mb-3" />
                    {uploadedFile
                      ? <p className="text-xs text-brand font-medium">{uploadedFile.name}</p>
                      : <p className="text-xs text-gray-500">Drag and Drop CSV here or <span className="text-brand font-medium underline">Browse</span></p>}
                  </div>

                  {/* URL upload */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">Or Upload from URL</p>
                    <div className="flex gap-2">
                      <input type="url" value={fileUrl}
                        onChange={(e) => { setFileUrl(e.target.value); if (urlStage !== "idle") clearUrlUpload(); }}
                        placeholder="Add File URL" className={inputCls}
                        disabled={urlStage === "fetching"} />
                      <button onClick={handleUrlUpload} disabled={!fileUrl.trim() || urlStage === "fetching" || loading}
                        className="px-5 py-2 rounded-sm bg-[#002FA733] text-xs text-brand hover:bg-brand/10 transition-all flex-shrink-0 border-none cursor-pointer disabled:opacity-50">
                        Upload
                      </button>
                    </div>

                    {urlStage === "fetching" && (
                      <div className="mt-3 rounded-lg flex flex-col items-center justify-center py-10 border-2 border-dashed border-brand bg-[#EEF2FF]">
                        <div className="relative w-16 h-16 mb-3">
                          <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="#E0E3F0" strokeWidth="6" />
                            <circle cx="32" cy="32" r="28" fill="none" stroke="#002FA7" strokeWidth="6"
                              strokeDasharray={2 * Math.PI * 28}
                              strokeDashoffset={2 * Math.PI * 28 * (1 - urlProgress / 100)}
                              strokeLinecap="round" className="transition-[stroke-dashoffset] duration-200 ease-linear" />
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
                      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg px-4 py-3 border border-[#E5E7EB]">
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

                  {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

                  <button
                    onClick={handleSubmit}
                    disabled={loading || urlStage === "fetching"}
                    className="w-full py-4 rounded-full text-white font-semibold text-sm bg-brand hover:opacity-90 active:scale-[0.98] transition-all mt-6 border-none cursor-pointer disabled:opacity-60"
                  >
                    {loading ? "Adding members…" : "Create Your Community"}
                  </button>
                </>
              )}

              {/* Manual tab */}
              {tab === "manual" && (
                <>
                  <p className="text-sm font-medium text-gray-900 mb-2">Enter Email(s):</p>
                  <div className="rounded-lg p-3 flex flex-wrap items-center gap-2 mb-5 min-h-[60px] border border-[#E5E7EB] bg-white">
                    {emails.map((em, i) => (
                      <span key={em + i} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full text-sm text-gray-800 bg-stacked-container">
                        <span className="w-6 h-6 rounded-full bg-[#D7E2FF] text-brand text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                          {em.charAt(0).toUpperCase()}
                        </span>
                        {em}
                        <button onClick={() => removeEmailChip(i)} aria-label={`Remove ${em}`}
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
                  <div className="relative mb-4">
                    <select
                      value={selectedRoleId}
                      onChange={(e) => setSelectedRoleId(e.target.value)}
                      disabled={rolesLoading}
                      className={`${inputCls} appearance-none pr-8 ${rolesLoading ? "opacity-50" : ""}`}
                    >
                      {rolesLoading
                        ? <option>Loading roles…</option>
                        : finalRoles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))
                      }
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>

                  <label className="flex items-center gap-2.5 text-sm text-gray-700 mb-5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={billingExempt}
                      onChange={(e) => setBillingExempt(e.target.checked)}
                      className="w-4 h-4 accent-brand cursor-pointer"
                    />
                    Exempt from billing
                    <span className="text-xs text-gray-400 font-normal">(no payment reminders will be sent)</span>
                  </label>

                  {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

                  <div className="flex justify-end">
                    <button
                      onClick={handleSendInvite}
                      disabled={emails.length === 0 || loading || rolesLoading || !selectedRoleId}
                      className="px-6 py-3.5 rounded-full text-white font-semibold text-sm bg-brand hover:opacity-90 active:scale-[0.98] transition-all border-none cursor-pointer disabled:opacity-50"
                    >
                      {loading ? "Sending…" : "Send Invite"}
                    </button>
                  </div>
                </>
              )}
            </div>
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


