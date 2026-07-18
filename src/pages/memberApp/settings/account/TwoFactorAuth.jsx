import { useState } from "react";
import GlassLogoGlow from "../../../../components/common/GlassLogoGlow";
import PageLoadingState from "../../../../components/common/PageLoadingState";
import LoadingState from "../../../../components/common/LoadingState";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ShieldCheck, Shield, Copy, Check } from "lucide-react";
import { useMe } from "../../../../hooks/useMyAccount";
import { useQueryClient } from "@tanstack/react-query";
import { setupMfaTotp, enableMfaTotp, disableMfaTotp } from "../../../../services/authService";
import { getErrorMessage } from "../../../../utils/errorHandler";

// ── OTP digit input ───────────────────────────────────────────────────────────
function CodeInput({ value, onChange, disabled }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={6}
      autoComplete="one-time-code"
      placeholder="000000"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      className="w-full py-3 px-4 text-[22px] font-bold tracking-[8px] text-center rounded-xl border-[1.5px] border-[#D0D0D0] bg-[#FAFAFA] outline-none text-[#111]"
    />
  );
}

// ── Setup flow ────────────────────────────────────────────────────────────────
function SetupFlow({ onSuccess, onCancel }) {
  const [stage, setStage] = useState("idle"); // idle | loading | qr | verifying | done
  const [setupData, setSetupData] = useState(null); // { secret, qrCodeUri, qrCodeImage }
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
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

  async function verifySetup() {
    if (code.length !== 6) return;
    setStage("verifying");
    setError("");
    try {
      await enableMfaTotp({ code });
      setStage("done");
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err, "Invalid code. Please try again."));
      setStage("qr");
      setCode("");
    }
  }

  function copySecret() {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Resolve the QR image: prefer an explicit image field, otherwise use
  // the qrCodeUri as an <img src> if it looks like a data URI or URL.
  const qrSrc = setupData?.qrCodeImage ?? setupData?.qrCodeDataUri ?? null;
  const qrUri = setupData?.qrCodeUri ?? null;

  if (stage === "idle") {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-[#F0F4FF] rounded-2xl py-[18px] px-4 text-center">
          <Shield size={28} className="text-brand mb-2.5" />
          <p className="text-[15px] font-semibold text-[#111] mb-1.5">
            Protect your account with MFA
          </p>
          <p className="text-[13px] text-[#666] m-0 leading-relaxed">
            Use an authenticator app like Google Authenticator or Authy to generate time-based codes at login.
          </p>
        </div>

        <button
          onClick={startSetup}
          className="p-3.5 rounded-xl border-none cursor-pointer bg-[#002FA7] text-white text-[15px] font-semibold"
        >
          Set Up MFA
        </button>
        <button
          onClick={onCancel}
          className="p-3 rounded-xl border-[1.5px] border-[#D0D0D0] bg-white text-[#555] text-sm cursor-pointer"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (stage === "loading") {
    return <LoadingState label="Preparing setup…" size={22} className="py-10" />;
  }

  if (stage === "qr" || stage === "verifying") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-[#111] m-0">
          1. Scan this QR code with your authenticator app
        </p>

        {/* QR code display */}
        {qrSrc ? (
          <div className="flex justify-center p-4 bg-white rounded-xl border border-outline-on-surface">
            <img src={qrSrc} alt="MFA QR code" className="w-[180px] h-[180px]" />
          </div>
        ) : qrUri ? (
          <div className="bg-white rounded-xl border border-outline-on-surface py-3 px-4">
            <p className="text-[11px] font-semibold text-[#999] uppercase tracking-[0.4px] mb-1.5">
              QR URI (scan or paste into your app)
            </p>
            <p className="text-[11px] text-[#555] break-all m-0 leading-snug">
              {qrUri}
            </p>
          </div>
        ) : null}

        {/* Manual secret */}
        {setupData?.secret && (
          <div>
            <p className="text-[13px] text-[#666] mb-2">
              Or enter this key manually:
            </p>
            <div className="flex items-center gap-2.5 bg-[#F5F5F5] rounded-[10px] py-2.5 px-3.5">
              <code className="flex-1 text-sm font-semibold tracking-[2px] text-[#111] break-all">
                {setupData.secret}
              </code>
              <button
                onClick={copySecret}
                className="bg-transparent border-none cursor-pointer text-brand flex-shrink-0 flex"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}

        <p className="text-sm font-semibold text-[#111] mt-1 mb-0">
          2. Enter the 6-digit code from the app
        </p>
        <CodeInput value={code} onChange={setCode} disabled={stage === "verifying"} />
        {error && <p className="text-[13px] text-[#DC2626] m-0">{error}</p>}

        <button
          onClick={verifySetup}
          disabled={code.length !== 6 || stage === "verifying"}
          className={`p-3.5 rounded-xl border-none text-white text-[15px] font-semibold ${code.length === 6 ? "cursor-pointer bg-[#002FA7]" : "cursor-not-allowed bg-[#E0E0E0]"} ${stage === "verifying" ? "opacity-70" : "opacity-100"}`}
        >
          {stage === "verifying" ? "Activating…" : "Activate MFA"}
        </button>
        <button
          onClick={onCancel}
          className="p-3 rounded-xl border-[1.5px] border-[#D0D0D0] bg-white text-[#555] text-sm cursor-pointer"
        >
          Cancel
        </button>
      </div>
    );
  }

  return null;
}

// ── Disable flow ──────────────────────────────────────────────────────────────
function DisableFlow({ onSuccess, onCancel }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDisable() {
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

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#FFF8F0] rounded-xl py-3.5 px-4 border border-[#FDDCB5]">
        <p className="text-sm font-semibold text-[#B45309] mb-1">Disable MFA?</p>
        <p className="text-[13px] text-[#7C4D0F] m-0 leading-relaxed">
          Your account will be less secure. You can re-enable it at any time.
        </p>
      </div>
      <p className="text-sm text-[#333] m-0">
        Enter the 6-digit code from your authenticator app to confirm:
      </p>
      <CodeInput value={code} onChange={setCode} disabled={loading} />
      {error && <p className="text-[13px] text-[#DC2626] m-0">{error}</p>}
      <button
        onClick={handleDisable}
        disabled={code.length !== 6 || loading}
        className={`p-3.5 rounded-xl border-none text-white text-[15px] font-semibold ${code.length === 6 ? "cursor-pointer bg-[#DC2626]" : "cursor-not-allowed bg-[#E0E0E0]"} ${loading ? "opacity-70" : "opacity-100"}`}
      >
        {loading ? "Disabling…" : "Disable MFA"}
      </button>
      <button
        onClick={onCancel}
        className="p-3 rounded-xl border-[1.5px] border-[#D0D0D0] bg-white text-[#555] text-sm cursor-pointer"
      >
        Cancel
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MFA() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useMe();
  const [flow, setFlow] = useState(null); // null | "setup" | "disable"

  const mfaEnabled = profile?.mfaEnabled ?? false;

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ["me"] });
    setFlow(null);
  }

  return (
    <div className="relative overflow-hidden min-h-screen pb-10" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <GlassLogoGlow />
      {/* Header */}
      <div className="flex items-center gap-2.5 pt-5 px-4 pb-4">
        <button
          onClick={() => flow ? setFlow(null) : navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
        <h1 className="text-lg font-semibold text-[#111] m-0">
          {flow === "setup" ? "Set Up MFA" : flow === "disable" ? "Disable MFA" : "Multi-Factor Authentication"}
        </h1>
      </div>

      <div className="px-4">
        {isLoading ? (
          <PageLoadingState size={56} padding="36px 24px" />
        ) : flow === "setup" ? (
          <SetupFlow onSuccess={handleSuccess} onCancel={() => setFlow(null)} />
        ) : flow === "disable" ? (
          <DisableFlow onSuccess={handleSuccess} onCancel={() => setFlow(null)} />
        ) : (
          <>
            {/* Status card */}
            <div className="bg-white rounded-2xl py-5 px-4 shadow-[0_1px_6px_rgba(0,0,0,0.06)] mb-5 flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center ${mfaEnabled ? "bg-[#DCFCE7]" : "bg-stacked-container"}`}
              >
                <ShieldCheck size={22} className={mfaEnabled ? "text-[#16A34A]" : "text-[#9CA3AF]"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-[#111] m-0">
                  Authenticator App (TOTP)
                </p>
                <p
                  className={`text-[13px] mt-0.5 mb-0 ${mfaEnabled ? "text-[#16A34A] font-medium" : "text-[#999] font-normal"}`}
                >
                  {mfaEnabled ? "Active — your account is protected" : "Not set up"}
                </p>
              </div>
              <span
                className={`text-[11px] font-bold py-1 px-2.5 rounded-full ${mfaEnabled ? "bg-[#DCFCE7] text-[#15803D]" : "bg-stacked-container text-[#9CA3AF]"}`}
              >
                {mfaEnabled ? "ON" : "OFF"}
              </span>
            </div>

            {/* Action */}
            {mfaEnabled ? (
              <button
                onClick={() => setFlow("disable")}
                className="w-full p-3.5 rounded-xl border-[1.5px] border-[#DC2626] bg-white text-[#DC2626] text-sm font-semibold cursor-pointer"
              >
                Disable MFA
              </button>
            ) : (
              <button
                onClick={() => setFlow("setup")}
                className="w-full p-3.5 rounded-xl border-none bg-[#002FA7] text-white text-[15px] font-semibold cursor-pointer"
              >
                Set Up MFA
              </button>
            )}

            {/* Info note */}
            <div className="flex items-start gap-2 py-3 px-3.5 rounded-[10px] bg-[#D7E2FF] mt-5">
              <div className="w-4 h-4 rounded-full border-[1.5px] border-[#002FA7] flex items-center justify-center flex-shrink-0 mt-px">
                <span className="text-[9px] font-bold text-brand">i</span>
              </div>
              <p className="text-xs text-[#333] m-0 leading-relaxed">
                With MFA enabled, you'll need to enter a code from your authenticator app every time you sign in. Use Google Authenticator, Authy, or any TOTP-compatible app.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
