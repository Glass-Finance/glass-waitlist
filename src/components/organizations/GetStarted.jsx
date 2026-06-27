import { useNavigate } from "react-router-dom";
import HowItWorksSection from "../howItWorks/HowItWorksSection";

import work1 from "../../assets/work/work1.jpg";
import work2 from "../../assets/work/work2.jpg";
import work3 from "../../assets/work/work3.jpg";
import work4 from "../../assets/work/work4.jpg";
import stepIcon1 from "../../assets/icon/step1.png";
import stepIcon2 from "../../assets/icon/step2.png";
import stepIcon3 from "../../assets/icon/step3.png";
import stepIcon4 from "../../assets/icon/step4.png";

const steps = [
  {
    num: "01",
    label: "Create Your Community",
    desc: "Set up your organisation in minutes — no paperwork, no bank visits.",
    badge: "Set Up With Few Clicks",
    img: work1,
    stepIcon: stepIcon1,
  },
  {
    num: "02",
    label: "Add Members",
    desc: "Invite by phone or email, or bulk-import your roster via CSV instantly.",
    badge: "Upload CSV For Bulk Addition",
    img: work2,
    stepIcon: stepIcon2,
  },
  {
    num: "03",
    label: "Set Payment Schedule",
    desc: "Define dues, set deadlines — monthly, yearly, or custom. Glass reconciles everything.",
    badge: "Set Your Dues Structure",
    img: work3,
    stepIcon: stepIcon3,
  },
  {
    num: "04",
    label: "Go Live!",
    desc: "Activate your community. Payments run automatically, receipts sent instantly.",
    badge: "Activate Your Community",
    img: work4,
    stepIcon: stepIcon4,
  },
];

export default function GetStarted() {
  const navigate = useNavigate();
  return <HowItWorksSection steps={steps} onCtaClick={() => navigate("/sign-up")} />;
}
