import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../store/AuthContext";
import { getMyInvites } from "../../api/invites";
import AuthLayout from "../../layouts/AuthLayout";

// ── Shared styles (matches SignUp/RegisterStep) ───────────────────────────────
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
    Sign In With Google
  </button>
);

const Divider = () => (
  <div className="flex items-center gap-3 my-2">
    <div className="flex-1 h-px bg-gray-200" />
    <span className="text-xs text-gray-400">or</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

// ── Desktop sign-in form ───────────────────────────────────────────────────────
export default function SignIn() {
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
      const user = await login(form.email.trim().toLowerCase(), form.password);

      const role = user?.role || "";
      const isAdmin =
        role.includes("OWNER") ||
        role.includes("ADMIN") ||
        role.includes("MANAGER");

      if (isAdmin) {
        navigate("/dashboard/home", { replace: true });
        return;
      }

      const inviteRes = await getMyInvites();
      const invites = inviteRes?.data?.data || [];
      navigate(invites.length > 0 ? "/member/invites" : "/member/home", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Incorrect email or password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heroTitle="Manage Your Community"
      heroSubtitle="Finance Effortlessly"
    >
      <div className="w-full max-w-sm flex flex-col">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-500">
            Enter your credentials to continue.
          </p>
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
              placeholder="e.g Bax**re@gmail.com"
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
              <Link
                to="/member/forgot-password"
                className="text-xs font-semibold"
                style={{ color: "#2535c3" }}
              >
                Forgot password?
              </Link>
            </div>
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

          {error && <p className="text-sm text-red-500 -mt-1">{error}</p>}

          <PrimaryBtn loading={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </PrimaryBtn>
        </form>

        <Divider />
        <GoogleBtn />

        <p className="text-center text-sm mt-5 text-gray-500">
          Don't have an account?{" "}
          <Link
            to="/member/signup"
            className="font-semibold hover:underline"
            style={{ color: "#1B2FE8" }}
          >
            Sign Up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
