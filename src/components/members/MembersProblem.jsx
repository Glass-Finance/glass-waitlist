import { Clock, CreditCard, Eye } from "lucide-react";
import SharedProblemSection from "../common/ProblemSection";

const problems = [
  {
    Icon: Clock,
    title: "Missing Payment Deadlines?",
    desc: "Important reminders get lost in group chats.",
  },
  {
    Icon: CreditCard,
    title: "Still Switching Between Apps To Pay?",
    desc: "Copying account numbers and switching apps turns a simple payment into a chore.",
  },
  {
    Icon: Eye,
    title: "Can't See What You've Already Paid?",
    desc: "You end up scrolling through chats for proof of payment.",
  },
];

export default function MembersProblem() {
  return (
    <SharedProblemSection
      image={{ publicId: "glass/problem/problem2", width: 1280 }}
      problems={problems}
      headline="Paying Dues Shouldn't Be A Hassle"
      subtext="Without a central place to pay, receipts pile up in chats and members fall behind without realising it."
      clipInsetStart="100%"
      staggerStep={0.1}
    />
  );
}
