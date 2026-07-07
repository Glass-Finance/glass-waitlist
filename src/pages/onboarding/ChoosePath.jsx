// import { useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import GlassLogo from "../../assets/Glass.webp";
// import CreateCommunityIcon from "../../assets/auth/create-community.webp";
// import JoinCommunityIcon from "../../assets/auth/join-community.webp";
// import Background from "../../assets/background.webp";

// export default function ChoosePath() {
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Email is passed via router state from SignUp's OTP step
//   // Fall back to "" so the app doesn't crash if navigated to directly
//   const email = location.state?.email ?? "";

//   const [selected, setSelected] = useState("create");

//   const options = [
//     {
//       id: "create",
//       title: "Create Community",
//       description: "No existing members or records. Start building your community on Glass.",
//       icon: CreateCommunityIcon,
//     },
//     {
//       id: "join",
//       title: "Join Community",
//       description: "Your community already exists. Join Now.",
//       icon: JoinCommunityIcon,
//     },
//   ];

//   const handleContinue = () => {
//     if (selected === "create") {
//       navigate("/onboarding/organization-profile", { state: { email } });
//     } else {
//       navigate("/check-email", { state: { email } });
//     }
//   };

//   return (
//     <div
//       className="h-screen w-screen flex flex-col overflow-hidden"
//       style={{ backgroundImage: `url(${Background})`, backgroundSize: "contain", backgroundPosition: "center" }}
//     >
//       {/* ── Navbar ── */}
//       <header className="flex items-center px-8 py-5 flex-shrink-0">
//         <div className="flex items-center gap-2">
//           <img src={GlassLogo} alt="Glass" className="w-7 h-7 object-contain" />
//           <span className="font-bold text-gray-900 text-base">Glass</span>
//         </div>
//       </header>

//       {/* ── Main ── */}
//       <main className="flex-1 flex flex-col items-center justify-center px-8 pb-10">

//         {/* Heading */}
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">
//             What would you like to do?
//           </h1>
//           <p className="text-sm text-gray-500">
//             Are you setting up a community, or joining one you've been invited to?
//           </p>
//         </div>

//         {/* Cards */}
//         <div className="flex gap-5 mb-8 items-stretch">
//           {options.map((option) => {
//             const isSelected = selected === option.id;
//             return (
//               <button
//                 key={option.id}
//                 onClick={() => setSelected(option.id)}
//                 className="relative flex flex-col items-center text-center px-10 py-8 rounded-2xl transition-all duration-200 cursor-pointer"
//                 style={{
//                   width: "380px",
//                   border: isSelected ? "2px solid #002FA7" : "2px solid #E5E5E5",
//                   background: isSelected ? "white" : "#FAFAFA",
//                 }}
//               >
//                 {/* Selection indicator */}
//                 <div className="absolute top-4 left-4">
//                   {isSelected ? (
//                     <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#002FA7" }}>
//                       <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
//                         <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
//                       </svg>
//                     </div>
//                   ) : (
//                     <div className="w-6 h-6 rounded-full border-2" style={{ borderColor: "#C2C2C2" }} />
//                   )}
//                 </div>

//                 {/* Icon */}
//                 <div className="mt-6 mb-5">
//                   <img src={option.icon} alt={option.title} className="w-14 h-14 object-contain mx-auto" />
//                 </div>

//                 {/* Text */}
//                 <h3 className="font-semibold text-gray-900 text-base mb-2">{option.title}</h3>
//                 <p className="text-sm text-gray-500 leading-relaxed">{option.description}</p>
//               </button>
//             );
//           })}
//         </div>

//         {/* Actions */}
//         <div className="flex flex-col items-center gap-4" style={{ width: "500px" }}>
//           <button
//             onClick={handleContinue}
//             className="w-full py-4 rounded-3xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] border-none cursor-pointer"
//             style={{ background: "#002FA7" }}
//           >
//             Continue
//           </button>
//           <button
//             onClick={() => navigate("/dashboard")}
//             className="text-sm font-medium hover:underline bg-transparent border-none cursor-pointer"
//             style={{ color: "#002FA7" }}
//           >
//             Skip
//           </button>
//         </div>

//       </main>
//     </div>
//   );
// }

/**
 * ChoosePath.jsx — no API calls, pure navigation
 * Receives email from router state (set by SignUp's OTP step)
 */
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Info } from "lucide-react";
import GlassLogo from "../../assets/Glass.webp";
import CreateCommunityIcon from "../../assets/auth/create-community.webp";
import JoinCommunityIcon from "../../assets/auth/join-community.webp";
import Background from "../../assets/background.webp";

export default function ChoosePath() {
  const navigate = useNavigate();
  const location = useLocation();
  const email    = location.state?.email ?? "";
  const [selected, setSelected] = useState("create");

  const options = [
    { id: "create", title: "Create Community",
      description: "No existing members or records. Start building your community on Glass.",
      icon: CreateCommunityIcon },
    { id: "join",   title: "Join Community",
      description: "Your community already exists. Join Now.",
      icon: JoinCommunityIcon },
  ];

  const handleContinue = () => {
    if (selected === "create") {
      navigate("/onboarding/paying-member", { state: { email } });
    } else {
      navigate("/check-email", { state: { email } });
    }
  };

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ backgroundImage: `url(${Background})`, backgroundSize: "contain", backgroundPosition: "center" }}
    >
      <header className="flex items-center px-8 py-5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={GlassLogo} alt="Glass" className="w-7 h-7 object-contain" />
          <span className="font-bold text-gray-900 text-base">Glass</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8 pb-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">What would you like to do?</h1>
          <p className="text-sm text-gray-500">Are you setting up a community, or joining one you've been invited to?</p>
        </div>

        <div className="flex gap-5 mb-8 items-stretch">
          {options.map((option) => {
            const isSelected = selected === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                className="relative flex flex-col items-center text-center px-10 py-8 rounded-2xl transition-all duration-200 cursor-pointer"
                style={{
                  width: 380,
                  border: isSelected ? "2px solid #002FA7" : "2px solid #E5E5E5",
                  background: isSelected ? "white" : "#FAFAFA",
                }}
              >
                <div className="absolute top-4 left-4">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#002FA7" }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2" style={{ borderColor: "#C2C2C2" }} />
                  )}
                </div>
                <div className="mt-6 mb-5">
                  <img src={option.icon} alt={option.title} className="w-14 h-14 object-contain mx-auto" />
                </div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">{option.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{option.description}</p>
              </button>
            );
          })}
        </div>

        <div className="flex items-start gap-1.5 mb-6" style={{ width: 500 }}>
          <Info size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-snug text-left">
            This choice isn't final — whichever option you pick now, you can still create or join additional communities later from your dashboard.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4" style={{ width: 500 }}>
          <button
            onClick={handleContinue}
            className="w-full py-4 rounded-3xl text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all border-none cursor-pointer"
            style={{ background: "#002FA7" }}
          >
            Continue
          </button>
          <button
            onClick={() => navigate("/dashboard/home")}
            className="text-sm font-medium hover:underline bg-transparent border-none cursor-pointer"
            style={{ color: "#002FA7" }}
          >
            Skip
          </button>
        </div>
      </main>
    </div>
  );
}