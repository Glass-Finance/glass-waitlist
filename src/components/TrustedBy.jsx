import React, { useRef } from "react";
import Overlay from "../assets/Overlay2.png";

export default function TrustedBy() {
  const scrollRef = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e) => {
    isDown.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isDown.current = false;
  };

  const trustedLogos = [
    {
      name: "The Babcock Torch",
      logo: "/logos/babcock-torch.png", // Replace with actual path
      alt: "The Babcock Torch logo",
    },

    {
      name: "GDG Lagos",
      logo: "/logos/gdg-lagos.png", // Replace with actual path
      alt: "GDG Lagos logo",
    },
  ];

  return (
    <section className="bg-[#F7F8FC] pb-16 px-6 md:px-12 lg:px-24">
      {/* Same overlay as problem section */}
      <div
        className="relative inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${Overlay})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.6,
        }}
      />
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-2xl font-bold mb-8">
            Trusted by forward-thinking communities
          </p>
        </div>

        {/* Logos Container - Carousel */}
        <div
          className="relative overflow-hidden cursor-grab active:cursor-grabbing"
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
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
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML = `<div class="text-gray-400 font-semibold text-lg whitespace-nowrap">${item.name}</div>`;
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
