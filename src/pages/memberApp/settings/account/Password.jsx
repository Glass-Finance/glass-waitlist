import { useState } from "react";
import GlassLogoGlow from "../../../../components/common/GlassLogoGlow";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useUpdatePassword } from "../../../../hooks/useMyAccount";
import { getErrorMessage } from "../../../../utils/errorHandler";
import { isPasswordValid, PASSWORD_REQUIREMENTS_TEXT } from "../../../../utils/password";
import PasswordChecklist from "../../../../components/auth/PasswordChecklist";

const inputCls = "w-full py-3 pl-3.5 pr-10 rounded-[10px] border-[1.5px] border-[#E0E0E0] text-sm text-[#111] outline-none bg-white box-border";

function PasswordField({ label, value, onChange, show, onToggleShow }) {
  return (
    <div>
      <label className="text-xs text-[#888] block mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          className={inputCls}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#999] p-1"
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
    if (!form.currentPassword) {
      setError("Current password is required.");
      return;
    }
    if (!isPasswordValid(form.newPassword)) {
      setError(`Password must include: ${PASSWORD_REQUIREMENTS_TEXT.toLowerCase()}`);
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
      setError(getErrorMessage(err, "Failed to update password."));
    }
  }

  return (
    <div
      className="relative overflow-hidden min-h-screen pb-10"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <GlassLogoGlow />
      <div className="flex items-center gap-2.5 pt-5 px-4 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
        <h1 className="text-lg font-semibold text-[#111] m-0">Password</h1>
      </div>

      <div className="px-4">
        <div className="border border-surface-container-border bg-white rounded-2xl p-4 flex flex-col gap-3.5 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
          <PasswordField
            label="Current Password"
            value={form.currentPassword}
            onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
            show={show.current}
            onToggleShow={() => setShow((s) => ({ ...s, current: !s.current }))}
          />
          <div>
            <PasswordField
              label="New Password"
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              show={show.next}
              onToggleShow={() => setShow((s) => ({ ...s, next: !s.next }))}
            />
            <PasswordChecklist password={form.newPassword} />
          </div>
          <PasswordField
            label="Confirm New Password"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            show={show.confirm}
            onToggleShow={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
          />
        </div>

        {error && <p className="text-[13px] text-[#DC2626] mt-3 mx-1 mb-0">{error}</p>}
        {success && <p className="text-[13px] text-[#059669] mt-3 mx-1 mb-0">Password updated.</p>}

        <button
          onClick={handleSubmit}
          disabled={updatePassword.isPending}
          className={`w-full mt-4 py-3.5 px-0 rounded-[10px] border-none bg-brand text-white text-[15px] font-semibold cursor-pointer ${updatePassword.isPending ? "opacity-70" : "opacity-100"}`}
        >
          {updatePassword.isPending ? "Updating…" : "Update Password"}
        </button>
      </div>
    </div>
  );
}
