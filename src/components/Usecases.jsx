import { useEffect, useRef } from "react";
import case1 from "../assets/case1.png";
import case2 from "../assets/case2.png";
import case3 from "../assets/case3.png";
import case4 from "../assets/case4.png";

const cases = [
  {
    img: case1,
    title: "Schools & Alumni",
    desc: "Collect school fees and alumni dues without the reconciliation headache.",
  },
  {
    img: case2,
    title: "Religious Organizations",
    desc: "Track tithes and building fund pledges with total transparency.",
  },
  {
    img: case3,
    title: "Clubs & Associations",
    desc: "Collect monthly dues and event fees in seconds, not hours.",
  },
  {
    img: case4,
    title: "Professional Bodies",
    desc: "Manage annual membership dues and certification fees effortlessly.",
  },
];

export default function UseCases() {
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
    <section className="bg-[#F7F8FC] py-20 md:py-28" id="use-cases">
      <div className="max-w-[1140px] mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <div {...anim(0, 0)}>
            <span className="inline-flex items-center border border-[#1C2B8A]/25 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full mb-7">
              Use Cases
            </span>
          </div>
          <div {...anim(1, 80)}>
            <h2 className="text-[clamp(36px,5.5vw,64px)] font-extrabold text-[#0f1d6e] leading-tight tracking-tight mb-4 max-w-[800px] mx-auto">
              Built for every Nigerian community
            </h2>
          </div>
          <div {...anim(2, 160)}>
            <p className="text-[16px] text-[#9099b2] max-w-[500px] mx-auto leading-relaxed">
              Whether you run a small club or a national association, Glass scales with you.
            </p>
          </div>
        </div>

        {/* 2×2 card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {cases.map(({ img, title, desc }, i) => (
            <div
              key={title}
              {...anim(3 + i, 200 + i * 70)}
              className="bg-white rounded-3xl overflow-hidden border border-[#ECEEF5] shadow-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1C2B8A]/8 transition-all duration-300"
            >
              {/* Photo */}
              <div className="w-full h-[240px] overflow-hidden">
                <img
                  src={img}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Text */}
              <div className="px-8 py-7 text-center">
                <h3 className="text-[22px] font-extrabold text-[#0f1d6e] mb-2 leading-tight">
                  {title}
                </h3>
                <p className="text-[15px] text-[#9099b2] leading-relaxed max-w-[320px] mx-auto">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}