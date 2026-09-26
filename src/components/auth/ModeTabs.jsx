import { Lock, KeyRound } from "lucide-react";

// Tab switcher between password and passwordless sign-in -- both are
// first-class here (the backend built OTP login as a parallel flow, not a
// "forgot your password" fallback), so equal-weight tabs rather than a
// single primary form with a secondary link underneath.
export default function ModeTabs({ mode, setMode, disabled }) {
  return (
    <div className="flex gap-1 bg-stacked-container rounded-xl p-1">
      <button
        type="button"
        onClick={() => setMode("password")}
        disabled={disabled}
        className={`appearance-none flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all disabled:cursor-not-allowed ${
          mode === "password"
            ? "bg-white text-gray-900"
            : "bg-transparent text-gray-500 hover:text-gray-800"
        }`}
      >
        <Lock size={14} /> Password
      </button>
      <button
        type="button"
        onClick={() => setMode("otp")}
        disabled={disabled}
        className={`appearance-none flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all disabled:cursor-not-allowed ${
          mode === "otp"
            ? "bg-white text-gray-900"
            : "bg-transparent text-gray-500 hover:text-gray-800"
        }`}
      >
        <KeyRound size={14} /> One-Time Code
      </button>
    </div>
  );
}
