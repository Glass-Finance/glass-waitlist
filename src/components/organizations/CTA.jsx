import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Overlay from "../../assets/Overlay2.png";
import CTAImage from "../../assets/CTA.png";

export default function CTA() {
  const navigate = useNavigate();
  const itemsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1 },
    );
    itemsRef.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // const anim = (i, delay = 0) => ({
  //   ref: (el) => (itemsRef.current[i] = el),
  //   style: {
  //     opacity: 0,
  //     transform: "translateY(24px)",
  //     transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
  //   },
  // });

  return (
    <section className="bg-[#F7F8FC] py-12 px-6">
      <div
        className="relative inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${Overlay})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.6,
        }}
      />
      <div className="max-w-[1140px] mx-auto bg-[#0d1a6e] rounded-3xl px-10 py-14 flex flex-col md:flex-row items-center gap-10 lg:gap-16 overflow-hidden relative">
        {/* Left — text + button */}
        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-start gap-4 mb-5">
            <h2 className="text-[clamp(36px,3.5vw,42px)] font-bold text-white leading-tight max-w-[720px]">
              Bring clarity to your community finances.
            </h2>
            {/* Decorative star */}
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              className="flex-shrink-0 mt-1 text-white"
            >
              <line
                x1="18"
                y1="0"
                x2="18"
                y2="36"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="0"
                y1="18"
                x2="36"
                y2="18"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="3"
                y1="3"
                x2="33"
                y2="33"
                stroke="currentColor"
                strokeWidth="1"
                strokeOpacity="0.5"
              />
              <line
                x1="33"
                y1="3"
                x2="3"
                y2="33"
                stroke="currentColor"
                strokeWidth="1"
                strokeOpacity="0.5"
              />
            </svg>
          </div>

          <p className="text-[15px] text-white/60 leading-relaxed mb-8 max-w-[300px]">
            Simplify payments. Eliminate follow-ups.
          </p>

          <button
            onClick={() => navigate("/waitlist")}
            className="inline-flex items-center gap-2 bg-white text-[#0f1d6e] font-semibold text-[15px] px-7 py-3.5 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-xl shadow-lg shadow-black/20"
          >
            Join Our Waitlist →
          </button>
        </div>

        {/* Right — image */}
        <div className="flex-shrink-0 w-full md:w-[420px] relative z-10">
          <img
            src={CTAImage}
            alt="Glass community finance"
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    </section>
  );
}
