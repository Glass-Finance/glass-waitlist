import React from "react";

export default function ProblemSection() {
  const problems = [
    {
      iconSrc: "/icons/frame1.png", // or whatever your icon filename is
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

  return (
    <section className="relative py-16 md:py-24 bg-[#F5F5F6]">
      <div className="max-w-[1280px] mx-auto px-7 md:px-12">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 border border-[#0E628C] px-[15px] py-[9px] rounded-full mb-6">
            <span className="text-[13px] font-normal text-[#0E628C]">
              THE PROBLEM
            </span>
          </div>
          <h2 className="text-[32px] md:text-[55px] font-medium text-black leading-tight md:leading-[80px] font-dm">
            Manual collection is holding you back
          </h2>
        </div>

        {/* Problem Cards - Vertical List */}
        <div className="max-w-[750px] mx-auto space-y-8 md:space-y-[50px]">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="flex items-start gap-6 md:gap-[90px]"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-[50px] h-[50px] border-2 border-[#0A89C6] rounded-[0.91px] flex items-center justify-center mt-6">
                <img 
                  src={problem.iconSrc} 
                  alt={problem.title}
                  className="w-6 h-6"
                />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                {/* Title */}
                <h3 className="text-[28px] md:text-[40px] font-medium text-black leading-tight md:leading-[80px] font-dm">
                  {problem.title}
                </h3>

                {/* Description */}
                <p className="text-[16px] md:text-[20px] font-medium text-[#808080] leading-relaxed">
                  {problem.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}