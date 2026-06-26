import { Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Ambassadors() {
  return (
    <div className="bg-[#EFEFF1] min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-24">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.07] border border-white/[0.1] flex items-center justify-center mb-6">
          <Rocket className="w-7 h-7 text-white/70" />
        </div>
        <h1 className="text-[clamp(28px,5vw,40px)] font-bold text-white tracking-tight mb-3">
          Ambassadors — Stay Tuned
        </h1>
        <p className="text-[15px] text-white/55 max-w-[480px] leading-relaxed mb-8">
          We're putting together our Ambassadors program. Check back soon for details on how to get involved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 bg-white text-[#0B0F2E] px-5 py-2.5 rounded-full text-[13.5px] font-bold transition-all hover:opacity-90"
        >
          Back to Home
        </Link>
      </div>
      <Footer />
    </div>
  );
}
