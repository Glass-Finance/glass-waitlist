import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveCommunityId } from "../../../../hooks/useActiveCommunityId";
import { useCommunity, useUpdateCommunity } from "../../../../hooks/useCommunity";
import { useFileUpload } from "../../../../hooks/useFileUpload";
import { getErrorMessage } from "../../../../utils/errorHandler";
import { resizeImageFile } from "../../../../utils/resizeImage";
import { deleteCommunity } from "../../../../api/communities";
import { useAuth } from "../../../../store/AuthContext";

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
  const navigate = useNavigate();
  const communityId = useActiveCommunityId();
  const { data: community, isLoading } = useCommunity(communityId);
  const updateCommunity = useUpdateCommunity(communityId);
  const uploadFile = useFileUpload();
  const logoInputRef = useRef(null);
  const { logout } = useAuth();

  const [form, setForm] = useState({ name: "", category: "", description: "" });
  const [toggles, setToggles] = useState({ publicVisible: true, requiresMemberApproval: false });
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError] = useState("");

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleDeleteCommunity() {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteCommunity(communityId);
      await logout();
      navigate("/sign-in");
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete community."));
      setDeleteLoading(false);
    }
  }

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
      setError(getErrorMessage(err, "Failed to save changes."));
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
      const resized = await resizeImageFile(file);
      const uploadRes = await uploadFile.mutateAsync({ file: resized, fileCategory: "COMMUNITY_LOGO" });
      const fileData = uploadRes.data?.data ?? uploadRes.data;
      const logoFileId = fileData?.id ?? fileData?.fileId;
      await updateCommunity.mutateAsync({ logoFileId });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upload logo."));
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
              {logoPreview || community?.logo?.url || community?.logoUrl ? (
                <img src={logoPreview ?? community?.logo?.url ?? community?.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initials || "C"
              )}
            </div>
            <div>
              <p className="text-sm text-gray-900">{isLoading ? "Loading…" : (community?.name ?? "Community")}</p>
              <p className="text-xs text-gray-500">{community?.slug ? `glasspay.app/member/join?community=${community.slug}` : ""}</p>
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
        className="bg-[#EFEFF1E5] rounded-lg px-5 pt-4 pb-5"
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
        className="bg-[#EFEFF1E5] rounded-lg px-5 pt-4 pb-4"
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
        className="bg-[#EFEFF1E5] rounded-lg px-5 pt-4 pb-4"
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
            onClick={() => setDeleteModal(true)}
            className="ml-4 px-3 py-1.5 rounded-md text-xs text-red-600 bg-white hover:bg-red-50 transition-all flex-shrink-0 cursor-pointer"
            style={{ border: "1px solid #FECACA" }}
          >
            Delete
          </button>
        </div>
      </div>

      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div className="bg-[#EFEFF1E5] rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
              style={{ background: "#FEE2E2" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>

            <h3 className="text-base font-semibold text-gray-900 mb-1">Delete Community</h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              This will permanently delete <strong className="text-gray-800">{community?.name}</strong> and all associated members, payments, and data. This cannot be undone.
            </p>

            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Type <strong>{community?.name}</strong> to confirm
            </label>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={community?.name ?? ""}
              className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-xs outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 mb-4 transition-all"
            />

            {deleteError && <p className="text-xs text-red-500 mb-3">{deleteError}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => { setDeleteModal(false); setDeleteConfirm(""); setDeleteError(""); }}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-gray-700 cursor-pointer transition-colors"
                style={{ background: "#F3F4F6" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCommunity}
                disabled={deleteConfirm !== community?.name || deleteLoading}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-white cursor-pointer transition-colors disabled:opacity-50"
                style={{ background: "#DC2626" }}
              >
                {deleteLoading ? "Deleting…" : "Delete Community"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
