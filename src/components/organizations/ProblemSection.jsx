import { useEffect, useRef } from "react";
import { Clock, Eye, Lightbulb } from "lucide-react";
import Problem from "../../assets/problem.png";
import Overlay from "../../assets/Overlay.png";

const problems = [
  {
    Icon: Clock,
    title: "How much time is your team losing to manual reconciliation?",
    desc: "Bank alerts and spreadsheets consume hours every month.",
  },
  {
    Icon: Eye,
    title: "Can your members clearly see how funds are managed?",
    desc: "Limited transparency reduces trust and slows compliance.",
  },
];

export default function ProblemSection() {
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

  return (
    <section className="py-20 md:py-28 relative" id="problem">
      {/* Overlay background image */}
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
      <div className="max-w-[1140px] mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div>
            <span className="inline-flex items-center border border-[#1C2B8A]/30 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full mb-6">
              THE PROBLEM
            </span>
          </div>
          <div>
            <h2 className="text-[clamp(26px,5vw,58px)] font-bold text-[#0f1d6e] leading-tight tracking-tight mb-4">
              Still spending weekends chasing payments?
            </h2>
          </div>
          <div>
            <p className="text-[17px] text-[#00000099] max-w-[720px] mx-auto leading-relaxed">
              Without centralized visibility, time is wasted and trust begins to
              weaken.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
          {/* LEFT */}
          <div className="flex flex-col gap-10">
            {problems.map(({ Icon, title, desc }, i) => (
              <div key={title} className="flex items-start gap-5">
                <div className="flex-shrink-0 w-[60px] h-[60px] rounded-full bg-white shadow-[0_2px_12px_rgba(28,43,138,0.10)] border border-[#e8eaf5] flex items-center justify-center mt-0.5">
                  <Icon className="w-[24px] h-[24px] text-[#1C2B8A]" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-[22px] font-bold text-[#0f1d6e] leading-snug mb-2">
                    {title}
                  </h3>
                  <p className="text-[17px] text-[#808080] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT */}
          <div className="w-full max-w-[640px] flex flex-col mx-auto lg:mx-0">
            <div
              className="relative rounded-2xl overflow-hidden w-full shadow-xl shadow-[#1C2B8A]/15"
              style={{ aspectRatio: "458 / 250" }}
            >
              <img
                src={Problem}
                alt="Manual reconciliation on laptop and phone"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: "50% 40%" }}
              />
            </div>

            <div
              className="rounded-2xl shadow-lg shadow-[#1C2B8A]/10 border border-[#eef0f8] px-5 py-4 flex items-center gap-4 self-start"
              style={{
                marginTop: "-28px",
                marginLeft: "-20px",
                width: "260px",
                position: "relative",
                zIndex: 10,
                backgroundColor: "#EFEFF199",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-[#eef0fb] flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-[#1C2B8A]" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#0f1d6e] leading-tight">
                  Your Solution Awaits.
                </p>
                <p className="text-[14px] text-[#00000099] text-center leading-snug mt-1">
                  Experience financial<br />transparency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}