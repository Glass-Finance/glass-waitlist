import { useNavigate } from "react-router-dom";
import { goToApp } from "../utils/deviceRedirect";
import logo from "../assets/cta/ctalogo.webp";
import BlurText from "./ui/BlurText";

const links = {
  Product: [
    { label: "Features",     href: "/#solution"     },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Pricing",      href: "/#pricing"      },
    { label: "Integrations", href: null             },
  ],
  "Use Cases": [
    { label: "Schools",                href: null },
    { label: "Religious Organizations",href: null },
    { label: "Clubs",                  href: null },
    { label: "Professional Bodies",    href: null },
  ],
  Resources: [
    { label: "Help Centre", href: "mailto:glasspayhq@gmail.com" },
  ],
  Company: [
    { label: "About",    href: null                          },
    { label: "Team",     href: null                          },
    { label: "Careers",  href: null                          },
    { label: "Contact",  href: "mailto:glasspayhq@gmail.com" },
  ],
  Legal: [
    { label: "Privacy",         href: "/privacy"       },
    { label: "Terms",           href: "/terms"         },
    { label: "Cookie Policy",   href: "/cookies"        },
    { label: "Acceptable Use",  href: "/acceptable-use" },
    { label: "Refund Policy",   href: "/refund-policy"  },
  ],
};

export default function Footer() {
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
            <BlurText
              text="Stop chasing payments."
              delay={80}
              animateBy="words"
              direction="top"
              stepDuration={0.35}
              centered
              className="justify-center text-[clamp(30px,5vw,54px)] font-bold text-white leading-tight tracking-tight"
            />
            <br />
            <BlurText
              text="Start building your Community."
              delay={120}
              animateBy="words"
              direction="top"
              stepDuration={0.35}
              centered
              className="justify-center text-[clamp(30px,5vw,54px)] font-bold text-white leading-tight tracking-tight"
            />
          </h2>
          <p className="text-[16px] text-white/60 max-w-[720px] mx-auto leading-relaxed mb-10">
            Join communities already running transparent finances on Glass.
          </p>
          <button
            onClick={() => goToApp("/sign-up", navigate)}
            className="inline-flex items-center gap-2 bg-white text-[#0f1640] text-[15px] font-semibold px-8 py-3.5 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/20 shadow-lg shadow-black/20"
          >
            Get Started Free
          </button>
        </div>
      </div>

      {/* ── Footer content ── */}
      <div className="max-w-[1140px] mx-auto px-6 pt-14 pb-8">
        {/* Brand */}
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 no-underline mb-3"
          >
            <img src={logo} alt="Glass" className="w-7 h-7" />
            <span className="font-bold text-[20px] text-white">Glass</span>
          </a>
        </div>

        {/* Nav columns */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-30 mb-12">
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <p className="text-[13px] font-bold text-white mb-4">{section}</p>
              <ul className="space-y-2.5 list-none p-0 m-0">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    {href ? (
                      <a
                        href={href}
                        className="text-[13px] text-white/60 hover:text-white no-underline transition-colors"
                      >
                        {label}
                      </a>
                    ) : (
                      <span className="text-[13px] text-white/35 cursor-default select-none">
                        {label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-7 text-center">
          <p className="text-[13px] text-white/50">
            Copyright © {new Date().getFullYear()} Glass Limited | Made for
            Nigerian communities
          </p>
        </div>
      </div>
    </footer>
  );
}
