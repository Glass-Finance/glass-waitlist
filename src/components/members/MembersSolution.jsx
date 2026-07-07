import { useEffect, useRef, useCallback, useState } from "react";
import { motion } from "motion/react";
import icon1 from "../../assets/icon/frame1.webp";
import icon2 from "../../assets/icon/frame2.webp";
import icon3 from "../../assets/icon/frame3.webp";
import icon4 from "../../assets/icon/frame4.webp";
import featurePayment from "../../assets/solution/payment.webp";
import featureReminder from "../../assets/solution/reminder.webp";
import featureInstant from "../../assets/solution/instant.webp";
import featureFlexible from "../../assets/solution/flexible.webp";
import lightBg from "../../assets/solution/bg-light.webp";

const features = [
  {
    icon: icon2,
    title: "One-Click Payments",
    desc: "Pay your dues in seconds from any device. No more manual transfers.",
    illustration: featurePayment,
  },
  {
    icon: icon1,
    title: "Smart Reminders",
    desc: "Get reminders via SMS, WhatsApp, and Email so you never miss a deadline.",
    illustration: featureReminder,
  },
  {
    icon: icon3,
    title: "Generate Instant Proof",
    desc: "View your full history and download official receipts immediately after paying.",
    illustration: featureInstant,
  },
  {
    icon: icon4,
    title: "Flexible Options",
    desc: "Pay exactly how you want — via Card, Bank Transfer, or USSD.",
    illustration: featureFlexible,
  },
];

// ─── BlurText ─────────────────────────────────────────────────────────────────
const buildKeyframes = (from, steps) => {
  const keys = new Set([
    ...Object.keys(from),
    ...steps.flatMap((s) => Object.keys(s)),
  ]);
  const keyframes = {};
  keys.forEach((k) => {
    keyframes[k] = [from[k], ...steps.map((s) => s[k])];
  });
  return keyframes;
};

