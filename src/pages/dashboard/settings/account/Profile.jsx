import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMe, useUpdateProfile } from "../../../../hooks/useMyAccount";
import { useFileUpload } from "../../../../hooks/useFileUpload";
import { updateEmail, deleteAccount, requestAccountDeletionCode } from "../../../../api/members";
import { getErrorMessage } from "../../../../utils/errorHandler";
import { getEmailError } from "../../../../utils/validators";
import { useAuth } from "../../../../store/AuthContext";
import { parseUserData } from "../../../../utils/userData";
import EmailChangeModal from "../../../../components/auth/EmailChangeModal";
import OtpBoxes from "../../../../components/common/OtpBoxes";

// Names save with the first letter of each word capitalised ("home" → "Home")
// so they read properly everywhere: greetings, join requests, receipts, emails.
function capitalizeName(s) {
  return (s ?? "").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Profile() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useMe();
  const { refreshUser, logout } = useAuth();
  const updateProfile = useUpdateProfile();
  const uploadFile = useFileUpload();
  const photoInputRef = useRef(null);

  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [savedForm, setSavedForm] = useState(form);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ firstName: "", lastName: "", email: "" });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState("warn"); // "warn" | "code"
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deletionCode, setDeletionCode] = useState(Array(6).fill(""));

  useEffect(() => {
    if (!deleteModal) return;
    const handler = (e) => { if (e.key === "Escape") setDeleteModal(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteModal]);
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

  // Account deletion requires a verification code (emailed by the backend)
  // before the actual DELETE — the "type DELETE" step above is just an extra
  // guardrail before that email even gets sent.
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
      navigate("/sign-in");
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete account."));
      setDeleteLoading(false);
    }
  }

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

  function validateField(field, value) {
    if (field === "firstName" && !value.trim()) return "First name is required.";
    if (field === "lastName" && !value.trim()) return "Last name is required.";
    if (field === "email") return getEmailError(value);
    return "";
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((fe) => (fe[name] ? { ...fe, [name]: validateField(name, value) } : fe));
  };

  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    if (!(name in fieldErrors)) return; // phone has no format rule
    setFieldErrors((fe) => ({ ...fe, [name]: validateField(name, value) }));
  };

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
    const nextFieldErrors = {
      firstName: validateField("firstName", form.firstName),
      lastName: validateField("lastName", form.lastName),
      email: validateField("email", form.email),
    };
    if (Object.values(nextFieldErrors).some(Boolean)) {
      setFieldErrors(nextFieldErrors);
      return;
    }
    try {
      if (form.firstName !== savedForm.firstName || form.lastName !== savedForm.lastName || form.phone !== savedForm.phone) {
        // Only send what changed — the success toast names the updated
        // field(s), so sending everything would always read "Profile updated".
        const userData = {};
        const firstName = capitalizeName(form.firstName.trim());
        const lastName = capitalizeName(form.lastName.trim());
        if (form.firstName !== savedForm.firstName) userData.firstName = firstName;
        if (form.lastName !== savedForm.lastName) userData.lastName = lastName;
        if (form.phone !== savedForm.phone) userData.phoneNumber = form.phone;
        await updateProfile.mutateAsync({
          username: user?.username,
          userData,
        });
        await refreshUser();
        // Reflect the capitalised names in the inputs immediately, matching
        // what was actually saved.
        setForm((f) => ({ ...f, firstName, lastName }));
        setSavedForm((sf) => ({ ...sf, firstName, lastName, phone: form.phone }));
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
    "w-full px-4 py-2.5 rounded-lg bg-white text-gray-900 text-xs outline-none transition-all border border-gray-300 focus:border-brand";

  const displayName = `${form.firstName} ${form.lastName}`.trim() || user?.email || "—";
  const initials = displayName.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";

  return (
    <div className="flex flex-col gap-5 max-w-3xl w-full">

      {/* Profile card */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Profile</p>
        <p className="text-xs text-gray-500">Manage your personal information</p>
      </div>
      <div className="bg-surface-container rounded-lg p-4 border border-surface-container-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#D7E2FF] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {photoPreview || profileImageUrl ? (
                <img src={photoPreview ?? profileImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm text-brand">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-900 truncate">{isLoading ? "Loading…" : displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email ?? ""}</p>
            </div>
          </div>
          <input ref={photoInputRef} type="file" accept="image/png,image/jpeg" className="hidden"
            onChange={(e) => handlePhotoSelect(e.target.files[0])} />
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadFile.isPending}
            className="flex-shrink-0 px-2 py-2 rounded-sm text-xs bg-white hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
            style={{ border: "1px solid" }}
          >
            {uploadFile.isPending ? "Uploading…" : "Change Photo"}
          </button>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-surface-container rounded-lg p-6 border border-surface-container-border">
        <p className="text-sm font-medium text-gray-900 mb-0.5">Personal Information</p>
        <p className="text-xs text-gray-500 mb-5">This is how your information will appear across glass</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600">First Name</label>
            <input name="firstName" value={form.firstName} onChange={handleChange} onBlur={handleFieldBlur} className={inputCls}
              style={fieldErrors.firstName ? { borderColor: "var(--color-danger)" } : undefined} />
            {fieldErrors.firstName && <p className="text-xs text-danger">{fieldErrors.firstName}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600">Last Name</label>
            <input name="lastName" value={form.lastName} onChange={handleChange} onBlur={handleFieldBlur} className={inputCls}
              style={fieldErrors.lastName ? { borderColor: "var(--color-danger)" } : undefined} />
            {fieldErrors.lastName && <p className="text-xs text-danger">{fieldErrors.lastName}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600">Email Address</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleFieldBlur} className={inputCls}
              style={fieldErrors.email ? { borderColor: "var(--color-danger)" } : undefined} />
            {fieldErrors.email && <p className="text-xs text-danger">{fieldErrors.email}</p>}
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
            className="p-2 rounded-sm text-[11px] text-brand hover:bg-brand hover:text-white transition-all cursor-pointer border border-brand disabled:opacity-50"
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

      {deleteModal && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-surface-container-border">
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
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-xs outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 mb-4 transition-all bg-white"
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
                    className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-white cursor-pointer transition-colors disabled:opacity-50"
                    style={{ background: "#DC2626" }}
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
                    className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-white cursor-pointer transition-colors disabled:opacity-50"
                    style={{ background: "#DC2626" }}
                  >
                    {deleteLoading ? "Deleting…" : "Delete Account"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Account */}
      <div className="bg-surface-container rounded-lg p-6 border border-surface-container-border">
        <p className="text-sm font-medium text-gray-900 mb-0.5">Delete Account</p>
        <p className="text-xs text-gray-500 mb-4">Permanent actions that cannot be undone.</p>
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 rounded-lg"
          style={{ border: "1px solid #FECACA", background: "#FFF5F5" }}
        >
          <p className="text-xs text-gray-700">
            Permanently remove your account and all associated data from Glass.
          </p>
          <button
            onClick={() => setDeleteModal(true)}
            className="self-start sm:self-auto flex-shrink-0 px-4 py-1.5 rounded-md text-xs font-medium text-red-500 hover:bg-red-50 transition-all cursor-pointer bg-transparent"
            style={{ border: "1px solid #FECACA" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
