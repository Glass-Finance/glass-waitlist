// import { useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { Eye, EyeOff } from "lucide-react";
// import AuthLayout from "../../layouts/AuthLayout";
// import PayingDues from "../../assets/auth/paying-dues.png";
// import ExemptPayments from "../../assets/auth/exempt-payments.png";

// // ── Step 1: Email Entry ──────────────────────────────────────────
// function EmailStep({ onNext }) {
//   const [email, setEmail] = useState("");
//   const [loading, setLoading] = useState(false);

//   function handleSubmit(e) {
//     e.preventDefault();
//     setLoading(true);
//     setTimeout(() => { setLoading(false); onNext(email); }, 1000);
//   }

//   return (
//     <div className="w-full max-w-sm flex flex-col">
//       <div className="text-center mb-7">
//         <h1 className="text-2xl font-bold text-gray-900 mb-1.5" style={{ fontFamily: "var(--font-sans)" }}>
//           Create Your Account
//         </h1>
//       </div>

//       <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//         <div className="flex flex-col gap-1.5">
//           <label className="text-sm font-medium text-gray-700">Email Address</label>
//           <input
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             placeholder="e.g Bax**re@gmail.com"
//             required
//             className="w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm outline-none transition-all"
//             style={{ border: "1.5px solid #C2C2C2" }}
//             onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
//             onBlur={(e) => (e.target.style.borderColor = "#C2C2C2")}
//           />
//         </div>

//         <button
//           type="submit"
//           disabled={loading}
//           className="mt-2 w-full py-3.5 rounded-3xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
//           style={{ background: "#2535c3" }}
//         >
//           {loading ? "Sending..." : "Continue"}
//         </button>
//       </form>

//       <div className="flex items-center gap-3 my-4">
//         <div className="flex-1 h-px bg-gray-200" />
//         <span className="text-xs text-gray-400">or</span>
//         <div className="flex-1 h-px bg-gray-200" />
//       </div>

//       <button
//         className="w-full py-3.5 rounded-3xl bg-white font-medium text-sm text-gray-700 flex items-center justify-center gap-2.5 hover:bg-gray-50 transition-all active:scale-[0.98]"
//         style={{ border: "1.5px solid #C2C2C2" }}
//       >
//         <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
//           <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
//           <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
//           <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
//           <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
//         </svg>
//         Sign Up With Google
//       </button>

//       <p className="text-center text-sm mt-5" style={{ color: "var(--color-gray-text)" }}>
//         Already Have An Account?{" "}
//         <button className="font-semibold hover:underline" style={{ color: "#1B2FE8" }}>
//           Sign In
//         </button>
//       </p>
//     </div>
//   );
// }

// // ── Step 2: OTP Verification ─────────────────────────────────────
// function OTPStep({ email, onNext, onBack }) {
//   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//   const [loading, setLoading] = useState(false);
//   const inputs = useRef([]);

//   const handleChange = (index, value) => {
//     if (!/^\d*$/.test(value)) return;
//     const updated = [...otp];
//     updated[index] = value.slice(-1);
//     setOtp(updated);
//     if (value && index < 5) inputs.current[index + 1]?.focus();
//   };

//   const handleKeyDown = (index, e) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       inputs.current[index - 1]?.focus();
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setTimeout(() => { setLoading(false); onNext(); }, 1000);
//   };

//   return (
//     <div className="w-full max-w-sm flex flex-col">
//       <div className="mb-7">
//         <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "var(--font-sans)" }}>
//           Verification Code Sent
//         </h1>
//         <p className="text-sm text-gray-500 mb-0.5">
//           Enter the 6-digit code that was sent to
//         </p>
//         <p className="text-sm font-semibold text-gray-900">{email}</p>
//         <button
//           onClick={onBack}
//           className="text-sm font-medium mt-1 hover:underline"
//           style={{ color: "#1B2FE8" }}
//         >
//           Wrong email?
//         </button>
//       </div>

