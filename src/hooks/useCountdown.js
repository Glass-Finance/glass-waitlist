import { useEffect, useState } from "react";

// Counts down from `seconds` to 0, one tick per second. Pass a `resetKey`
// that changes (e.g. the OTP's email, or a counter bumped on resend) to
// restart the countdown from `seconds` again.
export function useCountdown(seconds, resetKey) {
  const [secondsLeft, setSecondsLeft] = useState(seconds);

  // Only the reset key should restart the timer — not every re-render
  // where `seconds` happens to be passed as a fresh literal.
  useEffect(() => {
    setSecondsLeft(seconds);
  }, [resetKey]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  return secondsLeft;
}

// 615 -> "10:15"
export function formatCountdown(secondsLeft) {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
