/* eslint-disable no-unused-vars */
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { getMemberAuthRoute } from "../../utils/deviceRedirect";
import waveBg from "../../assets/hero/hero.jpg";
import iphone from "../../assets/hero/iphone.png";
import BlurText from "../ui/BlurText";
import VariableProximity from "../ui/VariableProximity";
import MembersDashboard from "../MemberDashboardOverlay";

export default function MembersHero() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // ── Static TV noise — drawn ONCE, frozen in place, very subtle ───────────
    const canvas = document.getElementById("hero-static-canvas");
    if (canvas) {
      const resize = () => {
        canvas.width = canvas.offsetWidth || window.innerWidth;
        canvas.height = canvas.offsetHeight || window.innerHeight;
        // Redraw once after resize
        const ctx = canvas.getContext("2d");
        const w = canvas.width,
          h = canvas.height;
        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const v = Math.random() > 0.5 ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = v;
          data[i + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
      };
      resize();
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }
  }, []);

  const [waveOpacity, setWaveOpacity] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return;
      const { top, height } = sectionRef.current.getBoundingClientRect();
      setWaveOpacity(Math.min(1, Math.max(0, (-top / height - 0.45) / 0.25)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col justify-center pt-[68px] overflow-hidden"
    >
      {/* Wave background */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${waveBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Dark overlay */}
      {/* <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(2,3,18,0.97) 0%, rgba(3,4,22,0.95) 35%, rgba(6,3,20,0.88) 60%, rgba(10,4,24,0.75) 100%)",
        }}
      /> */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(2,3,18,0.82) 0%, rgba(3,4,22,0.78) 35%, rgba(6,3,20,0.65) 60%, rgba(10,4,24,0.45) 100%)",
        }}
      />
      {/* ── 3. TV static noise — frozen, one-time draw, very subtle ── */}
      <canvas
        id="hero-static-canvas"
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          width: "100%",
          height: "100%",
          opacity: 0.028,
          mixBlendMode: "screen",
        }}
      />

      {/* Glow blobs */}
      {/* <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div
          className="absolute bottom-0 right-0 w-[700px] h-[480px]"
          style={{
            background:
              "radial-gradient(ellipse at bottom right, rgba(120,10,150,0.4) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[320px]"
          style={{
            background:
              "radial-gradient(ellipse at bottom left, rgba(80,8,110,0.28) 0%, transparent 60%)",
            filter: "blur(70px)",
          }}
        />
      </div> */}

      {/* ── DESKTOP ── */}
      <div className="hidden sm:flex relative z-10 w-full max-w-[1280px] mx-auto px-8 lg:px-16 min-h-[calc(100vh-68px)] flex-row items-center">
        {/* Left: Text */}
        <div
          ref={containerRef}
          className="flex flex-col justify-start pt-8"
          style={{
            width: "45%",
            flexShrink: 0,
            position: "relative",
            marginTop: "-60px",
          }}
        >
          {/* Line 1 */}
          <div
            style={{
              fontSize: "clamp(38px,5.8vw,62px)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              marginBottom: 2,
            }}
          >
            <BlurText
              text="Pay Your Dues"
              delay={80}
              animateBy="words"
              direction="top"
              stepDuration={0.36}
              className="text-white block"
            />
          </div>

          {/* Line 2 */}
          <div
            className="mb-6 text-white"
            style={{
              fontSize: "clamp(38px,5.8vw,62px)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            <BlurText
              text="Effortlessly"
              delay={400}
              animateBy="words"
              direction="top"
              stepDuration={0.42}
              className="block"
            />
          </div>

          {/* Sub-text */}
          <div className="mb-8" style={{ maxWidth: 420 }}>
            <VariableProximity
              label="Stop sending screenshots of receipts. Get instant proof of payment, track your history, and never miss a deadline again."
              s
              fromFontVariationSettings="'wght' 300, 'opsz' 9"
              toFontVariationSettings="'wght' 700, 'opsz' 40"
              containerRef={containerRef}
              radius={140}
              falloff="gaussian"
              className="leading-relaxed"
              style={{
                fontSize: 15,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.7,
                fontFamily: "Inter,-apple-system,sans-serif",
              }}
            />
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
              delay: 1.4,
            }}
          >
            <button
              onClick={() => navigate(getMemberAuthRoute())}
              className="inline-flex items-center gap-2 bg-white text-[#0c1020] text-[13px] px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/20 shadow-lg shadow-black/30 cursor-pointer"
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
              }}
            >
              Join A Community
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.span>
            </button>
          </motion.div>
        </div>

        {/* Right: iPhone */}
        <div
          className="relative self-stretch flex items-end justify-start"
          style={{
            width: "55%",
            paddingBottom: 0,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1.2,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.25,
            }}
            style={{
              position: "relative",
              width: "min(95%, 620px)",
              marginLeft: "-90px",
            }}
          >
            <img
              src={iphone}
              alt="Glass app on iPhone"
              className="relative block w-full"
              style={{
                zIndex: 10,
                objectFit: "contain",
              }}
              draggable={false}
            />
          </motion.div>
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="sm:hidden relative z-10 w-full px-6 pt-12 pb-0 flex flex-col">
        <div ref={containerRef} style={{ position: "relative" }}>
          <div
            style={{
              fontSize: "clamp(38px,10vw,56px)",
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              marginBottom: 2,
            }}
          >
            <BlurText
              text="Pay Your Dues"
              delay={80}
              animateBy="words"
              direction="top"
              stepDuration={0.36}
              className="text-white block"
              // style={{
              //   fontSize: "clamp(38px,10vw,56px)",
              //   fontWeight: 800,
              //   lineHeight: 1.05,
              // }}
            />
          </div>
          <div
            className="mb-6 text-white"
            style={{
              fontSize: "clamp(38px,10vw,62px)",
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            <BlurText
              text="Effortlessly"
              delay={400}
              animateBy="words"
              direction="top"
              stepDuration={0.42}
              className="block"
            />
          </div>
          <p
            className="text-[15px] leading-relaxed mb-8"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Stop sending screenshots of receipts. Get instant proof of payment,
            track your history, and never miss a deadline again.
          </p>
          <button
            onClick={() => navigate("/member/join")}
            className="inline-flex items-center gap-2 bg-white text-[#0c1020] text-[13px] px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/20 shadow-lg shadow-black/30 cursor-pointer"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
          >
            Join A Community
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.span>
          </button>
        </div>

        {/* Phone on mobile */}
        <div
          className="w-full flex justify-center overflow-hidden"
          style={{ maxHeight: 400 }}
        >
          <div style={{ position: "relative", width: 280 }}>
            <div
              style={{
                position: "absolute",
                top: "1.8%",
                left: "8.2%",
                width: "83.5%",
                height: "100%",
                borderRadius: "38px",
                overflow: "hidden",
                zIndex: 2,
              }}
            >
              {/* <div
                style={{
                  width: 390,
                  height: 844,
                  transform: `scale(${(280 * 0.835) / 390})`,
                  transformOrigin: "top left",
                }}
              >
                <MembersDashboard />
              </div> */}
            </div>
            <img
              src={iphone}
              alt="Glass app on iPhone"
              style={{
                position: "relative",
                zIndex: 10,
                width: "100%",
                display: "block",
                filter: "drop-shadow(0 16px 40px rgba(120,10,160,0.5))",
              }}
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* Bottom fades */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 hidden sm:block"
        style={{
          height: "40px",
          background:
            "linear-gradient(to top, rgba(229,229,229,0.97) 0%, rgba(229,229,229,0.65) 35%, rgba(229,229,229,0.1) 75%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 block sm:hidden"
        style={{
          height: "20px",
          background:
            "linear-gradient(to top, rgba(229,229,229,0.95) 0%, rgba(229,229,229,0.5) 40%, transparent 100%)",
        }}
      />
    </section>
  );
}