//       <form onSubmit={handleSubmit} className="flex flex-col gap-6">
//         {/* OTP inputs — 3 + dash + 3 */}
//         <div className="flex items-center gap-2 justify-center">
//           {[0, 1, 2].map((i) => (
//             <input
//               key={i}
//               ref={(el) => (inputs.current[i] = el)}
//               type="text"
//               inputMode="numeric"
//               maxLength={1}
//               value={otp[i]}
//               onChange={(e) => handleChange(i, e.target.value)}
//               onKeyDown={(e) => handleKeyDown(i, e)}
//               className="w-11 h-12 text-center text-lg font-semibold text-gray-900 bg-white rounded-xl outline-none transition-all"
//               style={{ border: "1.5px solid #C2C2C2" }}
//               onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
//               onBlur={(e) => (e.target.style.borderColor = "#C2C2C2")}
//             />
//           ))}
//           <span className="text-gray-400 text-lg font-medium px-1">—</span>
//           {[3, 4, 5].map((i) => (
//             <input
//               key={i}
//               ref={(el) => (inputs.current[i] = el)}
//               type="text"
//               inputMode="numeric"
//               maxLength={1}
//               value={otp[i]}
//               onChange={(e) => handleChange(i, e.target.value)}
//               onKeyDown={(e) => handleKeyDown(i, e)}
//               className="w-11 h-12 text-center text-lg font-semibold text-gray-900 bg-white rounded-xl outline-none transition-all"
//               style={{ border: "1.5px solid #C2C2C2" }}
//               onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
//               onBlur={(e) => (e.target.style.borderColor = "#C2C2C2")}
//             />
//           ))}
//         </div>

//         <button
//           type="submit"
//           disabled={loading || otp.some((d) => !d)}
//           className="w-full py-3.5 rounded-3xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
//           style={{ background: "#2535c3" }}
//         >
//           {loading ? "Verifying..." : "Continue"}
//         </button>
//       </form>

//       <p className="text-center text-sm mt-5" style={{ color: "var(--color-gray-text)" }}>
//         Didn't get OTP?{" "}
//         <button className="font-semibold hover:underline" style={{ color: "#1B2FE8" }}>
//           Resend
//         </button>
//       </p>
//     </div>
//   );
// }

// // ── Step 3: Complete Profile ──────────────────────────────────────
// function CompleteProfileStep({ onNext }) {
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [form, setForm] = useState({ firstName: "", lastName: "", password: "", confirmPassword: "" });

//   const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setTimeout(() => { setLoading(false); onNext(); }, 1000);
//   };

//   const inputCls = "w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm outline-none transition-all";
//   const inputStyle = { border: "1.5px solid #C2C2C2" };
//   const onFocus = (e) => (e.target.style.borderColor = "var(--color-primary)");
//   const onBlur = (e) => (e.target.style.borderColor = "#C2C2C2");

//   return (
//     <div className="w-full max-w-sm flex flex-col">
//       <div className="mb-7">
//         <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-sans)" }}>
//           Complete Your Profile
//         </h1>
//       </div>

//       <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//         {/* First + Last name */}
//         <div className="grid grid-cols-2 gap-3">
//           <div className="flex flex-col gap-1.5">
//             <label className="text-sm font-medium text-gray-700">First Name</label>
//             <input type="text" name="firstName" value={form.firstName} onChange={handleChange}
//               placeholder="Enter Your Name" required className={inputCls} style={inputStyle}
//               onFocus={onFocus} onBlur={onBlur} />
//           </div>
//           <div className="flex flex-col gap-1.5">
//             <label className="text-sm font-medium text-gray-700">Last Name</label>
//             <input type="text" name="lastName" value={form.lastName} onChange={handleChange}
//               placeholder="Enter Your Name" required className={inputCls} style={inputStyle}
//               onFocus={onFocus} onBlur={onBlur} />
//           </div>
//         </div>

//         {/* Password */}
//         <div className="flex flex-col gap-1.5">
//           <label className="text-sm font-medium text-gray-700">Create Password</label>
//           <div className="relative">
//             <input type={showPassword ? "text" : "password"} name="password" value={form.password}
//               onChange={handleChange} placeholder="Enter Your Password" required
//               className={`${inputCls} pr-11`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
//             <button type="button" onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
//               {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//             </button>
//           </div>
//         </div>

//         {/* Confirm Password */}
//         <div className="flex flex-col gap-1.5">
//           <label className="text-sm font-medium text-gray-700">Confirm Password</label>
//           <div className="relative">
//             <input type={showConfirm ? "text" : "password"} name="confirmPassword" value={form.confirmPassword}
//               onChange={handleChange} placeholder="re-enter Password" required
//               className={`${inputCls} pr-11`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
//             <button type="button" onClick={() => setShowConfirm(!showConfirm)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
//               {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
//             </button>
//           </div>
//         </div>

//         <button type="submit" disabled={loading}
//           className="mt-2 w-full py-3.5 rounded-3xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
//           style={{ background: "#2535c3" }}>
//           {loading ? "Creating..." : "Create Account"}
//         </button>
//       </form>

