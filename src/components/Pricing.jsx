import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { goToApp } from "../utils/deviceRedirect";
import { Check, ArrowRight } from "lucide-react";
import BlurText from "./ui/BlurText";

const features = [
  "Unlimited members",
  "Automated dues collection",
  "Real-time payment dashboard",
  "Auto-retry failed payments",
  "WhatsApp & SMS reminders",
  "Exportable transaction reports",
  "Member invite links",
  "Bank-grade AES-256 encryption",
];

export default function Pricing() {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const badgeRef = useRef(null);

  useEffect(() => {
    const io1 = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          e.target.style.clipPath = "inset(0% 0% 0% 0%)";
          io1.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    const io2 = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          e.target.style.opacity = "1";
          e.target.style.transform = "translateY(0)";
          io2.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    if (badgeRef.current) {
      badgeRef.current.style.clipPath = "inset(0% 100% 0% 0%)";
      badgeRef.current.style.transition = "clip-path 0.55s cubic-bezier(0.22,1,0.36,1)";
      io1.observe(badgeRef.current);
    }

    if (cardRef.current) {
      cardRef.current.style.opacity = "0";
      cardRef.current.style.transform = "translateY(28px)";
      cardRef.current.style.transition =
        "opacity 0.7s ease 80ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) 80ms";
      io2.observe(cardRef.current);
    }

    return () => { io1.disconnect(); io2.disconnect(); };
  }, []);

  return (
    <section className="bg-[#F7F8FC] py-20 md:py-28" id="pricing">
      <div className="max-w-[1140px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <span
              ref={badgeRef}
              className="inline-flex items-center border border-[#1C2B8A]/25 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full"
            >
              Pricing
            </span>
          </div>
          <h2 className="text-[clamp(32px,5vw,58px)] font-bold text-[#0f1d6e] leading-tight tracking-tight mb-4">
            <BlurText
              text="Free while we're in beta"
              animateBy="words"
              direction="top"
              delay={60}
              stepDuration={0.4}
              centered
            />
          </h2>
          <p className="text-[17px] text-[#9099b2] max-w-[520px] mx-auto leading-relaxed">
            Every feature, no credit card required. Transparent pricing when we launch — we&apos;ll notify you first.
          </p>
        </div>

        {/* Pricing card */}
        <div className="flex justify-center">
          <style>{`
            @property --pg-angle {
              syntax: "<angle>";
              initial-value: 0deg;
              inherits: false;
            }
            @keyframes spin-border {
              to { --pg-angle: 360deg; }
            }
            .pricing-glow-wrap {
              padding: 2px;
              border-radius: 26px;
              background: conic-gradient(
                from var(--pg-angle),
                #002FA7 0%,
                #4f46e5 22%,
                #7c3aed 44%,
                #002FA7 55%,
                #7c3aed 78%,
                #4f46e5 88%,
                #002FA7 100%
              );
              animation: spin-border 5s linear infinite;
            }
          `}</style>
          <div className="pricing-glow-wrap w-full max-w-[460px]">
          <div
            ref={cardRef}
            className="w-full bg-white rounded-3xl overflow-hidden"
          >
            {/* Dark header strip */}
            <div className="bg-[#0f1d6e] px-8 py-6">
              <div className="flex items-start justify-between mb-1">
                <p className="text-white/60 text-[13px] font-medium">Beta Access</p>
                <span className="bg-white/10 border border-white/20 text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                  Limited spots
                </span>
              </div>
              <p className="text-white text-[42px] font-bold leading-none mt-2">
                ₦0
                <span className="text-white/45 text-[17px] font-normal ml-1.5">/ month</span>
              </p>
            </div>

            {/* Features list */}
            <div className="px-8 py-7">
              <div className="grid grid-cols-1 gap-3.5 mb-8">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-[18px] h-[18px] rounded-full bg-[#1C2B8A]/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-[#1C2B8A]" strokeWidth={3} />
                    </div>
                    <span className="text-[14px] text-[#0f1d6e] font-medium">{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => goToApp("/sign-up", navigate)}
                className="w-full bg-[#0f1d6e] text-white font-semibold text-[15px] py-[15px] rounded-2xl flex items-center justify-center gap-2.5 transition-all duration-200 hover:bg-[#1C2B8A] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(15,29,110,0.28)]"
              >
                Create Your Community Free
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-[12px] text-[#b0b8cc] mt-4">
                No credit card · No hidden fees · Cancel any time
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
