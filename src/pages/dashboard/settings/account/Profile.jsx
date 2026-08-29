import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Pencil, ShieldCheck, ArrowLeft } from "lucide-react";
import { useMe, useUpdateProfile, useRequestPhoneUpdate, useUpdatePhone } from "../../../../hooks/useMyAccount";
import { useFileUpload } from "../../../../hooks/useFileUpload";
import { updateEmail, deleteAccount, requestAccountDeletionCode } from "../../../../api/members";
import { getErrorMessage } from "../../../../utils/errorHandler";
import { getEmailError } from "../../../../utils/validators";
import { useEscapeToClose } from "../../../../hooks/useKeyboardShortcuts";
import { isPhoneValid, PHONE_FORMAT_HINT } from "../../../../utils/phone";
import { useAuth } from "../../../../store/AuthContext";
import { parseUserData } from "../../../../utils/userData";
import EmailChangeModal from "../../../../components/common/EmailChangeModal";
import PhoneChangeModal from "../../../../components/common/PhoneChangeModal";
import OtpBoxes from "../../../../components/common/OtpBoxes";
import { toTitleCase } from "../../../../utils/format";
import { Button } from "../../../../components/ui/Button";
import verifiedBadge from "../../../../assets/icons/verified-badge.png";
import { toastSuccess } from "../../../../utils/toast";

