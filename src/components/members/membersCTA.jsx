import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function MembersCTA() {
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

  const anim = (i, delay = 0) => ({
    ref: (el) => (itemsRef.current[i] = el),
    style: {
      opacity: 0,
      transform: "translateY(24px)",
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    },
  });

  return (
    <section
      className="bg-[#0d1a6e] relative pt-20 md:pt-28 overflow-hidden"
      // style={{
      //   background: "linear-gradient(160deg, #0c1230 0%, #0f1640 50%, #121b55 100%)",
      // }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(30,50,160,0.35) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-[860px] mx-auto px-6 text-center">
        {/* Headline */}
        <div {...anim(0, 0)}>
          <h2 className="text-[clamp(30px,5vw,54px)] font-extrabold text-white leading-tight tracking-tight mb-5">
            Stop chasing payments.
            <br />
            Start building your Community.
          </h2>
        </div>

        {/* Subtext */}
        <div {...anim(1, 100)}>
          <p className="text-[16px] text-white/60 max-w-[420px] mx-auto leading-relaxed mb-10">
            Join 10+ communities already using Glass.
          </p>
        </div>

        {/* Single CTA */}
        <div {...anim(2, 200)}>
          <button
            onClick={() => navigate("/find-community")}
            className="inline-flex items-center gap-2 bg-white text-[#0f1640] text-[15px] px-8 py-3.5 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/20 shadow-lg shadow-black/20"
          >
            Join Our Waitlist
          </button>
        </div>
      </div>
    </section>
  );
}
