import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";

export default function MembersHero() {
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
      { threshold: 0.1 }
    );

    itemsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const animItem = (index, delay = 0) => ({
    ref: (el) => (itemsRef.current[index] = el),
    style: {
      opacity: 0,
      transform: "translateY(24px)",
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    },
  });

  return (
    <section
      className="relative min-h-screen flex flex-col justify-center pt-[68px] overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #0c1020 0%, #0e1128 30%, #120d24 60%, #1d0b32 80%, #2e0a44 100%)",
      }}
    >
      {/* ── Glow blobs ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div
          className="absolute bottom-0 right-0 w-[800px] h-[500px]"
          style={{
            background: "radial-gradient(ellipse at bottom right, #7a1090 0%, #4a0860 40%, transparent 65%)",
            filter: "blur(70px)",
            opacity: 0.9,
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[350px]"
          style={{
            background: "radial-gradient(ellipse at bottom left, #6b0f7a 0%, transparent 60%)",
            filter: "blur(80px)",
            opacity: 0.7,
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px]"
          style={{
            background: "radial-gradient(ellipse at bottom, #5a0870 0%, transparent 55%)",
            filter: "blur(90px)",
            opacity: 0.5,
          }}
        />
      </div>

      {/* ── Glass shimmer ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[550px] h-[550px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 65%)",
            filter: "blur(45px)",
            opacity: 0.03,
            animation: "glassFloat1 14s ease-in-out infinite",
            top: "15%",
            right: "20%",
          }}
        />
        <div
          className="absolute w-[350px] h-[350px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(210,180,255,0.9) 0%, transparent 65%)",
            filter: "blur(55px)",
            opacity: 0.025,
            animation: "glassFloat2 18s ease-in-out infinite",
            top: "40%",
            left: "10%",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-8 lg:px-16 py-20">
        <div className="max-w-[600px]">

          <h1
            {...animItem(0, 80)}
            className="text-[clamp(44px,7vw,70px)] font-extrabold text-white leading-[1.05] tracking-tight mb-6"
          >
            Pay Your Dues
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(90deg, #c8b8ff 0%, #b8a8f8 50%, #a0c8ff 100%)",
              }}
            >
              Effortlessly
            </span>
          </h1>

          <p
            {...animItem(1, 200)}
            className="text-[16px] text-white/55 leading-relaxed max-w-[480px] mb-10"
          >
            Stop sending screenshots of receipts. Get instant proof of payment,
            track your history, and never miss a deadline again.
          </p>

          <div {...animItem(2, 320)}>
            <button
              onClick={() => navigate("/waitlist")}
              className="inline-flex items-center gap-2 bg-white text-[#0c1020] text-[15px] px-8 py-3.5 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/20 shadow-lg shadow-black/30"
            >
              Join Our Waitlist
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
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
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(-40px, -25px) scale(1.06); }
          66%       { transform: translate(25px, 20px) scale(0.96); }
        }
        @keyframes glassFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40%       { transform: translate(30px, -30px) scale(1.07); }
          70%       { transform: translate(-20px, 18px) scale(0.94); }
        }
      `}</style>
    </section>
  );
}