const inputCls =
  "w-full h-12 min-h-8 px-4 py-1 rounded-lg text-gray-900 text-placeholder outline-none transition-all border-[1.5px] focus:border-[#002FA7]";

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: user } = useMe();
  const { refreshUser, logout } = useAuth();
  const updateProfile = useUpdateProfile();
  const uploadFile = useFileUpload();
  const photoInputRef = useRef(null);

  // "profile" (normal view) | "email" | "phone" — the latter two swap the
  // Personal Information card for a dedicated Update/Verify sub-card,
  // mirroring the member app's full-page equivalents but inline since this
  // is desktop. Seeded straight from ?verify=phone (the Dashboard banner's
  // deep link) so there's no flash of the normal profile view first.
  const [view, setView] = useState(() => (searchParams.get("verify") === "phone" ? "phone" : "profile"));

  const [form, setForm] = useState({ firstName: "", lastName: "" });
  const [savedForm, setSavedForm] = useState(form);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ firstName: "", lastName: "" });
  const [photoPreview, setPhotoPreview] = useState(null);

  const [emailDraft, setEmailDraft] = useState("");
  const [emailFieldError, setEmailFieldError] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const requestPhoneUpdate = useRequestPhoneUpdate();
  const updatePhone = useUpdatePhone();
  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneFieldError, setPhoneFieldError] = useState("");
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const isPhoneUpdate = Boolean(user?.phoneVerified);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState("warn"); // "warn" | "code"
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deletionCode, setDeletionCode] = useState(Array(6).fill(""));

  useEscapeToClose(() => setDeleteModal(false), deleteModal);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  function closeDeleteModal() {
    setDeleteModal(false);
    setDeleteStep("warn");
    setDeleteConfirm("");
    setDeleteError("");
    setDeletionCode(Array(6).fill(""));
    setResendMessage("");
  }

  async function handleRequestDeletionCode() {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await requestAccountDeletionCode();
      setDeleteStep("code");
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to send verification code."));
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleResendDeletionCode() {
    setResendLoading(true);
    setResendMessage("");
    setDeleteError("");
    try {
      await requestAccountDeletionCode();
      setResendMessage("Code resent.");
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to resend code."));
    } finally {
      setResendLoading(false);
    }
  }

  async function handleConfirmDeletion() {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteAccount(deletionCode.join(""));
      await logout();
      toastSuccess("Account deleted");
      navigate("/sign-in");
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete account."));
      setDeleteLoading(false);
    }
  }

  const profileImageUrl = parseUserData(user).profileImage?.url ?? user?.profileImage?.url ?? null;

  useEffect(() => {
    if (!user) return;
    const ud = parseUserData(user);
    const loaded = {
      firstName: ud.firstName ?? user?.firstName ?? "",
      lastName: ud.lastName ?? user?.lastName ?? "",
    };
    // Syncs the editable form from the async-loaded `user` -- form/savedForm
    // are user-editable afterward, so this has to be an effect, not a
    // render-time derivation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(loaded);
    setSavedForm(loaded);
    setEmailDraft(user.email ?? "");
    setPhoneDraft(user.phoneNumber ?? ud.phone ?? "");
  }, [user]);

  // ?verify=phone only needs to seed the initial view (above) — strip it
  // from the URL once so a later refresh doesn't re-trigger the deep link.
  useEffect(() => {
    if (searchParams.get("verify") !== "phone") return;
    const next = new URLSearchParams(searchParams);
    next.delete("verify");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validateField(field, value) {
    if (field === "firstName" && !value.trim()) return "First name is required.";
    if (field === "lastName" && !value.trim()) return "Last name is required.";
    return "";
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((fe) => (fe[name] ? { ...fe, [name]: validateField(name, value) } : fe));
  };

  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    if (!(name in fieldErrors)) return;
    setFieldErrors((fe) => ({ ...fe, [name]: validateField(name, value) }));
  };

  const isDirty = form.firstName !== savedForm.firstName || form.lastName !== savedForm.lastName;

  const handleSave = async () => {
    setError("");
    const nextFieldErrors = {
      firstName: validateField("firstName", form.firstName),
      lastName: validateField("lastName", form.lastName),
    };
    if (Object.values(nextFieldErrors).some(Boolean)) {
      setFieldErrors(nextFieldErrors);
      return;
    }
    try {
      const userData = {};
      const firstName = toTitleCase(form.firstName.trim());
      const lastName = toTitleCase(form.lastName.trim());
      if (form.firstName !== savedForm.firstName) userData.firstName = firstName;
      if (form.lastName !== savedForm.lastName) userData.lastName = lastName;
      await updateProfile.mutateAsync({ username: user?.username, userData });
      await refreshUser();
      setForm((f) => ({ ...f, firstName, lastName }));
      setSavedForm((sf) => ({ ...sf, firstName, lastName }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      const status = err?.response?.status;
      setError(
        status === 404
          ? "Profile setup incomplete — please contact support to finish setting up your account."
          : getErrorMessage(err, "Failed to save changes.")
      );
    }
  };

  async function handleStartEmailUpdate() {
    const trimmed = emailDraft.trim();
    const fieldErr = getEmailError(trimmed);
    if (fieldErr) { setEmailFieldError(fieldErr); return; }
    if (trimmed.toLowerCase() === user?.email?.toLowerCase()) {
      setEmailFieldError("That's already your current email address.");
      return;
    }
    setEmailFieldError("");
    setEmailSending(true);
    try {
      await updateEmail({ email: trimmed.toLowerCase() });
      setEmailModalOpen(true);
    } catch (err) {
      setEmailFieldError(getErrorMessage(err, "Couldn't send a code to that address. Please try again."));
    } finally {
      setEmailSending(false);
    }
  }

  function handleEmailVerified() {
    setEmailModalOpen(false);
    setView("profile");
    refreshUser();
  }

  function handleWrongEmail() {
    setEmailModalOpen(false);
  }

  async function handleStartPhoneUpdate() {
    const trimmed = phoneDraft.trim();
    if (!isPhoneValid(trimmed)) { setPhoneFieldError(PHONE_FORMAT_HINT); return; }
    if (isPhoneUpdate && trimmed === user?.phoneNumber) {
      setPhoneFieldError("That's already your current phone number.");
      return;
    }
    setPhoneFieldError("");
    setPhoneSending(true);
    try {
      await requestPhoneUpdate.mutateAsync({ phoneNumber: trimmed });
      setPhoneModalOpen(true);
    } catch (err) {
      setPhoneFieldError(getErrorMessage(err, "Couldn't send a code to that number. Please try again."));
    } finally {
      setPhoneSending(false);
    }
  }

  async function handleConfirmPhoneOtp(otp) {
    await updatePhone.mutateAsync({ phoneNumber: phoneDraft.trim(), phoneVerificationOtp: otp });
  }

  function handlePhoneVerified() {
    setPhoneModalOpen(false);
    setView("profile");
    refreshUser();
  }

  function handleWrongPhone() {
    setPhoneModalOpen(false);
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

  const displayName = `${form.firstName} ${form.lastName}`.trim() || user?.email || "—";
  const initials = displayName.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";

  return (
    <div className="flex flex-col gap-5 w-full">

      {view === "profile" && (
        <>
          <div className="bg-surface-container rounded-lg p-6 border border-surface-container-border">
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Profile</p>
            <p className="text-xs text-gray-500 mb-4">Manage your personal information</p>
            <div className="-mx-6 border-b border-gray-100 mb-5" />

            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-full bg-[#D7E2FF] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {photoPreview || profileImageUrl ? (
                  <img src={photoPreview ?? profileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base text-brand">{initials}</span>
                )}
              </div>
              <input ref={photoInputRef} type="file" accept="image/png,image/jpeg" className="hidden"
                onChange={(e) => handlePhotoSelect(e.target.files[0])} />
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadFile.isPending}
                className="h-12 px-2.5 rounded-[4px] text-xs text-brand bg-white hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50 border border-[#002FA7] flex items-center justify-center"
              >
                {uploadFile.isPending ? "Uploading…" : "Upload Photo"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-600">First Name</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} onBlur={handleFieldBlur} className={`${inputCls} ${fieldErrors.firstName ? "border-danger" : "border-gray-300"}`} />
                {fieldErrors.firstName && <p className="text-xs text-danger">{fieldErrors.firstName}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-600">Last Name</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} onBlur={handleFieldBlur} className={`${inputCls} ${fieldErrors.lastName ? "border-danger" : "border-gray-300"}`} />
                {fieldErrors.lastName && <p className="text-xs text-danger">{fieldErrors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-600">Email Address</label>
                <div className="flex items-center gap-2">
                  <div className={`${inputCls} bg-gray-50 text-gray-500 border-gray-300 flex items-center justify-between gap-2`}>
                    <span className="truncate">{user?.email ?? ""}</span>
                    {user?.emailVerified && <img src={verifiedBadge} alt="Verified" className="w-[18px] h-[18px] flex-shrink-0" />}
                  </div>
                  <button
                    onClick={() => { setEmailFieldError(""); setView("email"); }}
                    title="Update email"
                    aria-label="Update email"
                    className="flex-shrink-0 w-12 h-12 rounded-lg border-[1.5px] border-gray-300 bg-white text-brand cursor-pointer flex items-center justify-center"
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-600">Phone Number</label>
                <div className="flex items-center gap-2">
                  <div className={`${inputCls} bg-gray-50 text-gray-500 border-gray-300 flex items-center justify-between gap-2`}>
                    <span className="truncate">{user?.phoneNumber ?? ""}</span>
                    {user?.phoneVerified && <img src={verifiedBadge} alt="Verified" className="w-[18px] h-[18px] flex-shrink-0" />}
                  </div>
                  <button
                    onClick={() => { setPhoneFieldError(""); setView("phone"); }}
                    title={isPhoneUpdate ? "Update phone number" : "Verify phone number"}
                    aria-label={isPhoneUpdate ? "Update phone number" : "Verify phone number"}
                    className="flex-shrink-0 w-12 h-12 rounded-lg border-[1.5px] border-gray-300 bg-white text-brand cursor-pointer flex items-center justify-center"
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={updateProfile.isPending || !isDirty}
                className={`h-12 px-4 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center ${
                  updateProfile.isPending || !isDirty
                    ? "bg-[#C5C5C5] text-white border-none"
                    : "text-brand hover:bg-brand hover:text-white border border-brand"
                }`}
              >
                {saved ? "Saved!" : updateProfile.isPending ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </>
      )}

      {view === "email" && (
        <>
          {/* Neither Figma mock shows a way back to the main profile view --
              kept for now rather than silently dropping the only navigation
              out of this screen. Styled as the app's standard back-arrow link
              (matches PaymentProfile.jsx/PayingMember.jsx/CreatePlanModal.jsx)
              instead of a "Cancel" text button. */}
          <button
            onClick={() => setView("profile")}
            className="self-start flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer -ml-1 p-0"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="bg-white rounded-xl border border-surface-container-border">
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900">Update Your Email</p>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-1.5 max-w-md">
                <label className="text-xs text-gray-600">Email Address</label>
                <input
                  type="email"
                  value={emailDraft}
                  onChange={(e) => { setEmailDraft(e.target.value); setEmailFieldError(""); }}
                  className={`${inputCls} ${emailFieldError ? "border-danger" : "border-gray-300"}`}
                  autoFocus
                />
                {emailFieldError && <p className="text-xs text-danger mt-1">{emailFieldError}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button onClick={handleStartEmailUpdate} loading={emailSending} fullWidth={false} size="sm" className="px-10 min-w-[320px]">
              {emailSending ? "Sending Code…" : "Update"}
            </Button>
          </div>
        </>
      )}

      {view === "phone" && (
        <>
          {/* See the email view's identical comment above. */}
          <button
            onClick={() => setView("profile")}
            className="self-start flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer -ml-1 p-0"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="bg-white rounded-xl border border-surface-container-border">
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900">
                {isPhoneUpdate ? "Update Your Phone Number" : "Verify Your Phone Number"}
              </p>
            </div>
            <div className="p-6">
              {!isPhoneUpdate && (
                <p className="text-xs text-gray-500 mb-4">
                  We will use this number to send payments reminders and updates via WhatsApp or SMS.
                </p>
              )}
              <div className="flex flex-col gap-1.5 max-w-md">
                <label className="text-xs text-gray-600">Phone Number</label>
                <input
                  type="tel"
                  value={phoneDraft}
                  onChange={(e) => { setPhoneDraft(e.target.value); setPhoneFieldError(""); }}
                  className={`${inputCls} ${phoneFieldError ? "border-danger" : "border-gray-300"}`}
                  autoFocus
                />
                {phoneFieldError && <p className="text-xs text-danger mt-1">{phoneFieldError}</p>}
              </div>
            </div>
          </div>

          {!isPhoneUpdate && (
            <div className="flex items-start gap-2.5 px-4 py-3.5 rounded-xl bg-[#D7E2FF]">
              <ShieldCheck size={18} className="text-brand flex-shrink-0 mt-0.5" />
              <p className="text-sm text-brand leading-snug m-0">
                Your number is only used for payment reminders and account recovery. We will never share it.
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <Button onClick={handleStartPhoneUpdate} loading={phoneSending} fullWidth={false} size="sm" className="px-10 min-w-[320px]">
              {phoneSending ? "Sending Code…" : isPhoneUpdate ? "Update Phone Number" : "Verify"}
            </Button>
          </div>
        </>
      )}

      {emailModalOpen && (
        <EmailChangeModal
          newEmail={emailDraft}
          onSubmitOtp={(code) => updateEmail({ email: emailDraft.trim().toLowerCase(), emailVerificationOtp: code })}
          onVerified={handleEmailVerified}
          onWrongEmail={handleWrongEmail}
          onClose={handleWrongEmail}
        />
      )}

      {phoneModalOpen && (
        <PhoneChangeModal
          newPhone={phoneDraft}
          isUpdate={isPhoneUpdate}
          onSubmitOtp={handleConfirmPhoneOtp}
          onVerified={handlePhoneVerified}
          onWrongNumber={handleWrongPhone}
          onResend={() => requestPhoneUpdate.mutateAsync({ phoneNumber: phoneDraft.trim() })}
          onClose={handleWrongPhone}
        />
      )}

      {deleteModal && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-surface-container-border">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-4 bg-danger-tint"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>

            {deleteStep === "warn" ? (
              <>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Delete Account</h3>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  This will permanently delete your account and all associated data from Glass. This cannot be undone.
                </p>

                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="w-full h-12 min-h-8 border-[1.5px] border-gray-300 px-4 py-1 rounded-lg text-placeholder outline-none focus:border-red-400 mb-4 transition-all"
                />

                {deleteError && <p className="text-xs text-red-500 mb-3">{deleteError}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={closeDeleteModal}
                    className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-gray-700 cursor-pointer transition-colors bg-stacked-container"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestDeletionCode}
                    disabled={deleteConfirm !== "DELETE" || deleteLoading}
                    className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-white cursor-pointer transition-colors disabled:opacity-50 bg-danger"
                  >
                    {deleteLoading ? "Sending code…" : "Continue"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Enter Verification Code</h3>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  We've sent a code to <strong>{user?.email}</strong>. Enter it below to permanently delete your account.
                </p>

                <div className="mb-4">
                  <OtpBoxes value={deletionCode} onChange={setDeletionCode} disabled={deleteLoading} />
                </div>

                <div className="flex items-center justify-center mb-4">
                  <button
                    onClick={handleResendDeletionCode}
                    disabled={resendLoading || deleteLoading}
                    className="text-xs font-medium cursor-pointer bg-transparent border-none transition-all disabled:opacity-50 text-brand"
                  >
                    {resendLoading ? "Resending…" : resendMessage || "Resend code"}
                  </button>
                </div>

                {deleteError && <p className="text-xs text-red-500 mb-3 text-center">{deleteError}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={closeDeleteModal}
                    className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-gray-700 cursor-pointer transition-colors bg-stacked-container"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDeletion}
                    disabled={deletionCode.some((d) => !d) || deleteLoading}
                    className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-white cursor-pointer transition-colors disabled:opacity-50 bg-danger"
                  >
                    {deleteLoading ? "Deleting…" : "Delete Account"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {view === "profile" && (
        <div className="bg-surface-container rounded-lg p-6 border border-surface-container-border">
          <p className="text-sm font-medium text-gray-900 mb-0.5">Delete Account</p>
          <p className="text-xs text-gray-500 mb-4">Permanent actions that cannot be undone.</p>
          <div className="-mx-6 border-b border-gray-100 mb-4" />
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <p className="text-xs text-gray-700">
              Permanently remove your account and all associated data from Glass.
            </p>
            <button
              onClick={() => setDeleteModal(true)}
              className="self-start sm:self-auto flex-shrink-0 px-4 py-1.5 rounded-md text-xs font-medium text-red-500 hover:bg-red-50 transition-all cursor-pointer bg-transparent border border-[#FECACA]"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
