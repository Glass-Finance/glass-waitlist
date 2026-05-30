import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Reveal } from "../Reveal";
import macbookMockup from "../../assets/desktopdash.png";
import iphoneMockup from "../../assets/mobiledash.png";
import waveBg from "../../assets/hero/hero.jpg";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden pt-[68px]">
      {/* ── Wave image background ── */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${waveBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* ── Dark overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, rgba(4,6,28,0.88) 0%, rgba(8,8,42,0.75) 45%, rgba(14,6,36,0.52) 100%)",
        }}
      />

      {/* ── Glow blobs (sit on top of image) ── */}
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 100%, #6b0f6b 0%, #3d0a4a 40%, transparent 70%)",
            filter: "blur(60px)",
            opacity: 0.55,
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[300px]"
          style={{
            background:
              "radial-gradient(ellipse at bottom left, #7a0a5a 0%, transparent 60%)",
            filter: "blur(80px)",
            opacity: 0.4,
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px]"
          style={{
            background:
              "radial-gradient(ellipse at top, #0d1840 0%, transparent 65%)",
            filter: "blur(40px)",
            opacity: 0.7,
          }}
        />
      </div>

      {/* ── Hero text content ── */}
      <div className="relative z-10 w-full max-w-[720px] mx-auto text-center px-6 pt-12 pb-[280px] sm:pb-8 sm:pt-20">
        <h1
          className="font-bold text-white leading-[1.05] tracking-tight mb-5 text-center max-w-[280px] sm:max-w-none mx-auto"
          style={{ fontSize: "clamp(38px, 7.5vw, 72px)" }}
        >
          Community finance
          <br />
          <span>Crystal Clear</span>
        </h1>

        <p className="text-[15px] sm:text-[16px] text-white/55 leading-relaxed max-w-[540px] mx-auto mb-8 sm:mb-10">
          Save 15–20 hours monthly chasing payments. The transparent way for
          Nigerian associations, clubs, and schools to manage funds.
        </p>

        <button
          onClick={() => navigate("/waitlist")}
          className="inline-flex items-center gap-2 bg-white text-[#0d1022] text-[15px] px-8 py-3.5 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/20 shadow-lg shadow-black/30"
        >
          Create Your Community
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── DESKTOP mockup ── */}
      <div className="relative z-10 w-full px-8 pb-0 hidden sm:block">
        <div className="w-full max-w-[1100px] mx-auto">
          <img
            src={macbookMockup}
            alt="Glass dashboard on MacBook"
            className="w-full h-auto object-contain"
            style={{
              filter: "drop-shadow(0 32px 80px rgba(107, 15, 107, 0.45))",
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* ── MOBILE mockup ── */}
      <div
        className="block sm:hidden absolute bottom-0 left-0 right-0 z-10"
        style={{ padding: "0 16px" }}
      >
        <div
          className="w-full max-w-[360px] mx-auto overflow-hidden"
          style={{ maxHeight: "240px" }}
        >
          <img
            src={iphoneMockup}
            alt="Glass dashboard on iPhone"
            className="w-full"
            style={{
              display: "block",
              objectFit: "cover",
              objectPosition: "top",
              filter: "drop-shadow(0 24px 60px rgba(107, 15, 107, 0.5))",
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* ── Bottom fade — desktop ── */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 hidden sm:block"
        style={{
          height: "120px",
          background:
            "linear-gradient(to top, rgba(229,229,229,0.95) 0%, rgba(229,229,229,0.6) 30%, rgba(229,229,229,0.1) 70%, transparent 100%)",
        }}
      />

      {/* ── Bottom fade — mobile ── */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 block sm:hidden"
        style={{
          height: "70px",
          background:
            "linear-gradient(to top, rgba(229,229,229,0.95) 0%, rgba(229,229,229,0.5) 40%, transparent 100%)",
        }}
      />
    </section>
  );
}