function BlurText({
  text = "",
  delay = 80,
  className = "",
  animateBy = "words",
  direction = "top",
  threshold = 0.15,
  stepDuration = 0.38,
  centered = false,
  onAnimationComplete,
}) {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  const mobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 640px)").matches;

  const fromSnapshot =
    direction === "top"
      ? mobile ? { opacity: 0, y: -14 } : { filter: "blur(8px)", opacity: 0, y: -18 }
      : mobile ? { opacity: 0, y: 14 }  : { filter: "blur(8px)", opacity: 0, y: 18 };

  const toSnapshots = mobile
    ? [{ opacity: 1, y: 0 }]
    : [
        { filter: "blur(3px)", opacity: 0.5, y: direction === "top" ? 2 : -2 },
        { filter: "blur(0px)", opacity: 1, y: 0 },
      ];

  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) => i / (stepCount - 1));
  const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        justifyContent: centered ? "center" : "flex-start",
        width: centered ? "100%" : "auto",
      }}
    >
      {elements.map((segment, index) => (
        <motion.span
          className={mobile ? "inline-block will-change-[transform,opacity]" : "inline-block will-change-[transform,filter,opacity]"}
          key={index}
          initial={fromSnapshot}
          animate={inView ? animateKeyframes : fromSnapshot}
          transition={{
            duration: totalDuration,
            times,
            delay: (index * delay) / 1000,
            ease: "easeOut",
          }}
          onAnimationComplete={
            index === elements.length - 1 ? onAnimationComplete : undefined
          }
        >
          {segment === " " ? " " : segment}
          {animateBy === "words" && index < elements.length - 1 && " "}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Per-card tilt hook ───────────────────────────────────────────────────────
function useTilt(strength = 14) {
  const cardRef = useRef(null);
  const sheenRef = useRef(null);
  const rafRef = useRef(null);
  const cur = useRef({ rotX: 0, rotY: 0 });
  const tgt = useRef({ rotX: 0, rotY: 0 });
  const hovering = useRef(false);

  const lerp = (a, b, t) => a + (b - a) * t;

  const animate = useCallback(() => {
    const card = cardRef.current;
    const sheen = sheenRef.current;
    if (!card) return;

    cur.current.rotX = lerp(cur.current.rotX, tgt.current.rotX, hovering.current ? 0.12 : 0.08);
    cur.current.rotY = lerp(cur.current.rotY, tgt.current.rotY, hovering.current ? 0.12 : 0.08);

    const { rotX, rotY } = cur.current;
    const scale = hovering.current ? 1.03 : 1;
    card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${scale},${scale},1)`;

    const sx = (-rotY * 1.2).toFixed(2);
    const sy = (rotX * 1.2).toFixed(2);
    card.style.boxShadow = hovering.current
      ? `0 0 0 1px rgba(255,255,255,0.85) inset, ${sx}px ${sy}px 40px rgba(28,43,138,0.16), 0 2px 8px rgba(0,0,0,0.06)`
      : "0 0 0 1px rgba(255,255,255,0.75) inset, 0 2px 12px rgba(28,43,138,0.07), 0 1px 3px rgba(0,0,0,0.05)";

    if (sheen) {
      const nx = (rotY / strength + 1) / 2;
      const ny = (-rotX / strength + 1) / 2;
      sheen.style.background = `radial-gradient(ellipse 55% 45% at ${(nx * 100).toFixed(1)}% ${(ny * 100).toFixed(1)}%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.04) 45%, transparent 70%)`;
      sheen.style.opacity = hovering.current ? "1" : "0";
    }

    const moving =
      Math.abs(cur.current.rotX - tgt.current.rotX) > 0.01 ||
      Math.abs(cur.current.rotY - tgt.current.rotY) > 0.01;

    if (moving || hovering.current) rafRef.current = requestAnimationFrame(animate);
    else rafRef.current = null;
  }, [strength]);

  const onMouseMove = useCallback(
    (e) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      tgt.current.rotX = -((e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) * strength;
      tgt.current.rotY = ((e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * strength;
    },
    [strength],
  );

  const onMouseEnter = useCallback(() => {
    hovering.current = true;
    if (!rafRef.current) rafRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const onMouseLeave = useCallback(() => {
    hovering.current = false;
    tgt.current = { rotX: 0, rotY: 0 };
    if (!rafRef.current) rafRef.current = requestAnimationFrame(animate);
  }, [animate]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return { cardRef, sheenRef, onMouseMove, onMouseEnter, onMouseLeave };
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, illustration, entryDelay }) {
  const { cardRef, sheenRef, onMouseMove, onMouseEnter, onMouseLeave } = useTilt(14);

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "relative",
        borderRadius: 14,
        background: "#EFEFF1",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.75) inset, 0 2px 12px rgba(28,43,138,0.07), 0 1px 3px rgba(0,0,0,0.05)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "default",
        willChange: "transform",
        transformStyle: "preserve-3d",
        opacity: 0,
        animation: `glassCardIn 0.65s cubic-bezier(0.22,1,0.36,1) ${entryDelay}ms forwards`,
      }}
    >
      <div ref={sheenRef} style={{ position: "absolute", inset: 0, borderRadius: 14, pointerEvents: "none", zIndex: 20, opacity: 0, transition: "opacity 0.2s ease" }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "clamp(16px,3vw,28px) clamp(14px,2.5vw,20px) 0px" }}>
        <img src={icon} alt="" style={{ width: "clamp(36px,5vw,50px)", height: "clamp(36px,5vw,50px)", objectFit: "contain", flexShrink: 0 }} loading="lazy" decoding="async" />
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: "clamp(16px,2.5vw,18px)", fontWeight: 700, color: "#0f1d6e", lineHeight: 1.3, marginBottom: 6 }}>
            {title}
          </h3>
          <p style={{ fontSize: "clamp(14px,2vw,14px)", color: "rgba(0,0,0,0.6)", lineHeight: 1.6, margin: 0 }}>
            {desc}
          </p>
        </div>
      </div>

      <div className="solution-illus" style={{ position: "relative", height: "clamp(160px, 45vw, 240px)", overflow: "hidden" }}>
        <img src={lightBg} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} draggable={false} loading="lazy" decoding="async" />
        <div className="solution-fade" style={{ position: "absolute", top: 0, left: 0, right: 0, height: "18%", background: "linear-gradient(to bottom, #EFEFF1 0%, rgba(239,239,241,0.7) 55%, transparent 100%)", pointerEvents: "none", zIndex: 5 }} />
        <img src={illustration} alt={title} style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "85%", height: "auto", objectFit: "contain", zIndex: 10 }} draggable={false} loading="lazy" decoding="async" />
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function MembersSolution() {
  return (
    <>
      <style>{`
        @keyframes glassCardIn {
          from { opacity: 0; transform: perspective(900px) translateY(32px) rotateX(6deg); }
          to   { opacity: 1; transform: perspective(900px) translateY(0px) rotateX(0deg); }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .solution-illus { height: 180px !important; }
          .solution-fade { height: 8% !important; background: linear-gradient(to bottom, #EFEFF1 0%, transparent 100%) !important; }
        }
      `}</style>

      <section className="py-20 md:py-28 relative bg-white" id="solution">
        <div className="absolute inset-0 z-0 pointer-events-none" />

        <div className="max-w-[1140px] mx-auto px-6 relative z-30">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
              <span className="inline-flex items-center border border-[#1C2B8A]/25 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full">
                Our Solution
              </span>
            </div>

            <h2 style={{ fontSize: "clamp(26px,5vw,58px)", fontWeight: 700, color: "#0f1d6e", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 16 }}>
              <BlurText
                text="Everything You Need to Pay with Confidence"
                animateBy="words"
                direction="top"
                delay={55}
                stepDuration={0.42}
                centered
              />
            </h2>

            <p style={{ fontSize: "clamp(15px,2vw,17px)", color: "rgba(0,0,0,0.6)", maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
              One tap to pay, instant receipts, and a full history — so you never have to dig through chats again.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map(({ icon, title, desc, illustration }, i) => (
              <FeatureCard
                key={title}
                icon={icon}
                title={title}
                desc={desc}
                illustration={illustration}
                entryDelay={200 + i * 120}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
