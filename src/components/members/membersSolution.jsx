// import { useEffect, useRef } from "react";
// import icon1 from "../../assets/icon/frame1.png";
// import icon2 from "../../assets/icon/frame2.png";
// import icon3 from "../../assets/icon/frame3.png";
// import icon4 from "../../assets/icon/frame4.png";

// import featurePayment from "../../assets/solution/payment.png";
// import featureReminder from "../../assets/solution/reminder.png";
// import featureInstant from "../../assets/solution/instant.png";
// import featureFlexible from "../../assets/solution/flexible.png";
// import Overlay from "../../assets/Overlay2.png";
// import lightBg from "../../assets/solution/bg-light.png";

// const features = [
//   {
//     icon: icon2,
//     title: "One-Click Payments",
//     desc: "Pay your dues in seconds from any device. No more manual transfers.",
//     illustration: featurePayment,
//   },
//   {
//     icon: icon1,
//     title: "Smart Reminders",
//     desc: "Get reminders via SMS, WhatsApp, and Email so you never miss a deadline.",
//     illustration: featureReminder,
//   },
//   {
//     icon: icon3,
//     title: "Generate Instant Proof",
//     desc: "View your full history and download official receipts immediately after paying.",
//     illustration: featureInstant,
//   },
//   {
//     icon: icon4,
//     title: "Flexible Options",
//     desc: "Pay exactly how you want—via Card, Bank Transfer, or USSD.",
//     illustration: featureFlexible,
//   },
// ];

// export default function MembersSolution() {
//   const itemsRef = useRef([]);

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             entry.target.style.opacity = "1";
//             entry.target.style.transform = "translateY(0)";
//           }
//         });
//       },
//       { threshold: 0.1 },
//     );
//     itemsRef.current.forEach((el) => el && observer.observe(el));
//     return () => observer.disconnect();
//   }, []);

//   // const anim = (i, delay = 0) => ({
//   //   ref: (el) => (itemsRef.current[i] = el),
//   //   style: {
//   //     opacity: 0,
//   //     transform: "translateY(28px)",
//   //     transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
//   //   },
//   // });

//   return (
//     <section className="py-20 md:py-28 relative" id="solution">
//       {/* Background overlay */}
//       <div
//         className="relative inset-0 z-0 pointer-events-none"
//         style={{
//           backgroundImage: `url(${Overlay})`,
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           backgroundRepeat: "no-repeat",
//           opacity: 0.9,
//         }}
//       />

//       <div className="max-w-[1140px] mx-auto px-6 relative z-30">
//         {/* Header */}
//         <div className="text-center mb-12">
//           <div>
//             <span className="inline-flex items-center border border-[#1C2B8A]/25 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full mb-5">
//               Our Solution
//             </span>
//           </div>
//           <div>
//             <h2 className="text-[clamp(26px,5vw,58px)] font-bold text-[#0f1d6e] leading-tight tracking-tight mb-4">
//               Experience Financial Peace Of Mind
//             </h2>
//           </div>
//           <div>
//             <p className="text-[17px] md:text-[16px] text-[#00000099] max-w-[700px] mx-auto leading-relaxed">
//               Make payments in seconds, track everything in one place, and never
//               miss a due date again.
//             </p>
//           </div>
//         </div>

//         {/* 2-col grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {features.map(
//             ({ icon, title, desc, illustration, imgTransform }, i) => (
//               <div
//                 key={title}
//                 className="hover:-translate-y-1 transition-transform duration-300 cursor-default flex flex-col"
//                 style={{
//                   borderRadius: 16,
//                   background: "#EFEFF1",
//                   boxShadow:
//                     "0 0 0 1px rgba(255,255,255,0.75) inset, 0 2px 12px rgba(28,43,138,0.07), 0 1px 3px rgba(0,0,0,0.05)",
//                   overflow: "hidden",
//                 }}
//               >
//                 {/* ── Top: icon + text ── */}
//                 <div className="flex items-start gap-3 px-6 pt-5 pb-0">
//                   <img
//                     src={icon}
//                     alt=""
//                     style={{
//                       width: 44,
//                       height: 44,
//                       objectFit: "contain",
//                       flexShrink: 0,
//                     }}
//                   />
//                   <div>
//                     <h3
//                       style={{
//                         fontSize: 18,
//                         fontWeight: 700,
//                         color: "#0f1d6e",
//                         lineHeight: 1.3,
//                         marginBottom: 4,
//                       }}
//                     >
//                       {title}
//                     </h3>
//                     <p
//                       style={{
//                         fontSize: 15,
//                         color: "#00000099",
//                         lineHeight: 1.6,
//                         margin: 0,
//                       }}
//                     >
//                       {desc}
//                     </p>
//                   </div>
//                 </div>

