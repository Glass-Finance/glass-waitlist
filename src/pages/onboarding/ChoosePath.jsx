import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassLogo from "../../assets/Glass.png";
import CreateCommunityIcon from "../../assets/auth/create-community.png";
import JoinCommunityIcon from "../../assets/auth/join-community.png";

export default function ChoosePath() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("create");

  const options = [
    {
      id: "create",
      title: "Create Community",
      description: "No existing members or records. Start building your community on Glass.",
      icon: CreateCommunityIcon,
    },
    {
      id: "join",
      title: "Join Community",
      description: "Your community already exists. Join Now.",
      icon: JoinCommunityIcon,
    },
  ];

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ background: "#EAEAEC" }}
    >
      {/* ── Navbar ── */}
      <header className="flex items-center px-8 py-5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={GlassLogo} alt="Glass" className="w-7 h-7 object-contain" />
          <span
            className="font-bold text-gray-900 text-base"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            Glass
          </span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 pb-10">

        {/* Heading */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            What would you like to do?
          </h1>
          <p className="text-sm" style={{ color: "var(--color-gray-text)" }}>
            Are you setting up a community, or joining one you've been invited to?
          </p>
        </div>

        {/* Cards */}
        <div className="flex gap-5 mb-8 items-stretch">
          {options.map((option) => {
            const isSelected = selected === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                className="relative flex flex-col items-center text-center px-10 py-8 rounded-2xl transition-all duration-200 cursor-pointer"
                style={{
                  width: "380px",
                  border: isSelected ? "2px solid #3347F0" : "2px solid #E5E5E5",
                  background: isSelected ? "white" : "#FAFAFA",
                }}
              >
                {/* Selection indicator — top left, clear of icon */}
                <div className="absolute top-4 left-4">
                  {isSelected ? (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "#3347F0" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="white"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div
                      className="w-6 h-6 rounded-full border-2"
                      style={{ borderColor: "#C2C2C2" }}
                    />
                  )}
                </div>

                {/* Icon — smaller, centered, with top padding to clear the checkmark */}
                <div className="mt-6 mb-5">
                  <img
                    src={option.icon}
                    alt={option.title}
                    className="w-14 h-14 object-contain mx-auto"
                  />
                </div>

                {/* Text */}
                <h3
                  className="font-semibold text-gray-900 text-base mb-2"
                  style={{ fontFamily: "var(--font-dm)" }}
                >
                  {option.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-gray-text)" }}
                >
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Continue + Skip — spans full card width */}
        <div className="flex flex-col items-center gap-4" style={{ width: "780px" }}>
          <button
            onClick={() => navigate("/onboarding/organization")}
            className="w-full py-4 rounded-3xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#3347F0" }}
          >
            Continue
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm font-medium hover:underline"
            style={{ color: "#3347F0" }}
          >
            Skip
          </button>
        </div>

      </main>
    </div>
  );
}