//       <p className="text-center text-sm mt-5" style={{ color: "var(--color-gray-text)" }}>
//         Already Have An Account?{" "}
//         <button className="font-semibold hover:underline" style={{ color: "#1B2FE8" }}>Log In</button>
//       </p>
//     </div>
//   );
// }

// // ── Step 4: Paying Member ─────────────────────────────────────────
// function PayingMemberStep({ onDone }) {
//   const [selected, setSelected] = useState("yes");

//   const options = [
//     {
//       id: "yes",
//       label: "Yes, I Will pay dues",
//       icon: PayingDues,
//     },
//     {
//       id: "no",
//       label: "No, I'm exempt from payments",
//       icon: ExemptPayments,
//     },
//   ];

//   return (
//     <div className="w-full max-w-lg flex flex-col items-center">
//       <div className="text-center mb-8">
//         <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "var(--font-sans)" }}>
//           Are you a paying member of this community?
//         </h1>
//         <p className="text-sm text-gray-500 max-w-sm mx-auto">
//           Some admins manage communities without contributing financially. Let us know so we set up your account correctly.
//         </p>
//       </div>

//       <div className="flex gap-4 mb-8 w-full">
//         {options.map((opt) => {
//           const isSelected = selected === opt.id;
//           return (
//             <button
//               key={opt.id}
//               onClick={() => setSelected(opt.id)}
//               className="flex-1 relative flex flex-col items-center text-center px-6 py-8 rounded-2xl bg-white transition-all duration-200"
//               style={{ border: isSelected ? "2px solid #2535c3" : "2px solid #E5E5E5" }}
//             >
//               {/* Indicator */}
//               <div className="absolute top-3 left-3">
//                 {isSelected ? (
//                   <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#2535c3" }}>
//                     <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
//                       <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
//                     </svg>
//                   </div>
//                 ) : (
//                   <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
//                 )}
//               </div>
//               <div className="mb-3 mt-2" style={{ color: isSelected ? "#2535c3" : "#1a1a1a" }}>
//                 <img src={opt.icon} alt={opt.label} className="w-14 h-14 object-contain" />
//               </div>
//               <span className="text-sm font-medium text-gray-900">{opt.label}</span>
//             </button>
//           );
//         })}
//       </div>

//       <button
//         onClick={onDone}
//         className="w-full max-w-sm py-4 rounded-3xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
//         style={{ background: "#2535c3" }}
//       >
//         Continue
//       </button>

//       <button className="mt-4 text-sm font-medium hover:underline" style={{ color: "#2535c3" }}>
//         Skip
//       </button>
//     </div>
//   );
// }

// // ── Main Component ────────────────────────────────────────────────
// export default function MemberAuth() {
//   const navigate = useNavigate();
//   const [step, setStep] = useState(1);
//   const [email, setEmail] = useState("");

//   const handleEmailNext = (submittedEmail) => {
//     setEmail(submittedEmail);
//     setStep(2);
//   };

//   return (
//      <AuthLayout>
//     {step === 1 && <EmailStep onNext={handleEmailNext} />}
//     {step === 2 && <OTPStep email={email} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
//     {step === 3 && (
//   <CompleteProfileStep
//     onNext={() => navigate("/onboarding/choose-path", { state: { email } })}
//   />
// )}
//   </AuthLayout>
//   )
// }

// import { useState, useRef } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { Eye, EyeOff } from "lucide-react";
// import AuthPanel from "../../assets/auth/auth-panel.png";
// import {
//   register,
//   verifyEmail,
//   resendVerification,
//   storeAuthSession,
// } from "../../services/authService";

// // ── Step 1: Register (Email + Name + Password) ────────────────────────────────
// function RegisterStep({ onNext }) {
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirm, setShowConfirm]   = useState(false);
//   const [loading, setLoading]           = useState(false);
//   const [error, setError]               = useState("");
//   const [form, setForm] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (form.password !== form.confirmPassword) {
//       setError("Passwords do not match.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const data = await register({
//         firstName: form.firstName,
//         lastName: form.lastName,
//         email: form.email,
//         password: form.password,
//       });
//       // Store tokens immediately — register returns them right away
//       storeAuthSession(data);
//       onNext(form.email);
//     } catch (err) {
//       setError(err.response?.data?.message || "Something went wrong. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const inputCls = "w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm outline-none transition-all";
//   const inputStyle = { border: "1.5px solid #C2C2C2" };
//   const onFocus = (e) => (e.target.style.borderColor = "var(--color-primary)");
//   const onBlur  = (e) => (e.target.style.borderColor = "#C2C2C2");

