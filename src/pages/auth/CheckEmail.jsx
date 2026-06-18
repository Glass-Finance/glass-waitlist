import { useNavigate, useLocation } from "react-router-dom";
import GlassLogo from "../../assets/Glass.png";
import background from '../../assets/background.png';
;
export default function CheckEmail() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email || "sulaimonqayyum@gmail.com";

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ backgroundImage: `url(${background})`, backgroundSize: "contain", backgroundPosition: "left" }}>

      {/* Glass logo top left */}
      <header className="px-8 py-5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={GlassLogo} alt="Glass" className="w-7 h-7 object-contain" />
          <span className="font-semibold text-gray-900 text-base" style={{ fontFamily: "var(--font-sans)" }}>
            Glass
          </span>
        </div>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-10">

        {/* Envelope icon with checkmark */}
        <div className="mb-8">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Envelope body */}
            <rect x="6" y="18" width="60" height="42" rx="4" stroke="#111827" strokeWidth="2.5" fill="none"/>
            {/* Envelope flap lines */}
            <path d="M6 22l30 22 30-22" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            {/* Checkmark badge */}
            <circle cx="54" cy="22" r="12" fill="white"/>
            <circle cx="54" cy="22" r="10" fill="#111827"/>
            <path d="M49 22l3.5 3.5 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3 text-center" style={{ fontFamily: "var(--font-sans)" }}>
          Check Your Email
        </h1>

        {/* Subtext */}
        <div className="text-center mb-12">
          <p className="text-sm text-gray-500 mb-1">Glass for members is best experienced on mobile!</p>
          <p className="text-sm text-gray-600">
            We've sent a link{" "}
            <span className="font-medium text-gray-900">{email}.</span>
            {" "}Open it on your phone to join your community on Glass.
          </p>
        </div>

        {/* Continue button */}
        <button
          onClick={() => navigate("/dashboard/home")}
          className="w-full max-w-sm py-3.5 rounded-3xl text-white text-xs transition-all hover:opacity-90 active:scale-[0.98] mb-4"
          style={{ background: "#2535c3" }}
        >
          Continue
        </button>

        {/* Resend */}
        <button
          className="text-xs font-medium hover:underline"
          style={{ color: "#2535c3" }}
        >
          Resend Email
        </button>

      </main>
    </div>
  );
}