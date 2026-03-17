import { useEffect, useRef } from "react";
import icon1 from "../../assets/icon/frame (1).png";
import icon2 from "../../assets/icon/frame (2).png";
import icon3 from "../../assets/icon/frame (3).png";
import icon4 from "../../assets/icon/frame (4).png";

const features = [
  {
    icon: icon2,
    title: "Set It and Forget It.",
    desc: "Link your card once. Dues are deducted automatically.",
  },
  {
    icon: icon1,
    title: "Set Reminders",
    desc: "Get automated reminders via SMS, WhatsApp, and email.",
  },
  {
    icon: icon3,
    title: "Instant Proof Of Payment",
    desc: "View your full history and download official receipts immediately after paying.",
  },
  {
    icon: icon4,
    title: "Flexible Options",
    desc: "Pay exactly how you want, via Card, Bank Transfer, or USSD.",
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
      { threshold: 0.1 }
    );
    itemsRef.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const anim = (i, delay = 0) => ({
    ref: (el) => (itemsRef.current[i] = el),
    style: {
      opacity: 0,
      transform: "translateY(28px)",
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    },
  });

  return (
    <section className="bg-[#F7F8FC] py-20 md:py-28" id="members-solution">
      <div className="max-w-[1140px] mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <div {...anim(0, 0)}>
            <span className="inline-flex items-center border border-[#1C2B8A]/25 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full mb-6">
              Our Solution
            </span>
          </div>
          <div {...anim(1, 80)}>
            <h2 className="text-[clamp(32px,5vw,58px)] font-extrabold text-[#0f1d6e] leading-tight tracking-tight mb-4">
              Experience Financial Peace Of Mind
            </h2>
          </div>
          <div {...anim(2, 160)}>
            <p className="text-[16px] text-[#9099b2] max-w-[560px] mx-auto leading-relaxed">
              Make payments in seconds, track everything in one place, and never miss a due date again.
            </p>
          </div>
        </div>

        {/* 2x2 Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map(({ icon, iconBg, title, desc }, i) => (
            <div
              key={title}
              {...anim(3 + i, 200 + i * 80)}
              className="group bg-white border border-[#E8EAF0] rounded-3xl p-10 flex flex-col items-center text-center hover:shadow-xl hover:shadow-[#1C2B8A]/8 hover:-translate-y-1 transition-all duration-300 cursor-default"
            >
              {/* Circle icon */}
              <div className={`flex items-center justify-center mb-8`}>
                <img src={icon} alt={title} className="w-[72px] h-[72px] object-contain" />
              </div>

              <h3 className="text-[22px] font-extrabold text-[#0f1d6e] leading-snug mb-3">
                {title}
              </h3>
              <p className="text-[15px] text-[#9099b2] leading-relaxed max-w-[320px]">
                {desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}