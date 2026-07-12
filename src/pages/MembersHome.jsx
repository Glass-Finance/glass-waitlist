import { useSeoMeta } from "../hooks/useSeoMeta";
import Navbar from "../components/Navbar";
import MembersHero from "../components/members/MembersHero";
import MembersHowItWorks from "../components/members/MembersHowItWorks";
import MembersProblem from "../components/members/MembersProblem";
import MembersSolution from "../components/members/MembersSolution";
import Security from "../components/Security";
import TrustedBy from "../components/TrustedBy";
import Pricing from "../components/Pricing";
import UseCases from "../components/Usecases";
import WhyGlass from "../components/WhyGlass";
import MembersCTA from "../components/members/MembersCTA";
import Footer from "../components/Footer";

export default function MembersHome() {
  useSeoMeta({
    title: "Glass for Members — Pay Your Dues, Effortlessly",
    description:
      "Join your community on Glasspay and pay dues, subscriptions, and contributions in a few taps — no more chasing payments in group chats.",
    path: "/members",
  });
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
      <Pricing />
      <MembersCTA />
      <WhyGlass />
      <Footer />
    </div>
  );
}