//                 {/* ── Bottom: illustration panel ── */}
//                 <div
//                   className="relative"
//                   style={{ height: 240, overflow: "hidden", flexShrink: 0 }}
//                 >
//                   {/* Light background */}
//                   <img
//                     src={lightBg}
//                     alt=""
//                     style={{
//                       position: "absolute",
//                       inset: 0,
//                       width: "100%",
//                       height: "100%",
//                       objectFit: "cover",
//                       objectPosition: "center",
//                       display: "block",
//                       opacity: 0.3,
//                     }}
//                     draggable={false}
//                   />

//                   {/* Top fade */}
//                   <div
//                     style={{
//                       position: "absolute",
//                       top: 0,
//                       left: 0,
//                       right: 0,
//                       height: "18%",
//                       background:
//                         "linear-gradient(to bottom, #EFEFF1 0%, rgba(239,239,241,0.7) 50%, rgba(239,239,241,0) 100%)",
//                       pointerEvents: "none",
//                       zIndex: 5,
//                     }}
//                   />

//                   {/* Illustration — NO transform, just fill naturally */}
//                   <img
//                     src={illustration}
//                     alt={title}
//                     style={{
//                       position: "absolute",
//                       bottom: 0, // anchor to bottom edge like the goal
//                       left: "50%",
//                       transform: "translateX(-50%)",
//                       width: "100%",
//                       height: "auto",
//                       objectFit: "contain",
//                       display: "block",
//                       zIndex: 10,
//                     }}
//                     draggable={false}
//                   />
//                 </div>
//               </div>
//             ),
//           )}
//         </div>
//       </div>
//     </section>
//   );
// }

import { useEffect, useRef, useCallback, useState } from "react";
import { motion } from "motion/react";
import icon1 from "../../assets/icon/frame1.png";
import icon2 from "../../assets/icon/frame2.png";
import icon3 from "../../assets/icon/frame3.png";
import icon4 from "../../assets/icon/frame4.png";
import featurePayment from "../../assets/solution/payment.png";
import featureReminder from "../../assets/solution/reminder.png";
import featureInstant from "../../assets/solution/instant.png";
import featureFlexible from "../../assets/solution/flexible.png";
import Overlay from "../../assets/Overlay2.png";
import lightBg from "../../assets/solution/bg-light.png";

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
    desc: "Pay exactly how you want—via Card, Bank Transfer, or USSD.",
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

  const fromSnapshot =
    direction === "top"
      ? { filter: "blur(10px)", opacity: 0, y: -30 }
      : { filter: "blur(10px)", opacity: 0, y: 30 };

  const toSnapshots = [
    { filter: "blur(4px)", opacity: 0.5, y: direction === "top" ? 4 : -4 },
    { filter: "blur(0px)", opacity: 1, y: 0 },
  ];

  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from(
    { length: stepCount },
    (_, i) => i / (stepCount - 1),
  );
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
          className="inline-block will-change-[transform,filter,opacity]"
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
          {segment === " " ? "\u00A0" : segment}
          {animateBy === "words" && index < elements.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </span>
  );
}

