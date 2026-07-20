import icon1 from "../../assets/icon/frame1.webp";
import icon2 from "../../assets/icon/frame2.webp";
import icon3 from "../../assets/icon/frame3.webp";
import icon4 from "../../assets/icon/frame4.webp";
import featurePayment from "../../assets/solution/payment.webp";
import featureReminder from "../../assets/solution/reminder.webp";
import featureInstant from "../../assets/solution/instant.webp";
import featureFlexible from "../../assets/solution/flexible.webp";
import SolutionSection from "../common/SolutionSection";

const features = [
  {
    icon: icon2,
    title: "One-Click Payments",
    desc: "Pay your dues in seconds from any device. No more manual transfers.",
    illustration: featurePayment,
  },
  {
    icon: icon1,
    title: "Smart Reminders",
    desc: "Get reminders via SMS, WhatsApp, and Email so you never miss a deadline.",
    illustration: featureReminder,
  },
  {
    icon: icon3,
    title: "Generate Instant Proof",
    desc: "View your full history and download official receipts immediately after paying.",
    illustration: featureInstant,
  },
  {
    icon: icon4,
    title: "Flexible Options",
    desc: "Pay exactly how you want — via Card, Bank Transfer, or USSD.",
    illustration: featureFlexible,
  },
];

export default function MembersSolution() {
  return (
    <SolutionSection
      headline="Everything You Need to Pay with Confidence"
      subtext="One tap to pay, instant receipts, and a full history — so you never have to dig through chats again."
      subtextMaxWidth="600px"
      features={features}
    />
  );
}
