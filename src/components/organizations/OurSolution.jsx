import { useEffect, useRef } from "react";
import icon1 from "../../assets/icon/frame1.png";
import icon2 from "../../assets/icon/frame2.png";
import icon3 from "../../assets/icon/frame3.png";
import icon4 from "../../assets/icon/frame4.png";

import featureAutomate from "../../assets/solution/automate.png";
import featureRecover from "../../assets/solution/recover.png";
import featureProof from "../../assets/solution/proof.png";
import featureMonitor from "../../assets/solution/monitor.png";
import Overlay from "../../assets/Overlay2.png";
import lightBg from "../../assets/solution/bg-light.png";

const features = [
  {
    icon: icon2,
    title: "Automate Recurring Payments",
    desc: "Members link their cards once, and dues are deducted automatically.",
    illustration: featureAutomate,
  },
  {
    icon: icon1,
    title: "Auto-recover failed payments",
    desc: "When a payment fails, Glass retries securely and sends gentle SMS reminders",
    illustration: featureRecover,
  },
  {
    icon: icon3,
    title: "Generate Instant Proof",
    desc: "Auto-issued receipts and reconciled transaction logs.",
    illustration: featureProof,
  },
  {
    icon: icon4,
    title: "Monitor Payments in Real Time",
    desc: "See who has paid, who hasn't, and your total balance instantly",
    illustration: featureMonitor,
  },
];

export default function OurSolution() {
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
      {/* Same overlay as problem section */}
      <div
        className="relative inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${Overlay})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.6,
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
              Built-In Transparency for Every
              <br className="hidden md:block" /> Transaction
            </h2>
          </div>
          <div>
            <p className="text-[17px] md:text-[16px] text-[#00000099] max-w-[700px] mx-auto leading-relaxed">
              Centralize payments, records, and visibility in one shared system,
              so your team stops chasing and starts leading.
            </p>
          </div>
        </div>

        {/* Grid — 1 col mobile, 2 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(
            ({ icon, title, desc, illustration, imgTransform }, i) => (
              <div
                key={title}
                className="flex flex-col hover:-translate-y-1 transition-all duration-300 cursor-default"
                style={{
                  borderRadius: "12px",
                  background: "#EFEFF1",
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.75) inset, 0 2px 12px rgba(28,43,138,0.07), 0 1px 3px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                  width: "100%",
                }}
              >
                {/* Icon + text
                  — no fixed height so text wraps freely on mobile
                  — smaller padding on mobile via clamp */}
                <div
                  className="flex items-start gap-3 flex-shrink-0"
                  style={{
                    padding:
                      "clamp(16px, 3vw, 28px) clamp(14px, 2.5vw, 20px) clamp(6px, 1vw, 8px)",
                  }}
                >
                  <img
                    src={icon}
                    alt=""
                    style={{
                      width: "clamp(36px, 5vw, 50px)",
                      height: "clamp(36px, 5vw, 50px)",
                      objectFit: "contain",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: "clamp(14px, 2.5vw, 18px)",
                        fontWeight: 700,
                        color: "#0f1d6e",
                        lineHeight: 1.3,
                        marginBottom: "4px",
                      }}
                    >
                      {title}
                    </h3>
                    <p
                      style={{
                        fontSize: "clamp(15px, 2vw, 18px)",
                        color: "#00000099",
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {desc}
                    </p>
                  </div>
                </div>

                {/* Illustration panel */}
                <div
                  className="relative flex-shrink-0 h-[200px] md:h-[280px]"
                  style={{ height: "240px", overflow: "hidden" }}
                >
                  {/* lightBg — full bleed behind everything */}
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

                  {/* Top fade — thin, just blends card bg into lightBg */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "10%",
                      background:
                        "linear-gradient(to bottom, #EFEFF1 0%, rgba(239,239,241,0.7) 50%, rgba(239,239,241,0) 100%)",
                      pointerEvents: "none",
                      zIndex: 5,
                    }}
                  />

                  {/* Illustration — anchored to bottom, fills width naturally */}
                  <img
                    src={illustration}
                    alt={title}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "85%",
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
