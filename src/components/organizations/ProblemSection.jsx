import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import GridBackground from "./../GridBackground";

export default function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const problems = [
    {
      iconSrc: "/icons/frame1.png",
      title: "Members forget deadlines",
      description:
        "Chasing payments manually creates tension and awkward conversations.",
    },
    {
      iconSrc: "/icons/frame2.png",
      title: "15-20 hours wasted monthly",
      description:
        "Treasurers spend entire weekends reconciling bank transfers and spreadsheets.",
    },
    {
      iconSrc: "/icons/frame3.png",
      title: "Lack of transparency",
      description:
        "When members can't see how funds are managed, payment compliance drops.",
    },
  ];

  // Container animation with stagger
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  // Badge animation - drops down
  const badgeVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // Title animation
  const titleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  // Problem card animation - slides from left (burden approaching)
  const cardVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1], // Custom easing for smooth feel
      },
    },
  };

  return (
    <GridBackground variant="default">
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
              className="inline-flex items-center gap-2 border border-[#0E628C] px-[15px] py-[9px] rounded-full mb-6"
            >
              <span className="text-[13px] font-normal text-[#0E628C]">
                THE PROBLEM
              </span>
            </motion.div>

            <motion.h2
              variants={titleVariants}
              className="text-[32px] md:text-[45px] font-medium text-black leading-tight md:leading-[80px] font-dm"
            >
              Manual collection is holding you back
            </motion.h2>
          </motion.div>

          {/* Problem Cards with stagger */}
          <motion.div
            className="max-w-[750px] mx-auto space-y-8 md:space-y-[50px]"
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={containerVariants}
          >
            {problems.map((problem, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                className="flex items-start gap-6 md:gap-[90px] group cursor-pointer"
                whileHover={{
                  x: 8,
                  transition: { duration: 0.3, ease: "easeOut" },
                }}
              >
                {/* Icon with hover animation */}
                <motion.div
                  className="flex-shrink-0 w-[50px] h-[50px] border-2 border-[#0A89C6] rounded-[0.91px] flex items-center justify-center mt-6"
                  whileHover={{
                    scale: 1.15,
                    rotate: 8,
                    transition: { duration: 0.3 },
                  }}
                >
                  <img
                    src={problem.iconSrc}
                    alt={problem.title}
                    className="w-6 h-6"
                  />
                </motion.div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <h3 className="text-[28px] md:text-[40px] font-medium text-black leading-tight md:leading-[80px] font-dm">
                    {problem.title}
                  </h3>
                  <p className="text-[16px] md:text-[20px] font-medium text-[#808080] leading-relaxed">
                    {problem.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </GridBackground>
  );
}