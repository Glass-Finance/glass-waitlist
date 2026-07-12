import { useScrollReveal } from "../hooks/useScrollReveal";
import { useSeoMeta } from "../hooks/useSeoMeta";
import Navbar from "../components/Navbar";
import Hero from "../components/organizations/Hero";
import ProblemSection from "../components/organizations/ProblemSection";
import OurSolution from "../components/organizations/OurSolution";
import GetStarted from "../components/organizations/GetStarted";
import Usecases from "../components/Usecases";
import TrustedBy from "../components/TrustedBy";
import Security from "../components/Security";
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
    <div className="bg-[#F7F8FC]">
      <Navbar />
      <Hero />
      <ProblemSection />
      <OurSolution />
      <GetStarted />
      <Usecases />
      <TrustedBy />
      <Security />
      <CTA />
      <WhyGlass />
      <Footer />
    </div>
  );
}
