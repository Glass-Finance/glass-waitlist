// FILE: src/components/WhyGlass.jsx

import React from "react";
import { ExternalLink } from "lucide-react";

export default function WhyGlass() {
  return (
    <section className="relative py-12 md:py-16">
      <div className="max-w-[1280px] mx-auto px-7 md:px-12">
        <div className="flex justify-center">
          <a
            href="https://tribuneonlineng.com/team-glass-shines-as-winner-of-5th-babcock-innovation-challenge/" // Replace with actual Tribune URL
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 bg-[#E8F5FB] hover:bg-[#D1EBFA] px-6 md:px-8 py-4 md:py-5 rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105"
          >
            <span className="text-[14px] md:text-[16px] font-medium text-[#0E628C] group-hover:text-[#17A1E5] transition-colors">
              Read why the Nigerian Tribune calls Glass the new standard for community financial security
            </span>
            <ExternalLink className="w-4 h-4 md:w-5 md:h-5 text-[#0E628C] group-hover:text-[#17A1E5] transition-all duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}