import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CTA() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) navigate("/waitlist", { state: { email } });
  };

  return (
    <div>
      {/* ── TOP: Waitlist signup card ── */}
      <section className="bg-[#F7F8FC] py-12 px-6">
        <div
          {...anim(0, 0)}
          className="max-w-[1140px] mx-auto bg-[#EEF1FB] rounded-3xl px-10 py-12 flex flex-col lg:flex-row items-center gap-10 lg:gap-16"
        >
          {/* Left — text + form */}
          <div className="flex-1 min-w-0">
            {/* Star + title row */}
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-[clamp(24px,3.5vw,38px)] font-extrabold text-[#0f1d6e] leading-tight">
                Join our Waitlist
              </h2>
              {/* Decorative star */}
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                className="flex-shrink-0 text-[#1C2B8A]"
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

            <p className="text-[15px] text-[#6b7280] leading-relaxed mb-8 max-w-[320px]">
              Be the first to know when Glass launches. Early access for
              organisations who sign up now.
            </p>

            {/* Email form */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center bg-white rounded-full shadow-sm border border-[#e5e7eb] overflow-hidden max-w-[460px]"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 px-6 py-3.5 text-[14px] text-[#374151] placeholder-[#9ca3af] outline-none bg-transparent"
              />
              <button
                type="submit"
                className="bg-[#1C2B8A] hover:bg-[#0f1d6e] text-white font-semibold text-[14px] px-6 py-3.5 rounded-full transition-all hover:-translate-y-px flex-shrink-0 m-1"
              >
                Submit
              </button>
            </form>
          </div>

          {/* Right — video embed */}
          <div className="flex-shrink-0 w-full lg:w-[480px]">
            <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-[#1C2B8A]/10 aspect-video bg-[#0d1a6e]">
              <iframe
                src="https://www.youtube.com/embed/xkNFt2UGtEQ"
                title="Watch Pitch Deck"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
              {/* Demo label — pointer-events-none so it doesn't block the iframe */}
              <div className="absolute bottom-3 left-4 text-[11px] font-semibold text-white/70 tracking-widest uppercase pointer-events-none">
                Watch Pitch Deck
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM: Dark navy CTA ── */}
      <section
        className="bg-[#0d1a6e] relative py-20 md:py-28 overflow-hidden"
        // style={{
        //   background: "linear-gradient(160deg, #0c1230 0%, #0f1640 50%, #121b55 100%)",
        // }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(30,50,160,0.35) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-[860px] mx-auto px-6 text-center">
          <div {...anim(1, 0)}>
            <h2 className="text-[clamp(30px,5vw,54px)] font-extrabold text-white leading-tight tracking-tight mb-5">
              Stop chasing payments.
              <br />
              Start building your Community.
            </h2>
          </div>

          <div {...anim(2, 100)}>
            <p className="text-[16px] text-white/60 max-w-[420px] mx-auto leading-relaxed mb-10">
              Join 10+ other forward-thinking communities on the waitlist today.
            </p>
          </div>

          <div {...anim(3, 200)}>
            <button
              onClick={() => navigate("/waitlist")}
              className="inline-flex items-center gap-2 bg-white text-[#0f1640] font-bold text-[15px] px-8 py-3.5 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/20 shadow-lg shadow-black/20"
            >
              Join Our Waitlist
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
