import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Menu, X } from "lucide-react";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="relative pt-0 min-h-screen overflow-hidden bg-[#F5F5F6]">
      {/* Complex Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Bottom gradient fade to white */}
        <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-white via-white/80 to-transparent z-10" />

        {/* Blue gradient blur (bottom center on mobile, top right on desktop) */}
        <div
          className="absolute w-[700px] h-[700px] md:w-[800px] md:h-[800px] rounded-full opacity-50 md:opacity-60 -bottom-[100px] left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:translate-x-0 md:top-[20%] md:right-[10%]"
          style={{
            background:
              "radial-gradient(circle, #17A1E5 0%, rgba(23, 161, 229, 0) 70%)",
            filter: "blur(100px)",
          }}
        />

        {/* Vertical lines - Right side (dark to light bottom) */}
        <div className="absolute right-0 top-0 bottom-0 flex justify-end">
          {[...Array(7)].map((_, i) => (
            <div
              key={`right-${i}`}
              className="relative"
              style={{
                width: "103px",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.05) 40%, rgba(255,255,255,0) 60%)",
                  borderLeft: "1.5px solid rgba(255,255,255,0.15)",
                  transform: `translateY(${-300 + i * 20}px)`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto mt-8 px-7 md:px-12 pt-8 md:pt-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-4 md:gap-12 items-start">
          {/* Left Content */}
          <div className="space-y-6 font-sans">
            {/* Badge */}
            <div className="inline-flex items-center gap-[10px] bg-[rgba(45,156,219,0.20)] px-[13px] py-[9px] rounded-full backdrop-blur-sm mt-4 md:mt-0">
              <div className="w-2 h-2 bg-[#0E628C] rounded-full" />
              <span className="text-[13px] font-medium text-[#0E628C]">
                10+ communities just signed up!
              </span>
            </div>

            {/* Hero Heading */}
            <h1 className="leading-[40px] md:leading-[80px]">
              {/* Line 1 - Community (mobile), Community finance (desktop on same line) */}
              <span className="block md:inline text-[40px] md:text-[70px] font-medium text-black font-dm whitespace-nowrap">
                Community
              </span>
              <span className="block md:inline text-[40px] md:text-[70px] font-medium text-black font-dm md:ml-3">
                <span className="md:hidden">Finance</span>
                <span className="hidden md:inline">finance</span>
              </span>

              {/* Line 3 - Crystal Clear (always on same line) */}
              <span className="block text-[40px] md:text-[80px] font-medium text-black font-dm whitespace-nowrap">
                Crystal{" "}
                <span className="font-playfair italic font-normal">Clear</span>
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-[14px] md:text-[18px] font-medium text-[#808080] leading-[25px] md:leading-normal max-w-xl">
              <span className="md:hidden">
                Save 15-20 hours monthly chasing payments.
                <br />
                The transparent way for Nigerian associations,
                <br />
                clubs, and schools to manage funds.
              </span>
              <span className="hidden md:inline">
                Save 15-20 hours monthly chasing payments. The transparent way
                <br />
                for Nigerian associations, clubs, and schools to manage funds.
              </span>
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => navigate("/waitlist")}
                className="bg-[#17A1E5] hover:bg-[#0E628C] text-white px-3 py-2 rounded-[6px] text-[14px] font-semibold transition-all hover:shadow-lg hover:shadow-[#17A1E5]/30 whitespace-nowrap"
              >
                Join the Waitlist
              </button>

              <button className="group flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[14px] font-medium text-black hover:bg-black/5 transition-all whitespace-nowrap">
                See How It Works
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>

            {/* Compliance Badge */}
            <div className="flex items-center gap-2 pt-2 font-sans">
              <Lock className="w-[15px] h-[12px] md:w-[18px] md:h-[18px] text-[#808080] stroke-[2.5px]" />
              <span className="text-[14px] md:text-[15px] font-medium text-[#808080]">
                NDPR Compliant
              </span>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative pt-2 lg:pt-0 lg:-mt-12 flex justify-center lg:justify-end">
            <img
              src="/Artboard.png"
              alt="Community Finance App"
              className="w-full max-w-[350px] lg:max-w-[500px] xl:max-w-[600px] h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
