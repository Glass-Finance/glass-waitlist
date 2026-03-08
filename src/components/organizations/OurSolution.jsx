import { useEffect, useRef } from "react";
import icon1 from "../../assets/icon/frame (1).png";
import icon2 from "../../assets/icon/frame (2).png";
import icon3 from "../../assets/icon/frame (3).png";
import icon4 from "../../assets/icon/frame (4).png";

const features = [
  {
    icon: icon2,
    title: "Automate Recurring Payments",
    desc: "Members link their cards once, and dues are deducted automatically.",
  },
  {
    icon: icon1,
    title: "Recover Failed Payments Automatically",
    desc: "When a payment fails, Glass retries securely and sends gentle SMS reminders",
  },
  {
    icon: icon3,
    title: "Generate Instant Proof & Reconciliation",
    desc: "Receipts are issued automatically, and every transaction is logged in a clean, reconciled ledger",
  },
  {
    icon: icon4,
    title: "Monitor Payments in Real Time",
    desc: "See who has paid, who hasn't, and your total balance instantly",
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
    <section className="bg-[#F7F8FC]  py-20 md:py-28" id="solution">
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
              Built-In Transparency for Every<br />Transaction
            </h2>
          </div>
          <div {...anim(2, 160)}>
            <p className="text-[16px] text-[#9099b2] max-w-[580px] mx-auto leading-relaxed">
              Centralize payments, records, and visibility in one shared system, so your team stops chasing and starts leading.
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