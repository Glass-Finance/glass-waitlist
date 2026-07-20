import { useEffect, useRef, useState } from "react";
import GlassLogoGlow from "../../../../components/memberApp/GlassLogoGlow";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Pencil } from "lucide-react";
import { useMe, useUpdateProfile, useUpdateEmail } from "../../../../hooks/useMyAccount";
import { useFileUpload } from "../../../../hooks/useFileUpload";
import { useAuth } from "../../../../store/AuthContext";
import { getErrorMessage } from "../../../../utils/errorHandler";
import { getEmailError } from "../../../../utils/validators";
import { parseUserData } from "../../../../utils/userData";
import EmailChangeModal from "../../../../components/common/EmailChangeModal";

const inputCls = "w-full py-3 px-3.5 rounded-[10px] border-[1.5px] border-[#E0E0E0] text-sm text-[#111] outline-none bg-white box-border";

// Names save with the first letter of each word capitalised ("home" → "Home")
// so they read properly everywhere: greetings, join requests, receipts, emails.
function capitalizeName(s) {
  return (s ?? "").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Profile() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useMe();
  const updateProfile = useUpdateProfile();
  const uploadFile = useFileUpload();
  const { refreshUser } = useAuth();
  const photoInputRef = useRef(null);

  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [savedForm, setSavedForm] = useState(form);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);

  const updateEmail = useUpdateEmail();
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const ud = parseUserData(user);
    const loaded = {
      firstName: ud.firstName ?? "",
      lastName: ud.lastName ?? "",
      phone: user.phoneNumber ?? ud.phone ?? "",
    };
    setForm(loaded);
    setSavedForm(loaded);
  }, [user]);

  const isDirty =
    form.firstName !== savedForm.firstName ||
    form.lastName !== savedForm.lastName ||
    form.phone !== savedForm.phone;

  async function handleSave() {
    setError("");
    try {
      // Only send what changed — the success toast names the updated
      // field(s), so sending everything would always read "Profile updated".
      const userData = {};
      if (form.firstName !== savedForm.firstName) userData.firstName = capitalizeName(form.firstName.trim());
      if (form.lastName !== savedForm.lastName) userData.lastName = capitalizeName(form.lastName.trim());
      if (form.phone !== savedForm.phone) userData.phoneNumber = form.phone;
      await updateProfile.mutateAsync({
        username: user?.username,
        userData,
      });
      // Reflect the capitalised names in the inputs immediately, matching
      // what was actually saved.
      const next = {
        ...form,
        firstName: capitalizeName(form.firstName.trim()),
        lastName: capitalizeName(form.lastName.trim()),
      };
      setForm(next);
      setSavedForm(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save changes."));
    }
  }

  async function handlePhotoSelect(file) {
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
    try {
      const uploadRes = await uploadFile.mutateAsync({ file, fileCategory: "PROFILE_IMAGE" });
      const profileImageFileId = uploadRes.data?.data?.id;
      // profileImageFileId only takes effect nested under userData -- the
      // backend accepts firstName/lastName/phoneNumber flat, but not this.
      await updateProfile.mutateAsync({ userData: { profileImageFileId } });
      await refreshUser();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upload photo."));
    }
  }

  function startEditEmail() {
    setNewEmail(user?.email ?? "");
    setEmailError("");
    setEditingEmail(true);
  }

  function cancelEditEmail() {
    setEditingEmail(false);
    setNewEmail("");
    setEmailError("");
  }

  async function handleRequestEmailChange() {
    const trimmed = newEmail.trim().toLowerCase();
    const emailFormatError = getEmailError(trimmed);
    if (emailFormatError) {
      setEmailError(emailFormatError);
      return;
    }
    if (trimmed === user?.email?.toLowerCase()) {
      setEmailError("That's already your current email.");
      return;
    }
    setEmailError("");
    try {
      // First call with just { email } — no OTP yet — triggers the backend
      // to send a verification code to the new address before anything
      // actually changes.
      await updateEmail.mutateAsync({ email: trimmed });
      setOtpModalOpen(true);
    } catch (err) {
      setEmailError(getErrorMessage(err, "Couldn't start the email change. Please try again."));
    }
  }

  async function handleConfirmEmailOtp(otp) {
    await updateEmail.mutateAsync({ email: newEmail.trim().toLowerCase(), emailVerificationOtp: otp });
  }

  async function handleEmailVerified() {
    await refreshUser();
    setOtpModalOpen(false);
    setEditingEmail(false);
    setNewEmail("");
  }

  const ud = parseUserData(user);
  const photoUrl = ud.profileImage?.url ?? null;
  const initials = `${form.firstName} ${form.lastName}`.trim().split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";

  return (
    <div
      className="relative overflow-hidden min-h-screen pb-10"
    >
      <GlassLogoGlow />
      <div className="flex items-center gap-2.5 pt-5 px-4 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
        <h1 className="text-lg font-semibold text-[#111] m-0">Profile</h1>
      </div>

      <div className="px-4">
        <div className="flex flex-col items-center gap-2 mb-5">
          <div className="w-16 h-16 rounded-full bg-[#D7E2FF] flex items-center justify-center overflow-hidden">
            {photoPreview || photoUrl ? (
              <img src={photoPreview ?? photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-brand">{initials}</span>
            )}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handlePhotoSelect(e.target.files[0])}
          />
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadFile.isPending}
            className={`bg-transparent border-none cursor-pointer p-0 text-[13px] font-semibold text-brand ${uploadFile.isPending ? "opacity-60" : "opacity-100"}`}
          >
            {uploadFile.isPending ? "Uploading…" : "Change Photo"}
          </button>
          <p className="text-[13px] text-[#999] m-0">{isLoading ? "Loading…" : user?.email}</p>
        </div>

        <div className="border border-surface-container-border bg-white rounded-2xl p-4 flex flex-col gap-3.5 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
          <div>
            <label className="text-xs text-[#888] block mb-1.5">First Name</label>
            <input className={inputCls} value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-[#888] block mb-1.5">Last Name</label>
            <input className={inputCls} value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-[#888] block mb-1.5">Email Address</label>
            {editingEmail ? (
              <>
                <input
                  className={inputCls}
                  type="email"
                  value={newEmail}
                  onChange={(e) => { setNewEmail(e.target.value); setEmailError(""); }}
                  placeholder="Enter new email address"
                  autoFocus
                />
                {emailError && <p className="text-xs text-danger mt-1.5 mx-1 mb-0">{emailError}</p>}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleRequestEmailChange}
                    disabled={updateEmail.isPending}
                    className={`flex-1 py-2.5 px-0 rounded-lg border-none bg-brand text-white text-[13px] font-semibold cursor-pointer ${updateEmail.isPending ? "opacity-70" : "opacity-100"}`}
                  >
                    {updateEmail.isPending ? "Sending code…" : "Send Verification Code"}
                  </button>
                  <button
                    onClick={cancelEditEmail}
                    disabled={updateEmail.isPending}
                    className="py-2.5 px-4 rounded-lg border-[1.5px] border-[#E0E0E0] bg-white text-[#666] text-[13px] font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <input className={`${inputCls} bg-[#F5F5F5] text-[#999]`} value={user?.email ?? ""} disabled />
                <button
                  onClick={startEditEmail}
                  title="Change email"
                  aria-label="Change email"
                  className="flex-shrink-0 w-10 h-10 rounded-[10px] border-[1.5px] border-[#E0E0E0] bg-white text-brand cursor-pointer flex items-center justify-center"
                >
                  <Pencil size={15} />
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-[#888] block mb-1.5">Phone Number</label>
            <input className={inputCls} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
        </div>

        {error && <p className="text-[13px] text-danger mt-3 mx-1 mb-0">{error}</p>}

        <button
          onClick={handleSave}
          disabled={updateProfile.isPending || !isDirty}
          className={`w-full mt-4 py-3.5 px-0 rounded-[10px] border-none bg-brand text-white text-[15px] font-semibold cursor-pointer ${updateProfile.isPending || !isDirty ? "opacity-70" : "opacity-100"}`}
        >
          {saved ? "Saved!" : updateProfile.isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {otpModalOpen && (
        <EmailChangeModal
          newEmail={newEmail}
          onSubmitOtp={handleConfirmEmailOtp}
          onVerified={handleEmailVerified}
          onWrongEmail={() => setOtpModalOpen(false)}
          onClose={() => setOtpModalOpen(false)}
        />
      )}
    </div>
  );
}
