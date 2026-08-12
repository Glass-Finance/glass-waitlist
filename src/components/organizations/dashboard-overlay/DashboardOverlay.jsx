import { useEffect, useRef } from "react";
import { TOASTS, ELEM_IDS, PBARS } from "./constants";
import NavRail from "./NavRail";
import SidebarNav from "./SidebarNav";
import TopBar from "./TopBar";
import StatsRow from "./StatsRow";
import PaymentPlansPanel from "./PaymentPlansPanel";
import RecentActivityPanel from "./RecentActivityPanel";

// ─── Animated dashboard ───────────────────────────────────────────────────────
// Purely a marketing demo: every "dbo-*" element below (spread across
// StatsRow/PaymentPlansPanel/RecentActivityPanel/the header) is driven
// imperatively by document.getElementById from the effect below rather than
// React state, so the reveal timeline can run as a plain async loop instead
// of juggling twelve pieces of animation state through re-renders.
export default function DashboardOverlay() {
  const outerRef = useRef(null);
  const toastRef = useRef(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    const canvas = document.getElementById("hero-static-canvas");
    if (!canvas) return;
    const draw = () => {
      canvas.width = canvas.offsetWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
      const ctx = canvas.getContext("2d");
      const img = ctx.createImageData(canvas.width, canvas.height);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() > 0.5 ? 255 : 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    const sw = (ms) => new Promise((r) => setTimeout(r, ms));
    const $ = (id) => document.getElementById("dbo-" + id);

    const setRi = (el, show) => {
      if (!el) return;
      el.style.opacity = show ? "1" : "0";
      el.style.transform = show ? "translateY(0)" : "translateY(10px)";
    };

    const resetAll = () => {
      ELEM_IDS.forEach((id) => {
        const el = $(id);
        if (!el) return;
        el.style.transition = "opacity .36s ease, transform .36s ease";
        setRi(el, false);
      });
      PBARS.forEach((p) => {
        const el = $(p.id);
        if (el) {
          el.style.transition = "none";
          el.style.width = "0";
        }
      });
    };

    const revealIn = async () => {
      for (let i = 0; i < ELEM_IDS.length; i++) {
        if (!aliveRef.current) return;
        await sw(i === 0 ? 0 : i < 5 ? 100 : 130);
        const el = $(ELEM_IDS[i]);
        if (!el) continue;
        el.style.transition =
          "opacity .5s cubic-bezier(.22,1,.36,1), transform .5s cubic-bezier(.22,1,.36,1)";
        setRi(el, true);
        if (i >= 6 && i <= 7) {
          const bar = $(PBARS[i - 6].id);
          if (bar) {
            await sw(60);
            bar.style.transition = "width 1.1s ease";
            bar.style.width = PBARS[i - 6].w;
          }
        }
      }
    };

    const revealOut = async () => {
      for (let i = ELEM_IDS.length - 1; i >= 0; i--) {
        if (!aliveRef.current) return;
        await sw(55);
        const el = $(ELEM_IDS[i]);
        if (!el) continue;
        el.style.transition = "opacity .22s ease, transform .22s ease";
        setRi(el, false);
      }
      await sw(320);
    };

    const mkToast = (d) => {
      const el = document.createElement("div");
      el.style.cssText = `
        background:#fff;border-radius:10px;padding:11px 14px;
        box-shadow:0 4px 22px rgba(0,20,80,0.22);border:1px solid #E0E0EB;
        display:flex;align-items:flex-start;gap:9px;width:220px;
        opacity:0;transform:translateX(14px);
        transition:opacity .4s ease,transform .4s ease;
        font-family:Inter,-apple-system,sans-serif;
      `;
      el.innerHTML = `
        <div style="width:7px;height:7px;border-radius:50%;background:${d.color};flex-shrink:0;margin-top:4px"></div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#000;margin-bottom:2px">${d.title}</div>
          <div style="font-size:10px;color:#6b7280;line-height:1.35">${d.sub}</div>
        </div>`;
      return el;
    };

    const toastLoop = async () => {
      let idx = 0;
      while (aliveRef.current) {
        if (!toastRef.current) {
          await sw(500);
          continue;
        }
        toastRef.current.innerHTML = "";
        const el = mkToast(TOASTS[idx % TOASTS.length]);
        toastRef.current.appendChild(el);
        await sw(40);
        if (!aliveRef.current) return;
        el.style.opacity = "1";
        el.style.transform = "translateX(0)";
        await sw(3500);
        if (!aliveRef.current) return;
        el.style.opacity = "0";
        el.style.transform = "translateX(14px)";
        await sw(500);
        if (el.parentNode) el.parentNode.removeChild(el);
        idx++;
        const gap = idx % 2 === 0 ? 5000 : 7000;
        await sw(gap);
      }
    };

    const dashLoop = async () => {
      while (aliveRef.current) {
        await revealIn();
        await sw(5500);
        if (!aliveRef.current) break;
        await revealOut();
        await sw(400);
        resetAll();
      }
    };

    const main = async () => {
      await sw(400);
      if (!aliveRef.current || !outerRef.current) return;
      outerRef.current.style.opacity = "1";
      outerRef.current.style.transform = "translateY(0)";
      await sw(2200);
      if (!aliveRef.current) return;
      dashLoop();
      await sw(1400);
      if (!aliveRef.current) return;
      toastLoop();
    };

    resetAll();
    main();
    return () => {
      aliveRef.current = false;
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        ref={toastRef}
        style={{
          position: "absolute",
          top: 90,
          right: -30,
          display: "flex",
          flexDirection: "column",
          pointerEvents: "none",
          zIndex: 200,
          width: 220,
        }}
      />
      <div
        ref={outerRef}
        style={{
          opacity: 0,
          transform: "translateY(180px)",
          transition:
            "opacity 2s cubic-bezier(.22,1,.36,1), transform 2s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <div className="bg-[#3a3a3a] rounded-2xl pt-3.5 px-3.5 pb-0 shadow-[0_32px_100px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)] border border-white/[0.08]">
          <div className="flex bg-[#F7F8FC] overflow-hidden min-h-[480px] rounded-t">
            <NavRail />
            <SidebarNav nav="dashboard" />

            <div className="flex-1 flex flex-col min-w-0">
              <TopBar />
              <div className="flex-1 pt-3.5 px-4 pb-0 overflow-hidden">
                <div
                  id="dbo-e0"
                  style={{
                    opacity: 0,
                    transform: "translateY(10px)",
                    transition: "opacity .5s ease, transform .5s ease",
                  }}
                  className="flex items-start justify-between mb-3.5"
                >
                  <div>
                    <div className="text-base font-extrabold text-black">
                      Dashboard
                    </div>
                    <div className="text-[11px] text-[#9ca3af] mt-0.5">
                      A full picture of your community's financial activity.
                    </div>
                  </div>
                  <div className="flex gap-[7px]">
                    <button className="py-1.5 px-3 rounded-lg border-[1.5px] border-[#E0E0EB] bg-white text-black text-[11px] font-semibold">
                      Create Payment Plan
                    </button>
                    <button className="py-1.5 px-3 rounded-lg border-none bg-brand text-white text-[11px] font-semibold">
                      + Add Member
                    </button>
                  </div>
                </div>

                <StatsRow />

                <div className="grid grid-cols-2 gap-2.5">
                  <PaymentPlansPanel />
                  <RecentActivityPanel />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
