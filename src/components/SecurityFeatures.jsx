import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import BlurText from "./ui/BlurText";
import CloudImage from "./common/CloudImage";

const cards = [
  {
    publicId: "glass/security/transparency",
    title: "Transparency",
    desc: "Every fee is shown before you pay. Your community always receives the full due.",
  },
  {
    publicId: "glass/security/ndpr-compliant",
    title: "NDPR Compliant",
    desc: "Your rights — access, correction, and deletion — are set out in our Privacy Policy under the Nigeria Data Protection Act 2023.",
  },
  {
    publicId: "glass/security/encryption",
    title: "Encryption",
    desc: "Bank details, identity documents, and MFA secrets are AES-256 encrypted at rest; everything is TLS-encrypted in transit.",
  },
];

const TILTS = [
  { rotate: -3, y: 18 },
  { rotate: 0, y: 0 },
  { rotate: 3, y: 18 },
];

export default function SecurityFeatures() {
  const cardRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const idx = cardRefs.current.indexOf(entry.target);
          if (idx === -1) return;

          const { rotate, y } = TILTS[idx];

          entry.target.style.transform =
            window.innerWidth >= 1024 ? `rotateZ(${rotate}deg) translateY(${y}px)` : "none";

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
    <section className="relative isolate overflow-hidden py-20 md:py-28" id="security">
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
                text="Your Money and Data Are Protected at Every Layer"
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
              Your money moves through Paystack straight to your community's account — we never hold
              it. Your data is AES-256 encrypted, access-controlled, and monitored around the clock.
            </motion.p>
          </div>
        </div>

        {/* ── Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-14 xl:gap-20 mb-14 justify-items-center items-start">
          {cards.map(({ publicId, title, desc }, i) => {
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
                    <CloudImage
                      publicId={publicId}
                      alt={title}
                      width={84}
                      objectFit="contain"
                      className="w-7 h-7"
                    />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-[#1C2B8A] mb-3 leading-[1.25]">{title}</h3>

                {/* Description */}
                <p className="text-sm text-black/50 leading-[1.65] m-0 max-w-[260px]">{desc}</p>
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
                See how Team Glass took the ₦1,000,000 grand prize at the 5th Babcock Innovation
                Challenge.
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
