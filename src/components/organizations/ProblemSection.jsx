/* eslint-disable no-unused-vars */
// import { useEffect, useRef } from "react";
// import { Clock, Eye, Lightbulb } from "lucide-react";
// import Problem from "../../assets/problem.webp";
// import Overlay from "../../assets/Overlay.webp";

// const problems = [
//   {
//     Icon: Clock,
//     title: "How much time is your team losing to manual reconciliation?",
//     desc: "Bank alerts and spreadsheets consume hours every month.",
//   },
//   {
//     Icon: Eye,
//     title: "Can your members clearly see how funds are managed?",
//     desc: "Limited transparency reduces trust and slows compliance.",
//   },
// ];

// export default function ProblemSection() {
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

//   return (
//     <section className="py-20 md:py-28 relative" id="problem">
//       {/* Overlay background image */}
//       <div
//         className="relative inset-0 z-0 pointer-events-none"
//         style={{
//           backgroundImage: `url(${Overlay})`,
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           backgroundRepeat: "no-repeat",
//           opacity: 0.6,
//         }}
//       />
//       <div className="max-w-[1140px] mx-auto px-6 relative z-10">
//         {/* Header */}
//         <div className="text-center mb-16">
//           <div>
//             <span className="inline-flex items-center border border-[#1C2B8A]/30 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full mb-6">
//               THE PROBLEM
//             </span>
//           </div>
//           <div>
//             <h2 className="text-[clamp(26px,5vw,58px)] font-bold text-[#0f1d6e] leading-tight tracking-tight mb-4">
//               Still spending weekends chasing payments?
//             </h2>
//           </div>
//           <div>
//             <p className="text-[17px] text-[#00000099] max-w-[720px] mx-auto leading-relaxed">
//               Without centralized visibility, time is wasted and trust begins to
//               weaken.
//             </p>
//           </div>
//         </div>

//         {/* Body */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
//           {/* LEFT */}
//           <div className="flex flex-col gap-10">
//             {problems.map(({ Icon, title, desc }, i) => (
//               <div key={title} className="flex items-start gap-5">
//                 <div className="flex-shrink-0 w-[60px] h-[60px] rounded-full bg-white shadow-[0_2px_12px_rgba(28,43,138,0.10)] border border-[#e8eaf5] flex items-center justify-center mt-0.5">
//                   <Icon className="w-[24px] h-[24px] text-[#1C2B8A]" strokeWidth={1.8} />
//                 </div>
//                 <div>
//                   <h3 className="text-[22px] font-bold text-[#0f1d6e] leading-snug mb-2">
//                     {title}
//                   </h3>
//                   <p className="text-[17px] text-[#808080] leading-relaxed">{desc}</p>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* RIGHT */}
//           <div className="w-full max-w-[640px] flex flex-col mx-auto lg:mx-0">
//             <div
//               className="relative rounded-2xl overflow-hidden w-full shadow-xl shadow-[#1C2B8A]/15"
//               style={{ aspectRatio: "458 / 250" }}
//             >
//               <img
//                 src={Problem}
//                 alt="Manual reconciliation on laptop and phone"
//                 className="absolute inset-0 w-full h-full object-cover"
//                 style={{ objectPosition: "50% 40%" }}
//               />
//             </div>

//             <div
//               className="rounded-2xl shadow-lg shadow-[#1C2B8A]/10 border border-[#eef0f8] px-5 py-4 flex items-center gap-4 self-start"
//               style={{
//                 marginTop: "-28px",
//                 marginLeft: "-20px",
//                 width: "260px",
//                 position: "relative",
//                 zIndex: 10,
//                 backgroundColor: "#EFEFF199",
//                 backdropFilter: "blur(8px)",
//                 WebkitBackdropFilter: "blur(8px)",
//               }}
//             >
//               <div className="w-10 h-10 rounded-xl bg-[#eef0fb] flex items-center justify-center flex-shrink-0">
//                 <Lightbulb className="w-5 h-5 text-[#1C2B8A]" strokeWidth={1.8} />
//               </div>
//               <div>
//                 <p className="text-[15px] font-bold text-[#0f1d6e] leading-tight">
//                   Your Solution Awaits.
//                 </p>
//                 <p className="text-[14px] text-[#00000099] text-center leading-snug mt-1">
//                   Experience financial<br />transparency.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

/**
 * ProblemSection.jsx  →  src/components/organizations/ProblemSection.jsx
 *
 * UI layout: 100% identical to the original (centre-aligned header,
 * left/right grid body). The only changes are animations:
 *
 *   Header badge:   BlurText (characters, top)    — wraps the existing span
 *   Headline h2:    BlurText (words, top)         — replaces the h2 text
 *   Subtext p:      BlurText (words, top)         — replaces the p text
 *   Problem items:  slide from x:-56 → 0          — no opacity
 *   Image wrapper:  clipPath curtain wipe (top→bottom)
 *   Floating card:  y:20→0, delayed 350ms after image
 *
 * NO Overlay — removed. Section: relative bg-[#F7F8FC] overflow-hidden.
 */

import { useEffect, useRef } from "react";
import { Clock, Eye, Lightbulb } from "lucide-react";
import Problem from "../../assets/problem.webp";
import BlurText from "../ui/BlurText";

const problems = [
  {
    Icon: Clock,
    title: "How much time is your team losing to manual reconciliation?",
    desc: "Bank alerts and spreadsheets consume hours every month.",
  },
  {
    Icon: Eye,
    title: "Can your members clearly see how funds are managed?",
    desc: "Limited transparency reduces trust and slows compliance.",
  },
];

