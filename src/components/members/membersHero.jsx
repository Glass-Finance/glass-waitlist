import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import waveBg from "../../assets/hero/hero.jpg";

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
      { threshold: 0.1 },
    );
    itemsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // const animItem = (index, delay = 0) => ({
  //   ref: (el) => (itemsRef.current[index] = el),
  //   style: {
  //     opacity: 0,
  //     transform: "translateY(24px)",
  //     transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
  //   },
  // });

  return (
    <section className="relative flex flex-col justify-center pt-[68px] overflow-hidden">
      {/* ── Wave image ── */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${waveBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* ── Dark overlay — tweak the rgba values to get the darkness right ── */}
      {/* Currently: strong dark on left (where text lives), lighter on the right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, rgba(4,6,28,0.88) 0%, rgba(8,8,42,0.75) 45%, rgba(14,6,36,0.52) 100%)",
        }}
      />

      {/* ── Glow blobs (kept from original — sit on top of the image) ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div
          className="absolute bottom-0 right-0 w-[800px] h-[500px]"
          style={{
            background:
              "radial-gradient(ellipse at bottom right, #7a1090 0%, #4a0860 40%, transparent 65%)",
            filter: "blur(70px)",
            opacity: 0.55,
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[350px]"
          style={{
            background:
              "radial-gradient(ellipse at bottom left, #6b0f7a 0%, transparent 60%)",
            filter: "blur(80px)",
            opacity: 0.45,
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-8 lg:px-16 py-20">
        <div className="max-w-[600px]">
          <h1 className="text-[clamp(44px,7vw,70px)] font-bold text-white leading-[1.05] tracking-tight mb-6">
            Pay Your Dues
            <br />
            <span>Effortlessly</span>
          </h1>

          <p className="text-[16px] text-white/55 leading-relaxed max-w-[480px] mb-10">
            Stop sending screenshots of receipts. Get instant proof of payment,
            track your history, and never miss a deadline again.
          </p>

          <div>
            <button
              onClick={() => navigate("/waitlist")}
              className="inline-flex items-center gap-2 bg-white text-[#0c1020] text-[15px] px-8 py-3.5 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/20 shadow-lg shadow-black/30"
            >
              Join A Community
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom fade — desktop ── */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 hidden sm:block"
        style={{
          height: "80px",
          background:
            "linear-gradient(to top, rgba(229,229,229,0.95) 0%, rgba(229,229,229,0.6) 30%, rgba(229,229,229,0.1) 70%, transparent 100%)",
        }}
      />

      {/* ── Bottom fade — mobile ── */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 block sm:hidden"
        style={{
          height: "60px",
          background:
            "linear-gradient(to top, rgba(229,229,229,0.95) 0%, rgba(229,229,229,0.5) 40%, transparent 100%)",
        }}
      />
    </section>
  );
}
