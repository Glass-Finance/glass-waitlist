import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import GridBackground from "../GridBackground";

export default function Security() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const sectionRef = useRef(null);

  const features = [
    {
      iconSrc: "/icons/frame12.png",
      title: "NDPR Compliant",
      description:
        "Fully compliant with Nigeria Data Protection Regulation. Your members' data is protected and secure.",
    },
    {
      iconSrc: "/icons/frame13.png",
      title: "Encryption",
      description:
        "Bank-grade 256-bit encryption keeps all financial data secure. Your information is always protected.",
    },
    {
      iconSrc: "/icons/frame14.png",
      title: "Transparency",
      description:
        "Complete audit trail of every transaction. Members can access and verify all financial records anytime.",
    },
  ];

  // Badge animation - drops down
  const badgeVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

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
    <GridBackground variant="default">
      <section ref={sectionRef} className="relative w-full py-16 md:py-24">
        <div className="w-full max-w-[1280px] mx-auto px-6 md:px-12">
          {/* Section Header */}
          <div className="flex flex-col items-center text-center mb-12 md:mb-16">
            <motion.div
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
              variants={badgeVariants}
              className="inline-flex items-center gap-2 border border-[#0E628C] px-4 py-2.5 rounded-full mb-6"
            >
              <span className="text-sm font-normal text-[#0E628C]">
                SECURITY
              </span>
            </motion.div>

            {/* Main Heading - Different for Mobile and Desktop */}
            <h2
              className={`font-medium text-black font-dm mb-4 max-w-4xl transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              {/* Mobile - Two lines */}
              <span className="md:hidden block text-[40px] leading-[40px]">
                Bank-grade security for
                <br />
                your peace of mind
              </span>

              {/* Desktop - One line */}
              <span className="hidden md:block text-5xl lg:text-[40px] leading-tight">
                Bank-grade security for your peace of mind
              </span>
            </h2>

            {/* Subtitle */}
            <p
              className={`text-base md:text-md font-medium text-[#808080] leading-relaxed max-w-4xl transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: "0.1s" }}
            >
              We protect your funds with end-to-end encryption, and ensure your
              data never falls into the wrong hands.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`flex flex-col items-center text-center bg-white border border-gray-200 rounded-2xl p-8 transition-all duration-500 ${
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
                  className={`flex items-center justify-center w-20 h-20 mb-6 transition-all duration-300 ${
                    hoveredCard === index ? "scale-110 rotate-6" : ""
                  }`}
                >
                  <img
                    src={feature.iconSrc}
                    alt={feature.title}
                    className="w-12 h-14"
                  />
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-medium text-black mb-3 font-dm">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm md:text-base font-medium text-[#808080] leading-relaxed">
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
