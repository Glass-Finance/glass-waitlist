import { Loader2, ShieldCheck } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import { Label, TextInput, PrimaryButton, ErrorMessage } from "../../components/auth/FormFields";
import OtpBoxes from "../../components/common/OtpBoxes";

export function MfaChallengeScreen({
  mfaInputRef,
  mfaCode,
  setMfaCode,
  error,
  loading,
  onVerify,
  onBack,
}) {
  return (
    <AuthLayout heroTitle="Manage Your Community" heroSubtitle="Finance Effortlessly">
      <div className="w-full max-w-md flex flex-col md:mt-14 mb-auto gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <ShieldCheck size={22} className="text-brand" />
          </div>
          <div>
            <h1 className="text-headline text-gray-900 mb-1">Enter MFA Code</h1>
            <p className="text-sm text-gray-500">Open your authenticator app and enter the 6-digit code.</p>
          </div>
        </div>

        <div>
          <Label htmlFor="mfa-code">Authentication Code</Label>
          <TextInput
            id="mfa-code"
            ref={mfaInputRef}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && onVerify()}
            autoComplete="one-time-code"
            disabled={loading}
            error={error}
          />
          <ErrorMessage message={error} />
        </div>

        <PrimaryButton onClick={onVerify} loading={loading} disabled={mfaCode.length !== 6}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Verifying…</span>
            </span>
          ) : "Verify Code"}
        </PrimaryButton>

        <button
          onClick={onBack}
          className="text-sm text-center text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
        >
          ← Back to sign in
        </button>
      </div>
    </AuthLayout>
  );
}

export function OtpVerifyScreen({
  otpIdentifier,
  otp,
  setOtp,
  otpError,
  otpCodeExpired,
  otpSecondsLeft,
  otpVerifying,
  otpSending,
  resendSecondsLeft,
  onBackToIdentifier,
  onVerify,
  onResend,
  formatCountdown,
}) {
  return (
    <AuthLayout heroTitle="Manage Your Community" heroSubtitle="Finance Effortlessly">
      <div className="w-full max-w-xl flex flex-col md:mt-14 mb-auto gap-12">
        <div>
          <h1 className="text-headline text-gray-900 mb-3 font-sans">Enter Your Code</h1>
          <p className="text-sm text-gray-500 mb-0.5">Enter the 6-digit code sent to</p>
          <p className="text-sm font-semibold text-gray-900">{otpIdentifier}</p>
          <button
            onClick={onBackToIdentifier}
            className="text-sm font-medium mt-1 hover:underline text-[#1B2FE8] bg-transparent border-none cursor-pointer p-0"
          >
            Use a different email or number
          </button>
          <p className={`text-xs mt-2 ${otpCodeExpired ? "text-red-500 font-medium" : "text-gray-400"}`}>
            {otpCodeExpired
              ? "Your code has expired — request a new one below."
              : `Code expires in ${formatCountdown(otpSecondsLeft)}`}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <OtpBoxes
            value={otp}
            onChange={(next) => setOtp(next)}
            length={6}
            autoFocus
            disabled={otpVerifying}
            renderBoxes={(digits, activeIndex) => (
              <div className="flex items-center gap-4 justify-center pointer-events-none">
                {digits.slice(0, 3).map((digit, index) => (
                  <div key={index} className={`w-16 h-16 flex-shrink-0 flex items-center justify-center text-lg font-semibold text-gray-900 rounded-lg transition-all border-[1.5px] ${digit || index === activeIndex ? "border-primary" : "border-[#C2C2C2]"}`}>
                    {digit}
                  </div>
                ))}
                <span className="text-gray-400 text-lg font-medium px-1 flex-shrink-0">—</span>
                {digits.slice(3, 6).map((digit, index) => {
                  const position = index + 3;
                  return (
                    <div key={position} className={`w-16 h-16 flex-shrink-0 flex items-center justify-center text-lg font-semibold text-gray-900 rounded-lg transition-all border-[1.5px] ${digit || position === activeIndex ? "border-primary" : "border-[#C2C2C2]"}`}>
                      {digit}
                    </div>
                  );
                })}
              </div>
            )}
          />

          {otpError && <p className="text-sm text-red-500 text-center -mt-2">{otpError}</p>}
          <PrimaryButton onClick={onVerify} loading={otpVerifying} disabled={otpCodeExpired || otp.some((digit) => !digit)}>
            {otpVerifying ? "Verifying…" : "Verify & Sign In"}
          </PrimaryButton>
        </div>

        <p className="text-center text-sm text-gray-text">
          Didn't get a code?{" "}
          <button
            onClick={onResend}
            disabled={otpSending || resendSecondsLeft > 0}
            className="font-semibold hover:underline disabled:opacity-60 text-[#1B2FE8] bg-transparent border-none cursor-pointer p-0"
          >
            {otpSending ? "Resending…" : resendSecondsLeft > 0 ? `Resend in ${formatCountdown(resendSecondsLeft)}` : "Resend"}
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}
