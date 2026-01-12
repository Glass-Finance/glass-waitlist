import React, { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";

export default function GetStarted() {
  const ref = useRef(null);
  const [hoveredStep, setHoveredStep] = useState(null);
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const steps = [
    {
      number: "1",
      title: "Create Your Community",
      description:
        "Set up your organization in minutes. Add your community's name and key details.",
      screenshot: "/screenshots/org-setup.png", // Add your actual screenshot path
    },
    {
      number: "2",
      title: "Add Members",
      description:
        "Invite your community members. They can access their info, see outstanding dues, and track their payment history.",
      screenshot: "/screenshots/org-members.png", // Add your actual screenshot path
    },
    {
      number: "3",
      title: "Set Payment Schedule",
      description:
        "Define dues, set deadlines, and automate reminders. We'll track everything for you.",
      screenshot: "/screenshots/org-schedule.png", // Add your actual screenshot path
    },
    {
      number: "4",
      title: "Go Live!",
      description:
        "Members can now make payments, upload proof, and everyone can see real-time updates on the same dashboard.",
      screenshot: "/screenshots/org-dashboard.png", // Add your actual screenshot path
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
            Get your community running in minutes
          </motion.h2>
        </motion.div>

        {/* Steps with Individual Screenshots */}
        <motion.div
          className="space-y-12 md:space-y-16 max-w-6xl mx-auto"
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
              className="grid lg:grid-cols-[1fr_300px] gap-6 md:gap-8 items-center group"
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
                    hoveredStep === index ? { scale: 1.05 } : { scale: 1 }
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

              {/* Right: Dashboard Screenshot */}
              <motion.div
                className="flex justify-center lg:justify-end"
                initial={{ opacity: 0, x: 20 }}
                animate={
                  isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }
                }
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              >
                <div
                  className={`relative w-full max-w-[280px] md:max-w-[500px] transition-all duration-300 ${
                    hoveredStep === index
                      ? "scale-105 drop-shadow-2xl"
                      : "scale-100 drop-shadow-lg"
                  }`}
                >
                  {/* Browser/Dashboard Frame */}
                  <div className="relative bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
                    {/* Browser Header */}
                    <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                      </div>
                      <div className="flex-1 bg-white rounded px-2 py-0.5">
                        <div className="text-[8px] text-gray-400">
                          glass.app/dashboard
                        </div>
                      </div>
                    </div>

                    {/* Screenshot */}
                    <div className="bg-white aspect-[4/3]">
                      <img
                        src={step.screenshot}
                        alt={`${step.title} screenshot`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image doesn't exist
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E8F5FB] to-[#F5F5F6]">
                              <div class="text-center p-6">
                                <div class="text-4xl font-bold text-[#17A1E5] mb-2">${step.number}</div>
                                <div class="text-sm text-gray-600 font-medium">${step.title}</div>
                                <div class="text-xs text-gray-400 mt-2">Dashboard Preview</div>
                              </div>
                            </div>
                          `;
                        }}
                      />
                    </div>
                  </div>

                  {/* Subtle glow effect on hover */}
                  {hoveredStep === index && (
                    <div className="absolute inset-0 bg-[#17A1E5] opacity-10 rounded-lg blur-xl -z-10"></div>
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