// ─── TextType — scroll-triggered, plays once, no loop ─────────────────────────
function TextType({
  text,
  typingSpeed = 28,
  initialDelay = 0,
  showCursor = true,
  cursorCharacter = "|",
  className = "",
  onComplete,
  trigger = false,
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!trigger || done) return;
    setDisplayed("");
    indexRef.current = 0;

    const tick = () => {
      if (indexRef.current >= text.length) {
        setDone(true);
        onComplete?.();
        return;
      }
      setDisplayed(text.slice(0, indexRef.current + 1));
      indexRef.current += 1;
      timerRef.current = setTimeout(tick, typingSpeed);
    };

    timerRef.current = setTimeout(tick, initialDelay);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <span className={`text-type ${className}`} style={{ display: "inline" }}>
      <span className="text-type__content">{displayed}</span>
      {showCursor && !done && (
        <span
          style={{
            display: "inline-block",
            marginLeft: "1px",
            animation: "ttCursorBlink 0.55s step-end infinite",
            color: "inherit",
            fontWeight: 300,
          }}
        >
          {cursorCharacter}
        </span>
      )}
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

    cur.current.rotX = lerp(
      cur.current.rotX,
      tgt.current.rotX,
      hovering.current ? 0.12 : 0.08,
    );
    cur.current.rotY = lerp(
      cur.current.rotY,
      tgt.current.rotY,
      hovering.current ? 0.12 : 0.08,
    );

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

    if (moving || hovering.current)
      rafRef.current = requestAnimationFrame(animate);
    else rafRef.current = null;
  }, [strength]);

  const onMouseMove = useCallback(
    (e) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      tgt.current.rotX =
        -((e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) *
        strength;
      tgt.current.rotY =
        ((e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) *
        strength;
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

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return { cardRef, sheenRef, onMouseMove, onMouseEnter, onMouseLeave };
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  desc,
  illustration,
  entryDelay,
  sectionInView,
}) {
  const { cardRef, sheenRef, onMouseMove, onMouseEnter, onMouseLeave } =
    useTilt(14);
  const [titleDone, setTitleDone] = useState(false);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (sectionInView && !triggered) {
      const t = setTimeout(() => setTriggered(true), entryDelay);
      return () => clearTimeout(t);
    }
    if (!sectionInView) {
      setTriggered(false);
      setTitleDone(false);
    }
  }, [sectionInView, entryDelay]);

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "relative",
        borderRadius: 16,
        background: "B3B3B3",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.75) inset, 0 2px 12px rgba(28,43,138,0.07), 0 1px 3px rgba(0,0,0,0.05)",
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
      {/* Sheen */}
      <div
        ref={sheenRef}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          pointerEvents: "none",
          zIndex: 20,
          opacity: 0,
          transition: "opacity 0.2s ease",
        }}
      />

      {/* Icon + text */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "20px 24px 10px",
        }}
      >
        <img
          src={icon}
          alt=""
          style={{ width: 44, height: 44, objectFit: "contain", flexShrink: 0 }}
        />
        <div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0f1d6e",
              lineHeight: 1.3,
              marginBottom: 6,
              minHeight: "1.4em",
            }}
          >
            <TextType
              text={title}
              typingSpeed={30}
              trigger={triggered}
              showCursor={!titleDone}
              onComplete={() => setTitleDone(true)}
            />
          </h3>
          <p
            style={{
              fontSize: 15,
              color: "rgba(0,0,0,0.6)",
              lineHeight: 1.6,
              margin: 0,
              minHeight: "3em",
            }}
          >
            <TextType
              text={desc}
              typingSpeed={18}
              initialDelay={100}
              trigger={titleDone}
              showCursor={titleDone}
            />
          </p>
        </div>
      </div>

      {/* Illustration */}
      <div
        style={{
          position: "relative",
          height: 240,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <img
          src={lightBg}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.3,
          }}
          draggable={false}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "18%",
            background:
              "linear-gradient(to bottom, #EFEFF1 0%, rgba(239,239,241,0.7) 55%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
        <img
          src={illustration}
          alt={title}
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            height: "auto",
            objectFit: "contain",
            zIndex: 10,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function MembersSolution() {
  const sectionRef = useRef(null);
  const [sectionInView, setSectionInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSectionInView(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes glassCardIn {
          from { opacity: 0; transform: perspective(900px) translateY(32px) rotateX(6deg); }
          to   { opacity: 1; transform: perspective(900px) translateY(0px) rotateX(0deg); }
        }
        @keyframes ttCursorBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>

      <section
        ref={sectionRef}
        className="py-20 md:py-28 relative"
        id="solution"
      >
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          // style={{
          //   backgroundImage: `url(${Overlay})`,
          //   backgroundSize: "cover",
          //   backgroundPosition: "center",
          //   backgroundRepeat: "no-repeat",
          //   opacity: 0.1,  /* was 0.9 — that's what made the section dark */
          // }}
        />

        <div className="max-w-[1140px] mx-auto px-6 relative z-30">
          {/* ── Header — BlurText on all three elements ── */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div
              style={{
                marginBottom: 20,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <BlurText
                text="Our Solution"
                animateBy="words"
                direction="top"
                delay={60}
                stepDuration={0.4}
                className="inline-flex items-center border border-[#1C2B8A]/25 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full"
              />
            </div>

            <h2
              style={{
                fontSize: "clamp(26px,5vw,58px)",
                fontWeight: 700,
                color: "#0f1d6e",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                marginBottom: 16,
              }}
            >
              <BlurText
                text="Experience Financial Peace Of Mind"
                animateBy="words"
                direction="top"
                delay={55}
                stepDuration={0.42}
                centered
              />
            </h2>

            <p
              style={{
                fontSize: "clamp(15px,2vw,17px)",
                color: "rgba(0,0,0,0.6)",
                maxWidth: 640,
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              <BlurText
                text="Make payments in seconds, track everything in one place, and never miss a due date again."
                animateBy="words"
                direction="top"
                delay={30}
                stepDuration={0.35}
                centered
              />
            </p>
          </div>

          {/* ── Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map(({ icon, title, desc, illustration }, i) => (
              <FeatureCard
                key={title}
                icon={icon}
                title={title}
                desc={desc}
                illustration={illustration}
                entryDelay={200 + i * 120}
                sectionInView={sectionInView}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
