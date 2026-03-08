// import React, { useState, useEffect } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import { ChevronDown, ChevronRight, Menu, X, Search } from "lucide-react";

// export default function Navbar() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [scrolled, setScrolled] = useState(false);

//   // Determine active view based on current route
//   const viewMode = location.pathname === "/members" ? "members" : "organizations";

//   // Handle scroll effect
//   useEffect(() => {
//     const handleScroll = () => {
//       const isScrolled = window.scrollY > 20;
//       if (isScrolled !== scrolled) {
//         setScrolled(isScrolled);
//       }
//     };

//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, [scrolled]);

//   const handleViewModeChange = (mode) => {
//     if (mode === "organizations") {
//       navigate("/");
//     } else if (mode === "members") {
//       navigate("/members");
//     }
//   };

//   return (
//     <nav
//       className={`fixed top-0 left-0 right-0 z-50 h-[60px] font-sans transition-all duration-300 ${
//         scrolled
//           ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200"
//           : "bg-transparent"
//       }`}
//     >
//       <div className="max-w-[1280px] mx-auto px-7 lg:px-12 h-full flex items-center justify-between">
//         {/* Logo */}
//         <div className="flex items-center gap-4">
//           <Link to="/" className="w-[34px] h-[34px] rounded-sm">
//             <img
//               src="/Glass.png"
//               alt="Glass Logo"
//               className="w-[34px] h-[34px]"
//             />
//           </Link>

//           {/* Toggle Pill - Hidden on mobile */}
//           <div className="hidden lg:flex bg-[#EAEAEA] rounded-full p-[2px] items-center">
//             <button
//               onClick={() => handleViewModeChange("organizations")}
//               className={`px-[13px] py-[9px] rounded-full text-[15px] font-medium transition-all ${
//                 viewMode === "organizations"
//                   ? "bg-[#17A1E5] text-white"
//                   : "text-[#667085]"
//               }`}
//             >
//               Organizations
//             </button>
//             <button
//               onClick={() => handleViewModeChange("members")}
//               className={`px-[13px] py-[9px] rounded-full text-[15px] font-medium transition-all ${
//                 viewMode === "members"
//                   ? "bg-[#17A1E5] text-white"
//                   : "text-[#667085]"
//               }`}
//             >
//               Members
//             </button>
//           </div>
//         </div>

//         {/* Nav Links - Hidden on mobile */}
//         <div className="hidden lg:flex items-center gap-[25px]">
//           <div className="flex items-center gap-[6px] cursor-pointer group">
//             <span className="text-[15px] font-medium text-[#808080] group-hover:text-black transition-colors">
//               Product
//             </span>
//             <ChevronDown className="w-[10px] h-[10px] text-[#808080] group-hover:text-black transition-colors" />
//           </div>

//           <div className="flex items-center gap-[6px] cursor-pointer group">
//             <span className="text-[15px] font-medium text-[#808080] group-hover:text-black transition-colors">
//               Use Cases
//             </span>
//             <ChevronDown className="w-[10px] h-[10px] text-[#808080] group-hover:text-black transition-colors" />
//           </div>

//           <button className="text-[15px] font-medium text-[#808080] hover:text-black transition-colors">
//             Contact Us
//           </button>

//           <button
//             onClick={() => navigate("/ambassadors")}
//             className="text-[15px] font-medium text-[#808080] hover:text-black transition-colors"
//           >
//             Ambassadors
//           </button>

//           {/* Conditional CTA Button based on viewMode */}
//           {viewMode === "organizations" ? (
//             <button
//               onClick={() => navigate("/waitlist")}
//               className="bg-[#17A1E5] hover:bg-[#0E628C] text-white px-[13px] py-[9px] rounded-[6px] text-[15px] font-semibold transition-colors flex items-center gap-2"
//             >
//               Join Waitlist
//               <ChevronRight className="w-4 h-4" />
//             </button>
//           ) : (
//             <button
//               onClick={() => navigate("/find-community")}
//               className="bg-[#17A1E5] hover:bg-[#0E628C] text-white px-[13px] py-[9px] rounded-[6px] text-[15px] font-semibold transition-colors flex items-center gap-2"
//             >
//               Find My Community
//               <Search className="w-4 h-4" />
//             </button>
//           )}
//         </div>

