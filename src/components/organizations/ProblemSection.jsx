import { Clock, Eye } from "lucide-react";
import Problem from "../../assets/problem.webp";
import SharedProblemSection from "../common/ProblemSection";

const problems = [
  {
    Icon: Clock,
    title: "How much time is your team losing to manual reconciliation?",
    desc: "Bank alerts and spreadsheets consume hours every month.",
  },
  {
    Icon: Eye,
    title: "Can your members clearly see how funds are managed?",
    desc: "Limited transparency reduces trust and slows compliance.",
  },
];

export default function ProblemSection() {
  return (
    <SharedProblemSection
      image={Problem}
      problems={problems}
      headline="Still spending weekends chasing payments?"
      subtext="Without centralized visibility, time is wasted and trust begins to weaken."
      clipInsetStart="90%"
      staggerStep={0.12}
    />
  );
}
