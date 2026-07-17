import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Eye, EyeOff, ShieldCheck, Shield, Copy, Check, X } from "lucide-react";
import { useUpdatePassword, useMe } from "../../../../hooks/useMyAccount";
import { setupMfaTotp, enableMfaTotp, disableMfaTotp } from "../../../../services/authService";
import { getErrorMessage } from "../../../../utils/errorHandler";
import { isPasswordValid, PASSWORD_REQUIREMENTS_TEXT } from "../../../../utils/password";
import PasswordChecklist from "../../../../components/auth/PasswordChecklist";
import LoadingState from "../../../../components/common/LoadingState";
import { useQueryClient } from "@tanstack/react-query";

// ─── MFA Modal ────────────────────────────────────────────────────────────────

function MfaModal({ mode, onClose, onSuccess }) {
  const [stage, setStage] = useState(mode === "setup" ? "idle" : "confirm");
  const [setupData, setSetupData] = useState(null);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function startSetup() {
    setStage("loading");
    setError("");
    try {
      const data = await setupMfaTotp();
      setSetupData(data);
      setStage("qr");
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't start setup. Please try again."));
      setStage("idle");
    }
  }

  async function confirmEnable() {
    if (code.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const result = await enableMfaTotp({ code });
      setRecoveryCodes(result?.recoveryCodes ?? []);
      setStage("recovery");
    } catch (err) {
      setError(getErrorMessage(err, "Invalid code. Please try again."));
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDisable() {
    if (code.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      await disableMfaTotp({ code });
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err, "Invalid code. Please try again."));
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  function copySecret() {
    if (!secret) return;
    navigator.clipboard.writeText(secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const otpauthUri = setupData?.otpauthUri ?? setupData?.qrCodeUri ?? setupData?.otpAuthUri ?? setupData?.otpauth_url ?? setupData?.uri ?? null;
  const secret = setupData?.secret ?? setupData?.totpSecret ?? setupData?.secretKey ?? setupData?.key
    ?? (otpauthUri ? new URLSearchParams(otpauthUri.split("?")[1]).get("secret") : null);
  const [qrSrc, setQrSrc] = useState(null);

  useEffect(() => {
    if (!otpauthUri) return;
    QRCode.toDataURL(otpauthUri, { width: 200, margin: 1 })
      .then(setQrSrc)
      .catch(() => setQrSrc(null));
  }, [otpauthUri]);

  const inputCls = "w-full px-4 py-2.5 rounded-md border border-gray-300 text-gray-900 text-sm outline-none text-center tracking-widest font-mono text-lg transition-all focus:border-[#002FA7]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" style={{ border: "1px solid #E5E7EB" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">
            {mode === "setup" ? "Set Up Authenticator App" : "Disable MFA"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Setup: idle */}
          {mode === "setup" && stage === "idle" && (
            <>
              <div className="bg-[#F0F4FF] rounded-xl p-4 text-center">
                <Shield size={24} className="text-[#002FA7] mx-auto mb-2" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  Use Google Authenticator, Authy, or any TOTP-compatible app to generate time-based codes at login.
                </p>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={startSetup}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
                style={{ background: "#002FA7" }}
              >
                Begin Setup
              </button>
            </>
          )}

          {/* Setup: loading */}
          {stage === "loading" && <LoadingState className="py-8" />}

          {/* Setup: QR code + code entry */}
          {(stage === "qr" || (mode === "setup" && stage === "confirm")) && (
            <>
              <p className="text-xs font-semibold text-gray-700">1. Scan with your authenticator app</p>
              {qrSrc ? (
                <div className="flex justify-center p-4 bg-white rounded-xl border border-gray-200">
                  <img src={qrSrc} alt="MFA QR code" className="w-44 h-44" />
                </div>
              ) : otpauthUri ? (
                <div className="bg-stacked-container rounded-xl p-3 border border-gray-200">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Copy this URI into your authenticator app</p>
                  <p className="text-xs text-gray-600 break-all leading-relaxed">{otpauthUri}</p>
                </div>
              ) : null}

              {secret && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Or enter this key manually:</p>
                  <div className="flex items-center gap-2 bg-stacked-container rounded-lg px-3 py-2 border border-gray-200">
                    <code className="flex-1 text-xs font-bold tracking-widest text-gray-800 break-all">{secret}</code>
                    <button onClick={copySecret} className="border-none bg-transparent cursor-pointer text-[#002FA7] flex-shrink-0">
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs font-semibold text-gray-700">2. Enter the 6-digit code</p>
              <input
                type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={inputCls}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={confirmEnable}
                disabled={code.length !== 6 || loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-50"
                style={{ background: "#002FA7" }}
              >
                {loading ? "Activating…" : "Activate MFA"}
              </button>
            </>
          )}

          {/* Disable flow */}
          {mode === "disable" && stage === "confirm" && (
            <>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="text-xs font-semibold text-amber-800 mb-1">Your account will be less secure</p>
                <p className="text-xs text-amber-700 leading-relaxed">You can re-enable MFA at any time from Security settings.</p>
              </div>
              <p className="text-xs text-gray-600">Enter the 6-digit code from your authenticator app to confirm:</p>
              <input
                type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={inputCls}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={confirmDisable}
                disabled={code.length !== 6 || loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-50"
                style={{ background: "#DC2626" }}
              >
                {loading ? "Disabling…" : "Disable MFA"}
              </button>
            </>
          )}

          {/* Recovery codes — shown after MFA is successfully enabled */}
          {stage === "recovery" && (
            <div className="flex flex-col gap-3">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-xs font-semibold text-green-800 mb-1">MFA enabled successfully</p>
                <p className="text-xs text-green-700 leading-relaxed">Save these recovery codes somewhere safe. Each code can only be used once if you lose access to your authenticator app.</p>
              </div>
              {recoveryCodes.length > 0 && (
                <div className="bg-stacked-container rounded-xl p-4 border border-gray-200 grid grid-cols-2 gap-2">
                  {recoveryCodes.map((rc, i) => (
                    <code key={i} className="text-xs font-mono font-bold text-gray-800 bg-white rounded px-2 py-1 border border-gray-200 text-center">{rc}</code>
                  ))}
                </div>
              )}
              <button
                onClick={onSuccess}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
                style={{ background: "#002FA7" }}
              >
                Done
              </button>
            </div>
          )}

          {stage !== "recovery" && (
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer border-none"
          >
            Cancel
          </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Security() {
  const queryClient = useQueryClient();
  const updatePassword = useUpdatePassword();
  const { data: profile } = useMe();
  const mfaEnabled = profile?.mfaEnabled ?? false;

  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mfaModal, setMfaModal] = useState(null); // "setup" | "disable" | null

  const inputCls = "w-full px-4 py-2.5 rounded-md border border-gray-300 text-gray-900 text-xs outline-none transition-all pr-11 focus:border-[#002FA7]";

  async function handleUpdatePassword() {
    setError("");
    setSuccess(false);
    if (!passwords.current) { setError("Current password is required."); return; }
    if (!isPasswordValid(passwords.new)) { setError(`Password must include: ${PASSWORD_REQUIREMENTS_TEXT.toLowerCase()}`); return; }
    if (passwords.new !== passwords.confirm) { setError("New passwords don't match."); return; }
    try {
      await updatePassword.mutateAsync({ oldPassword: passwords.current, newPassword: passwords.new, confirmPassword: passwords.confirm });
      setSuccess(true);
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update password."));
    }
  }

  function handleMfaSuccess() {
    queryClient.invalidateQueries({ queryKey: ["me"] });
    setMfaModal(null);
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
              <input type={show.current ? "text" : "password"} value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                placeholder="Enter Current Password" className={inputCls} />
              <button type="button" onClick={() => setShow({ ...show, current: !show.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show.current ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">New Password</label>
              <div className="relative">
                <input type={show.new ? "text" : "password"} value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  placeholder="Enter New Password" className={inputCls} />
                <button type="button" onClick={() => setShow({ ...show, new: !show.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show.new ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <PasswordChecklist password={passwords.new} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Confirm New Password</label>
              <div className="relative">
                <input type={show.confirm ? "text" : "password"} value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  placeholder="Confirm New Password" className={inputCls} />
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
            <button onClick={handleUpdatePassword} disabled={updatePassword.isPending}
              className="px-4 py-2 rounded-sm font-small text-xs text-[#002FA7] border border-[#002FA7] hover:opacity-90 transition-all disabled:opacity-50">
              {updatePassword.isPending ? "Updating…" : "Update Password"}
            </button>
          </div>
        </div>
      </div>

      {/* MFA */}
      <div className="bg-[#f6f6f6] rounded-2xl p-6" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Multi-Factor Authentication (MFA)</p>
        <p className="text-xs text-gray-500 mb-5">Add an extra layer of protection to your account.</p>

        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${mfaEnabled ? "bg-green-50" : "bg-gray-100"}`}>
              <ShieldCheck size={16} className={mfaEnabled ? "text-green-600" : "text-gray-400"} />
            </div>
            <div>
              <p className="text-sm text-gray-900">Authenticator App (TOTP)</p>
              <p className="text-xs text-gray-500">Time-based codes from Google Authenticator or Authy</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mfaEnabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
              {mfaEnabled ? "ON" : "OFF"}
            </span>
            <button
              onClick={() => setMfaModal(mfaEnabled ? "disable" : "setup")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all"
              style={mfaEnabled
                ? { border: "1px solid #FECACA", color: "#DC2626", background: "#FFF5F5" }
                : { border: "1px solid #002FA7", color: "#002FA7", background: "#fff" }
              }
            >
              {mfaEnabled ? "Disable" : "Enable"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-100">
              <Shield size={16} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-900">SMS Verification</p>
              <p className="text-xs text-gray-500">One-time code via SMS at login</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Coming soon</span>
        </div>
      </div>

      {mfaModal && (
        <MfaModal
          mode={mfaModal}
          onClose={() => setMfaModal(null)}
          onSuccess={handleMfaSuccess}
        />
      )}
    </div>
  );
}
