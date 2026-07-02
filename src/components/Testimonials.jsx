import { useRef, useEffect } from "react";
import BlurText from "./ui/BlurText";

const testimonials = [
  {
    quote:
      "Before Glass, our treasurer spent every Sunday chasing members on WhatsApp. Now dues collect themselves and everyone can see the balance in real time.",
    name: "Tolu Adeyemi",
    role: "President, Babcock Torch Alumni",
    initial: "T",
    color: "#4f46e5",
  },
  {
    quote:
      "We run 200+ engineers through GDG Lagos. Glass gave us financial visibility we never had — I can see exactly who has paid for any event within seconds.",
    name: "Chioma Okafor",
    role: "Community Lead, GDG Lagos",
    initial: "C",
    color: "#0891b2",
  },
  {
    quote:
      "The automatic retry alone recovered payments we would have written off manually. It's a completely different way of running community finances.",
    name: "Emeka Nwosu",
    role: "Treasurer, ICAN Lagos Chapter",
    initial: "E",
    color: "#059669",
  },
];

export default function Testimonials() {
  const cardRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.opacity = "1";
            e.target.style.transform = "translateY(0)";
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = "0";
      el.style.transform = "translateY(36px)";
      el.style.transition = `opacity 0.6s ease ${i * 110}ms, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${i * 110}ms`;
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-[#07091F] py-20 md:py-28">
      <div className="max-w-[1140px] mx-auto px-6">
        <div className="text-center mb-14">
          <div className="mb-6">
            <span className="inline-flex items-center border border-white/20 text-white/60 text-[13px] font-medium px-5 py-2 rounded-full">
              What communities say
            </span>
          </div>
          <h2 className="text-[clamp(32px,5vw,56px)] font-bold text-white leading-tight tracking-tight">
            <BlurText
              text="Trusted by the communities that run on it"
              animateBy="words"
              direction="top"
              delay={55}
              stepDuration={0.4}
              centered
            />
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              ref={(el) => (cardRefs.current[i] = el)}
              className="flex flex-col gap-5 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <svg
                    key={j}
                    className="w-4 h-4 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-[15px] text-white/70 leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/[0.07]">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0"
                  style={{ background: t.color }}
                >
                  {t.initial}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white">{t.name}</p>
                  <p className="text-[12px] text-white/45">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
