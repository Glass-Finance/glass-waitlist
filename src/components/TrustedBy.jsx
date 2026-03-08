import React from "react";

export default function TrustedBy() {
  // You'll replace these placeholder items with actual logo images
  const trustedLogos = [
    {
      name: "Babcock University",
      logo: "/logos/babcock.png", // Replace with actual path
      alt: "Babcock University logo",
    },
    {
      name: "The Babcock Torch",
      logo: "/logos/babcock-torch.png", // Replace with actual path
      alt: "The Babcock Torch logo",
    },
    {
      name: "Cowrywise",
      logo: "/logos/cowrywise.png", // Replace with actual path
      alt: "Cowrywise logo",
    },
    {
      name: "ICAN",
      logo: "/logos/ican.png", // Replace with actual path
      alt: "ICAN logo",
    },
    {
      name: "GDG Lagos",
      logo: "/logos/gdg-lagos.png", // Replace with actual path
      alt: "GDG Lagos logo",
    },
  ];

  return (
    <section className="bg-[#F7F8FC] py-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-lg font-bold mb-8">
            Trusted by forward-thinking communities
          </p>
        </div>

        {/* Logos Container - Carousel */}
        <div className="relative overflow-hidden">
          {/* Scrolling Container */}
          <div className="flex items-center gap-12 md:gap-16 animate-scroll">
            {/* First set of logos */}
            {trustedLogos.map((item, index) => (
              <div
                key={`logo-1-${index}`}
                className="flex-shrink-0 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
              >
                <img
                  src={item.logo}
                  alt={item.alt}
                  className="h-12 md:h-16 w-auto object-contain"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML = `<div class="text-gray-400 font-semibold text-lg whitespace-nowrap">${item.name}</div>`;
                  }}
                />
              </div>
            ))}

            {/* Duplicate set for seamless loop */}
            {trustedLogos.map((item, index) => (
              <div
                key={`logo-2-${index}`}
                className="flex-shrink-0 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
              >
                <img
                  src={item.logo}
                  alt={item.alt}
                  className="h-12 md:h-16 w-auto object-contain"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML = `<div class="text-gray-400 font-semibold text-lg whitespace-nowrap">${item.name}</div>`;
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Alternative: Static Grid (if you prefer no animation) */}
        {/* Uncomment this and comment out the carousel above if you want a static grid */}
        {/* 
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {trustedLogos.map((item, index) => (
            <div 
              key={index}
              className="grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
            >
              <img 
                src={item.logo}
                alt={item.alt}
                className="h-12 md:h-16 w-auto object-contain"
              />
            </div>
          ))}
        </div>
        */}
      </div>
    </section>
  );
}