//         {/* Mobile Menu Button */}
//         <button
//           onClick={() => setMenuOpen(!menuOpen)}
//           className="lg:hidden p-2 hover:bg-black/5 rounded-lg transition-colors"
//         >
//           {menuOpen ? (
//             <X className="w-6 h-6 text-black" />
//           ) : (
//             <Menu className="w-6 h-6 text-black" />
//           )}
//         </button>
//       </div>

//       {/* Mobile Dropdown Menu */}
//       {menuOpen && (
//         <div className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-b border-gray-200">
//           <div className="px-7 py-4 space-y-4">
//             {/* Toggle Pill for Mobile */}
//             <div className="bg-[#EAEAEA] rounded-full p-[2px] flex items-center w-full">
//               <button
//                 onClick={() => {
//                   handleViewModeChange("organizations");
//                   setMenuOpen(false);
//                 }}
//                 className={`flex-1 px-[13px] py-[9px] rounded-full text-[15px] font-medium transition-all ${
//                   viewMode === "organizations"
//                     ? "bg-[#17A1E5] text-white"
//                     : "text-[#667085]"
//                 }`}
//               >
//                 Organizations
//               </button>
//               <button
//                 onClick={() => {
//                   handleViewModeChange("members");
//                   setMenuOpen(false);
//                 }}
//                 className={`flex-1 px-[13px] py-[9px] rounded-full text-[15px] font-medium transition-all ${
//                   viewMode === "members"
//                     ? "bg-[#17A1E5] text-white"
//                     : "text-[#667085]"
//                 }`}
//               >
//                 Members
//               </button>
//             </div>

//             <div className="space-y-3 pt-2">
//               <div className="flex items-center justify-between py-2 cursor-pointer">
//                 <span className="text-[15px] font-medium text-[#808080]">Product</span>
//                 <ChevronDown className="w-4 h-4 text-[#808080]" />
//               </div>

//               <div className="flex items-center justify-between py-2 cursor-pointer">
//                 <span className="text-[15px] font-medium text-[#808080]">Use Cases</span>
//                 <ChevronDown className="w-4 h-4 text-[#808080]" />
//               </div>

//               <button className="block w-full text-left py-2 text-[15px] font-medium text-[#808080] hover:text-black transition-colors">
//                 Contact Us
//               </button>

//               <button
//                 onClick={() => {
//                   navigate("/ambassadors");
//                   setMenuOpen(false);
//                 }}
//                 className="block w-full text-left py-2 text-[15px] font-medium text-[#808080] hover:text-black transition-colors"
//               >
//                 Ambassadors
//               </button>

