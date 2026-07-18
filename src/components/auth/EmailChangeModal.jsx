import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { resendVerification } from "../../services/authService";
import { notifyError } from "../../utils/errorHandler";
import { useCountdown, formatCountdown } from "../../hooks/useCountdown";
import OtpBoxes from "../common/OtpBoxes";

// Codes are valid for 15 minutes (see the same figure quoted in SignIn.jsx).
const OTP_VALIDITY_SECONDS = 15 * 60;

// Masks an email's local part for display in the OTP prompt, e.g.
// "aminaargawal@gmail.com" -> "**********al@gmail.com" — keep the last 2
// characters before the @ visible, mask the rest.
function maskEmail(email) {
  const [local, domain] = email.split("@");
  if (!domain || local.length <= 2) return email;
  return "*".repeat(local.length - 2) + local.slice(-2) + "@" + domain;
}

function ModalShell({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative bg-surface-container rounded-xl p-8 w-full max-w-md shadow-xl border border-[#E5E7EB]">{children}</div>
    </div>
  );
}

// Two-step modal: enter the OTP sent to the new email, then a brief success
// confirmation. Reuses verifyEmail/resendVerification from authService —
// the same /auth/verify endpoints the signup flow uses — on the assumption
// that PATCH /user/email (called by the caller before mounting this) sends
// the code the same way registration does. Untested against the live
// backend yet; adjust here first if the real contract differs.
// onSubmitOtp(otpString) — called with the 6-digit code to confirm the change
export default function EmailChangeModal({ newEmail, onSubmitOtp, onVerified, onWrongEmail, onClose }) {
  const [step, setStep] = useState("otp"); // "otp" | "success"
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendCount, setResendCount] = useState(0);

  const secondsLeft = useCountdown(OTP_VALIDITY_SECONDS, `${newEmail}-${resendCount}`);
  const codeExpired = secondsLeft <= 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmitOtp(otp.join(""));
      setStep("success");
      setTimeout(() => onVerified(), 1800);
    } catch (err) {
      setError(notifyError(err, { context: "Verify email", fallback: "Invalid or expired code. Please try again." }));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMessage("");
    try {
      await resendVerification({ email: newEmail });
      setResendMessage("A new code has been sent.");
      setResendCount((c) => c + 1);
      setOtp(["", "", "", "", "", ""]);
      setError("");
    } catch (err) {
      setResendMessage(notifyError(err, { context: "Resend code", fallback: "Could not resend. Please try again.", silent: true }));
    } finally {
      setResending(false);
    }
  }

  if (step === "success") {
    return (
      <ModalShell>
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#ECFDF5" }}>
            <CheckCircle2 size={36} style={{ color: "#059669" }} />
          </div>
          <p className="text-lg font-semibold text-gray-900">Your Email Has Been Changed Successfully!</p>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell>
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Close">
        ✕
      </button>
      <h1 className="text-headline text-gray-900 mb-3">Enter Confirmation Code</h1>
      <p className="text-sm text-gray-500 mb-0.5">Enter the 6-digit code that was sent to</p>
      <p className="text-sm font-semibold text-gray-900 mb-2">{maskEmail(newEmail)}</p>
      <button onClick={onWrongEmail} className="text-sm font-medium hover:underline" style={{ color: "#1B2FE8" }}>
        Wrong email?
      </button>
      <p className={`text-xs mt-2 mb-6 ${codeExpired ? "text-red-500 font-medium" : "text-gray-400"}`}>
        {codeExpired
          ? "Your code has expired — request a new one below."
          : `Code expires in ${formatCountdown(secondsLeft)}`}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <OtpBoxes
          key={resendCount}
          value={otp}
          onChange={setOtp}
          length={6}
          autoFocus
          renderBoxes={(digits, activeIndex) => (
            <div className="flex items-center gap-2 justify-center pointer-events-none">
              {digits.slice(0, 3).map((d, i) => (
                <div
                  key={i}
                  className="w-11 h-12 flex items-center justify-center text-lg font-semibold text-gray-900 bg-white rounded-xl transition-all"
                  style={{ border: `1.5px solid ${d || i === activeIndex ? "#1C2B8A" : "#C2C2C2"}` }}
                >
                  {d}
                </div>
              ))}
              <span className="text-gray-400 text-lg font-medium px-1">—</span>
              {digits.slice(3, 6).map((d, i) => {
                const idx = i + 3;
                return (
                  <div
                    key={idx}
                    className="w-11 h-12 flex items-center justify-center text-lg font-semibold text-gray-900 bg-white rounded-xl transition-all"
                    style={{ border: `1.5px solid ${d || idx === activeIndex ? "#1C2B8A" : "#C2C2C2"}` }}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          )}
        />

        {error && <p className="text-sm text-red-500 text-center -mt-2">{error}</p>}

        <button
          type="submit"
          disabled={loading || codeExpired || otp.some((d) => !d)}
          className="w-full py-3.5 rounded-3xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 bg-[#2535c3]"
        >
          {loading ? "Verifying..." : "Continue"}
        </button>
      </form>

      <p className="text-center text-sm mt-5 text-gray-500">
        Didn't get OTP?{" "}
        <button onClick={handleResend} disabled={resending} className="font-semibold hover:underline disabled:opacity-60" style={{ color: "#1B2FE8" }}>
          {resending ? "Resending..." : "Resend"}
        </button>
      </p>
      {resendMessage && <p className="text-center text-xs text-gray-400 mt-1">{resendMessage}</p>}
    </ModalShell>
  );
}
