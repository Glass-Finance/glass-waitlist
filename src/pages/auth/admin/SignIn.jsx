import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../../store/AuthContext";
import { getMyInvites } from "../../../api/invites";
import { isMobileDevice, mobileRequiredPath } from "../../../utils/deviceRedirect";
import { notifyError } from "../../../utils/errorHandler";
import { toastInfo } from "../../../utils/toast";
import GoogleAuthButton from "../../../components/auth/GoogleAuthButton";
import AuthLayout from "../../../layouts/AuthLayout";

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

  // client.js's 401 interceptor hard-redirects here on session expiry — a
  // toast shown right before that navigation gets wiped along with
  // everything else, so it leaves this flag for the destination to read.
  useEffect(() => {
    if (sessionStorage.getItem("glass_session_expired")) {
      sessionStorage.removeItem("glass_session_expired");
      setTimeout(() => {
        toastInfo("Session expired", { description: "For your security, please sign in again." });
      }, 0);
    }
  }, []);

  // Shared by password sign-in and Google sign-in: routes by the *resulting*
  // role/device, since neither knows in advance whether this is a community
  // owner or a mobile-only member who just happened to land on the desktop
  // sign-in page (matches member/SignIn.jsx's routeAfterAuth).
  async function routeAfterAuth(user) {
    if (user?.isAdmin) {
      navigate("/dashboard/home", { replace: true });
      return;
    }

    if (!isMobileDevice()) {
      navigate(mobileRequiredPath("/member/app-sign-in"), { replace: true });
      return;
    }

    const inviteRes = await getMyInvites();
    const invites = inviteRes?.data?.data || [];
    navigate(invites.length > 0 ? "/member/invites" : "/member/home", {
      replace: true,
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email.trim().toLowerCase(), form.password);
      await routeAfterAuth(user);
    } catch (err) {
      setError(
        notifyError(err, {
          context: "Sign in",
          fallback: "Incorrect email or password. Please try again.",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  async function handleGoogleAuth(user) {
    try {
      await routeAfterAuth(user);
    } catch (err) {
      setError(notifyError(err, { context: "Google sign in" }));
    }
  }

  return (
    <AuthLayout
      heroTitle="Manage Your Community"
      heroSubtitle="Finance Effortlessly"
    >
      <div className="w-full max-w-sm flex flex-col my-auto">
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
                to="/forgot-password"
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
        <GoogleAuthButton onAuthenticated={handleGoogleAuth} label="signin_with" />

        <p className="text-center text-sm mt-5 text-gray-500">
          Don't have an account?{" "}
          <Link
            to="/sign-up"
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
