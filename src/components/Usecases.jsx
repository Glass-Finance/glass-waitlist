import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import GridBackground from "./GridBackground";

export default function UseCases() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const sectionRef = useRef(null);

  const useCases = [
    {
      iconSrc: "/icons/frame8.png",
      title: "Schools & Alumni",
      description:
        "Collect tuition, event fees, and alumni contributions with complete transparency and automated reminders.",
    },
    {
      iconSrc: "/icons/frame9.png",
      title: "Religious Organizations",
      description:
        "Manage tithes, offerings, and special projects with full accountability and member access to all records.",
    },
    {
      iconSrc: "/icons/frame10.png",
      title: "Residential Estates",
      description:
        "Automate service charges and levies. Members see exactly how every naira is spent on estate maintenance.",
    },
    {
      iconSrc: "/icons/frame11.png",
      title: "Professional Bodies",
      description:
        "Manage membership dues, event fees, and certification payments with automated compliance tracking.",
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
    <GridBackground variant="alternate">
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
                USECASES
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
              {/* Mobile - Two lines with specific styling */}
              <span className="md:hidden block text-[40px] leading-[40px]">
                Built for every
                <br />
                Nigerian community
              </span>

              {/* Desktop - One line */}
              <span className="hidden md:block text-5xl lg:text-[40px] leading-tight">
                Built for every Nigerian community
              </span>
            </h2>

            <p className="text-base md:text-md font-medium text-[#808080] leading-relaxed max-w-4xl">
              Whether you run a small club or a national association, Glass
              scales with you.
            </p>
          </div>

          {/* Use Cases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`flex flex-col bg-white border border-gray-200 rounded-2xl p-8 md:p-10 transition-all duration-500 ${
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
                {/* Icon - FIXED: Consistent size wrapper for all icons */}
                <div
                  className={`flex items-center justify-center w-16 h-16 md:w-20 md:h-20 mb-6 transition-all duration-300 ${
                    hoveredCard === index ? "scale-110 rotate-6" : ""
                  }`}
                >
                  <img
                    src={useCase.iconSrc}
                    alt={useCase.title}
                    className="w-10 h-10 md:w-12 md:h-12 object-contain"
                  />
                </div>

                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-medium text-black mb-3 font-dm leading-tight">
                  {useCase.title}
                </h3>

                {/* Description */}
                <p className="text-base md:text-lg font-medium text-[#808080] leading-relaxed">
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </GridBackground>
  );
}
