// Three steps, mirroring the owner SignUp flow's EmailPhoneStep ->
// RegisterStep -> OTPStep split, instead of collecting everything on one
// screen the way this page used to. SIGNIN_OTP isn't part of that linear
// flow -- it's entered directly, bypassing CONTACT/PROFILE, when arriving
// via CheckEmail.jsx's QR (see StepSignInOtp).
export const STEPS = { CONTACT: "contact", PHONE_OTP: "phoneOtp", PROFILE: "profile", OTP: "otp", SIGNIN_OTP: "signinOtp" };
export const OTP_LENGTH = 6;
// Codes are valid for 15 minutes (see SignIn.jsx and the spam-notice copy in StepOTP).
export const OTP_VALIDITY_SECONDS = 15 * 60;
export const PENDING_KEY = "glass_pending_member_verification";
