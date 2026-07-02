// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import logo from "../assets/cta/ctalogo.png";
// import TextType from "./ui/TextType";
// import BlurText from "./ui/BlurText";

// const links = {
//   Product: ["Features", "How It Works", "Pricing", "Integrations"],
//   "Use Cases": [
//     "Schools",
//     "Religious Organizations",
//     "Clubs",
//     "Professional Bodies",
//   ],
//   Resources: ["Help Centre"],
//   Company: ["About", "Team", "Careers", "Contact"],
//   Legal: ["Privacy", "Terms", "Security", "Cookie Policy"],
// };

// export default function Footer() {
//   const [contact, setContact] = useState("");
//   const navigate = useNavigate();

//   return (
//     <footer className="bg-[#0d1a6e] text-white">
//       {/* ── CTA ── */}
//       <div className="relative pt-20 md:pt-28 pb-20 overflow-hidden">
//         <div
//           className="absolute inset-0 pointer-events-none"
//           style={{
//             background:
//               "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(30,50,160,0.35) 0%, transparent 70%)",
//           }}
//         />
//         <div className="relative z-10 max-w-[860px] mx-auto px-6 text-center">
//           <h2 className="text-[clamp(30px,5vw,54px)] font-bold text-white leading-tight tracking-tight mb-5">
//             <BlurText
//               text="Stop chasing payments."
//               delay={80}
//               animateBy="words"
//               direction="top"
//               stepDuration={0.35}
//               centered
//               className="justify-center text-[clamp(30px,5vw,54px)] font-bold text-white leading-tight tracking-tight"
//             />
//             <br />
//             <BlurText
//               text="Start building your Community."
//               delay={120}
//               animateBy="words"
//               direction="top"
//               stepDuration={0.35}
//               centered
//               className="justify-center text-[clamp(30px,5vw,54px)] font-bold text-white leading-tight tracking-tight"
//             />
//           </h2>
//           <p className="text-[16px] text-white/60 max-w-[720px] mx-auto leading-relaxed mb-10">
//             Join 10+ other forward-thinking communities on the waitlist today.
//           </p>
//           <button
//             onClick={() => navigate("/waitlist")}
//             className="inline-flex items-center gap-2 bg-white text-[#0f1640] text-[15px] font-semibold px-8 py-3.5 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/20 shadow-lg shadow-black/20"
//           >
//             Get Started
//           </button>
//         </div>
//       </div>

//       {/* ── Footer content ── */}
//       <div className="max-w-[1140px] mx-auto px-6 pt-14 pb-8">
//         {/* Brand */}
//         <div className="mb-6">
//           <a
//             href="/"
//             className="inline-flex items-center gap-2 no-underline mb-3"
//           >
//             <img src={logo} alt="Glass" className="w-7 h-7" />
//             <span className="font-bold text-[20px] text-white">Glass</span>
//           </a>
//         </div>

//         {/* Nav columns */}
//         <div className="grid grid-cols-2 lg:grid-cols-5 gap-30 mb-12">
//           {Object.entries(links).map(([section, items]) => (
//             <div key={section}>
//               <TextType
//                 text={section}
//                 typingSpeed={50}
//                 loop={false}
//                 showCursor={false}
//                 startOnVisible
//                 className="text-[13px] font-bold text-white mb-4"
//               />
//               <ul className="space-y-2.5 list-none p-0 m-0">
//                 {items.map((item) => (
//                   <li key={item}>
//                     <a
//                       href="#"
//                       className="text-[13px] text-white/60 hover:text-white no-underline transition-colors"
//                     >
//                       {item}
//                     </a>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           ))}
//         </div>

//         {/* Copyright */}
//         <div className="border-t border-white/10 pt-7 text-center">
//           <p className="text-[13px] text-white/50">
//             Copyright © {new Date().getFullYear()} Glass | Made for Nigerian
//             communities
//           </p>
//         </div>
//       </div>
//     </footer>
//   );
// }

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/cta/ctalogo.png";
import BlurText from "./ui/BlurText";

const links = {
  Product: ["Features", "How It Works", "Pricing", "Integrations"],
  "Use Cases": [
    "Schools",
    "Religious Organizations",
    "Clubs",
    "Professional Bodies",
  ],
  Resources: ["Help Centre"],
  Company: ["About", "Team", "Careers", "Contact"],
  Legal: ["Privacy", "Terms", "Security", "Cookie Policy"],
};

export default function Footer() {
  const [contact, setContact] = useState("");
  const navigate = useNavigate();

  return (
    <footer className="bg-[#0d1a6e] text-white">
      {/* ── CTA ── */}
      <div className="relative pt-20 md:pt-28 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(30,50,160,0.35) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-[860px] mx-auto px-6 text-center">
          <h2 className="text-[clamp(30px,5vw,54px)] font-bold text-white leading-tight tracking-tight mb-5">
            <BlurText
              text="Stop chasing payments."
              delay={80}
              animateBy="words"
              direction="top"
              stepDuration={0.35}
              centered
              className="justify-center text-[clamp(30px,5vw,54px)] font-bold text-white leading-tight tracking-tight"
            />
            <br />
            <BlurText
              text="Start building your Community."
              delay={120}
              animateBy="words"
              direction="top"
              stepDuration={0.35}
              centered
              className="justify-center text-[clamp(30px,5vw,54px)] font-bold text-white leading-tight tracking-tight"
            />
          </h2>
          <p className="text-[16px] text-white/60 max-w-[720px] mx-auto leading-relaxed mb-10">
            Join communities already running transparent finances on Glass.
          </p>
          <button
            onClick={() => navigate("/sign-up")}
            className="inline-flex items-center gap-2 bg-white text-[#0f1640] text-[15px] font-semibold px-8 py-3.5 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/20 shadow-lg shadow-black/20"
          >
            Get Started Free
          </button>
        </div>
      </div>

      {/* ── Footer content ── */}
      <div className="max-w-[1140px] mx-auto px-6 pt-14 pb-8">
        {/* Brand */}
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 no-underline mb-3"
          >
            <img src={logo} alt="Glass" className="w-7 h-7" />
            <span className="font-bold text-[20px] text-white">Glass</span>
          </a>
        </div>

        {/* Nav columns */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-30 mb-12">
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <p className="text-[13px] font-bold text-white mb-4">{section}</p>
              <ul className="space-y-2.5 list-none p-0 m-0">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-[13px] text-white/60 hover:text-white no-underline transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-7 text-center">
          <p className="text-[13px] text-white/50">
            Copyright © {new Date().getFullYear()} Glass | Made for Nigerian
            communities
          </p>
        </div>
      </div>
    </footer>
  );
}