//   return (
//     <div className="w-full max-w-sm flex flex-col">
//       <div className="text-center mb-3">
//         <h1 className="text-2xl font-bold text-gray-900 mb-1.5" style={{ fontFamily: "var(--font-sans)" }}>
//           Create Your Account
//         </h1>
//       </div>

//       <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//         <div className="grid grid-cols-2 gap-3">
//           <div className="flex flex-col gap-1.5">
//             <label className="text-sm font-medium text-gray-700">First Name</label>
//             <input type="text" name="firstName" value={form.firstName} onChange={handleChange} placeholder="Enter Your Name" required className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
//           </div>
//           <div className="flex flex-col gap-1.5">
//             <label className="text-sm font-medium text-gray-700">Last Name</label>
//             <input type="text" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Enter Your Name" required className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
//           </div>
//         </div>

//         <div className="flex flex-col gap-1.5">
//           <label className="text-sm font-medium text-gray-700">Email Address</label>
//           <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="e.g Bax**re@gmail.com" required className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
//         </div>

//         <div className="flex flex-col gap-1.5">
//           <label className="text-sm font-medium text-gray-700">Create Password</label>
//           <div className="relative">
//             <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Enter Your Password" required className={`${inputCls} pr-11`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
//             <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
//               {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//             </button>
//           </div>
//         </div>

//         <div className="flex flex-col gap-1.5">
//           <label className="text-sm font-medium text-gray-700">Confirm Password</label>
//           <div className="relative">
//             <input type={showConfirm ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter Password" required className={`${inputCls} pr-11`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
//             <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
//               {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
//             </button>
//           </div>
//         </div>

//         {error && <p className="text-sm text-red-500 -mt-1">{error}</p>}

//         <button type="submit" disabled={loading} className="mt-2 w-full py-3.5 rounded-3xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60" style={{ background: "#2535c3" }}>
//           {loading ? "Creating Account..." : "Continue"}
//         </button>
//       </form>

//       <div className="flex items-center gap-3 my-2">
//         <div className="flex-1 h-px bg-gray-200" />
//         <span className="text-xs text-gray-400">or</span>
//         <div className="flex-1 h-px bg-gray-200" />
//       </div>

//       <button className="w-full py-3.5 rounded-3xl bg-white font-medium text-sm text-gray-700 flex items-center justify-center gap-2.5 hover:bg-gray-50 transition-all active:scale-[0.98]" style={{ border: "1.5px solid #C2C2C2" }}>
//         <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
//           <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
//           <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
//           <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
//           <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
//         </svg>
//         Sign Up With Google
//       </button>
//     </div>
//   );
// }

// // ── Step 2: OTP Verification ───────────────────────────────────────────────────
// function OTPStep({ email, onVerified, onBack }) {
//   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [resending, setResending] = useState(false);
//   const [resendMessage, setResendMessage] = useState("");
//   const inputs = useRef([]);

//   const handleChange = (index, value) => {
//     if (!/^\d*$/.test(value)) return;
//     const updated = [...otp];
//     updated[index] = value.slice(-1);
//     setOtp(updated);
//     if (value && index < 5) inputs.current[index + 1]?.focus();
//   };

//   const handleKeyDown = (index, e) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       inputs.current[index - 1]?.focus();
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);
//     try {
//       await verifyEmail({ email, token: otp.join("") });
//       onVerified();
//     } catch (err) {
//       setError(err.response?.data?.message || "Invalid or expired code. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleResend = async () => {
//     setResending(true);
//     setResendMessage("");
//     try {
//       await resendVerification({ email });
//       setResendMessage("A new code has been sent.");
//     } catch {
//       setResendMessage("Could not resend. Please try again.");
//     } finally {
//       setResending(false);
//     }
//   };

//   return (
//     <div className="w-full max-w-sm flex flex-col">
//       <div className="mb-7">
//         <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "var(--font-sans)" }}>
//           Verification Code Sent
//         </h1>
//         <p className="text-sm text-gray-500 mb-0.5">Enter the 6-digit code that was sent to</p>
//         <p className="text-sm font-semibold text-gray-900">{email}</p>
//         <button onClick={onBack} className="text-sm font-medium mt-1 hover:underline" style={{ color: "#1B2FE8" }}>
//           Wrong email?
//         </button>
//       </div>

