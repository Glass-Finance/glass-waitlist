import { useEffect, useRef, useState } from "react";
import GlassLogoGlow from "../../../../components/memberApp/GlassLogoGlow";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Pencil } from "lucide-react";
import { useMe, useUpdateProfile, useUpdateEmail, useRequestPhoneUpdate, useUpdatePhone } from "../../../../hooks/useMyAccount";
import { useFileUpload } from "../../../../hooks/useFileUpload";
import { useAuth } from "../../../../store/AuthContext";
import { getErrorMessage } from "../../../../utils/errorHandler";
import { getEmailError } from "../../../../utils/validators";
import { isPhoneValid, PHONE_FORMAT_HINT } from "../../../../utils/phone";
import { parseUserData } from "../../../../utils/userData";
import EmailChangeModal from "../../../../components/common/EmailChangeModal";
import PhoneChangeModal from "../../../../components/common/PhoneChangeModal";
import { toTitleCase } from "../../../../utils/format";
import { Button } from "../../../../components/ui/Button";

const inputCls = "w-full h-12 min-h-8 py-1 px-4 rounded-lg border border-[#E0E0E0] text-placeholder text-[#111] outline-none bg-white box-border transition-all focus:border-[#002FA7]";

export default function Profile() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useMe();
  const updateProfile = useUpdateProfile();
  const uploadFile = useFileUpload();
  const { refreshUser } = useAuth();
  const photoInputRef = useRef(null);

  const [form, setForm] = useState({ firstName: "", lastName: "" });
  const [savedForm, setSavedForm] = useState(form);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);

  const updateEmail = useUpdateEmail();
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  // Phone changes go through OTP verification (POST /action-verification/request
  // then PATCH /user/phone) — no longer part of the general profile PATCH.
  const requestPhoneUpdate = useRequestPhoneUpdate();
  const updatePhone = useUpdatePhone();
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneOtpModalOpen, setPhoneOtpModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const ud = parseUserData(user);
    const loaded = {
      firstName: ud.firstName ?? "",
      lastName: ud.lastName ?? "",
    };
    setForm(loaded);
    setSavedForm(loaded);
  }, [user]);

  const isDirty =
    form.firstName !== savedForm.firstName ||
    form.lastName !== savedForm.lastName;

  async function handleSave() {
    setError("");
    try {
      // Only send what changed — the success toast names the updated
      // field(s), so sending everything would always read "Profile updated".
      const userData = {};
      if (form.firstName !== savedForm.firstName) userData.firstName = toTitleCase(form.firstName.trim());
      if (form.lastName !== savedForm.lastName) userData.lastName = toTitleCase(form.lastName.trim());
      await updateProfile.mutateAsync({
        username: user?.username,
        userData,
      });
      // Reflect the capitalised names in the inputs immediately, matching
      // what was actually saved.
      const next = {
        ...form,
        firstName: toTitleCase(form.firstName.trim()),
        lastName: toTitleCase(form.lastName.trim()),
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

  function startEditPhone() {
    setNewPhone(user?.phoneNumber ?? "");
    setPhoneError("");
    setEditingPhone(true);
  }

  function cancelEditPhone() {
    setEditingPhone(false);
    setNewPhone("");
    setPhoneError("");
  }

  async function handleRequestPhoneChange() {
    const trimmed = newPhone.trim();
    if (!isPhoneValid(trimmed)) {
      setPhoneError(PHONE_FORMAT_HINT);
      return;
    }
    if (trimmed === user?.phoneNumber) {
      setPhoneError("That's already your current phone number.");
      return;
    }
    setPhoneError("");
    try {
      // Send just the number — no OTP yet — triggers the backend to send a
      // verification code before anything actually changes.
      await requestPhoneUpdate.mutateAsync({ phoneNumber: trimmed });
      setPhoneOtpModalOpen(true);
    } catch (err) {
      setPhoneError(getErrorMessage(err, "Couldn't start the phone change. Please try again."));
    }
  }

  async function handleConfirmPhoneOtp(otp) {
    await updatePhone.mutateAsync({ phoneNumber: newPhone.trim(), phoneVerificationOtp: otp });
  }

  async function handlePhoneVerified() {
    await refreshUser();
    setPhoneOtpModalOpen(false);
    setEditingPhone(false);
    setNewPhone("");
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
          className="w-9 h-9 rounded-full bg-white border border-surface-container-border cursor-pointer flex items-center justify-center"
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

        <div className="border border-surface-container-border bg-white rounded-2xl p-4 flex flex-col gap-3.5">
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
                  <Button
                    onClick={handleRequestEmailChange}
                    loading={updateEmail.isPending}
                    className="flex-1"
                  >
                    {updateEmail.isPending ? "Sending code…" : "Send Verification Code"}
                  </Button>
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
            {editingPhone ? (
              <>
                <input
                  className={inputCls}
                  type="tel"
                  value={newPhone}
                  onChange={(e) => { setNewPhone(e.target.value); setPhoneError(""); }}
                  placeholder="Enter new phone number"
                  autoFocus
                />
                {phoneError && <p className="text-xs text-danger mt-1.5 mx-1 mb-0">{phoneError}</p>}
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={handleRequestPhoneChange}
                    loading={requestPhoneUpdate.isPending}
                    className="flex-1"
                  >
                    {requestPhoneUpdate.isPending ? "Sending code…" : "Send Verification Code"}
                  </Button>
                  <button
                    onClick={cancelEditPhone}
                    disabled={requestPhoneUpdate.isPending}
                    className="py-2.5 px-4 rounded-lg border-[1.5px] border-[#E0E0E0] bg-white text-[#666] text-[13px] font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <input className={`${inputCls} bg-[#F5F5F5] text-[#999]`} value={user?.phoneNumber ?? ""} disabled />
                <button
                  onClick={startEditPhone}
                  title="Change phone number"
                  aria-label="Change phone number"
                  className="flex-shrink-0 w-10 h-10 rounded-[10px] border-[1.5px] border-[#E0E0E0] bg-white text-brand cursor-pointer flex items-center justify-center"
                >
                  <Pencil size={15} />
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-[13px] text-danger mt-3 mx-1 mb-0">{error}</p>}

        <Button
          onClick={handleSave}
          disabled={!isDirty}
          loading={updateProfile.isPending}
          className="mt-4"
        >
          {saved ? "Saved!" : updateProfile.isPending ? "Saving…" : "Save Changes"}
        </Button>
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

      {phoneOtpModalOpen && (
        <PhoneChangeModal
          newPhone={newPhone}
          onSubmitOtp={handleConfirmPhoneOtp}
          onVerified={handlePhoneVerified}
          onWrongNumber={() => setPhoneOtpModalOpen(false)}
          onResend={() => requestPhoneUpdate.mutateAsync({ phoneNumber: newPhone.trim() })}
          onClose={() => setPhoneOtpModalOpen(false)}
        />
      )}
    </div>
  );
}
