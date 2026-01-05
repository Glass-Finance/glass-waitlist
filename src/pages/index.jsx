import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ProblemSection from '../components/ProblemSection';
import HowItWorks from '../components/HowItWorks';
// import WhyGlass from '../components/WhyGlass';
// import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F5F6] font-sans">
      <Navbar />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      
      {/* Trusted By Section */}
      <section className="relative bg-[#F9FAFB] py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-7 md:px-12">
          <h2 
            className="text-center text-[32px] md:text-[55px] font-medium leading-tight md:leading-[80px] text-black mb-12 md:mb-16"
            style={{ fontFamily: 'DM Sans, Inter, sans-serif' }}
          >
            Trusted by Leading Communities
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 items-center opacity-40">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="h-20 md:h-24 bg-gray-200 rounded-xl flex items-center justify-center"
              >
                <span className="text-gray-500 font-semibold text-base md:text-lg">Partner {i}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* <WhyGlass />
      <Footer /> */}
    </div>
  );
}