/**
 * Shared "problem" section shell used by both the organizations and
 * members marketing pages. Layout/animation logic is identical between
 * them; only copy, image, item list, and two animation constants
 * (clipInsetStart, staggerStep) vary — see organizations/ProblemSection.jsx
 * and members/MembersProblem.jsx for the per-audience data.
 */

import { useEffect, useRef } from "react";
import { Lightbulb } from "lucide-react";
import BlurText from "../ui/BlurText";

export default function ProblemSection({
  image,
  imageAlt = "Manual reconciliation on laptop and phone",
  problems,
  headline,
  subtext,
  clipInsetStart = "90%",
  staggerStep = 0.12,
}) {
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
      el.style.transition = `transform 0.72s cubic-bezier(0.22,1,0.36,1) ${i * staggerStep}s`;
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
      imageRef.current.style.clipPath = `inset(${clipInsetStart} 0% 0% 0%)`;
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
  }, [clipInsetStart, staggerStep]);

  return (
    <section
      className="relative z-0 bg-[#F7F8FC] overflow-hidden py-20 md:py-28"
      id="problem"
    >
      {/* Soft background glow, purely decorative. zIndex: -1 matters -- a
          positioned element paints above normal-flow content regardless of
          DOM order, so without it this would wash out the section's real
          text content instead of sitting behind it. */}
      <div
        className="absolute inset-0 pointer-events-none -z-[1] bg-cover bg-left bg-no-repeat bg-problem-glow"
        aria-hidden="true"
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
              text={headline}
              delay={60}
              animateBy="words"
              direction="top"
              stepDuration={0.38}
              centered
            />
          </h2>

          <p className="text-[17px] text-[#00000099] max-w-[720px] mx-auto leading-relaxed">
            {subtext}
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
                  <p className="text-[17px] text-gray-text leading-relaxed">
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
              className="relative rounded-2xl overflow-hidden w-full shadow-xl shadow-[#1C2B8A]/15 aspect-[458/250]"
            >
              <img
                src={image}
                alt={imageAlt}
                className="absolute inset-0 w-full h-full object-cover object-[50%_40%]"
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Floating card */}
            <div
              ref={cardRef}
              className="rounded-2xl shadow-lg shadow-[#1C2B8A]/10 border border-[#eef0f8] px-5 py-4 flex items-center gap-4 self-start -mt-7 -ml-5 w-[260px] relative z-10 bg-[#EFEFF199] backdrop-blur-sm [-webkit-backdrop-filter:blur(8px)]"
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