//       <form onSubmit={handleSubmit} className="flex flex-col gap-6">
//         <div className="flex items-center gap-2 justify-center">
//           {[0, 1, 2].map((i) => (
//             <input key={i} ref={(el) => (inputs.current[i] = el)} type="text" inputMode="numeric" maxLength={1} value={otp[i]} onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} className="w-11 h-12 text-center text-lg font-semibold text-gray-900 bg-white rounded-xl outline-none transition-all" style={{ border: "1.5px solid #C2C2C2" }} onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")} onBlur={(e) => (e.target.style.borderColor = "#C2C2C2")} />
//           ))}
//           <span className="text-gray-400 text-lg font-medium px-1">—</span>
//           {[3, 4, 5].map((i) => (
//             <input key={i} ref={(el) => (inputs.current[i] = el)} type="text" inputMode="numeric" maxLength={1} value={otp[i]} onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} className="w-11 h-12 text-center text-lg font-semibold text-gray-900 bg-white rounded-xl outline-none transition-all" style={{ border: "1.5px solid #C2C2C2" }} onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")} onBlur={(e) => (e.target.style.borderColor = "#C2C2C2")} />
//           ))}
//         </div>

//         {error && <p className="text-sm text-red-500 text-center -mt-2">{error}</p>}

//         <button type="submit" disabled={loading || otp.some((d) => !d)} className="w-full py-3.5 rounded-3xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60" style={{ background: "#2535c3" }}>
//           {loading ? "Verifying..." : "Continue"}
//         </button>
//       </form>

//       <p className="text-center text-sm mt-5" style={{ color: "var(--color-gray-text)" }}>
//         Didn't get OTP?{" "}
//         <button onClick={handleResend} disabled={resending} className="font-semibold hover:underline disabled:opacity-60" style={{ color: "#1B2FE8" }}>
//           {resending ? "Resending..." : "Resend"}
//         </button>
//       </p>
//       {resendMessage && <p className="text-center text-xs text-gray-400 mt-1">{resendMessage}</p>}
//     </div>
//   );
// }

// // ── Main Component ────────────────────────────────────────────────────────────
// export default function MemberAuth() {
//   const navigate = useNavigate();
//   const [step, setStep] = useState(1);
//   const [email, setEmail] = useState("");

//   const handleRegistered = (registeredEmail) => {
//     setEmail(registeredEmail);
//     setStep(2);
//   };

//   const handleVerified = () => {
//     navigate("/onboarding/choose-path", { state: { email } });
//   };

//   return (
//     <div className="h-screen w-screen flex overflow-hidden bg-[#F5F5F6] p-2">
//       {/* LEFT panel */}
//       <div className="hidden md:block w-[46%] h-full flex-shrink-0 rounded-3xl overflow-hidden">
//         <img src={AuthPanel} alt="Glass Finance" className="w-full h-full object-fill" />
//       </div>

//       {/* RIGHT form */}
//       <div className="flex-1 flex flex-col justify-center items-center px-12 bg-[#F5F5F6] overflow-y-auto">
//         {step === 1 && <RegisterStep onNext={handleRegistered} />}
//         {step === 2 && (
//           <OTPStep
//             email={email}
//             onVerified={handleVerified}
//             onBack={() => setStep(1)}
//           />
//         )}
//          <p className="text-sm text-center text-gray-500 pt-4">
//                 Already Have An Account?{" "}
//                 <Link
//                   to="/member/sign-in"
//                   className="font-semibold"
//                   style={{ color: "#1C2B8A" }}
//                 >
//                   Sign In
//                 </Link>
//               </p>
//       </div>
//     </div>
//   );
// }

import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthPanel from "../../assets/auth/auth-panel.png";
import { useAuth } from "../../store/AuthContext";
import {
  register,
  verifyEmail,
  resendVerification,
} from "../../services/authService";

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm outline-none transition-all";
const inputStyle = { border: "1.5px solid #C2C2C2" };
const onFocus = (e) => (e.target.style.borderColor = "#2535c3");
const onBlur = (e) => (e.target.style.borderColor = "#C2C2C2");

const PrimaryBtn = ({ loading, disabled, children, ...props }) => (
  <button
    {...props}
    disabled={loading || disabled}
    className="mt-2 w-full py-3.5 rounded-3xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
    style={{ background: "#2535c3" }}
  >
    {children}
  </button>
);

