import React from "react";
import Navbar from "../components/Navbar";
import MembersHero from "../components/members/MembersHero";
import MembersHowItWorks from "../components/members/MembersHowItWorks";
import MembersProblem from "../components/members/MembersProblem";
import MembersSolution from "../components/members/MembersSolution";
import Security from "../components/Security";
import Footer from "../components/Footer";
import TrustedBy from "../components/TrustedBy";
import UseCases from "../components/Usecases";
import WhyGlass from "../components/WhyGlass";
import MembersCTA from "../components/members/MembersCTA";

export default function MembersHome() {
  return (
    <div className="bg-[#F7F8FC]">
      <Navbar />
      <MembersHero />
      <MembersProblem />
      <MembersSolution />
      <MembersHowItWorks />
      <UseCases />
      <TrustedBy />
      <Security />
      <MembersCTA />
      <WhyGlass />
      <Footer />
    </div>
  );
}
