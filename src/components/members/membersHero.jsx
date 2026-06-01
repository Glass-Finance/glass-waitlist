import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import waveBg from "../../assets/hero/hero.jpg";

export default function MembersHero() {
  const navigate = useNavigate();
  const itemsRef = useRef([]);
  const sectionRef = useRef(null);
  const [waveOpacity, setWaveOpacity] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1 },
    );
    itemsRef.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  // Show wave only when scrolling toward the bottom of the hero
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const { top, height } = sectionRef.current.getBoundingClientRect();
      // Start fading in when the section is 60% scrolled past
      const scrolled = -top / height;
      const opacity  = Math.min(1, Math.max(0, (scrolled - 0.45) / 0.25));
      setWaveOpacity(opacity);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col justify-center pt-[68px] overflow-hidden"
    >
      {/* ── Wave image ── */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${waveBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* ── Dark overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, rgba(4,6,28,0.88) 0%, rgba(8,8,42,0.75) 45%, rgba(14,6,36,0.52) 100%)",
        }}
      />

      {/* ── Glow blobs ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div
          className="absolute bottom-0 right-0 w-[800px] h-[500px]"
          style={{
            background: "radial-gradient(ellipse at bottom right, #7a1090 0%, #4a0860 40%, transparent 65%)",
            filter: "blur(70px)",
            opacity: 0.55,
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[350px]"
          style={{
            background: "radial-gradient(ellipse at bottom left, #6b0f7a 0%, transparent 60%)",
            filter: "blur(80px)",
            opacity: 0.45,
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-8 lg:px-16 py-20">
        <div className="max-w-[600px]">
          <h1 className="text-[clamp(44px,7vw,70px)] font-bold text-white leading-[1.05] tracking-tight mb-6">
            Pay Your Dues
            <br />
            <span>Effortlessly</span>
          </h1>

          <p className="text-[16px] text-white/55 leading-relaxed max-w-[480px] mb-10">
            Stop sending screenshots of receipts. Get instant proof of payment,
            track your history, and never miss a deadline again.
          </p>

          <div>
            <button
              onClick={() => navigate("/waitlist")}
              className="inline-flex items-center gap-2 bg-white text-[#0c1020] text-[15px] px-8 py-3.5 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/20 shadow-lg shadow-black/30"
            >
              Join A Community
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Wave fade canvas — only visible when scrolling down ── */}
      <canvas
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20"
        style={{
          width: "100%",
          height: "130px",
          display: "block",
          opacity: waveOpacity,
          transition: "opacity 0.15s ease",
        }}
        ref={(canvas) => {
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          let raf;

          const resize = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = 130;
          };
          resize();
          window.addEventListener("resize", resize);

          function getWavePts(t, W, H) {
            const pts = [];
            for (let i = 0; i <= 80; i++) {
              const x = (i / 80) * W, nx = x / W;
              const y = H * 0.28
                + Math.sin(nx * Math.PI * 2.1 + t * 0.6)  * 20
                + Math.sin(nx * Math.PI * 3.5 + t * 0.35) * 11
                + Math.sin(nx * Math.PI * 1.2 + t * 0.5)  * 15;
              pts.push({ x, y });
            }
            return pts;
          }

          function frame(ts) {
            const t = ts * 0.001;
            const W = canvas.width, H = canvas.height;
            ctx.clearRect(0, 0, W, H);
            const pts = getWavePts(t, W, H);

            // Layer 1: solid #F7F8FC base fill
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            pts.forEach((p) => ctx.lineTo(p.x, p.y));
            ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
            ctx.fillStyle = "#F7F8FC";
            ctx.fill();

            // Layer 2: horizontal purple mesh, clipped + faded vertically
            const hGrd = ctx.createLinearGradient(0, 0, W, 0);
            pts.forEach((p, i) => {
              const norm = Math.max(0, 1 - p.y / (H * 0.65));
              hGrd.addColorStop(i / (pts.length - 1), `rgba(100,20,170,${(norm * 0.72).toFixed(3)})`);
            });

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            pts.forEach((p) => ctx.lineTo(p.x, p.y));
            ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
            ctx.clip();
            ctx.fillStyle = hGrd;
            ctx.fillRect(0, 0, W, H);
            ctx.globalCompositeOperation = "destination-in";
            const vGrd = ctx.createLinearGradient(0, 0, 0, H);
            vGrd.addColorStop(0,    "rgba(0,0,0,1)");
            vGrd.addColorStop(0.45, "rgba(0,0,0,0.5)");
            vGrd.addColorStop(1,    "rgba(0,0,0,0)");
            ctx.fillStyle = vGrd;
            ctx.fillRect(0, 0, W, H);
            ctx.restore();

            // Layer 3: crisp base at very bottom
            const baseGrd = ctx.createLinearGradient(0, H * 0.6, 0, H);
            baseGrd.addColorStop(0, "rgba(247,248,252,0)");
            baseGrd.addColorStop(1, "rgba(247,248,252,1)");
            ctx.fillStyle = baseGrd;
            ctx.fillRect(0, H * 0.6, W, H * 0.4);

            raf = requestAnimationFrame(frame);
          }

          raf = requestAnimationFrame(frame);
          canvas._cleanup = () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
          };
        }}
      />
    </section>
  );
}