//               {/* Conditional CTA Button for Mobile */}
//               {viewMode === "organizations" ? (
//                 <button
//                   onClick={() => {
//                     navigate("/waitlist");
//                     setMenuOpen(false);
//                   }}
//                   className="w-full bg-[#17A1E5] hover:bg-[#0E628C] text-white px-[13px] py-[9px] rounded-[6px] text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 mt-4"
//                 >
//                   Join Waitlist
//                   <ChevronRight className="w-4 h-4" />
//                 </button>
//               ) : (
//                 <button
//                   onClick={() => {
//                     navigate("/find-community");
//                     setMenuOpen(false);
//                   }}
//                   className="w-full bg-[#17A1E5] hover:bg-[#0E628C] text-white px-[13px] py-[9px] rounded-[6px] text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 mt-4"
//                 >
//                   Find My Community
//                   <Search className="w-4 h-4" />
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </nav>
//   );
// }

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Search, Menu, X } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const viewMode = location.pathname === "/members" ? "members" : "organizations";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleViewModeChange = (mode) => {
    if (mode === "organizations") navigate("/");
    else if (mode === "members") navigate("/members");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-[68px] transition-all duration-300 ${
        scrolled
          ? "bg-[#07091F]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_30px_rgba(0,0,0,0.4)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-8 lg:px-12 h-full flex items-center justify-between gap-6">

        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2.5 no-underline shrink-0">
          <img src="/Glass.png" alt="Glass" className="w-8 h-8" />
          <span className="font-bold text-[17px] text-white tracking-tight">Glass</span>
        </Link>

        {/* ── Toggle Pill (desktop) ── */}
        <div className="hidden lg:flex bg-white/[0.07] border border-white/[0.1] rounded-full p-[3px] items-center gap-0.5 backdrop-blur-sm">
          <button
            onClick={() => handleViewModeChange("organizations")}
            className={`px-4 py-2 rounded-full text-[13.5px] font-semibold transition-all duration-200 ${
              viewMode === "organizations"
                ? "bg-white text-[#0B0F2E] shadow-sm"
                : "text-white/55 hover:text-white/80"
            }`}
          >
            Organizations
          </button>
          <button
            onClick={() => handleViewModeChange("members")}
            className={`px-4 py-2 rounded-full text-[13.5px] font-semibold transition-all duration-200 ${
              viewMode === "members"
                ? "bg-white text-[#0B0F2E] shadow-sm"
                : "text-white/55 hover:text-white/80"
            }`}
          >
            Members
          </button>
        </div>

        {/* ── Nav Links (desktop) ── */}
        <div className="hidden lg:flex items-center gap-7">
          <button className="flex items-center gap-1 text-[13.5px] text-white hover:text-white/55 transition-colors font-medium">
            Use Cases <ChevronDown className="w-3.5 h-3.5 mt-px" />
          </button>
          <button className="text-[13.5px] text-white hover:text-white/55 transition-colors font-medium">
            Contact Us
          </button>
          <button
            onClick={() => navigate("/ambassadors")}
            className="text-[13.5px] text-white hover:text-white/55 transition-colors font-medium"
          >
            Ambassadors
          </button>
        </div>

        {/* ── CTA ── */}
        <div className="hidden lg:flex items-center shrink-0">
          {viewMode === "organizations" ? (
            <button
              onClick={() => navigate("/waitlist")}
              className="flex items-center gap-1.5 bg-white text-[#0B0F2E] px-5 py-2.5 rounded-full text-[13.5px] font-bold transition-all hover:opacity-90 hover:-translate-y-px shadow-lg shadow-black/20"
            >
              Join Our Waitlist
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => navigate("/find-community")}
              className="flex items-center gap-1.5 bg-white text-[#0B0F2E] px-5 py-2.5 rounded-full text-[13.5px] font-bold transition-all hover:opacity-90 hover:-translate-y-px shadow-lg shadow-black/20"
            >
              Find My Community
              <Search className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 text-white/70 hover:text-white transition-colors"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile Dropdown ── */}
      {menuOpen && (
        <div className="lg:hidden bg-[#0B0F2E]/98 backdrop-blur-xl border-b border-white/[0.08]">
          <div className="px-6 py-5 space-y-4">
            {/* Toggle pill mobile */}
            <div className="bg-white/[0.07] border border-white/[0.1] rounded-full p-[3px] flex">
              <button
                onClick={() => { handleViewModeChange("organizations"); setMenuOpen(false); }}
                className={`flex-1 px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                  viewMode === "organizations" ? "bg-white text-[#0B0F2E]" : "text-white/55"
                }`}
              >
                Organizations
              </button>
              <button
                onClick={() => { handleViewModeChange("members"); setMenuOpen(false); }}
                className={`flex-1 px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                  viewMode === "members" ? "bg-white text-[#0B0F2E]" : "text-white/55"
                }`}
              >
                Members
              </button>
            </div>

            <div className="space-y-1 pt-1">
              {["Use Cases", "Contact Us", "Ambassadors"].map((item) => (
                <button
                  key={item}
                  className="flex items-center justify-between w-full py-3 text-[14px] font-medium text-white/60 hover:text-white transition-colors border-b border-white/[0.05]"
                >
                  {item}
                  {item === "Use Cases" && <ChevronDown className="w-4 h-4" />}
                </button>
              ))}
            </div>

            {viewMode === "organizations" ? (
              <button
                onClick={() => { navigate("/waitlist"); setMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 bg-white text-[#0B0F2E] py-3 rounded-full text-[14px] font-bold"
              >
                Join Our Waitlist <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => { navigate("/find-community"); setMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 bg-white text-[#0B0F2E] py-3 rounded-full text-[14px] font-bold"
              >
                Find My Community <Search className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}