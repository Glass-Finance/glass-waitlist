import { useEffect, useRef } from "react";
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

export default function MembersSolution() {
  const itemsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1 },
    );
    itemsRef.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // const anim = (i, delay = 0) => ({
  //   ref: (el) => (itemsRef.current[i] = el),
  //   style: {
  //     opacity: 0,
  //     transform: "translateY(28px)",
  //     transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
  //   },
  // });

  return (
    <section className="py-20 md:py-28 relative" id="solution">
      {/* Background overlay */}
      <div
        className="relative inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${Overlay})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.9,
        }}
      />

      <div className="max-w-[1140px] mx-auto px-6 relative z-30">
        {/* Header */}
        <div className="text-center mb-12">
          <div>
            <span className="inline-flex items-center border border-[#1C2B8A]/25 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full mb-5">
              Our Solution
            </span>
          </div>
          <div>
            <h2 className="text-[clamp(26px,5vw,58px)] font-bold text-[#0f1d6e] leading-tight tracking-tight mb-4">
              Experience Financial Peace Of Mind
            </h2>
          </div>
          <div>
            <p className="text-[17px] md:text-[16px] text-[#00000099] max-w-[700px] mx-auto leading-relaxed">
              Make payments in seconds, track everything in one place, and never
              miss a due date again.
            </p>
          </div>
        </div>

        {/* 2-col grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(
            ({ icon, title, desc, illustration, imgTransform }, i) => (
              <div
                key={title}
                className="hover:-translate-y-1 transition-transform duration-300 cursor-default flex flex-col"
                style={{
                  borderRadius: 16,
                  background: "#EFEFF1",
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.75) inset, 0 2px 12px rgba(28,43,138,0.07), 0 1px 3px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                }}
              >
                {/* ── Top: icon + text ── */}
                <div className="flex items-start gap-3 px-6 pt-5 pb-0">
                  <img
                    src={icon}
                    alt=""
                    style={{
                      width: 44,
                      height: 44,
                      objectFit: "contain",
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#0f1d6e",
                        lineHeight: 1.3,
                        marginBottom: 4,
                      }}
                    >
                      {title}
                    </h3>
                    <p
                      style={{
                        fontSize: 15,
                        color: "#00000099",
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {desc}
                    </p>
                  </div>
                </div>

                {/* ── Bottom: illustration panel ── */}
                <div
                  className="relative"
                  style={{ height: 240, overflow: "hidden", flexShrink: 0 }}
                >
                  {/* Light background */}
                  <img
                    src={lightBg}
                    alt=""
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                      display: "block",
                      opacity: 0.3,
                    }}
                    draggable={false}
                  />

                  {/* Top fade */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "18%",
                      background:
                        "linear-gradient(to bottom, #EFEFF1 0%, rgba(239,239,241,0.7) 50%, rgba(239,239,241,0) 100%)",
                      pointerEvents: "none",
                      zIndex: 5,
                    }}
                  />

                  {/* Illustration — NO transform, just fill naturally */}
                  <img
                    src={illustration}
                    alt={title}
                    style={{
                      position: "absolute",
                      bottom: 0, // anchor to bottom edge like the goal
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "100%",
                      height: "auto",
                      objectFit: "contain",
                      display: "block",
                      zIndex: 10,
                    }}
                    draggable={false}
                  />
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
