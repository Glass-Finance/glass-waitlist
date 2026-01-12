import React, { useState, useEffect, useRef } from "react";

export default function MembersSolution() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const sectionRef = useRef(null);

  const features = [
    {
      iconSrc: "/icons/frame15.png",
      title: "One-Click Payments",
      description:
        "Pay your dues in seconds from any device. No more manual transfers.",
    },
    {
      iconSrc: "/icons/frame5.png",
      title: "Smart Reminders",
      description:
        "Receive automated reminders via SMS, WhatsApp, and Email so you never miss a deadline.",
    },
    {
      iconSrc: "/icons/frame6.png",
      title: "Instant Receipts",
      description:
        "View your full history and download official receipts immediately after paying.",
    },
    {
      iconSrc: "/icons/frame16.png",
      title: "Flexible Options",
      description: "Pay exactly how you want—via Card, Bank Transfer, or USSD.",
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto px-7 md:px-12">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <div
            className={`inline-flex items-center gap-2 border border-[#2E7D32] px-[15px] py-[9px] rounded-full mb-6 transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <span className="text-[13px] font-normal text-[#0E628C]">
              OUR SOLUTION
            </span>
          </div>
          <h2
            className={`text-[32px] md:text-[45px] font-medium text-black leading-tight md:leading-[80px] font-dm mb-4 transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
            style={{ transitionDelay: "0.1s" }}
          >
            Experience financial peace of mind
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-[1100px] mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`bg-white border border-gray-200 rounded-[10px] p-6 md:p-8 transition-all duration-500 ${
                hoveredCard === index
                  ? "shadow-xl border-[#17A1E5]/30 -translate-y-2 scale-105"
                  : "hover:shadow-lg"
              } ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${0.2 + index * 0.1}s` }}
            >
              <div
                className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center mb-4 transition-all duration-300 ${
                  hoveredCard === index ? "scale-110 rotate-6" : ""
                }`}
              >
                <img
                  src={feature.iconSrc}
                  alt={feature.title}
                  className="w-6 h-6 md:w-10 md:h-10"
                />
              </div>

              <h3 className="text-[24px] md:text-[28px] font-medium text-black mb-3 font-dm leading-tight">
                {feature.title}
              </h3>

              <p className="text-[16px] md:text-[18px] font-medium text-[#808080] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
