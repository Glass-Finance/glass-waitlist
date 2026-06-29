import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useUpdatePassword } from "../../../../hooks/useMyAccount";
import { getErrorMessage } from "../../../../utils/errorHandler";

// Greyed-out, non-interactive — matches memberApp/settings/account/TwoFactorAuth.jsx's
// honest treatment of the same "not built yet" backend gap, rather than a toggle
// that looks live but silently does nothing.
function DisabledToggle() {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0 opacity-60 cursor-not-allowed">
      <div className="relative w-8 h-[20px] rounded-full bg-gray-200">
        <div className="absolute top-0.75 left-0.5 w-[14px] h-[14px] rounded-full bg-white shadow" />
      </div>
      <span className="text-xs font-medium text-gray-400">Off</span>
    </div>
  );
}

export default function Security() {
  const updatePassword = useUpdatePassword();

  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const inputCls = "w-full px-4 py-2.5 rounded-md border border-gray-300 text-gray-900 text-xs outline-none transition-all pr-11";

  async function handleUpdatePassword() {
    setError("");
    setSuccess(false);
    if (!passwords.current || !passwords.new) {
      setError("Please fill in all fields.");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setError("New passwords don't match.");
      return;
    }
    try {
      await updatePassword.mutateAsync({
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      if (typeof pendo !== "undefined") {
        pendo.track("password_changed", {
          user_type: "admin",
        });
      }
      setSuccess(true);
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update password."));
    }
  }

  return (
    <div className="max-w-2xl flex flex-col gap-5">

      {/* Password */}
      <div className="bg-[#f6f6f6] rounded-2xl p-6" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Password</p>
        <p className="text-xs text-gray-500 mb-5">Keep your account secure with a strong password.</p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">Current Password</label>
            <div className="relative">
              <input
                type={show.current ? "text" : "password"}
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                placeholder="Enter Current Password"
                className={inputCls}
              />
              <button type="button" onClick={() => setShow({ ...show, current: !show.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show.current ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">New Password</label>
              <div className="relative">
                <input
                  type={show.new ? "text" : "password"}
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  placeholder="Enter New Password"
                  className={inputCls}
                />
                <button type="button" onClick={() => setShow({ ...show, new: !show.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show.new ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Confirm New Password</label>
              <div className="relative">
                <input
                  type={show.confirm ? "text" : "password"}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  placeholder="Confirm New Password"
                  className={inputCls}
                />
                <button type="button" onClick={() => setShow({ ...show, confirm: !show.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {success && <p className="text-xs text-emerald-600">Password updated.</p>}

          <div className="flex justify-end">
            <button
              onClick={handleUpdatePassword}
              disabled={updatePassword.isPending}
              className="px-4 py-2 rounded-sm font-small text-xs text-[#002FA7] border border-[#002FA7] hover:opacity-90 transition-all disabled:opacity-50"
            >
              {updatePassword.isPending ? "Updating…" : "Update Password"}
            </button>
          </div>
        </div>
      </div>

      {/* 2FA */}
      <div className="bg-[#f6f6f6] rounded-2xl p-6" style={{ border: "1px solid #f6f6f6" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Two-factor authentication</p>
        <p className="text-xs text-gray-500 mb-5">Add an extra layer of protection to your account.</p>

        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-sm text-gray-900">Enable 2FA</p>
            <p className="text-xs text-gray-500">Require a verification code on every login</p>
          </div>
          <DisabledToggle />
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm text-gray-900">SMS verification</p>
            <p className="text-xs text-gray-500">Send OTP to phone number</p>
          </div>
          <DisabledToggle />
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Two-factor authentication setup is coming soon.
        </p>
      </div>
    </div>
  );
}
