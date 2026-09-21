import SolutionSection from "../common/SolutionSection";

const features = [
  {
    icon: { publicId: "glass/icon/frame-payment", width: 100 },
    title: "One-Click Payments",
    desc: "Pay your dues in seconds from any device. No more manual transfers.",
    illustration: { publicId: "glass/solution/payment", width: 800 },
  },
  {
    icon: { publicId: "glass/icon/frame-reminder", width: 100 },
    title: "Smart Reminders",
    desc: "Get reminders via SMS, WhatsApp, and Email so you never miss a deadline.",
    illustration: { publicId: "glass/solution/reminder", width: 800 },
  },
  {
    icon: { publicId: "glass/icon/frame-receipt", width: 100 },
    title: "Generate Instant Proof",
    desc: "View your full history and download official receipts immediately after paying.",
    illustration: { publicId: "glass/solution/instant", width: 800 },
  },
  {
    icon: { publicId: "glass/icon/frame-flexible", width: 100 },
    title: "Flexible Options",
    desc: "Pay exactly how you want — via Card, Bank Transfer, or USSD.",
    illustration: { publicId: "glass/solution/flexible", width: 800 },
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
