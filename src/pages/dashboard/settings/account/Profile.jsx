import { useEffect, useRef, useState } from "react";
import { useMe, useUpdateProfile } from "../../../../hooks/useMyAccount";
import { useFileUpload } from "../../../../hooks/useFileUpload";
import { updateEmail } from "../../../../api/members";
import { getErrorMessage } from "../../../../utils/errorHandler";
import { useAuth } from "../../../../store/AuthContext";
import { parseUserData } from "../../../../utils/userData";
import EmailChangeModal from "../../../../components/auth/EmailChangeModal";

export default function Profile() {
  const { data: user, isLoading } = useMe();
  const { refreshUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const uploadFile = useFileUpload();
  const photoInputRef = useRef(null);

  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [savedForm, setSavedForm] = useState(form);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);

  // user here is from useMe() (raw GET /user/me response). profileImage is
  // nested inside the userData blob, so parseUserData is the correct extractor.
  // The AuthContext user is separate — it has profileImage flat after refreshUser.
  const profileImageUrl = parseUserData(user).profileImage?.url ?? user?.profileImage?.url ?? null;

  useEffect(() => {
    if (!user) return;
    const ud = parseUserData(user);
    const loaded = {
      firstName: ud.firstName ?? user?.firstName ?? "",
      lastName: ud.lastName ?? user?.lastName ?? "",
      phone: user.phoneNumber ?? ud.phone ?? "",
      email: user.email ?? "",
    };
    setForm(loaded);
    setSavedForm(loaded);
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const isDirty =
    form.firstName !== savedForm.firstName ||
    form.lastName !== savedForm.lastName ||
    form.phone !== savedForm.phone ||
    form.email !== savedForm.email;

  // Email changes go through OTP verification (handled by EmailChangeModal)
  // before they actually take effect, so they're split out from the rest of
  // the form here — name/phone save immediately as before, email only after
  // the code sent to the new address is confirmed.
  const handleSave = async () => {
    setError("");
    try {
      if (form.firstName !== savedForm.firstName || form.lastName !== savedForm.lastName || form.phone !== savedForm.phone) {
        await updateProfile.mutateAsync({
          username: user?.username,
          userData: {
            firstName: form.firstName,
            lastName: form.lastName,
            phoneNumber: form.phone,
          },
        });
        await refreshUser();
        setSavedForm((sf) => ({ ...sf, firstName: form.firstName, lastName: form.lastName, phone: form.phone }));
      }

      if (form.email !== savedForm.email) {
        setEmailSaving(true);
        await updateEmail({ email: form.email.trim().toLowerCase() });
        setEmailSaving(false);
        setEmailModalOpen(true);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setEmailSaving(false);
      const status = err?.response?.status;
      setError(
        status === 404
          ? "Profile setup incomplete — please contact support to finish setting up your account."
          : getErrorMessage(err, "Failed to save changes.")
      );
    }
  };

  function handleEmailVerified() {
    setEmailModalOpen(false);
    setSavedForm((sf) => ({ ...sf, email: form.email }));
    refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleWrongEmail() {
    // Just closes the modal — the (mistyped) email stays in the field so
    // they can correct it rather than retyping the whole address.
    setEmailModalOpen(false);
  }

  const handlePhotoSelect = async (file) => {
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
    try {
      const uploadRes = await uploadFile.mutateAsync({ file, fileCategory: "PROFILE_IMAGE" });
      const fileData = uploadRes.data?.data ?? uploadRes.data;
      const profileImageFileId = fileData?.id ?? fileData?.fileId;
      await updateProfile.mutateAsync({ userData: { profileImageFileId } });
      await refreshUser();
    } catch (err) {
      const status = err?.response?.status;
      setError(
        status === 404
          ? "Profile setup incomplete — please contact support to finish setting up your account."
          : getErrorMessage(err, "Failed to upload photo.")
      );
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
      <div className="bg-[#EFEFF1E5] rounded-lg p-4" style={{ border: "1px solid #E5E7EB" }}>
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
      <div className="bg-[#EFEFF1E5] rounded-lg p-6" style={{ border: "1px solid #E5E7EB" }}>
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
            <input name="email" type="email" value={form.email} onChange={handleChange} className={inputCls} />
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
            disabled={updateProfile.isPending || emailSaving || !isDirty}
            className="p-2 rounded-sm text-[11px] text-[#002FA7] hover:bg-[#002FA7] hover:text-white transition-all cursor-pointer border border-[#002FA7] disabled:opacity-50"
          >
            {saved ? "Saved!" : updateProfile.isPending || emailSaving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {emailModalOpen && (
        <EmailChangeModal
          newEmail={form.email}
          onSubmitOtp={(code) =>
            updateEmail({ email: form.email.trim().toLowerCase(), emailVerificationOtp: code })
          }
          onVerified={handleEmailVerified}
          onWrongEmail={handleWrongEmail}
          onClose={handleWrongEmail}
        />
      )}

      {/* Delete Account */}
      <div className="bg-[#EFEFF1E5] rounded-lg p-6" style={{ border: "1px solid #E5E7EB" }}>
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
            disabled
            title="Account deletion — coming soon"
            className="ml-4 px-4 py-1.5 rounded-md text-xs font-medium text-red-300 transition-all flex-shrink-0 cursor-not-allowed bg-transparent"
            style={{ border: "1px solid #FECACA" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
