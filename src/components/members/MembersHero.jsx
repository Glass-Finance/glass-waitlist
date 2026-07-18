/* eslint-disable no-unused-vars */
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { isMobileDevice, mobileRequiredPath } from "../../utils/deviceRedirect";
import waveBg from "../../assets/hero/hero.webp";
import iphone from "../../assets/hero/iphone.webp";
import BlurText from "../ui/BlurText";
import VariableProximity from "../ui/VariableProximity";
import MembersDashboard from "../MemberDashboardOverlay";

export default function MembersHero() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const containerRef = useRef(null);

  // Joining is a mobile-only flow — on desktop/tablet, hand off via QR
  // instead of sending the visitor into a registration form built for
  // a phone screen.
  function handleJoin() {
    navigate(isMobileDevice() ? "/member/join" : mobileRequiredPath("/member/join"));
  }
//
  useEffect(() => {
    // index.css sets `scroll-behavior: smooth` globally for anchor links —
    // that also hijacks plain scrollTo() calls, turning this reset into a
    // visible multi-hundred-ms slide instead of an instant jump. Suppressing
    // it has to survive past the browser's next paint, or restoring it
    // synchronously here wins the race and the scroll still animates.
    const root = document.documentElement;
    const prevBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      root.style.scrollBehavior = prevBehavior;
    });
  }, []);

  useEffect(() => {
    const canvas = document.getElementById("members-hero-canvas");
    if (!canvas) return;
    const draw = () => {
      canvas.width = canvas.offsetWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
      const ctx = canvas.getContext("2d");
      const img = ctx.createImageData(canvas.width, canvas.height);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() > 0.5 ? 255 : 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, []);

  return (
    <>
    <style>{`
      @keyframes waveDrift {
        0%   { transform: scale(1.06) translate(0px, 0px); }
        30%  { transform: scale(1.09) translate(-16px, -8px); }
        65%  { transform: scale(1.07) translate(12px, -14px); }
        100% { transform: scale(1.06) translate(0px, 0px); }
      }
      @media (max-width: 640px) {
        .hero-wave-bg { animation: none !important; transform: scale(1.06) !important; will-change: auto !important; }
        .hero-blur-blobs { display: none !important; }
      }
    `}</style>
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col justify-center pt-[68px] overflow-hidden"
    >
      {/* Wave background */}
      <div
        className="hero-wave-bg absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${waveBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          animation: "waveDrift 28s ease-in-out infinite",
          willChange: "transform",
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

      <canvas
        id="members-hero-canvas"
        className="absolute inset-0 pointer-events-none select-none"
        style={{ width: "100%", height: "100%", opacity: 0.035, mixBlendMode: "screen" }}
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
              onClick={handleJoin}
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
            {/* loading="lazy" here (and on the mobile copy below) is
                deliberate, not an oversight: this and the mobile-only
                <img> further down both render the same iphone.webp,
                one hidden via `hidden sm:flex` and the other via
                `sm:hidden`. display:none doesn't stop an eager <img> from
                fetching, so without this every visitor downloaded BOTH
                copies. Browsers skip fetching a lazy image with no
                generated box (i.e. currently display:none), so only the
                one actually visible at the matching breakpoint loads --
                whichever one that is still loads promptly since it's in
                the initial viewport, "lazy" here just means "skip if
                hidden," not "defer until scrolled to." */}
            <img
              src={iphone}
              alt="Glass app on iPhone"
              className="relative block w-full"
              style={{
                zIndex: 10,
                objectFit: "contain",
              }}
              draggable={false}
              loading="lazy"
              decoding="async"
            />
          </motion.div>
        </div>
      </div>

      {/* ── MOBILE ── */}
      {/* Taken out of the section's flex/justify-center flow and pinned to
          inset:0 instead — that way the phone mockup below can be
          absolutely bottom-pinned to the actual screen edge (filling it on
          any phone height) without the section's centering logic shifting
          the whole group up and leaving a gap underneath. */}
      <div className="sm:hidden absolute top-[68px] left-0 right-0 bottom-0 z-10 flex flex-col">
        <div ref={containerRef} className="px-6 pt-30 relative">
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
            onClick={handleJoin}
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

        {/* Phone on mobile — pinned to the screen's bottom edge so it
            always fills flush to the bottom regardless of phone height,
            instead of floating with a gap beneath it. Cropped from the
            top (items-end) if it doesn't fit, never from the bottom. */}
        <div
          className="absolute bottom-0 left-0 right-0 flex justify-center items-end overflow-hidden"
          style={{ maxHeight: "58vh" }}
        >
          <div style={{ position: "relative", width: 330 }}>
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
            {/* See the desktop copy of this <img> above for why
                loading="lazy" is deliberate here, not an oversight. */}
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
              loading="lazy"
              decoding="async"
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
    </section>
    </>
  );
}
