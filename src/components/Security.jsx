import { useEffect, useRef } from "react";


const cards = [
  {
    imgSrc: "/icons/frame17.png",
    imgBg: "linear-gradient(135deg, #4a2472 0%, #6b3fa0 50%, #8b5cc7 100%)",
    iconBg: "#7B5FC7",
    title: "NDPR Compliant",
    desc: "Fully licensed and compliant with Nigerian Data Protection Regulations.",
    titleColor: "#1C2B8A",
  },
  {
    imgSrc: "/icons/frame14.png",
    imgBg: "linear-gradient(135deg, #1a3a6b 0%, #1e5299 50%, #2a72c8 100%)",
    iconBg: "#2563EB",
    title: "Transparency",
    desc: "Every kobo is accounted for. No hidden fees or missing funds.",
    titleColor: "#1C2B8A",
  },
  {
    imgSrc: "/icons/frame13.png",
    imgBg: "linear-gradient(135deg, #2d6b3a 0%, #3a8a4a 50%, #4aaa5a 100%)",
    iconBg: "#16a34a",
    title: "Encryption",
    desc: "All data and transactions are encrypted. Your records are private.",
    titleColor: "#1C2B8A",
  },
];

export default function Security() {
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
    <section className="bg-[#F7F8FC] py-20 md:py-28" id="security">
      <div className="max-w-[1140px] mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <div {...anim(0, 0)}>
            <span className="inline-flex items-center border border-[#1C2B8A]/25 text-[#1C2B8A] text-[13px] font-medium px-5 py-2 rounded-full mb-8">
              Security & Trust
            </span>
          </div>
          <div {...anim(1, 80)}>
            <h2 className="text-[clamp(36px,5.5vw,64px)] font-extrabold text-[#0f1d6e] leading-tight tracking-tight mb-5 max-w-[1320px] mx-auto">
              Bank-grade security for your peace of mind
            </h2>
          </div>
          <div {...anim(2, 160)}>
            <p className="text-[16px] text-[#9099b2] max-w-[520px] mx-auto leading-relaxed">
              We protect your funds with end-to-end encryption, and ensure your data never falls into the wrong hands.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {cards.map(({ imgSrc, imgBg, iconBg, title, desc, titleColor }, i) => (
            <div
              key={title}
              {...anim(3 + i, 200 + i * 80)}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#ECEEF5] hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1C2B8A]/8 transition-all duration-300"
            >
              {/* Top — gradient bg with concentric circles + icon */}
              <div
                className="relative w-full h-[200px] flex items-center justify-center overflow-hidden"
                style={{ background: imgBg }}
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[240px] h-[240px] rounded-full border border-white/10 absolute" />
                  <div className="w-[170px] h-[170px] rounded-full border border-white/10 absolute" />
                  <div className="w-[110px] h-[110px] rounded-full border border-white/10 absolute" />
                </div>
                <div
                  className="relative z-10 w-[76px] h-[76px] rounded-full flex items-center justify-center shadow-2xl"
                  style={{ backgroundColor: iconBg }}
                >
                  <img
                    src={imgSrc}
                    alt={title}
                    className="w-9 h-9 object-contain brightness-0 invert"
                  />
                </div>
              </div>

              {/* Bottom — white text area */}
              <div className="px-6 py-6 text-center">
                <h3
                  className="text-[20px] font-extrabold mb-2 leading-tight"
                  style={{ color: titleColor }}
                >
                  {title}
                </h3>
                <p className="text-[14px] text-[#9099b2] leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom banner */}
        <div {...anim(6, 460)}>
          <div className="bg-[#EEF1FB] rounded-2xl px-8 py-6 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <h4 className="text-[15px] font-bold text-[#0f1d6e] mb-1">
                Why the Nigerian Tribune Is Talking About Glass
              </h4>
              <p className="text-[14px] text-[#9099b2]">
                Discover how Glass is redefining community financial security.
              </p>
            </div>
            <a
              href="https://tribuneonlineng.com/team-glass-shines-as-winner-of-5th-babcock-innovation-challenge/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 bg-white border border-[#D1D5E8] text-[#0f1d6e] font-semibold text-[14px] px-6 py-3 rounded-full no-underline hover:shadow-md hover:-translate-y-px transition-all"
            >
              Check It Out
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}