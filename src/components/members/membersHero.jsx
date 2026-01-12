import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";

export default function MembersHero() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative pt-0 min-h-screen overflow-hidden">
      {/* FIXED: Changed from 'fixed' to 'absolute' - now contained to this component only */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-[#F5F5F6] via-[#F5F5F6]/80 to-transparent" />

        <div
          className="absolute w-[700px] h-[700px] md:w-[800px] md:h-[800px] rounded-full opacity-50 md:opacity-60 -bottom-[100px] left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:translate-x-0 md:top-[20%] md:left-[10%] transition-all duration-1000 animate-pulse"
          style={{
            background:
              "radial-gradient(circle, #17A1E5 0%, rgba(23, 161, 229, 0) 70%)",
            filter: "blur(100px)",
            animationDuration: "4s",
          }}
        />

        <div className="absolute right-0 top-0 h-full flex justify-end overflow-hidden">
          {[...Array(7)].map((_, i) => (
            <div
              key={`right-${i}`}
              className="relative opacity-0 animate-fadeIn"
              style={{
                width: "103px",
                height: "100%",
                animationDelay: `${i * 0.1}s`,
                animationFillMode: "forwards",
              }}
            >
              <div
                className="absolute inset-0 transition-transform duration-500"
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
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Left Content */}
          <div className="space-y-6 font-sans">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-[10px] bg-[rgba(45,156,219,0.20)] px-[13px] py-[9px] rounded-full backdrop-blur-sm mt-4 md:mt-0 hover:scale-105 transition-all duration-300 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: "0.1s" }}
            >
              <div className="w-2 h-2 bg-[#0E628C] rounded-full animate-pulse" />
              <span className="text-[13px] font-medium text-[#0E628C]">
                Habeeb **** just signed up!
              </span>
            </div>

            {/* Hero Heading */}
            <h1
              className={`leading-[40px] md:leading-[80px] transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: "0.2s" }}
            >
              <span className="block text-[40px] md:text-[70px] font-medium text-black font-dm">
                Pay your dues
              </span>
              <span className="block text-[40px] md:text-[70px] font-medium text-black font-playfair italic font-normal">
                Effortlessly
              </span>
            </h1>

            {/* Subheading */}
            <p
              className={`text-[14px] md:text-[18px] font-medium text-[#808080] leading-[25px] md:leading-normal max-w-xl transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: "0.3s" }}
            >
              Stop sending screenshots of receipts. Get instant proof of
              payment, track your history, and never miss a deadline again.
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex items-center gap-2 pt-2 transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: "0.4s" }}
            >
              <button
                onClick={() => navigate("/waitlist")}
                className="bg-[#17A1E5] hover:bg-[#0E628C] text-white px-3 py-2 rounded-[6px] text-[14px] font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-[#17A1E5]/30 hover:scale-105 hover:-translate-y-1 whitespace-nowrap"
              >
                Make Your First Payment
              </button>

              <button className="group flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[14px] font-medium text-black hover:bg-black/5 transition-all duration-300 whitespace-nowrap">
                See Your Dashboard
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>

            {/* Compliance Badge */}
            <div
              className={`flex items-center gap-2 pt-2 font-sans transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: "0.5s" }}
            >
              <Lock className="w-[15px] h-[12px] md:w-[18px] md:h-[18px] text-[#808080] stroke-[2.5px]" />
              <span className="text-[14px] md:text-[15px] font-medium text-[#808080]">
                NDPR Compliant
              </span>
            </div>
          </div>

          {/* Right Content - Mobile Phone Mockup */}
          <div className="relative pt-2 lg:pt-0 lg:-mt-12 flex justify-center lg:justify-end min-h-[500px]">
            <div className="relative z-10">
              <img
                src="/Artboard.png"
                alt="Member Dashboard"
                className="w-full max-w-[350px] lg:max-w-[600px] xl:max-w-[800px] h-auto object-contain hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </section>
  );
}