import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ShieldCheck, Shield, Loader2, Copy, Check } from "lucide-react";
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
      style={{
        width: "100%", padding: "12px 16px", fontSize: 22, fontWeight: 700,
        letterSpacing: 8, textAlign: "center", borderRadius: 12,
        border: "1.5px solid #D0D0D0", background: "#FAFAFA",
        outline: "none", color: "#111",
      }}
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
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#F0F4FF", borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
          <Shield size={28} style={{ color: "#002FA7", marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: "#111", margin: "0 0 6px" }}>
            Protect your account with MFA
          </p>
          <p style={{ fontSize: 13, color: "#666", margin: 0, lineHeight: 1.5 }}>
            Use an authenticator app like Google Authenticator or Authy to generate time-based codes at login.
          </p>
        </div>

        <button
          onClick={startSetup}
          style={{
            padding: "14px", borderRadius: 12, border: "none", cursor: "pointer",
            background: "#002FA7", color: "#fff", fontSize: 15, fontWeight: 600,
          }}
        >
          Set Up MFA
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "12px", borderRadius: 12, border: "1.5px solid #D0D0D0",
            background: "#fff", color: "#555", fontSize: 14, cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (stage === "loading") {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <Loader2 size={26} style={{ color: "#002FA7" }} className="animate-spin" />
        <p style={{ fontSize: 13, color: "#999", marginTop: 12 }}>Preparing setup…</p>
      </div>
    );
  }

  if (stage === "qr" || stage === "verifying") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: 0 }}>
          1. Scan this QR code with your authenticator app
        </p>

        {/* QR code display */}
        {qrSrc ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "16px", background: "#fff", borderRadius: 12, border: "1px solid var(--color-outline-on-surface)" }}>
            <img src={qrSrc} alt="MFA QR code" style={{ width: 180, height: 180 }} />
          </div>
        ) : qrUri ? (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--color-outline-on-surface)", padding: "12px 16px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.4, margin: "0 0 6px" }}>
              QR URI (scan or paste into your app)
            </p>
            <p style={{ fontSize: 11, color: "#555", wordBreak: "break-all", margin: 0, lineHeight: 1.4 }}>
              {qrUri}
            </p>
          </div>
        ) : null}

        {/* Manual secret */}
        {setupData?.secret && (
          <div>
            <p style={{ fontSize: 13, color: "#666", margin: "0 0 8px" }}>
              Or enter this key manually:
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F5F5F5", borderRadius: 10, padding: "10px 14px" }}>
              <code style={{ flex: 1, fontSize: 14, fontWeight: 600, letterSpacing: 2, color: "#111", wordBreak: "break-all" }}>
                {setupData.secret}
              </code>
              <button
                onClick={copySecret}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#002FA7", flexShrink: 0, display: "flex" }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}

        <p style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: "4px 0 0" }}>
          2. Enter the 6-digit code from the app
        </p>
        <CodeInput value={code} onChange={setCode} disabled={stage === "verifying"} />
        {error && <p style={{ fontSize: 13, color: "#DC2626", margin: 0 }}>{error}</p>}

        <button
          onClick={verifySetup}
          disabled={code.length !== 6 || stage === "verifying"}
          style={{
            padding: "14px", borderRadius: 12, border: "none", cursor: code.length === 6 ? "pointer" : "not-allowed",
            background: code.length === 6 ? "#002FA7" : "#E0E0E0", color: "#fff", fontSize: 15, fontWeight: 600,
            opacity: stage === "verifying" ? 0.7 : 1,
          }}
        >
          {stage === "verifying" ? "Activating…" : "Activate MFA"}
        </button>
        <button
          onClick={onCancel}
          style={{ padding: "12px", borderRadius: 12, border: "1.5px solid #D0D0D0", background: "#fff", color: "#555", fontSize: 14, cursor: "pointer" }}
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#FFF8F0", borderRadius: 12, padding: "14px 16px", border: "1px solid #FDDCB5" }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#B45309", margin: "0 0 4px" }}>Disable MFA?</p>
        <p style={{ fontSize: 13, color: "#7C4D0F", margin: 0, lineHeight: 1.5 }}>
          Your account will be less secure. You can re-enable it at any time.
        </p>
      </div>
      <p style={{ fontSize: 14, color: "#333", margin: 0 }}>
        Enter the 6-digit code from your authenticator app to confirm:
      </p>
      <CodeInput value={code} onChange={setCode} disabled={loading} />
      {error && <p style={{ fontSize: 13, color: "#DC2626", margin: 0 }}>{error}</p>}
      <button
        onClick={handleDisable}
        disabled={code.length !== 6 || loading}
        style={{
          padding: "14px", borderRadius: 12, border: "none", cursor: code.length === 6 ? "pointer" : "not-allowed",
          background: code.length === 6 ? "#DC2626" : "#E0E0E0", color: "#fff", fontSize: 15, fontWeight: 600,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Disabling…" : "Disable MFA"}
      </button>
      <button
        onClick={onCancel}
        style={{ padding: "12px", borderRadius: 12, border: "1.5px solid #D0D0D0", background: "#fff", color: "#555", fontSize: 14, cursor: "pointer" }}
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
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 420px 340px at 15% 88%, rgba(124,58,237,0.10), transparent 70%), var(--color-surface-bg)", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 16px" }}>
        <button
          onClick={() => flow ? setFlow(null) : navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: 0 }}>
          {flow === "setup" ? "Set Up MFA" : flow === "disable" ? "Disable MFA" : "Multi-Factor Authentication"}
        </h1>
      </div>

      <div style={{ padding: "0 16px" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Loader2 size={22} style={{ color: "#002FA7" }} className="animate-spin" />
          </div>
        ) : flow === "setup" ? (
          <SetupFlow onSuccess={handleSuccess} onCancel={() => setFlow(null)} />
        ) : flow === "disable" ? (
          <DisableFlow onSuccess={handleSuccess} onCancel={() => setFlow(null)} />
        ) : (
          <>
            {/* Status card */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: "20px 16px",
              boxShadow: "0 1px 6px rgba(0,0,0,0.06)", marginBottom: 20,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: mfaEnabled ? "#DCFCE7" : "var(--color-stacked-container)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ShieldCheck size={22} style={{ color: mfaEnabled ? "#16A34A" : "#9CA3AF" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#111", margin: 0 }}>
                  Authenticator App (TOTP)
                </p>
                <p style={{ fontSize: 13, color: mfaEnabled ? "#16A34A" : "#999", margin: "2px 0 0", fontWeight: mfaEnabled ? 500 : 400 }}>
                  {mfaEnabled ? "Active — your account is protected" : "Not set up"}
                </p>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
                background: mfaEnabled ? "#DCFCE7" : "var(--color-stacked-container)",
                color: mfaEnabled ? "#15803D" : "#9CA3AF",
              }}>
                {mfaEnabled ? "ON" : "OFF"}
              </span>
            </div>

            {/* Action */}
            {mfaEnabled ? (
              <button
                onClick={() => setFlow("disable")}
                style={{
                  width: "100%", padding: "14px", borderRadius: 12,
                  border: "1.5px solid #DC2626", background: "#fff",
                  color: "#DC2626", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Disable MFA
              </button>
            ) : (
              <button
                onClick={() => setFlow("setup")}
                style={{
                  width: "100%", padding: "14px", borderRadius: 12,
                  border: "none", background: "#002FA7",
                  color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
                }}
              >
                Set Up MFA
              </button>
            )}

            {/* Info note */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "12px 14px", borderRadius: 10, background: "#D7E2FF", marginTop: 20,
            }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1.5px solid #002FA7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#002FA7" }}>i</span>
              </div>
              <p style={{ fontSize: 12, color: "#333", margin: 0, lineHeight: 1.5 }}>
                With MFA enabled, you'll need to enter a code from your authenticator app every time you sign in. Use Google Authenticator, Authy, or any TOTP-compatible app.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
