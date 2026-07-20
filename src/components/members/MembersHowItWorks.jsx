import { useNavigate } from "react-router-dom";
import { isMobileDevice, mobileRequiredPath } from "../../utils/deviceRedirect";
import HowItWorksSection from "../howItWorks/HowItWorksSection";

import work1 from "../../assets/work/mwork1.webp";
import work2 from "../../assets/work/mwork2.webp";
import work3 from "../../assets/work/mwork3.webp";
import stepIcon1 from "../../assets/icon/step1.webp";
import stepIcon2 from "../../assets/icon/step2.webp";
import stepIcon3 from "../../assets/icon/step3.webp";

const steps = [
  {
    num: "01",
    label: "Get Invited",
    desc: "Receive an invite link from your admin via WhatsApp or SMS. One tap and you're in.",
    badge: "Instant Access",
    img: work1,
    stepIcon: stepIcon1,
  },
  {
    num: "02",
    label: "Create Account",
    desc: "Sign up in under 60 seconds. Verify your phone — no long forms, no waiting.",
    badge: "No Long Forms",
    img: work2,
    stepIcon: stepIcon2,
  },
  {
    num: "03",
    label: "Set Up Payment",
    desc: "Add your card, bank, or USSD once. Glass stores it securely — never re-enter it.",
    badge: "Set Your Dues Structure",
    img: work3,
    stepIcon: stepIcon3,
  },
];

export default function MembersHowItWorks() {
  const navigate = useNavigate();

  function handleJoin() {
    navigate(isMobileDevice() ? "/member/join" : mobileRequiredPath("/member/join"));
  }

  return <HowItWorksSection steps={steps} onCtaClick={handleJoin} />;
}
