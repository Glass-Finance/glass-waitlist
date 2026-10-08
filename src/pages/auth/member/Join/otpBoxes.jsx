// Re-exported so existing imports (StepOTP, StepSignInOtp) keep working —
// the renderer now lives with the shared OTP helpers so every member-app
// OTP surface renders one box style.
export { renderDashedOtpBoxes } from "../../../../components/common/renderDashedOtpBoxes";
