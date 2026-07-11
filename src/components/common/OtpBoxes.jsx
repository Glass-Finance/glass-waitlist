import { useRef } from "react";

// Shared 6-box OTP input. Focus moves to the next/previous box on
// type/backspace, deferred via setTimeout(...,0) -- calling .focus()
// synchronously from within the onChange fired by iOS's SMS/QuickType
// autofill bar makes Safari drop focus and dismiss the keyboard instead of
// advancing (see OTPStep.jsx/ForgotPassword.jsx/EmailChangeModal.jsx/Join.jsx
// for the same fix). autoComplete="one-time-code" + a 6-char maxLength on
// every box lets the browser deliver a full pasted/autofilled code without
// silently truncating it first.
export default function OtpBoxes({ value, onChange, length = 6, disabled = false }) {
  const inputs = useRef([]);

  function focusBox(index) {
    setTimeout(() => inputs.current[index]?.focus(), 0);
  }

  function handleChange(index, raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length > 1) {
      const pasted = digits.slice(0, length).split("");
      const next = Array(length).fill("");
      pasted.forEach((ch, i) => { next[i] = ch; });
      onChange(next);
      focusBox(Math.min(pasted.length, length - 1));
      return;
    }
    const next = [...value];
    next[index] = digits;
    onChange(next);
    if (digits && index < length - 1) focusBox(index + 1);
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      focusBox(index - 1);
    }
  }

  return (
    <div className="flex items-center gap-2 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={length}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className="w-11 h-12 text-center text-lg font-semibold text-gray-900 bg-white rounded-xl outline-none transition-all disabled:opacity-50"
          style={{ border: value[i] ? "2px solid #1C2B8A" : "1.5px solid #D0D5E8" }}
        />
      ))}
    </div>
  );
}
