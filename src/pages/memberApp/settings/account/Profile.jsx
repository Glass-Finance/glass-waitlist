import { useEffect, useRef, useState } from "react";
import GlassLogoGlow from "../../../../components/common/GlassLogoGlow";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Pencil } from "lucide-react";
import { useMe, useUpdateProfile, useUpdateEmail } from "../../../../hooks/useMyAccount";
import { useFileUpload } from "../../../../hooks/useFileUpload";
import { useAuth } from "../../../../store/AuthContext";
import { getErrorMessage } from "../../../../utils/errorHandler";
import { parseUserData } from "../../../../utils/userData";
import EmailChangeModal from "../../../../components/auth/EmailChangeModal";

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1.5px solid #E0E0E0",
  fontSize: 14,
  color: "#111",
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
};

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Enter a valid email address.");
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
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh",  fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 40 }}>
      <GlassLogoGlow />
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
        <h1 className="text-lg font-semibold text-[#111] m-0">Profile</h1>
      </div>

      <div className="px-4">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#D7E2FF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {photoPreview || photoUrl ? (
              <img src={photoPreview ?? photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span style={{ fontSize: 20, fontWeight: 600, color: "#002FA7" }}>{initials}</span>
            )}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: "none" }}
            onChange={(e) => handlePhotoSelect(e.target.files[0])}
          />
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadFile.isPending}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontSize: 13, fontWeight: 600, color: "#002FA7", opacity: uploadFile.isPending ? 0.6 : 1,
            }}
          >
            {uploadFile.isPending ? "Uploading…" : "Change Photo"}
          </button>
          <p style={{ fontSize: 13, color: "#999", margin: 0 }}>{isLoading ? "Loading…" : user?.email}</p>
        </div>

        <div className="border border-surface-container-border" style={{ background: "#fff", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>First Name</label>
            <input style={inputStyle} value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>Last Name</label>
            <input style={inputStyle} value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>Email Address</label>
            {editingEmail ? (
              <>
                <input
                  style={inputStyle}
                  type="email"
                  value={newEmail}
                  onChange={(e) => { setNewEmail(e.target.value); setEmailError(""); }}
                  placeholder="Enter new email address"
                  autoFocus
                />
                {emailError && <p style={{ fontSize: 12, color: "#DC2626", margin: "6px 4px 0" }}>{emailError}</p>}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={handleRequestEmailChange}
                    disabled={updateEmail.isPending}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                      background: "#002FA7", color: "#fff", fontSize: 13, fontWeight: 600,
                      cursor: "pointer", opacity: updateEmail.isPending ? 0.7 : 1,
                    }}
                  >
                    {updateEmail.isPending ? "Sending code…" : "Send Verification Code"}
                  </button>
                  <button
                    onClick={cancelEditEmail}
                    disabled={updateEmail.isPending}
                    style={{
                      padding: "10px 16px", borderRadius: 8, border: "1.5px solid #E0E0E0",
                      background: "#fff", color: "#666", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input style={{ ...inputStyle, background: "#F5F5F5", color: "#999" }} value={user?.email ?? ""} disabled />
                <button
                  onClick={startEditEmail}
                  title="Change email"
                  aria-label="Change email"
                  style={{
                    flexShrink: 0, width: 40, height: 40, borderRadius: 10, border: "1.5px solid #E0E0E0",
                    background: "#fff", color: "#002FA7", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Pencil size={15} />
                </button>
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>Phone Number</label>
            <input style={inputStyle} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
        </div>

        {error && <p style={{ fontSize: 13, color: "#DC2626", margin: "12px 4px 0" }}>{error}</p>}

        <button
          onClick={handleSave}
          disabled={updateProfile.isPending || !isDirty}
          style={{
            width: "100%", marginTop: 16, padding: "14px 0", borderRadius: 10, border: "none",
            background: "#002FA7", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
            opacity: updateProfile.isPending || !isDirty ? 0.7 : 1,
          }}
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
