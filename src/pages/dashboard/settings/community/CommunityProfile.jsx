import { useEffect, useRef, useState } from "react";
import { useActiveCommunityId } from "../../../../hooks/useActiveCommunity";
import { useCommunity, useUpdateCommunity } from "../../../../hooks/useCommunity";
import { useFileUpload } from "../../../../hooks/useFileUpload";

const CATEGORIES = [
  "Alumni Association",
  "Faith Community",
  "Professional Association",
  "Student Club",
  "University Club",
  "NGO / Non-profit",
  "Sports Club",
  "School",
  "Other",
];

const inputCls =
  "w-full border border-gray-300 px-3 py-2.5 rounded-lg text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/10 transition-all";

function Toggle({ on, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      disabled={disabled}
      role="switch"
      aria-checked={on}
      className="relative inline-flex items-center cursor-pointer border-none bg-transparent disabled:opacity-50"
      style={{ width: 40, height: 22 }}
    >
      <span
        className="absolute inset-0 rounded-full transition-colors duration-200"
        style={{ background: on ? "#002FA7" : "#D1D5DB" }}
      />
      <span
        className="absolute w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
        style={{ top: 3, transform: on ? "translateX(20px)" : "translateX(3px)" }}
      />
    </button>
  );
}

export default function CommunityProfile() {
  const communityId = useActiveCommunityId();
  const { data: community, isLoading } = useCommunity(communityId);
  const updateCommunity = useUpdateCommunity(communityId);
  const uploadFile = useFileUpload();
  const logoInputRef = useRef(null);

  const [form, setForm] = useState({ name: "", category: "", description: "" });
  const [toggles, setToggles] = useState({ publicVisible: true, requiresMemberApproval: false });
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!community) return;
    setForm({
      name: community.name ?? "",
      category: Array.isArray(community.category) ? community.category[0] ?? "" : community.category ?? "",
      description: community.description ?? "",
    });
    setToggles({
      publicVisible: community.publicVisible ?? true,
      requiresMemberApproval: community.requiresMemberApproval ?? false,
    });
  }, [community]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setError("");
    try {
      await updateCommunity.mutateAsync({
        name: form.name,
        category: [form.category],
        description: form.description,
        ...toggles,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to save changes.");
    }
  };

  const handleToggle = async (key, value) => {
    const next = { ...toggles, [key]: value };
    setToggles(next);
    try {
      await updateCommunity.mutateAsync(next);
    } catch {
      setToggles(toggles); // revert on failure
    }
  };

  const handleLogoSelect = async (file) => {
    if (!file || !communityId) return;
    setLogoPreview(URL.createObjectURL(file));
    setError("");
    try {
      const uploadRes = await uploadFile.mutateAsync({ file, fileCategory: "COMMUNITY_LOGO" });
      const logoFileId = uploadRes.data?.data?.id;
      await updateCommunity.mutateAsync({ logoFileId });
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to upload logo.");
    }
  };

  const initials = (community?.name ?? "?").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("");

  return (
    <div className="flex flex-col gap-4" >

      {/* ── Logo ── */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Profile</p>
        <p className="text-xs text-gray-500 mb-3">Manage how your community appears across Glass</p>

        <div
          className="bg-[#f6f6f8] rounded-lg px-4 py-4 flex items-center justify-between"
          style={{ border: "1px solid #EFEFF1" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs text-[#002FA7] flex-shrink-0 overflow-hidden"
              style={{ background: "#D7E2FF" }}
            >
              {logoPreview || community?.logo?.url ? (
                <img src={logoPreview ?? community.logo.url} alt="" className="w-full h-full object-cover" />
              ) : (
                initials || "C"
              )}
            </div>
            <div>
              <p className="text-sm text-gray-900">{isLoading ? "Loading…" : (community?.name ?? "Community")}</p>
              <p className="text-xs text-gray-500">{community?.slug ? `glasspay.app/join/${community.slug}` : ""}</p>
            </div>
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => handleLogoSelect(e.target.files[0])}
          />
          <button
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadFile.isPending}
            className="px-3 py-2 rounded-sm text-xs text-gray-700 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
            style={{ border: "1px solid" }}
          >
            {uploadFile.isPending ? "Uploading…" : "Change Logo"}
          </button>
        </div>
      </div>

      {/* ── Community Information ── */}
      <div
        className="bg-[#f6f6f8] rounded-lg px-5 pt-4 pb-5"
        style={{ border: "1px solid #E5E7EB" }}
      >
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Community Information</p>
        <p className="text-xs text-gray-500 mb-4">This is how your information will appear across glass</p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Community Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
            <select name="category" value={form.category} onChange={handleChange} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={`${inputCls} resize-none`} />
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={updateCommunity.isPending}
            className="px-2 py-2 rounded-sm text-xs text-[#002FA7] hover:bg-[#002FA7]/10 transition-all border border-[#002FA7] cursor-pointer disabled:opacity-50"
          >
            {saved ? "Saved!" : updateCommunity.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* ── Visibility & Approval ── */}
      <div
        className="bg-[#f6f6f8] rounded-lg px-5 pt-4 pb-4"
        style={{ border: "1px solid #E5E7EB" }}
      >
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Visibility & Approval</p>
        <p className="text-xs text-gray-500 mb-4">Control who can find and join your community.</p>

        <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <div>
            <p className="text-sm text-gray-900">Public visibility</p>
            <p className="text-xs text-gray-500">Show this community in public search and join pages.</p>
          </div>
          <Toggle on={toggles.publicVisible} onChange={(v) => handleToggle("publicVisible", v)} disabled={updateCommunity.isPending} />
        </div>

        <div className="flex items-center justify-between py-2.5">
          <div>
            <p className="text-sm text-gray-900">Require approval to join</p>
            <p className="text-xs text-gray-500">New members must be approved by an admin before joining.</p>
          </div>
          <Toggle on={toggles.requiresMemberApproval} onChange={(v) => handleToggle("requiresMemberApproval", v)} disabled={updateCommunity.isPending} />
        </div>
      </div>

      {/* ── Delete Community ── */}
      <div
        className="bg-[#f6f6f8] rounded-lg px-5 pt-4 pb-4"
        style={{ border: "1px solid #E5E7EB" }}
      >
        <p className="text-sm text-gray-900 mb-0.5">Delete Community</p>
        <p className="text-xs text-gray-500 mb-3">Permanent actions that cannot be undone.</p>

        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ border: "1px solid #FECACA", background: "#FFF5F5" }}
        >
          <p className="text-xs text-gray-700">
            Permanently remove this community and all associated data from Glass.
          </p>
          <button
            className="ml-4 px-3 py-1.5 rounded-md text-xs text-red-600 bg-white hover:bg-red-50 transition-all flex-shrink-0 cursor-pointer"
            style={{ border: "1px solid #FECACA" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
