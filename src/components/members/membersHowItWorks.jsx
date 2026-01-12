// FILE: src/components/members/MembersHowItWorks.jsx

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

export default function MembersHowItWorks() {
  const ref = useRef(null);
  const [hoveredStep, setHoveredStep] = useState(null);
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const steps = [
    {
      number: "1",
      title: "Get Invited",
      description:
        "Receive an invitation link from your community admin via WhatsApp or SMS.",
      screenshot: "/screenshots/member-invite.png", // Add your actual screenshot path
    },
    {
      number: "2",
      title: "Create Account",
      description:
        "Sign up in seconds and verify your phone number. No long forms.",
      screenshot: "/screenshots/member-signup.png", // Add your actual screenshot path
    },
    {
      number: "3",
      title: "Set Up Payment",
      description:
        "Add your preferred payment method once, Card or Bank Transfer.",
      screenshot: "/screenshots/member-payment.png", // Add your actual screenshot path
    },
    {
      number: "4",
      title: "Auto-Pay!",
      description:
        "Sit back. Payments happen automatically on the due date. You get a receipt instantly",
      screenshot: "/screenshots/member-receipt.png", // Add your actual screenshot path
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const stepVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6 },
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
    <section ref={ref} className="relative py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto px-7 md:px-12">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          <motion.div
            variants={badgeVariants}
            className={`inline-flex items-center gap-2 border border-[#2E7D32] px-[15px] py-[9px] rounded-full mb-10 transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <span className="text-[13px] font-normal text-[#0E628C]">
              HOW IT WORKS
            </span>
          </motion.div>

          <motion.h2
            variants={titleVariants}
            className="text-[32px] md:text-[45px] font-medium text-black leading-tight md:leading-[80px] font-dm"
          >
            Join your community in minutes
          </motion.h2>
        </motion.div>

        {/* Steps with Individual Screenshots */}
        <motion.div
          className="space-y-12 md:space-y-16 max-w-5xl mx-auto"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={stepVariants}
              onMouseEnter={() => setHoveredStep(index)}
              onMouseLeave={() => setHoveredStep(null)}
              className="grid lg:grid-cols-[1fr_200px] gap-6 md:gap-8 items-center group"
            >
              {/* Left: Step Content */}
              <div className="flex items-start gap-4 md:gap-6">
                {/* Number Badge */}
                <motion.div
                  className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-[#E8F5FB] rounded-lg flex items-center justify-center transition-all duration-300"
                  whileHover={{
                    scale: 1.1,
                    rotate: 5,
                    transition: { duration: 0.3 },
                  }}
                  animate={
                    hoveredStep === index
                      ? { scale: 1.05 }
                      : { scale: 1 }
                  }
                >
                  <span className="text-[20px] md:text-[24px] font-semibold text-[#17A1E5]">
                    {step.number}
                  </span>
                </motion.div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <h3 className="text-[20px] md:text-[24px] font-normal text-black mb-2 font-dm">
                    {step.title}
                  </h3>
                  <p className="text-[14px] md:text-[16px] md:max-w-[500px] font-normal text-[#808080] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Right: Mobile Screenshot */}
              <motion.div
                className="flex justify-center lg:justify-end"
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              >
                <div
                  className={`relative w-[160px] md:w-[180px] transition-all duration-300 ${
                    hoveredStep === index
                      ? "scale-105 drop-shadow-xl"
                      : "scale-100"
                  }`}
                >
                  {/* Phone Frame */}
                  <div className="relative bg-gray-900 rounded-[24px] p-2 shadow-2xl">
                    {/* Screenshot */}
                    <div className="bg-white rounded-[20px] overflow-hidden aspect-[9/19]">
                      <img
                        src={step.screenshot}
                        alt={`${step.title} screenshot`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image doesn't exist
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-gray-100">
                              <div class="text-center p-4">
                                <div class="text-3xl mb-2">${step.number}</div>
                                <div class="text-xs text-gray-500">${step.title}</div>
                              </div>
                            </div>
                          `;
                        }}
                      />
                    </div>
                    
                    {/* Phone Notch */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-full"></div>
                  </div>

                  {/* Subtle glow effect on hover */}
                  {hoveredStep === index && (
                    <div className="absolute inset-0 bg-[#17A1E5] opacity-10 rounded-[24px] blur-xl -z-10"></div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}