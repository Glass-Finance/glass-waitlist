import { useEffect, useRef } from "react";
import { Clock, Eye, Lightbulb } from "lucide-react";
import Problem from "../../assets/problem.png";
import Gradient from "/gradient.png";

const problems = [
  {
    Icon: Clock,
    title: "Missing Payment Deadlines?",
    desc: "Important reminders get lost in group chats.",
  },
  {
    Icon: Eye,
    title: "Still Switching Between Apps To Pay?",
    desc: "Copying account numbers and switching apps turns a simple payment into a chore.",
  },
  {
    Icon: Eye,
    title: "Can't See What You've Already Paid?",
    desc: "You end up scrolling through chats for proof of payment.",
  },
];

export default function MembersProblem() {
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

  const anim = (i, delay = 0) => ({
    ref: (el) => (itemsRef.current[i] = el),
    style: {
      opacity: 0,
      transform: "translateY(28px)",
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    },
  });

  return (
    <section className="bg-[#F7F8FC] py-20 md:py-28" id="members-problem">
      <div className="max-w-[1140px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div {...anim(0, 0)}>
            <span className="inline-flex items-center border border-[#1C2B8A]/30 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full mb-6">
              THE PROBLEM
            </span>
          </div>
          <div {...anim(1, 80)}>
            <h2 className="text-[clamp(32px,5vw,58px)] font-extrabold text-[#0f1d6e] leading-tight tracking-tight mb-4">
              Paying Dues Shouldn't Be A Hassle
            </h2>
          </div>
          <div {...anim(2, 160)}>
            <p className="text-[16px] text-[#9099b2] max-w-[720px] mx-auto leading-relaxed">
              Between scattered reminders, manual transfers, and lost receipts,
              keeping up with community payments becomes harder than it should
              be.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-start">
          {/* LEFT */}
          <div className="flex flex-col gap-8">
            {problems.map(({ Icon, title, desc }, i) => (
              <div
                key={title}
                {...anim(3 + i, 220 + i * 120)}
                className="flex items-start gap-5"
              >
                <div className="flex-shrink-0 w-[60px] h-[60px] rounded-full bg-white shadow-[0_2px_12px_rgba(28,43,138,0.10)] border border-[#e8eaf5] flex items-center justify-center mt-0.5">
                  <Icon
                    className="w-[18px] h-[18px] text-[#1C2B8A]"
                    strokeWidth={1.8}
                  />
                </div>
                <div>
                  <h3 className="text-[22px] font-bold text-[#0f1d6e] leading-snug mb-2">
                    {title}
                  </h3>
                  <p className="text-[17px] text-[#9099b2] leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT */}
          <div {...anim(6, 300)} className="w-full max-w-[450px]">
            <div className="relative" style={{ paddingBottom: "72px" }}>
              {/* Image */}
              <div
                className="relative rounded-2xl overflow-hidden w-full shadow-xl shadow-[#1C2B8A]/15"
                style={{ aspectRatio: "458 / 220" }}
              >
                <img
                  src={Problem}
                  alt="Person managing payments on phone"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: "72% 50%" }}
                />
                {/* Gradient overlay */}
                <img
                  src={Gradient}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  style={{ mixBlendMode: "multiply", opacity: 0.85 }}
                />
              </div>

              {/* Floating card — overlaps bottom of image, left-aligned */}
              <div
                className="absolute bottom-0 left-4 bg-white rounded-2xl shadow-lg shadow-[#1C2B8A]/10 border border-[#eef0f8] px-5 py-4 flex items-center gap-4 w-[260px]"
                style={{
                  marginTop: "-28px",
                  marginLeft: "-60px",
                  width: "260px",
                  position: "relative",
                  zIndex: 10,
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-[#eef0fb] flex items-center justify-center flex-shrink-0">
                  <Lightbulb
                    className="w-5 h-5 text-[#1C2B8A]"
                    strokeWidth={1.8}
                  />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#0f1d6e] leading-tight">
                    Your Solution Awaits.
                  </p>
                  <p className="text-[12px] text-[#9099b2] leading-snug mt-1">
                    Experience financial transparency.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
