import { useSeoMeta } from "../hooks/useSeoMeta";
import Navbar from "../components/Navbar";
import MembersHero from "../components/members/MembersHero";
import MembersHowItWorks from "../components/members/MembersHowItWorks";
import MembersProblem from "../components/members/MembersProblem";
import MembersSolution from "../components/members/MembersSolution";
import SecurityFeatures from "../components/SecurityFeatures";
import TrustedBy from "../components/TrustedBy";
import UseCases from "../components/UseCases";
import WhyGlass from "../components/WhyGlass";
import MembersCTA from "../components/members/MembersCTA";
import Footer from "../components/Footer";

export default function MembersHome() {
  useSeoMeta({
    title: "Pay Your Dues, Effortlessly",
    description:
      "Join your community on Glasspay and pay dues, subscriptions, and contributions in a few taps. No more chasing payments in group chats.",
    path: "/members",
  });
  return (
    <div className="bg-white">
      {/* One glow for the whole page instead of every section carrying its
          own copy -- fixed positioning keeps it glued to the same spot on
          screen for the entire scroll (Problem through WhyGlass) instead of
          scrolling away. Every section between Hero and Footer needs a
          transparent background of its own for this to show through. */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat bg-solution-glow"
        aria-hidden="true"
      />
      <Navbar />
      <MembersHero />
      <MembersProblem />
      <MembersSolution />
      <MembersHowItWorks />
      <UseCases />
      <TrustedBy />
      <SecurityFeatures />
      <MembersCTA />
      <WhyGlass />
      <Footer />
    </div>
  );
}
