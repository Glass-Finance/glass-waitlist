import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import BlurText from "./ui/BlurText";

import icon1 from "../assets/security/icon1.webp";
import icon2 from "../assets/security/icon2.webp";
import icon3 from "../assets/security/icon3.webp";

const cards = [
  {
    icon: icon1,
    title: "Transparency",
    desc: "Every kobo is accounted for. No hidden fees or missing funds.",
  },
  {
    icon: icon2,
    title: "NDPR Compliant",
    desc: "Fully licensed and compliant with Nigerian Data Protection Regulations.",
  },
  {
    icon: icon3,
    title: "Encryption",
    desc: "All data and transactions are encrypted. Your records are private.",
  },
];

const TILTS = [
  { rotate: -3, y: 18 },
  { rotate: 0, y: 0 },
  { rotate: 3, y: 18 },
];

export default function SecurityFeatures() {
  const cardRefs = useRef([]);
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const orb1Y = useTransform(scrollYProgress, [0, 1], ["-40px", "40px"]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], ["30px", "-50px"]);
  const orb3Y = useTransform(scrollYProgress, [0, 1], ["-20px", "60px"]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const idx = cardRefs.current.indexOf(entry.target);
          if (idx === -1) return;

          const { rotate, y } = TILTS[idx];

          entry.target.style.transform =
            window.innerWidth >= 1024
              ? `rotateZ(${rotate}deg) translateY(${y}px)`
              : "none";

          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.15,
      },
    );

    cardRefs.current.forEach((el) => el && observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#F7F8FC] overflow-hidden py-20 md:py-28"
      id="security"
    >
      {/* ── Parallax glow orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <motion.div
          className="absolute top-[10%] left-[5%] w-[340px] h-[340px] rounded-full bg-[radial-gradient(circle,rgba(28,43,138,0.08)_0%,transparent_70%)] blur-[60px] will-change-transform"
          style={{ y: orb1Y }}
        />
        <motion.div
          className="absolute bottom-[12%] right-[8%] w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.07)_0%,transparent_70%)] blur-[55px] will-change-transform"
          style={{ y: orb2Y }}
        />
        <motion.div
          className="absolute top-[40%] right-[20%] w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,rgba(28,43,138,0.05)_0%,transparent_70%)] blur-[45px] will-change-transform"
          style={{ y: orb3Y }}
        />
      </div>
      <div className="relative z-10 max-w-[1140px] mx-auto px-6">
        {/* ── Header ── */}
        <div className="mb-8 md:mb-16 text-center">
          {/* Badge */}
          <div className="flex justify-center [margin-bottom:clamp(16px,4vw,28px)]">
            <motion.span
              initial={{ clipPath: "inset(0% 100% 0% 0%)" }}
              whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center border border-[#1C2B8A]/25 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full"
            >
              Security & Trust
            </motion.span>
          </div>

          {/* Headline */}
          <div className="flex justify-center mb-4">
            <h2 className="text-[clamp(32px,5.5vw,58px)] font-bold text-[#0f1d6e] leading-tight tracking-tight max-w-[1080px]">
              <BlurText
                text="Bank-grade security for your peace of mind"
                delay={80}
                animateBy="words"
                direction="top"
                stepDuration={0.38}
                centered
              />
            </h2>
          </div>

          {/* Subtext */}
          <div className="flex justify-center">
            <motion.p
              className="text-[17px] text-[#00000099] leading-relaxed max-w-[700px] text-center"
              initial={{ clipPath: "inset(0% 0% 100% 0%)", opacity: 0 }}
              whileInView={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.65, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              We protect your funds with end-to-end encryption and ensure your data never falls into the wrong hands.
            </motion.p>
          </div>
        </div>

        {/* ── Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-14 xl:gap-20 mb-14 justify-items-center items-start">
          {cards.map(({ icon, title, desc }, i) => {
            const { rotate, y } = TILTS[i];

            return (
              <div
                key={title}
                ref={(el) => (cardRefs.current[i] = el)}
                className="w-full max-w-[320px] [transform-origin:top_center] rounded-3xl bg-[#EFEFF1E5] py-8 px-6 flex flex-col items-center text-center"
                style={{
                  transform:
                    window.innerWidth >= 1024
                      ? `rotateZ(${rotate}deg) translateY(${y + 20}px)`
                      : window.innerWidth >= 640
                        ? `rotateZ(${rotate * 0.4}deg) translateY(${(y + 20) * 0.5}px)`
                        : "none",
                  transition: `transform 0.7s cubic-bezier(0.22,1,0.36,1) ${200 + i * 100}ms`,
                }}
              >
                <div className="relative w-[170px] h-[170px] mb-7 flex items-center justify-center">
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.35)_0%,rgba(168,85,247,0.18)_45%,transparent_75%)] blur-[20px]" />

                  {/* White circle */}
                  <div className="w-[78px] h-[78px] rounded-full bg-white shadow-[0_0_0_6px_rgba(255,255,255,0.35),0_4px_20px_rgba(28,43,138,0.1)] flex items-center justify-center relative z-[1]">
                    <img
                      src={icon}
                      alt={title}
                      className="w-7 h-7 object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-[#1C2B8A] mb-3 leading-[1.25]">
                  {title}
                </h3>

                {/* Description */}
                <p className="text-sm text-black/50 leading-[1.65] m-0 max-w-[260px]">
                  {desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Bottom banner ── */}
        <motion.div
          initial={{ y: 20 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="bg-[#CCDBFF66] rounded-2xl px-8 py-6 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <h4 className="text-[15px] font-bold text-[#0f1d6e] mb-1">
                Why the Nigerian Tribune Is Talking About Glass
              </h4>
              <p className="text-[14px] text-[#9099b2]">
                Discover how Glass is redefining community financial security.
              </p>
            </div>
            <a
              href="https://tribuneonlineng.com/team-glass-shines-as-winner-of-5th-babcock-innovation-challenge/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 border border-[#0f1d6e] text-[#0f1d6e] font-semibold text-[14px] px-6 py-3 rounded-full no-underline transition-all hover:bg-[#0f1d6e] hover:text-white"
            >
              Check It Out
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
