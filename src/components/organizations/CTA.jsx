import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function CTA() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

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
    <section 
      ref={sectionRef} 
      className="relative py-16 md:py-24 bg-[#0E628C] text-white"
    >
      <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-24 text-center">
        {/* Heading */}
        <h2
          className={`text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 transition-all duration-700 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          Stop chasing payments.
          <br />
          Start building your <span className="font-playfair italic">Community</span>.
        </h2>

        {/* Description */}
        <p
          className={`text-lg text-white/90 mb-8 transition-all duration-700 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
          style={{ transitionDelay: "0.2s" }}
        >
          Join 10+ other forward-thinking communities on the waitlist today.
        </p>

        {/* CTA Buttons */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
          style={{ transitionDelay: "0.4s" }}
        >
          <button
            onClick={() => navigate("/waitlist")}
            className="px-8 py-3 bg-white text-[#0E628C] rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1"
          >
            Join the Waitlist →
          </button>
          <button
            onClick={() => navigate("/contact")}
            className="text-white hover:text-gray-200 transition-colors font-medium"
          >
            Questions? <span className="underline">Contact Us</span>
          </button>
        </div>
      </div>
    </section>
  );
}