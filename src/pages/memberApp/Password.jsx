import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useUpdatePassword } from "../../hooks/useMembers";

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

function PasswordField({ label, value, onChange, show, onToggleShow }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          style={{ ...inputStyle, paddingRight: 40 }}
        />
        <button
          type="button"
          onClick={onToggleShow}
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4 }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

export default function Password() {
  const navigate = useNavigate();
  const updatePassword = useUpdatePassword();

  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!form.currentPassword || !form.newPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    try {
      await updatePassword.mutateAsync({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to update password.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#EBEBEB", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: 0 }}>Password</h1>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <PasswordField
            label="Current Password"
            value={form.currentPassword}
            onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
            show={show.current}
            onToggleShow={() => setShow((s) => ({ ...s, current: !s.current }))}
          />
          <PasswordField
            label="New Password"
            value={form.newPassword}
            onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
            show={show.next}
            onToggleShow={() => setShow((s) => ({ ...s, next: !s.next }))}
          />
          <PasswordField
            label="Confirm New Password"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            show={show.confirm}
            onToggleShow={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
          />
        </div>

        {error && <p style={{ fontSize: 13, color: "#DC2626", margin: "12px 4px 0" }}>{error}</p>}
        {success && <p style={{ fontSize: 13, color: "#059669", margin: "12px 4px 0" }}>Password updated.</p>}

        <button
          onClick={handleSubmit}
          disabled={updatePassword.isPending}
          style={{
            width: "100%", marginTop: 16, padding: "14px 0", borderRadius: 10, border: "none",
            background: "#002FA7", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
            opacity: updatePassword.isPending ? 0.7 : 1,
          }}
        >
          {updatePassword.isPending ? "Updating…" : "Update Password"}
        </button>
      </div>
    </div>
  );
}
