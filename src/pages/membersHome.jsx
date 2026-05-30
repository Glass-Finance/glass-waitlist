import React from "react";
import Navbar from "../components/Navbar";
import MembersHero from "../components/members/membersHero";
import MembersHowItWorks from "../components/members/membersHowItWorks";
import MembersProblem from "../components/members/membersProblem";
import MembersSolution from "../components/members/membersSolution";
import Security from "../components/Security";
import Footer from "../components/Footer";
import TrustedBy from "../components/TrustedBy";
import UseCases from "../components/Usecases";
import WhyGlass from "../components/WhyGlass";
import MembersCTA from "../components/members/membersCTA";

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
