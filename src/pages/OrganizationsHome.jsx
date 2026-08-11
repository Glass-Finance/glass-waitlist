import { useScrollReveal } from "../hooks/useScrollReveal";
import { useSeoMeta } from "../hooks/useSeoMeta";
import Navbar from "../components/Navbar";
import Hero from "../components/organizations/Hero";
import ProblemSection from "../components/organizations/ProblemSection";
import OurSolution from "../components/organizations/OurSolution";
import GetStarted from "../components/organizations/GetStarted";
import UseCases from "../components/UseCases";
import TrustedBy from "../components/TrustedBy";
import SecurityFeatures from "../components/SecurityFeatures";
import CTA from "../components/organizations/CTA";
import WhyGlass from "../components/WhyGlass";
import Footer from "../components/Footer";

export default function OrganizationsHome() {
  useSeoMeta({
    title: "Community Finance, Crystal Clear",
    description:
      "Stop chasing dues in group chats. Glasspay lets Nigerian associations, clubs, and schools collect, track, and manage community funds in one place.",
    path: "/",
  });
  useScrollReveal();

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
      <Hero />
      <ProblemSection />
      <OurSolution />
      <GetStarted />
      <UseCases />
      <TrustedBy />
      <SecurityFeatures />
      <CTA />
      <WhyGlass />
      <Footer />
    </div>
  );
}