const GoogleBtn = () => (
  <button
    type="button"
    className="w-full py-3.5 rounded-3xl bg-white font-medium text-sm text-gray-700 flex items-center justify-center gap-2.5 hover:bg-gray-50 transition-all active:scale-[0.98]"
    style={{ border: "1.5px solid #C2C2C2" }}
  >
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
    Sign Up With Google
  </button>
);

const Divider = () => (
  <div className="flex items-center gap-3 my-2">
    <div className="flex-1 h-px bg-gray-200" />
    <span className="text-xs text-gray-400">or</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

// ── Step: Sign In ─────────────────────────────────────────────────────────────
function SignInStep({ onSwitch }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      // Route based on role — adjust role string to match your backend
      const role = (user?.role ?? "").toLowerCase();
      if (role.includes("admin")) {
        navigate("/dashboard/home", { replace: true });
      } else {
        navigate("/member/home", { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid email or password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col">
      <div className="text-center mb-7">
        <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
          Welcome Back
        </h1>
        <p className="text-sm text-gray-500">Sign in to your Glass account</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            className={inputCls}
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <button
              type="button"
              className="text-xs font-medium hover:underline bg-transparent border-none cursor-pointer"
              style={{ color: "#1B2FE8" }}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className={`${inputCls} pr-11`}
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 -mt-1">{error}</p>}

        <PrimaryBtn loading={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </PrimaryBtn>
      </form>

      <Divider />
      <GoogleBtn />

      <p className="text-center text-sm mt-5 text-gray-500">
        Don't have an account?{" "}
        <button
          onClick={onSwitch}
          className="font-semibold hover:underline bg-transparent border-none cursor-pointer"
          style={{ color: "#1B2FE8" }}
        >
          Create Account
        </button>
      </p>
    </div>
  );
}

// ── Step: Register ────────────────────────────────────────────────────────────
function RegisterStep({ onNext, onSwitch }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      onNext(form.email);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col">
      <div className="text-center mb-3">
        <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
          Create Your Account
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="Enter Your Name"
              required
              className={inputCls}
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Enter Your Name"
              required
              className={inputCls}
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="e.g Bax**re@gmail.com"
            required
            className={inputCls}
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Create Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter Your Password"
              required
              className={`${inputCls} pr-11`}
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter Password"
              required
              className={`${inputCls} pr-11`}
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 -mt-1">{error}</p>}

        <PrimaryBtn loading={loading}>
          {loading ? "Creating Account..." : "Continue"}
        </PrimaryBtn>
      </form>

      <Divider />
      <GoogleBtn />

      <p className="text-center text-sm mt-5 text-gray-500">
        Already Have An Account?{" "}
        <button
          onClick={onSwitch}
          className="font-semibold hover:underline bg-transparent border-none cursor-pointer"
          style={{ color: "#1B2FE8" }}
        >
          Sign In
        </button>
      </p>
    </div>
  );
}

// ── Step: OTP Verification ────────────────────────────────────────────────────
function OTPStep({ email, onVerified, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const inputs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputs.current[index - 1]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyEmail({ email, token: otp.join("") });
      onVerified();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid or expired code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg("");
    try {
      await resendVerification({ email });
      setResendMsg("A new code has been sent.");
    } catch {
      setResendMsg("Could not resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const otpInput = (i) => (
    <input
      key={i}
      ref={(el) => (inputs.current[i] = el)}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={otp[i]}
      onChange={(e) => handleChange(i, e.target.value)}
      onKeyDown={(e) => handleKeyDown(i, e)}
      className="w-11 h-12 text-center text-lg font-semibold text-gray-900 bg-white rounded-xl outline-none transition-all"
      style={{ border: "1.5px solid #C2C2C2" }}
      onFocus={(e) => (e.target.style.borderColor = "#2535c3")}
      onBlur={(e) => (e.target.style.borderColor = "#C2C2C2")}
    />
  );

  return (
    <div className="w-full max-w-sm flex flex-col">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Verification Code Sent
        </h1>
        <p className="text-sm text-gray-500 mb-0.5">
          Enter the 6-digit code that was sent to
        </p>
        <p className="text-sm font-semibold text-gray-900">{email}</p>
        <button
          onClick={onBack}
          className="text-sm font-medium mt-1 hover:underline bg-transparent border-none cursor-pointer"
          style={{ color: "#1B2FE8" }}
        >
          Wrong email?
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex items-center gap-2 justify-center">
          {[0, 1, 2].map(otpInput)}
          <span className="text-gray-400 text-lg font-medium px-1">—</span>
          {[3, 4, 5].map(otpInput)}
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center -mt-2">{error}</p>
        )}

        <PrimaryBtn loading={loading} disabled={otp.some((d) => !d)}>
          {loading ? "Verifying..." : "Continue"}
        </PrimaryBtn>
      </form>

      <p className="text-center text-sm mt-5 text-gray-500">
        Didn't get OTP?{" "}
        <button
          onClick={handleResend}
          disabled={resending}
          className="font-semibold hover:underline bg-transparent border-none cursor-pointer disabled:opacity-60"
          style={{ color: "#1B2FE8" }}
        >
          {resending ? "Resending..." : "Resend"}
        </button>
      </p>
      {resendMsg && (
        <p className="text-center text-xs text-gray-400 mt-1">{resendMsg}</p>
      )}
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
// mode: "signin" | "register" | "otp"
export default function MemberAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin"); // default to sign in
  const [email, setEmail] = useState("");

  const handleRegistered = (registeredEmail) => {
    setEmail(registeredEmail);
    setMode("otp");
  };

  const handleVerified = () => {
    navigate("/onboarding/choose-path", { state: { email } });
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#F5F5F6] p-2">
      {/* Left panel */}
      <div className="hidden md:block w-[46%] h-full flex-shrink-0 rounded-3xl overflow-hidden">
        <img
          src={AuthPanel}
          alt="Glass Finance"
          className="w-full h-full object-fill"
        />
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col justify-center items-center px-12 bg-[#F5F5F6] overflow-y-auto">
        {mode === "signin" && (
          <SignInStep onSwitch={() => setMode("register")} />
        )}

        {mode === "register" && (
          <RegisterStep
            onNext={handleRegistered}
            onSwitch={() => setMode("signin")}
          />
        )}

        {mode === "otp" && (
          <OTPStep
            email={email}
            onVerified={handleVerified}
            onBack={() => setMode("register")}
          />
        )}
      </div>
    </div>
  );
}

// import { useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { Eye, EyeOff, Mail } from "lucide-react";
// import AuthPanel from "../../assets/auth/auth-panel.png";
// import {
//   register,
//   verifyEmail,
//   resendVerification,
//   storeAuthSession,
// } from "../../services/authService";
// import AuthLayout from '../../layouts/AuthLayout';

// // ── Step 1: Register (Email + Name + Password) ────────────────────────────────
// function RegisterStep({ onNext }) {
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirm, setShowConfirm]   = useState(false);
//   const [loading, setLoading]           = useState(false);
//   const [error, setError]               = useState("");
//   const [form, setForm] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (form.password !== form.confirmPassword) {
//       setError("Passwords do not match.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const data = await register({
//         firstName: form.firstName,
//         lastName: form.lastName,
//         email: form.email,
//         password: form.password,
//       });
//       // Store tokens immediately — register returns them right away
//       storeAuthSession(data);
//       onNext(form.email);
//     } catch (err) {
//       setError(err.response?.data?.message || "Something went wrong. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const inputCls = "w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm outline-none transition-all";
//   const inputStyle = { border: "1.5px solid #C2C2C2" };
//   const onFocus = (e) => (e.target.style.borderColor = "var(--color-primary)");
//   const onBlur  = (e) => (e.target.style.borderColor = "#C2C2C2");

//   return (
//     <div className="w-full max-w-sm flex flex-col">
//       <div className="text-center mb-7">
//         <h1 className="text-2xl font-bold text-gray-900 mb-1.5" style={{ fontFamily: "var(--font-sans)" }}>
//           Create Your Account
//         </h1>
//       </div>

//       <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//         <div className="grid grid-cols-2 gap-3">
//           <div className="flex flex-col gap-1.5">
//             <label className="text-sm font-medium text-gray-700">First Name</label>
//             <input type="text" name="firstName" value={form.firstName} onChange={handleChange} placeholder="Enter Your Name" required className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
//           </div>
//           <div className="flex flex-col gap-1.5">
//             <label className="text-sm font-medium text-gray-700">Last Name</label>
//             <input type="text" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Enter Your Name" required className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
//           </div>
//         </div>

//         <div className="flex flex-col gap-1.5">
//           <label className="text-sm font-medium text-gray-700">Email Address</label>
//           <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="e.g Bax**re@gmail.com" required className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
//         </div>

//         <div className="flex flex-col gap-1.5">
//           <label className="text-sm font-medium text-gray-700">Create Password</label>
//           <div className="relative">
//             <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Enter Your Password" required className={`${inputCls} pr-11`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
//             <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
//               {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//             </button>
//           </div>
//         </div>

//         <div className="flex flex-col gap-1.5">
//           <label className="text-sm font-medium text-gray-700">Confirm Password</label>
//           <div className="relative">
//             <input type={showConfirm ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter Password" required className={`${inputCls} pr-11`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
//             <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
//               {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
//             </button>
//           </div>
//         </div>

//         {error && <p className="text-sm text-red-500 -mt-1">{error}</p>}

//         <button type="submit" disabled={loading} className="mt-2 w-full py-3.5 rounded-3xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60" style={{ background: "#2535c3" }}>
//           {loading ? "Creating Account..." : "Continue"}
//         </button>
//       </form>

//       <div className="flex items-center gap-3 my-4">
//         <div className="flex-1 h-px bg-gray-200" />
//         <span className="text-xs text-gray-400">or</span>
//         <div className="flex-1 h-px bg-gray-200" />
//       </div>

//       <button className="w-full py-3.5 rounded-3xl bg-white font-medium text-sm text-gray-700 flex items-center justify-center gap-2.5 hover:bg-gray-50 transition-all active:scale-[0.98]" style={{ border: "1.5px solid #C2C2C2" }}>
//         <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
//           <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
//           <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
//           <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
//           <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
//         </svg>
//         Sign Up With Google
//       </button>
//     </div>
//   );
// }

// // ── Step 2: Check Your Email ───────────────────────────────────────────────────
// // The backend sends a link — not an OTP code — so we just tell the user to check
// // their inbox. The verify-email page (separate route) handles the token from the link.
// function CheckEmailStep({ email, onResend, onBack }) {
//   const [resending, setResending] = useState(false);
//   const [resent, setResent]       = useState(false);
//   const [error, setError]         = useState("");

//   async function handleResend() {
//     setResending(true);
//     setError("");
//     try {
//       const res = await fetch(`${API}/verify/resend`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email }),
//       });
//       const data = await res.json();
//       if (!res.ok || !data.success) throw new Error(data.message || "Could not resend");
//       setResent(true);
//       setTimeout(() => setResent(false), 3000);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setResending(false);
//     }
//   }

//   return (
//     <div className="w-full max-w-sm flex flex-col items-center text-center">
//       {/* Mail icon */}
//       <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
//         style={{ background: "#EEF2FF" }}>
//         <Mail size={28} color="#002FA7" />
//       </div>

//       <h1 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h1>
//       <p className="text-sm text-gray-500 mb-1">We sent a verification link to</p>
//       <p className="text-sm font-semibold text-gray-900 mb-1">{email}</p>
//       <button onClick={onBack} className="text-sm font-medium mb-6 hover:underline bg-transparent border-none cursor-pointer"
//         style={{ color: "#1B2FE8" }}>
//         Wrong email?
//       </button>

//       <div className="w-full px-5 py-4 rounded-2xl mb-5 text-left"
//         style={{ background: "#F0F4FF", border: "1px solid #C7D2FE" }}>
//         <p className="text-sm text-gray-700 leading-relaxed">
//           Click the <strong>"Verify email"</strong> button in the email to activate your account.
//           The link will take you straight to your dashboard.
//         </p>
//       </div>

//       {error && (
//         <p className="text-sm text-red-500 mb-3">{error}</p>
//       )}

//       <p className="text-sm text-gray-500">
//         Didn't get it?{" "}
//         <button onClick={handleResend} disabled={resending}
//           className="font-semibold hover:underline bg-transparent border-none cursor-pointer disabled:opacity-50"
//           style={{ color: "#1B2FE8" }}>
//           {resending ? "Sending..." : resent ? "Sent!" : "Resend email"}
//         </button>
//       </p>
//     </div>
//   );
// }

// // ── Main export ───────────────────────────────────────────────────────────────
// export default function MemberAuth() {
//   const [step, setStep]   = useState("register"); // "register" | "check-email"
//   const [email, setEmail] = useState("");

//   return (
//     <AuthLayout>
//       {step === "register" && (
//         <RegisterStep onNext={(e) => { setEmail(e); setStep("check-email"); }} />
//       )}
//       {step === "check-email" && (
//         <CheckEmailStep
//           email={email}
//           onBack={() => setStep("register")}
//           onResend={() => {}}
//         />
//       )}
//     </AuthLayout>
//   );
// }
