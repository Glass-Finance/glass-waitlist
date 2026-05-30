import { useEffect, useRef } from "react";
import Overlay from "../assets/Overlay2.png";
import case1 from "../assets/usecase/case1.png";
import case2 from "../assets/usecase/case2.png";
import case3 from "../assets/usecase/case3.png";
import case4 from "../assets/usecase/case4.png";

const cases = [
  {
    img: case1,
    title: "Schools & Alumni",
    desc: "Collect school fees and alumni dues without the reconciliation headache.",
  },
  {
    img: case4,
    title: "Professional Bodies",
    desc: "Manage annual membership dues and certification fees effortlessly.",
  },
  {
    img: case3,
    title: "Clubs & Associations",
    desc: "Collect monthly dues and event fees in seconds, not hours.",
  },
  {
    img: case2,
    title: "Religious Organizations",
    desc: "Track tithes and building fund pledges with total transparency.",
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
    <section className="bg-[#F7F8FC] py-20 md:py-28" id="use-cases">
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
      <div className="max-w-[1140px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <div>
            <span className="inline-flex items-center border border-[#1C2B8A]/25 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full mb-7">
              Use Cases
            </span>
          </div>
          <div>
            <h2 className="text-[clamp(26px,5.5vw,64px)] font-bold text-[#0f1d6e] leading-tight tracking-tight mb-4 max-w-[800px] mx-auto">
              Built for every Nigerian community
            </h2>
          </div>
          <div>
            <p className="text-[17px] text-[#00000099] max-w-[500px] mx-auto leading-relaxed">
              Whether you run a small club or a national association, Glass
              scales with you.
            </p>
          </div>
        </div>

        {/* 2×2 card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {cases.map(({ img, title, desc }, i) => (
            <div
              key={title}
              className="bg-[#F0F1F7] rounded-xl md:rounded-3xl border border-[#ECEEF5] shadow-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1C2B8A]/8 transition-all duration-300 p-1.5"
            >
              {/* Photo */}
              <div className="w-full h-[180px] md:h-[260px] overflow-hidden rounded-lg md:rounded-2xl">
                <img
                  src={img}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Text */}
              <div className="px-2 py-5 text-left">
                <h3 className="text-[22px] font-bold text-[#0f1d6e] mb-2 leading-tight">
                  {title}
                </h3>
                <p className="text-[15px] text-[#9099b2] leading-relaxed max-w-[320px]">
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
