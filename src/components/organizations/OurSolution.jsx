import React, { useState, useEffect, useRef } from "react";
import GridBackground from "./../GridBackground";

export default function OurSolution() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const sectionRef = useRef(null);

  const features = [
    {
      iconSrc: "/icons/frame4.png",
      title: "Set it and forget it",
      description:
        "Create payment schedules once. We'll handle reminders, tracking, and follow-ups automatically.",
    },
    {
      iconSrc: "/icons/frame5.png",
      title: "We chase, so you don't",
      description:
        "Automated reminders via SMS and email mean you never have to awkwardly ask for payments again.",
    },
    {
      iconSrc: "/icons/frame6.png",
      title: "Instant proof of payment",
      description:
        "Members upload receipts directly. No more chasing screenshots or wondering who paid.",
    },
    {
      iconSrc: "/icons/frame7.png",
      title: "Total visibility",
      description:
        "Everyone sees the same dashboard. No more questions about where the money went.",
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
    <GridBackground variant="alternate">
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
              Automation puts you back in control
            </h2>
          </div>

          {/* Features Grid with stagger animation */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-[1100px] mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`bg-white border border-gray-200 rounded-[20px] p-6 md:p-8 transition-all duration-500 ${
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
                {/* Icon */}
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

                {/* Title */}
                <h3 className="text-[24px] md:text-[28px] font-medium text-black mb-3 font-dm leading-tight">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-[16px] md:text-[18px] font-medium text-[#808080] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </GridBackground>
  );
}
