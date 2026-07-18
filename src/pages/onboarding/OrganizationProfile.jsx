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
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Upload, Check, X as XIcon, Loader2, ArrowLeft } from "lucide-react";
import GlassLogo from "../../assets/Glass.webp";
import Background from "../../assets/background.webp";
import client from "../../api/client";
import { updateCommunity } from "../../api/communities";
import { useSlug } from "../../hooks/useSlug";
import { useAuth } from "../../store/AuthContext";
import { notifyError } from "../../utils/errorHandler";
import { getEmailError } from "../../utils/validators";
import { resizeImageFile } from "../../utils/resizeImage";
import { saveOnboardingProgress, readOnboardingProgress } from "../../utils/onboardingProgress";
import { ONBOARDING_STEPS } from "../../utils/onboardingSteps";

const CATEGORIES = [
  "Alumni Association", "Faith Community", "Professional Association",
  "Student Club", "University Club", "NGO / Non-profit", "Sports Club", "Other",
];

const COMPLETED_STEP_IDS = ["choose-path", "paying-member"];

const inputCls =
  "w-full border border-gray-300 bg-stacked-container p-3 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all";

function StepIcon({ id }) {
  const icons = {
    organization: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
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

  // location.state doesn't survive a reload or a forced re-login mid-form
  // (see errorHandler.js/client.js's session-expiry redirect) -- fall back
  // to whatever was last persisted for this in-progress signup so a
  // dropped session doesn't also drop everything already typed.
  const savedProgress = readOnboardingProgress();
  const email      = location.state?.email ?? savedProgress.email ?? "";
  const isPaying   = location.state?.isPaying ?? savedProgress.isPaying ?? true;
  // Set once the community's actually been created (see handleSubmit) — if
  // present, this is a revisit (e.g. via PaymentProfile's Back button), and
  // submitting again must update that same community instead of creating a
  // second one.
  const existingCommunityId   = location.state?.communityId ?? savedProgress.communityId ?? null;
  const existingCommunitySlug = location.state?.communitySlug ?? savedProgress.communitySlug ?? null;
  const { updateUser, isAuthenticated } = useAuth();

  // Covers users who already have an account (and so already have a
  // session) but end up here by accident — e.g. hitting back/forward or a
  // stale bookmark mid-onboarding. They shouldn't get stuck on this form
  // with no way out other than the browser back button.
  const handleBack = () => {
    navigate(isAuthenticated ? "/dashboard/home" : "/onboarding/choose-path", { state: { email } });
  };

  const [dragOver,  setDragOver]  = useState(false);
  const [logoFile,  setLogoFile]  = useState(null);   // File object -- not persisted, re-picking a logo is a small ask next to losing the whole form
  const [logoUrl,   setLogoUrl]   = useState(null);   // preview URL
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ communityName: "", category: "", contactEmail: "", slug: "", description: "" });

  const [form, setForm] = useState({
    communityName: savedProgress.form?.communityName ?? "",
    description:   savedProgress.form?.description ?? "",
    category:      savedProgress.form?.category ?? "",
    contactEmail:  savedProgress.form?.contactEmail ?? email,
  });

  const { slug, setSlug, available, checking, suggesting, suggestFrom } =
    useSlug("COMMUNITY");

  // Restore a previously-entered slug once on mount (setSlug triggers the
  // hook's own debounced availability re-check, same as a manual edit).
  useEffect(() => {
    if (savedProgress.slug) setSlug(savedProgress.slug);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist as the admin types, so a dropped session mid-form loses at
  // most the last few keystrokes instead of the whole thing.
  useEffect(() => {
    saveOnboardingProgress({ form, slug, email, isPaying });
  }, [form, slug, email, isPaying]);

  function validateField(field, value) {
    if (field === "communityName" && !value.trim()) return "Community name is required.";
    if (field === "category" && !value) return "Please select a category.";
    if (field === "contactEmail") return getEmailError(value);
    if (field === "slug" && !value.trim()) return "Please choose a community URL slug.";
    if (field === "description") {
      const trimmed = value.trim();
      if (!trimmed) return "Tell members a bit about your community.";
      if (trimmed.length < 10) return "Description is too short — add a few more words.";
    }
    return "";
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((fe) => (fe[name] ? { ...fe, [name]: validateField(name, value) } : fe));
  };

  const handleFieldBlur = (field) => (e) =>
    setFieldErrors((fe) => ({ ...fe, [field]: validateField(field, e.target.value) }));

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

    const nextFieldErrors = {
      communityName: validateField("communityName", form.communityName),
      category: validateField("category", form.category),
      contactEmail: validateField("contactEmail", form.contactEmail),
      slug: validateField("slug", slug),
      description: validateField("description", form.description),
    };
    if (Object.values(nextFieldErrors).some(Boolean)) {
      setFieldErrors(nextFieldErrors);
      return;
    }
    // An unchanged slug on a revisit is taken -- by this same community --
    // so the live availability check would otherwise wrongly block re-saving.
    if (available === false && slug.trim() !== existingCommunitySlug) {
      setError("That URL slug is already taken — pick another.");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload logo (optional — skip if no file selected)
      let logoFileId = undefined;
      if (logoFile) {
        const resizedLogo = await resizeImageFile(logoFile);
        const fd = new FormData();
        fd.append("file", resizedLogo);
        fd.append("fileCategory", "COMMUNITY_LOGO");
        const uploadRes = await client.post("/file/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        logoFileId = uploadRes.data?.data?.id;
      }

      const payload = {
        name:        form.communityName.trim(),
        slug:        slug.trim(),
        description: form.description.trim(),
        category:    [form.category],
        contactEmail: form.contactEmail.trim(),
        publicVisible: true,
        // Default to approval-required: with the public Discover page, an
        // open-join community would let absolutely anyone in unmoderated.
        // Admins can turn this off in Settings → Community → Member Access.
        requiresMemberApproval: true,
        ...(logoFileId ? { logoFileId } : {}),
      };

      // 2. Create the community, or update it if this is a revisit (e.g. via
      // PaymentProfile's Back button) -- posting again would create a second,
      // duplicate community rather than editing the one already made.
      const res = existingCommunityId
        ? await updateCommunity(existingCommunityId, payload)
        : await client.post("/communities", payload);

      const community = res.data?.data;
      if (!community?.id) throw new Error("Community creation failed.");

      // AuthContext's isAdmin reflects the communities list as of the last
      // login/refresh, which didn't include this community yet since it
      // didn't exist. Without this, ProtectedRoute's admin check bounces
      // straight to the member app, which then hits the device guard on
      // desktop and dead-ends at the QR handoff instead of the dashboard.
      updateUser({ isAdmin: true });

      // From here on, this community exists on the backend whether or not
      // the rest of onboarding completes -- persist the link to it so a
      // dropped session on the next two steps can resume instead of
      // stranding a half-configured community with no way back to it.
      saveOnboardingProgress({
        email, isPaying,
        communityId: community.id, communitySlug: community.slug, communityName: community.name,
      });

      navigate("/onboarding/payment-profile", {
        state: { email, isPaying, communityId: community.id, communitySlug: community.slug, communityName: community.name },
      });

    } catch (err) {
      setError(notifyError(err, { context: existingCommunityId ? "Update community" : "Create community" }));
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
      <header className="flex items-center justify-between px-8 py-4 bg-surface-container border-b border-outline-on-surface flex-shrink-0">
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
        <aside className="w-64 flex-shrink-0 bg-surface-container border-r border-outline-on-surface flex flex-col pt-10 px-6">
          {ONBOARDING_STEPS.map((step, i) => {
            const isActive    = step.id === "organization";
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
                      : <StepIcon id={step.id} />}
                  </div>
                  {!isLast && <div className="w-px my-1" style={{ minHeight: 40, background: isCompleted ? "#002FA7" : "var(--color-outline-on-surface)" }} />}
                </div>
                <div className="pt-1.5 pb-10">
                  <span className={`text-sm font-medium ${isActive ? "text-[#000000]" : "text-gray-400"}`}>{step.label}</span>
                </div>
              </div>
            );
          })}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto py-10 px-12 flex flex-col items-center">
          <form onSubmit={handleSubmit} className="w-full max-w-4xl">
            <div className="mb-8">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer mb-4 -ml-1 p-0"
              >
                <ArrowLeft size={15} />
                {isAuthenticated ? "Back to dashboard" : "Back"}
              </button>
              <h2 className="text-xl font-medium text-gray-900 mb-1">Tell us about your community</h2>
              <p className="text-sm text-gray-500">This is how your community will appear to members on Glass.</p>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Community Name *</label>
                <input type="text" name="communityName" value={form.communityName} onChange={handleChange}
                  onBlur={(e) => { if (!slug) suggestFrom(form.communityName); handleFieldBlur("communityName")(e); }}
                  placeholder="e.g. Babcock University Alumni Association" className={inputCls}
                  style={fieldErrors.communityName ? { borderColor: "var(--color-danger)" } : undefined} />
                {fieldErrors.communityName && <span className="text-xs text-danger">{fieldErrors.communityName}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Description *</label>
                <input type="text" name="description" value={form.description} onChange={handleChange}
                  onBlur={handleFieldBlur("description")}
                  placeholder="Briefly describe what your community is about" className={inputCls}
                  style={fieldErrors.description ? { borderColor: "var(--color-danger)" } : undefined} />
                {fieldErrors.description && <span className="text-xs text-danger">{fieldErrors.description}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Category *</label>
                <select name="category" value={form.category} onChange={handleChange} onBlur={handleFieldBlur("category")} className={inputCls}
                  style={fieldErrors.category ? { borderColor: "var(--color-danger)" } : undefined}>
                  <option value="" disabled>Select a category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {fieldErrors.category && <span className="text-xs text-danger">{fieldErrors.category}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Community URL slug *</label>
                <div className="relative">
                  <input type="text" value={slug}
                    onChange={(e) => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""); setSlug(v); setFieldErrors((fe) => (fe.slug ? { ...fe, slug: validateField("slug", v) } : fe)); }}
                    onBlur={(e) => setFieldErrors((fe) => ({ ...fe, slug: validateField("slug", e.target.value) }))}
                    placeholder="e.g. babcock-alumni" className={inputCls + " pr-8"}
                    style={fieldErrors.slug ? { borderColor: "var(--color-danger)" } : undefined} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {(checking || suggesting) && <Loader2 size={14} className="animate-spin text-gray-400" />}
                    {!checking && !suggesting && available === true && <Check size={14} className="text-green-600" />}
                    {!checking && !suggesting && available === false && <XIcon size={14} className="text-red-500" />}
                  </span>
                </div>
                {fieldErrors.slug && (
                  <span className="text-xs text-danger">{fieldErrors.slug}</span>
                )}
                {!fieldErrors.slug && available === false && !checking && (
                  <span className="text-xs text-red-500">That URL is taken — try another.</span>
                )}
                {!fieldErrors.slug && available === true && !checking && (
                  <span className="text-xs text-green-600">glasspay.app/member/join?community={slug}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Contact Email *</label>
                <input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange}
                  onBlur={handleFieldBlur("contactEmail")}
                  placeholder="e.g. contact@babcockalumni.org" className={inputCls}
                  style={fieldErrors.contactEmail ? { borderColor: "var(--color-danger)" } : undefined} />
                {fieldErrors.contactEmail ? (
                  <p className="text-xs text-danger">{fieldErrors.contactEmail}</p>
                ) : (
                  <p className="text-xs text-gray-400">Where Glass and members can reach your community.</p>
                )}
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
                  border: dragOver ? "1.5px dashed #002FA7" : "1.5px dashed #C2C2C2",
                }}
              >
                <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])} />
                {logoUrl
                  ? <img src={logoUrl} alt="preview" className="h-16 object-contain mb-2" />
                  : <Upload size={28} className="text-gray-400 mb-3" />}
                <p className="text-sm text-gray-500 text-center">
                  <span className="font-medium underline text-brand">Upload</span> or Drag and Drop Logo Here
                </p>
                <p className="text-xs text-gray-400 mt-1">(PNG or JPG, max 2MB.)</p>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <button
              type="submit"
              disabled={loading || checking || available === false}
              className="w-1/2 mx-auto block py-4 rounded-full text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all border-none cursor-pointer disabled:opacity-60 bg-brand"
            >
              {loading ? "Creating community..." : "Next"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}

