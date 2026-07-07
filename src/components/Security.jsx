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

export default function Security() {
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
          style={{ y: orb1Y, position: "absolute", top: "10%", left: "5%", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(28,43,138,0.08) 0%, transparent 70%)", filter: "blur(60px)", willChange: "transform" }}
        />
        <motion.div
          style={{ y: orb2Y, position: "absolute", bottom: "12%", right: "8%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)", filter: "blur(55px)", willChange: "transform" }}
        />
        <motion.div
          style={{ y: orb3Y, position: "absolute", top: "40%", right: "20%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(28,43,138,0.05) 0%, transparent 70%)", filter: "blur(45px)", willChange: "transform" }}
        />
      </div>
      <div className="relative z-10 max-w-[1140px] mx-auto px-6">
        {/* ── Header ── */}
        <div className="mb-8 md:mb-16" style={{ textAlign: "center" }}>
          {/* Badge */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "clamp(16px, 4vw, 28px)",
            }}
          >
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <h2
              className="text-[clamp(32px,5.5vw,58px)] font-bold text-[#0f1d6e] leading-tight tracking-tight"
              style={{ maxWidth: 1080 }}
            >
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
          <div style={{ display: "flex", justifyContent: "center" }}>
            <motion.p
              className="text-[17px] text-[#00000099] leading-relaxed"
              style={{ maxWidth: 700, textAlign: "center" }}
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
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-14 xl:gap-20 mb-14 justify-items-center"
          style={{ alignItems: "start" }}
        >
          {cards.map(({ icon, title, desc }, i) => {
            const { rotate, y } = TILTS[i];

            return (
              <div
                key={title}
                ref={(el) => (cardRefs.current[i] = el)}
                style={{
                  width: "100%",
                  maxWidth: "320px",

                  transform:
                    window.innerWidth >= 1024
                      ? `rotateZ(${rotate}deg) translateY(${y + 20}px)`
                      : window.innerWidth >= 640
                        ? `rotateZ(${rotate * 0.4}deg) translateY(${(y + 20) * 0.5}px)`
                        : "none",
                        
                  transition: `transform 0.7s cubic-bezier(0.22,1,0.36,1) ${200 + i * 100}ms`,

                  transformOrigin: "top center",

                  borderRadius: 24,
                  background: "#EFEFF1E5",

                  padding: "32px 24px",

                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",

                  // boxShadow:
                  //   "0 0 0 1px rgba(255,255,255,0.7) inset, 0 2px 16px rgba(28,43,138,0.06)",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 170,
                    height: 170,
                    marginBottom: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Glow */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle, rgba(168,85,247,0.35) 0%, rgba(168,85,247,0.18) 45%, transparent 75%)",
                      filter: "blur(20px)",
                    }}
                  />

                  {/* White circle */}
                  <div
                    style={{
                      width: 78,
                      height: 78,
                      borderRadius: "50%",
                      background: "#fff",
                      boxShadow:
                        "0 0 0 6px rgba(255,255,255,0.35), 0 4px 20px rgba(28,43,138,0.10)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <img
                      src={icon}
                      alt={title}
                      style={{
                        width: 28,
                        height: 28,
                        objectFit: "contain",
                      }}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#1C2B8A",
                    marginBottom: 12,
                    lineHeight: 1.25,
                  }}
                >
                  {title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontSize: 14,
                    color: "rgba(0,0,0,0.5)",
                    lineHeight: 1.65,
                    margin: 0,
                    maxWidth: 260,
                  }}
                >
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
              className="flex-shrink-0 border border-[#0f1d6e] text-[#0f1d6e] font-semibold text-[14px] px-6 py-3 rounded-full no-underline transition-all"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0f1d6e";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "";
                e.currentTarget.style.color = "#0f1d6e";
              }}
            >
              Check It Out
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
