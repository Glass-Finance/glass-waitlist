import React from "react";
import GridBackground from "../components/GridBackground";
import Navbar from "../components/Navbar";
import MembersHero from "../components/members/membersHero";
import MembersHowItWorks from "../components/members/membersHowItWorks";
import MembersProblem from "../components/members/membersProblem";
import MembersSolution from "../components/members/membersSolution";
import MembersSecurity from "../components/members/memberSecurity";
import MembersCTA from "../components/members/membersCTA";
import Footer from "../components/Footer";
import TrustedBy from "../components/TrustedBy";
import UseCases from "../components/Usecases";
import WhyGlass from "../components/WhyGlass";

export default function MembersHome() {
  return (
    <div className="bg-white">
      <Navbar />

      {/* Hero Section - WHITE with Grid */}
      <GridBackground>
        <MembersHero />
      </GridBackground>

      {/* Problem Section - GRAY with Grid */}
      <GridBackground>
        <MembersProblem />
      </GridBackground>

      {/* Solution Section - WHITE with Grid */}
      <GridBackground>
        <MembersSolution />
      </GridBackground>

      {/* How It Works Section - WHITE with Grid */}
      <GridBackground>
        <MembersHowItWorks />
      </GridBackground>

      <GridBackground>
        <UseCases />
      </GridBackground>

      {/* Trusted By Section - GRAY with Grid */}
      <GridBackground>
        <TrustedBy />
      </GridBackground>

      {/* Security Section (Reused) - GRAY with Grid */}
      <GridBackground>
        <MembersSecurity />
      </GridBackground>

      {/* Why Glass Section */}
      <GridBackground>
        <WhyGlass />
      </GridBackground>

      {/* CTA Section - WHITE with Grid */}
      <GridBackground>
        <MembersCTA />
      </GridBackground>

      {/* Footer - NO GRID (has its own blue background) */}
      <Footer />
    </div>
  );
}
