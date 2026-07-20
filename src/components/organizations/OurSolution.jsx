import icon1 from "../../assets/icon/frame1.webp";
import icon2 from "../../assets/icon/frame2.webp";
import icon3 from "../../assets/icon/frame3.webp";
import icon4 from "../../assets/icon/frame4.webp";
import featureAutomate from "../../assets/solution/automate.webp";
import featureRecover from "../../assets/solution/recover.webp";
import featureProof from "../../assets/solution/proof.webp";
import featureMonitor from "../../assets/solution/monitor.webp";
import SolutionSection from "../common/SolutionSection";

const features = [
  {
    icon: icon2,
    title: "Automate Recurring Payments",
    desc: "Members link their cards once, and dues are deducted automatically.",
    illustration: featureAutomate,
  },
  {
    icon: icon1,
    title: "Auto-recover failed payments",
    desc: "When a payment fails, Glass retries securely and sends gentle SMS reminders",
    illustration: featureRecover,
  },
  {
    icon: icon3,
    title: "Generate Instant Proof",
    desc: "Auto-issued receipts and reconciled transaction logs.",
    illustration: featureProof,
  },
  {
    icon: icon4,
    title: "Monitor Payments in Real Time",
    desc: "See who has paid, who hasn't, and your total balance instantly",
    illustration: featureMonitor,
  },
];

export default function OurSolution() {
  return (
    <SolutionSection
      headline="Built-In Transparency for Every Transaction"
      subtext="Centralize payments, records, and visibility in one shared system, so your team stops chasing and starts leading."
      subtextMaxWidth="640px"
      features={features}
    />
  );
}
