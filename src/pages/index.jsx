import React from "react";
import GridBackground from "../components/GridBackground";
import Navbar from "../components/Navbar";
import Hero from "../components/organizations/Hero";
import Usecases from "../components/Usecases";
import Security from "../components/organizations/Security";
import CTA from "../components/organizations/CTA";
import Footer from "../components/Footer";
import ProblemSection from "../components/organizations/ProblemSection";
import OurSolution from "../components/organizations/OurSolution";
import GetStarted from "../components/organizations/GetStarted";
import TrustedBy from "../components/TrustedBy";
import WhyGlass from "../components/WhyGlass";

export default function Home() {
  return (
    <div>
      <Navbar />
      {/* Hero Section with Grid Background */}
      <GridBackground>
        <Hero />
      </GridBackground>
      {/* Problem Section with Grid Background */}
      <GridBackground>
        <ProblemSection />
      </GridBackground>
      {/* Our Solution Section with Grid Background */}
      <GridBackground>
        <OurSolution />
      </GridBackground>
      {/* Get Started Section with Grid Background */}
      <GridBackground>
        <GetStarted />
      </GridBackground>
      {/* Use Cases Section */}
      <GridBackground>
        <Usecases />
      </GridBackground>
      {/* Trusted By Section */}
      <GridBackground>
        <TrustedBy />
      </GridBackground>
      {/* Security Section - Dark theme, no grid */}
      <GridBackground>
        <Security />
      </GridBackground>
      {/* Why Glass Section */}
      <GridBackground>
        <WhyGlass />
      </GridBackground>
      {/* CTA Section with Primary Color Variant (Optional) */}
      <GridBackground>
        <CTA />
      </GridBackground>
      {/* Footer with Grid Background */}
      <GridBackground>
        <Footer />
      </GridBackground>
    </div>
  );
}