export default function ProblemSection() {
  const itemRefs = useRef([]);
  const imageRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    /* ── Problem items: slide from left ── */
    const io1 = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.transform = "translateX(0)";
            io1.unobserve(e.target);
          }
        }),
      { threshold: 0.2 },
    );
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.transform = "translateX(-56px)";
      el.style.transition = `transform 0.72s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s`;
      io1.observe(el);
    });

    /* ── Image: clipPath curtain ── */
    const io2 = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.clipPath = "inset(0% 0% 0% 0%)";
            io2.unobserve(e.target);
          }
        }),
      { threshold: 0, rootMargin: "0px 0px -100px 0px" },
    );
    if (imageRef.current) {
      imageRef.current.style.clipPath = "inset(90% 0% 0% 0%)";
      imageRef.current.style.transition =
        "clip-path 0.85s cubic-bezier(0.22,1,0.36,1)";
      io2.observe(imageRef.current);
    }

    /* ── Floating card: y-drop after image ── */
    const io3 = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTimeout(() => {
              if (!cardRef.current) return;
              cardRef.current.style.transform = "translateY(0)";
              cardRef.current.style.opacity = "1";
            }, 350);
            io3.unobserve(e.target);
          }
        }),
      { threshold: 0.1 },
    );
    if (cardRef.current) {
      cardRef.current.style.transform = "translateY(20px)";
      cardRef.current.style.opacity = "0";
      cardRef.current.style.transition =
        "transform 0.65s cubic-bezier(0.22,1,0.36,1), opacity 0.55s ease";
      io3.observe(cardRef.current);
    }

    return () => {
      io1.disconnect();
      io2.disconnect();
      io3.disconnect();
    };
  }, []);

  return (
    <section
      className="relative bg-[#F7F8FC] overflow-hidden py-20 md:py-28"
      id="problem"
    >
      {/* Glass Logo Element Surface Overlay, per the design system spec:
          the logo mark as a plain color source, then a frosted panel
          (#F9F9FB at 95% opacity + 120px backdrop-blur) in front of it,
          blurring it from behind into a soft pastel glow rather than
          blurring the image asset itself. Purely decorative. */}
      <img
        src="/Bg.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute -left-16 -bottom-16 w-[420px] md:w-[560px]"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-surface-overlay"
        style={{
          backdropFilter: "blur(var(--blur-logo-overlay))",
          WebkitBackdropFilter: "blur(var(--blur-logo-overlay))",
        }}
      />
      <div className="max-w-[1140px] mx-auto px-6 relative">
        {/* ── Header — layout identical, text animated ── */}
        <div className="text-center mb-16">
          {/* Badge: same span + classes, BlurText inside */}
          <div className="mb-6">
            <span className="inline-flex items-center border border-[#1C2B8A]/30 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full">
              THE PROBLEM
            </span>
          </div>

          <h2 className="text-[clamp(26px,5vw,58px)] font-bold text-[#0f1d6e] leading-tight tracking-tight mb-4">
            <BlurText
              text="Still spending weekends chasing payments?"
              delay={60}
              animateBy="words"
              direction="top"
              stepDuration={0.38}
              centered
            />
          </h2>

          <p className="text-[17px] text-[#00000099] max-w-[720px] mx-auto leading-relaxed">
            Without centralized visibility, time is wasted and trust begins to weaken.
          </p>
        </div>

        {/* ── Body — identical grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
          {/* LEFT */}
          <div className="flex flex-col gap-10">
            {problems.map(({ Icon, title, desc }, i) => (
              <div
                key={title}
                ref={(el) => (itemRefs.current[i] = el)}
                className="flex items-start gap-5"
              >
                <div className="flex-shrink-0 w-[60px] h-[60px] rounded-full bg-white shadow-[0_2px_12px_rgba(28,43,138,0.10)] border border-[#e8eaf5] flex items-center justify-center mt-0.5">
                  <Icon
                    className="w-[24px] h-[24px] text-[#1C2B8A]"
                    strokeWidth={1.8}
                  />
                </div>
                <div>
                  <h3 className="text-[22px] font-bold text-[#0f1d6e] leading-snug mb-2">
                    {title}
                  </h3>
                  <p className="text-[17px] text-[#808080] leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT */}
          <div className="w-full max-w-[640px] flex flex-col mx-auto lg:mx-0">
            {/* Image wrapper — clipPath wipe applied here */}
            <div
              ref={imageRef}
              className="relative rounded-2xl overflow-hidden w-full shadow-xl shadow-[#1C2B8A]/15"
              style={{ aspectRatio: "458 / 250" }}
            >
              <img
                src={Problem}
                alt="Manual reconciliation on laptop and phone"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: "50% 40%" }}
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Floating card */}
            <div
              ref={cardRef}
              className="rounded-2xl shadow-lg shadow-[#1C2B8A]/10 border border-[#eef0f8] px-5 py-4 flex items-center gap-4 self-start"
              style={{
                marginTop: "-28px",
                marginLeft: "-20px",
                width: "260px",
                position: "relative",
                zIndex: 10,
                backgroundColor: "#EFEFF199",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-[#eef0fb] flex items-center justify-center flex-shrink-0">
                <Lightbulb
                  className="w-5 h-5 text-[#1C2B8A]"
                  strokeWidth={1.8}
                />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#0f1d6e] leading-tight">
                  Your Solution Awaits.
                </p>
                <p className="text-[14px] text-[#00000099] text-center leading-snug mt-1">
                  Experience financial
                  <br />
                  transparency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
