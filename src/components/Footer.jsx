import { useState } from "react";
import { useNavigate } from "react-router-dom";

const links = {
  Product: ["Features", "How It Works", "Pricing", "Integrations"],
  "Use Cases": ["Schools", "Religious Organizations", "Clubs", "Professional Bodies"],
  Resources: ["Blog", "Help Centre", "API Docs", "System Status"],
  Company: ["About", "Team", "Careers", "Contact", "Press"],
  Legal: ["Privacy", "Terms", "Security", "Cookie Policy"],
};

export default function Footer() {
  const [contact, setContact] = useState("");
  const navigate = useNavigate();

  return (
    <footer className="bg-[#0d1a6e] text-white">

      {/* ── CTA ── */}
      <div className="relative pt-20 md:pt-28 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(30,50,160,0.35) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-[860px] mx-auto px-6 text-center">
          <h2 className="text-[clamp(30px,5vw,54px)] font-bold text-white leading-tight tracking-tight mb-5">
            Stop chasing payments.
            <br />
            Start building your Community.
          </h2>
          <p className="text-[16px] text-white/60 max-w-[720px] mx-auto leading-relaxed mb-10">
            Join 10+ other forward-thinking communities on the waitlist today.
          </p>
          <button
            onClick={() => navigate("/waitlist")}
            className="inline-flex items-center gap-2 bg-white text-[#0f1640] text-[15px] font-semibold px-8 py-3.5 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/20 shadow-lg shadow-black/20"
          >
            Sign in
          </button>
        </div>
      </div>

      {/* ── Footer content ── */}
      <div className="max-w-[1140px] mx-auto px-6 pt-14 pb-8">

        {/* Brand */}
        <div className="mb-10">
          <a href="/" className="inline-flex items-center gap-2 no-underline mb-3">
            <img src="/Glass.png" alt="Glass" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-[24px] text-white">Glass</span>
          </a>
          <p className="text-[13px] text-white/60 leading-relaxed max-w-[280px]">
            Financial clarity for Nigerian communities.
          </p>
        </div>

        {/* Nav columns */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-[13px] font-bold text-white mb-4">{section}</h4>
              <ul className="space-y-2.5 list-none p-0 m-0">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-[13px] text-white/60 hover:text-white no-underline transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Subscribe row */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <p className="text-[14px] font-medium text-white mb-4">
            Get updates on Glass
          </p>
          <div className="flex items-center bg-white/10 rounded-full overflow-hidden max-w-[380px] border border-white/10">
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email/Phone Number"
              className="flex-1 px-5 py-3 text-[13px] text-white placeholder-white/40 bg-transparent outline-none"
            />
            <button className="bg-white text-[#0d1a6e] font-semibold text-[13px] px-5 py-3 rounded-full m-1 hover:opacity-90 transition-opacity flex-shrink-0">
              Subscribe
            </button>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-7 text-center">
          <p className="text-[13px] text-white/50">
            Copyright © {new Date().getFullYear()} Glass | Made for Nigerian communities
          </p>
        </div>

      </div>
    </footer>
  );
}