// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Lock, ArrowRight } from "lucide-react";
// import AnimatedDashboard from "./../AnimatedDashboard";

// export default function Hero() {
//   const navigate = useNavigate();
//   const [isVisible, setIsVisible] = useState(false);

//   useEffect(() => {
//     setIsVisible(true);
//   }, []);

//   return (
//     <section className="relative pt-0 min-h-screen overflow-hidden">
//       {/* Fixed Background Effects - using fixed positioning */}
//       <div className="absolute inset-0 pointer-events-none z-0">
//         {/* Bottom gradient fade to match bg */}
//         <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-[#F5F5F6] via-[#F5F5F6]/80 to-transparent" />

//         {/* Blue gradient blur - fixed position */}
//         <div
//           className="absolute w-[700px] h-[700px] md:w-[800px] md:h-[800px] rounded-full opacity-50 md:opacity-60 -bottom-[100px] left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:translate-x-0 md:top-[20%] md:right-[10%] transition-all duration-1000 animate-pulse"
//           style={{
//             background:
//               "radial-gradient(circle, #17A1E5 0%, rgba(23, 161, 229, 0) 70%)",
//             filter: "blur(100px)",
//             animationDuration: "4s",
//           }}
//         />

//         {/* Vertical lines - animated entrance with proper positioning */}
//         <div className="absolute right-0 top-0 h-screen flex justify-end overflow-hidden">
//           {[...Array(7)].map((_, i) => (
//             <div
//               key={`right-${i}`}
//               className="relative opacity-0 animate-fadeIn"
//               style={{
//                 width: "103px",
//                 height: "100vh",
//                 animationDelay: `${i * 0.1}s`,
//                 animationFillMode: "forwards",
//               }}
//             >
//               <div
//                 className="absolute inset-0 transition-transform duration-500"
//                 style={{
//                   background:
//                     "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.05) 40%, rgba(255,255,255,0) 60%)",
//                   borderLeft: "1.5px solid rgba(255,255,255,0.15)",
//                   transform: `translateY(${-300 + i * 20}px)`,
//                 }}
//               />
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="max-w-[1280px] mx-auto mt-8 px-7 md:px-12 pt-8 md:pt-20 relative z-10">
//         <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-start">
//           {/* Left Content - stagger animations */}
//           <div className="space-y-6 font-sans">
//             {/* Badge */}
//             <div
//               className={`inline-flex items-center gap-[10px] bg-[rgba(45,156,219,0.20)] px-[13px] py-[9px] rounded-full backdrop-blur-sm mt-4 md:mt-0 hover:scale-105 transition-all duration-300 ${
//                 isVisible
//                   ? "opacity-100 translate-y-0"
//                   : "opacity-0 translate-y-10"
//               }`}
//               style={{ transitionDelay: "0.1s" }}
//             >
//               <div className="w-2 h-2 bg-[#0E628C] rounded-full animate-pulse" />
//               <span className="text-[13px] font-medium text-[#0E628C]">
//                 10+ communities just signed up!
//               </span>
//             </div>

//             {/* Hero Heading */}
//             <h1
//               className={`leading-[40px] md:leading-[80px] transition-all duration-700 ${
//                 isVisible
//                   ? "opacity-100 translate-y-0"
//                   : "opacity-0 translate-y-10"
//               }`}
//               style={{ transitionDelay: "0.2s" }}
//             >
//               <span className="block md:inline text-[40px] md:text-[70px] font-medium text-black font-dm whitespace-nowrap">
//                 Community
//               </span>
//               <span className="block md:inline text-[40px] md:text-[70px] font-medium text-black font-dm md:ml-3">
//                 <span className="md:hidden">Finance</span>
//                 <span className="hidden md:inline">finance</span>
//               </span>
//               <span className="block text-[40px] md:text-[80px] font-medium text-black font-dm whitespace-nowrap">
//                 Crystal{" "}
//                 <span className="font-playfair italic font-normal">Clear</span>
//               </span>
//             </h1>

//             {/* Subheading */}
//             <p
//               className={`text-[14px] md:text-[18px] font-medium text-[#808080] leading-[25px] md:leading-normal max-w-xl transition-all duration-700 ${
//                 isVisible
//                   ? "opacity-100 translate-y-0"
//                   : "opacity-0 translate-y-10"
//               }`}
//               style={{ transitionDelay: "0.3s" }}
//             >
//               <span className="md:hidden">
//                 Save 15-20 hours monthly chasing payments.
//                 <br />
//                 The transparent way for Nigerian associations,
//                 <br />
//                 clubs, and schools to manage funds.
//               </span>
//               <span className="hidden md:inline">
//                 Save 15-20 hours monthly chasing payments. The transparent way
//                 <br />
//                 for Nigerian associations, clubs, and schools to manage funds.
//               </span>
//             </p>

//             {/* CTA Buttons */}
//             <div
//               className={`flex items-center gap-2 pt-2 transition-all duration-700 ${
//                 isVisible
//                   ? "opacity-100 translate-y-0"
//                   : "opacity-0 translate-y-10"
//               }`}
//               style={{ transitionDelay: "0.4s" }}
//             >
//               <button
//                 onClick={() => navigate("/waitlist")}
//                 className="bg-[#17A1E5] hover:bg-[#0E628C] text-white px-3 py-2 rounded-[6px] text-[14px] font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-[#17A1E5]/30 hover:scale-105 hover:-translate-y-1 whitespace-nowrap"
//               >
//                 Join the Waitlist
//               </button>

