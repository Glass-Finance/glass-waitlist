import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useMe, useUpdateProfile } from "../../../../hooks/useMyAccount";
import { useFileUpload } from "../../../../hooks/useFileUpload";
import { useAuth } from "../../../../store/AuthContext";
import { getErrorMessage } from "../../../../utils/errorHandler";
import { parseUserData } from "../../../../utils/userData";

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
      await updateProfile.mutateAsync({
        username: user?.username,
        userData: {
          firstName: form.firstName,
          lastName: form.lastName,
          phoneNumber: form.phone,
        },
      });
      setSavedForm(form);
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

  const ud = parseUserData(user);
  const photoUrl = ud.profileImage?.url ?? null;
  const initials = `${form.firstName} ${form.lastName}`.trim().split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";

  return (
    <div style={{ minHeight: "100vh", background: "#EBEBEB", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: 0 }}>Profile</h1>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#D7E2FF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {photoPreview || photoUrl ? (
              <img src={photoPreview ?? photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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

        <div style={{ background: "#fff", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
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
            <input style={{ ...inputStyle, background: "#F5F5F5", color: "#999" }} value={user?.email ?? ""} disabled />
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
    </div>
  );
}
