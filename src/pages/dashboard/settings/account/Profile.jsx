import { useEffect, useRef, useState } from "react";
import { useMe, useUpdateProfile } from "../../../../hooks/useMyAccount";
import { useFileUpload } from "../../../../hooks/useFileUpload";
import { getErrorMessage } from "../../../../utils/errorHandler";
import { useAuth } from "../../../../store/AuthContext";
import { parseUserData } from "../../../../utils/userData";

export default function Profile() {
  const { data: user, isLoading } = useMe();
  const updateProfile = useUpdateProfile();
  const uploadFile = useFileUpload();
  const { refreshUser } = useAuth();
  const photoInputRef = useRef(null);

  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);

  // profileImage lives inside userData too (confirmed against the real
  // GET /user/me response — it's not a top-level field).
  const profileImageUrl = parseUserData(user).profileImage?.url ?? null;

  useEffect(() => {
    if (!user) return;
    const ud = parseUserData(user);
    setForm({
      firstName: ud.firstName ?? "",
      lastName: ud.lastName ?? "",
      phone: user.phoneNumber ?? ud.phone ?? "",
    });
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setError("");
    try {
      await updateProfile.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phone,
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save changes."));
    }
  };

  const handlePhotoSelect = async (file) => {
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
    try {
      const uploadRes = await uploadFile.mutateAsync({ file, fileCategory: "PROFILE_IMAGE" });
      const profileImageFileId = uploadRes.data?.data?.id;
      // Unlike firstName/lastName/phoneNumber (which the backend accepts
      // flat and maps into userData itself), profileImageFileId only takes
      // effect when sent nested under userData explicitly.
      await updateProfile.mutateAsync({ userData: { profileImageFileId } });
      await refreshUser();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upload photo."));
    }
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-lg bg-white text-gray-900 text-xs outline-none transition-all border border-gray-300 focus:border-[#002FA7]";

  const displayName = `${form.firstName} ${form.lastName}`.trim() || user?.email || "—";
  const initials = displayName.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";

  return (
    <div className="flex flex-col gap-5 max-w-3xl w-full">

      {/* Profile card */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Profile</p>
        <p className="text-xs text-gray-500">Manage your personal information</p>
      </div>
      <div className="bg-white rounded-lg p-4" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#D7E2FF] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {photoPreview || profileImageUrl ? (
                <img src={photoPreview ?? profileImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm text-[#002FA7]">{initials}</span>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-900">{isLoading ? "Loading…" : displayName}</p>
              <p className="text-xs text-gray-500">{user?.email ?? ""}</p>
            </div>
          </div>
          <input ref={photoInputRef} type="file" accept="image/png,image/jpeg" className="hidden"
            onChange={(e) => handlePhotoSelect(e.target.files[0])} />
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadFile.isPending}
            className="px-2 py-2 rounded-sm text-xs bg-white hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
            style={{ border: "1px solid" }}
          >
            {uploadFile.isPending ? "Uploading…" : "Change Photo"}
          </button>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg p-6" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-medium text-gray-900 mb-0.5">Personal Information</p>
        <p className="text-xs text-gray-500 mb-5">This is how your information will appear across glass</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600">First Name</label>
            <input name="firstName" value={form.firstName} onChange={handleChange} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600">Last Name</label>
            <input name="lastName" value={form.lastName} onChange={handleChange} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600">Email Address</label>
            <input value={user?.email ?? ""} disabled className={inputCls + " bg-gray-50 text-gray-400"} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600">Phone Number</label>
            <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} />
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="p-2 rounded-sm text-[11px] text-[#002FA7] hover:bg-[#002FA7] hover:text-white transition-all cursor-pointer border border-[#002FA7] disabled:opacity-50"
          >
            {saved ? "Saved!" : updateProfile.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-white rounded-lg p-6" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-medium text-gray-900 mb-0.5">Delete Account</p>
        <p className="text-xs text-gray-500 mb-4">Permanent actions that cannot be undone.</p>
        <div
          className="flex items-center justify-between px-4 py-3 rounded-lg"
          style={{ border: "1px solid #FECACA", background: "#FFF5F5" }}
        >
          <p className="text-xs text-gray-700">
            Permanently remove your account and all associated data from Glass.
          </p>
          <button
            className="ml-4 px-4 py-1.5 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 transition-all flex-shrink-0 cursor-pointer bg-transparent"
            style={{ border: "1px solid #FECACA" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