//               <button className="group flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[14px] font-medium text-black hover:bg-black/5 transition-all duration-300 whitespace-nowrap">
//                 See How It Works
//                 <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
//               </button>
//             </div>

//             {/* Compliance Badge */}
//             <div
//               className={`flex items-center gap-2 pt-2 font-sans transition-all duration-700 ${
//                 isVisible
//                   ? "opacity-100 translate-y-0"
//                   : "opacity-0 translate-y-10"
//               }`}
//               style={{ transitionDelay: "0.5s" }}
//             >
//               <Lock className="w-[15px] h-[12px] md:w-[18px] md:h-[18px] text-[#808080] stroke-[2.5px]" />
//               <span className="text-[14px] md:text-[15px] font-medium text-[#808080]">
//                 NDPR Compliant
//               </span>
//             </div>
//           </div>

//           {/* Right Content - Layered: Animated Dashboard Behind Welcome Image */}
//           <div className="relative pt-2 lg:pt-0 lg:-mt-12 flex justify-center lg:justify-end min-h-[500px]">
//             {/* Background Layer: Animated Dashboard (Transparent, Positioned Right) */}
//             <div className="hidden lg:block absolute top-0 right-0 w-[400px] h-[500px] opacity-80 translate-x-12">
//               <AnimatedDashboard transparent={true} />
//             </div>

//             {/* Foreground Layer: Welcome Image */}
//             <div className="relative z-10">
//               <img
//                 src="/Artboard.png"
//                 alt="Community Finance App"
//                 className="w-full max-w-[350px] lg:max-w-[600px] xl:max-w-[800px] h-auto object-contain hover:scale-105 transition-transform duration-500"
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       <style jsx>{`
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//           }
//           to {
//             opacity: 1;
//           }
//         }
//         .animate-fadeIn {
//           animation: fadeIn 0.8s ease-out;
//         }
//       `}</style>
//     </section>
//   );
// }

import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import { Reveal } from "../Reveal";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center pt-[68px] overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #0d1022 0%, #0f1228 30%, #130d22 60%, #1a0a2e 80%, #2a0a3a 100%)",
      }}
    >
      {/* ── Static glow blobs matching the screenshot ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Bottom-center purple/magenta glow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px]"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 100%, #6b0f6b 0%, #3d0a4a 40%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        {/* Bottom-left warm rose tint */}
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[300px]"
          style={{
            background:
              "radial-gradient(ellipse at bottom left, #7a0a5a 0%, transparent 60%)",
            filter: "blur(80px)",
            opacity: 0.5,
          }}
        />
        {/* Very subtle top-center deep blue */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px]"
          style={{
            background:
              "radial-gradient(ellipse at top, #0d1840 0%, transparent 65%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* ── Subtle animated glass shimmer ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.035]"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 65%)",
            filter: "blur(40px)",
            animation: "glassFloat1 12s ease-in-out infinite",
            top: "10%",
            left: "20%",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.025]"
          style={{
            background:
              "radial-gradient(circle, rgba(200,180,255,0.9) 0%, transparent 65%)",
            filter: "blur(50px)",
            animation: "glassFloat2 16s ease-in-out infinite",
            bottom: "15%",
            right: "15%",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-[720px] mx-auto text-center px-6 py-16">
        <Reveal variant="up" delay={80}>
          <h1 className="text-[clamp(44px,7.5vw,72px)] font-extrabold text-white leading-[1.05] tracking-tight mb-6">
            Community finance
            <br />
            <span className="text-white bg-clip-text">Crystal Clear</span>
          </h1>
        </Reveal>

        <Reveal variant="up" delay={160}>
          <p className="text-[16px] text-white/55 leading-relaxed max-w-[500px] mx-auto mb-10">
            Save 15–20 hours monthly chasing payments. The transparent way for
            Nigerian associations, clubs, and schools to manage funds.
          </p>
        </Reveal>

        <Reveal variant="up" delay={240}>
          <button
            onClick={() => navigate("/waitlist")}
            className="inline-flex items-center gap-2 bg-white text-[#0d1022] text-[15px] px-8 py-3.5 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/20 shadow-lg shadow-black/30"
          >
            Join Our Waitlist
            <ArrowRight className="w-4 h-4" />
          </button>
        </Reveal>
      </div>

      {/* Scroll indicator */}
      {/* <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/25 text-[10px] tracking-[0.2em] uppercase">
        <div
          className="w-px h-10 bg-gradient-to-b from-white/25 to-transparent"
          style={{ animation: "scrollline 2.2s ease-in-out infinite" }}
        />
        scroll
      </div> */}

      <style>{`
        @keyframes scrollline {
          0%   { opacity: 0; transform: scaleY(0); transform-origin: top; }
          50%  { opacity: 1; transform: scaleY(1); transform-origin: top; }
          100% { opacity: 0; transform: scaleY(1); transform-origin: bottom; }
        }
        @keyframes glassFloat1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33%       { transform: translate(40px, -30px) scale(1.05); }
          66%       { transform: translate(-20px, 20px) scale(0.97); }
        }
        @keyframes glassFloat2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          40%       { transform: translate(-35px, -25px) scale(1.08); }
          70%       { transform: translate(25px, 15px) scale(0.95); }
        }
      `}</style>
    </section>
  );
}
