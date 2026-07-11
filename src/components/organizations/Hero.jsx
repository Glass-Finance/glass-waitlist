import { useNavigate } from "react-router-dom";
import { goToApp } from "../../utils/deviceRedirect";
import { ArrowRight } from "lucide-react";
import { Reveal } from "../Reveal";
import { motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
const waveBg = "/hero.webp";

// ─── Toast data ───────────────────────────────────────────────────────────────
const TOASTS = [
  {
    color: "#059669",
    title: "Payment received",
    sub: "Joseph Alabi paid ₦20,200",
  },
  {
    color: "#002FA7",
    title: "New member joined",
    sub: "Grace Adekunle joined the community",
  },
  {
    color: "#d4a017",
    title: "Reminder sent",
    sub: "SMS sent to 12 overdue members",
  },
  {
    color: "#7c3aed",
    title: "Plan milestone",
    sub: "Infra Development: 74% collected",
  },
  {
    color: "#059669",
    title: "Payment received",
    sub: "Emeka Nwosu paid ₦15,000",
  },
];

const ELEM_IDS = [
  "e0",
  "e1",
  "e2",
  "e3",
  "e4",
  "e5",
  "e6",
  "e7",
  "e8",
  "e9",
  "e10",
  "e11",
];
const PBARS = [
  { id: "pb0", w: "60%" },
  { id: "pb1", w: "74%" },
  { id: "pb2", w: "20%" },
];

// ─── Animated dashboard ───────────────────────────────────────────────────────
function DashboardOverlay() {
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
        if (i >= 5 && i <= 7) {
          const bar = $(PBARS[i - 5].id);
          if (bar) {
            await sw(60);
            bar.style.transition = "width 1.1s ease";
            bar.style.width = PBARS[i - 5].w;
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
        box-shadow:0 4px 22px rgba(0,20,80,0.22);border:1px solid #eef0f8;
        display:flex;align-items:flex-start;gap:9px;width:220px;
        opacity:0;transform:translateX(14px);
        transition:opacity .4s ease,transform .4s ease;
        font-family:Inter,-apple-system,sans-serif;
      `;
      el.innerHTML = `
        <div style="width:7px;height:7px;border-radius:50%;background:${d.color};flex-shrink:0;margin-top:4px"></div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#0f1d6e;margin-bottom:2px">${d.title}</div>
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

  const ri = {
    opacity: 0,
    transform: "translateY(10px)",
    transition: "opacity .5s ease, transform .5s ease",
  };
  const F = { fontFamily: "Inter,-apple-system,sans-serif" };

  return (
    <div style={{ position: "relative", width: "100%", ...F }}>
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
        <div
          style={{
            background: "#3a3a3a",
            borderRadius: 16,
            padding: "14px 14px 0",
            boxShadow:
              "0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              background: "#F7F8FC",
              overflow: "hidden",
              minHeight: 480,
              borderRadius: "4px 4px 0 0",
            }}
          >
            {/* Blue rail */}
            <div
              style={{
                width: 48,
                background: "#002FA7",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 12,
                flexShrink: 0,
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <img
                  src="/Glass.webp"
                  alt=""
                  style={{
                    width: 24,
                    height: 24,
                    objectFit: "contain",
                    filter: "brightness(0) invert(1)",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"
                    stroke="#002FA7"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 21V12h6v9"
                    stroke="#002FA7"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div
                style={{
                  width: 20,
                  height: 1,
                  background: "rgba(255,255,255,0.2)",
                  marginBottom: 12,
                }}
              />
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "#fff",
                  color: "#002FA7",
                  fontSize: 10,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 7,
                }}
              >
                KC
              </div>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                C1
              </div>
            </div>

            {/* White sidebar */}
            <div
              style={{
                width: 180,
                background: "#fff",
                borderRight: "1px solid #eef0f8",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  padding: "14px 12px",
                  borderBottom: "1px solid #eef0f8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#0f1d6e",
                      lineHeight: 1.3,
                    }}
                  >
                    Kings College Alumni
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#e85d04",
                      background: "#fff4ee",
                      borderRadius: 99,
                      padding: "1px 6px",
                      display: "inline-block",
                      marginTop: 2,
                    }}
                  >
                    Admin
                  </span>
                </div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3"
                    y="3"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="#9ca3af"
                    strokeWidth="1.8"
                  />
                  <rect
                    x="14"
                    y="3"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="#9ca3af"
                    strokeWidth="1.8"
                  />
                  <rect
                    x="3"
                    y="14"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="#9ca3af"
                    strokeWidth="1.8"
                  />
                  <rect
                    x="14"
                    y="14"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="#9ca3af"
                    strokeWidth="1.8"
                  />
                </svg>
              </div>
              <div style={{ padding: "10px 8px" }}>
                {[
                  {
                    label: "Dashboard",
                    active: true,
                    icon: (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="7"
                          height="7"
                          rx="1"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <rect
                          x="14"
                          y="3"
                          width="7"
                          height="7"
                          rx="1"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <rect
                          x="3"
                          y="14"
                          width="7"
                          height="7"
                          rx="1"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <rect
                          x="14"
                          y="14"
                          width="7"
                          height="7"
                          rx="1"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                      </svg>
                    ),
                  },
                  {
                    label: "Payments",
                    active: false,
                    icon: (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <rect
                          x="2"
                          y="5"
                          width="20"
                          height="14"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M2 10h20M6 15h4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    label: "Members",
                    active: false,
                    icon: (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="9"
                          cy="7"
                          r="4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    label: "Settings",
                    active: false,
                    icon: (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                      </svg>
                    ),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 10px",
                      borderRadius: 8,
                      marginBottom: 3,
                      background: item.active ? "#e6eeff" : "transparent",
                      color: item.active ? "#002FA7" : "#6b7280",
                      fontSize: 12,
                      fontWeight: item.active ? 700 : 500,
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Main area — identical to original, omitted for brevity but kept intact */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderBottom: "1px solid #eef0f8",
                  padding: "8px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#f5f6fa",
                    borderRadius: 7,
                    padding: "6px 12px",
                    border: "1px solid #eef0f8",
                    flex: 1,
                    maxWidth: 340,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="11"
                      cy="11"
                      r="8"
                      stroke="#9ca3af"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M21 21l-4.35-4.35"
                      stroke="#9ca3af"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>
                    Search members, payments, receipts...
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                        stroke="#6b7280"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M13.73 21a2 2 0 0 1-3.46 0"
                        stroke="#6b7280"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: 5,
                        height: 5,
                        background: "#e11d48",
                        borderRadius: "50%",
                        border: "1px solid #fff",
                      }}
                    />
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg,#002FA7,#4f6fe5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      AA
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#0f1d6e",
                          lineHeight: 1.2,
                        }}
                      >
                        Amina Agrawal
                      </div>
                      <div style={{ fontSize: 9, color: "#9ca3af" }}>
                        amina@gmail.com
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{ flex: 1, padding: "14px 16px 0", overflow: "hidden" }}
              >
                <div
                  id="dbo-e0"
                  style={{
                    opacity: 0,
                    transform: "translateY(10px)",
                    transition: "opacity .5s ease, transform .5s ease",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "#0f1d6e",
                      }}
                    >
                      Dashboard
                    </div>
                    <div
                      style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}
                    >
                      A full picture of your community's financial activity.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 7 }}>
                    <button
                      style={{
                        padding: "6px 12px",
                        borderRadius: 7,
                        border: "1.5px solid #e0e3f0",
                        background: "#fff",
                        color: "#0f1d6e",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      Create Payment Plan
                    </button>
                    <button
                      style={{
                        padding: "6px 12px",
                        borderRadius: 7,
                        border: "none",
                        background: "#002FA7",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      + Add Member
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,1fr)",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  {[
                    {
                      id: "e1",
                      label: "Total Members",
                      value: "209",
                      color: "#002FA7",
                      icon: (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                            stroke="#002FA7"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="9"
                            cy="7"
                            r="4"
                            stroke="#002FA7"
                            strokeWidth="1.8"
                          />
                          <path
                            d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                            stroke="#002FA7"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      ),
                    },
                    {
                      id: "e2",
                      label: "Inactive Members",
                      value: "12",
                      color: "#e85d04",
                      icon: (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                            stroke="#e85d04"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="9"
                            cy="7"
                            r="4"
                            stroke="#e85d04"
                            strokeWidth="1.8"
                          />
                          <line
                            x1="17"
                            y1="11"
                            x2="23"
                            y2="17"
                            stroke="#e85d04"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <line
                            x1="23"
                            y1="11"
                            x2="17"
                            y2="17"
                            stroke="#e85d04"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      ),
                    },
                    {
                      id: "e3",
                      label: "Total Contributions",
                      value: "₦ 2,002,490",
                      color: "#d4a017",
                      small: true,
                      icon: (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="#d4a017"
                            strokeWidth="1.8"
                          />
                          <path
                            d="M12 6v2m0 8v2M9 9h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15"
                            stroke="#d4a017"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      ),
                    },
                    {
                      id: "e4",
                      label: "Active Plans",
                      value: "05",
                      color: "#7c3aed",
                      icon: (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <rect
                            x="2"
                            y="5"
                            width="20"
                            height="14"
                            rx="2"
                            stroke="#7c3aed"
                            strokeWidth="1.8"
                          />
                          <path
                            d="M2 10h20M6 15h4"
                            stroke="#7c3aed"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      ),
                    },
                  ].map((s) => (
                    <div
                      key={s.id}
                      id={"dbo-" + s.id}
                      style={{
                        opacity: 0,
                        transform: "translateY(10px)",
                        transition: "opacity .5s ease, transform .5s ease",
                        background: "#fff",
                        borderRadius: 10,
                        padding: "12px 14px",
                        border: "1px solid #eef0f8",
                        boxShadow: "0 1px 4px rgba(0,47,167,0.05)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "#6b7280",
                          fontWeight: 500,
                          marginBottom: 8,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {s.label}
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="#c4c9e0"
                            strokeWidth="1.8"
                          />
                          <path
                            d="M12 8v4M12 16h.01"
                            stroke="#c4c9e0"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {s.icon}
                        <span
                          style={{
                            fontSize: s.small ? 12 : 16,
                            fontWeight: 800,
                            color: "#0f1d6e",
                          }}
                        >
                          {s.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      background: "rgba(204,219,255,0.4)",
                      borderRadius: 10,
                      border: "1px solid #eef0f8",
                      padding: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#0f1d6e",
                        }}
                      >
                        Payment Plans
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#002FA7",
                          fontWeight: 600,
                        }}
                      >
                        Manage All
                      </span>
                    </div>
                    {[
                      {
                        id: "e5",
                        pb: "pb0",
                        name: "Association Dues",
                        freq: "Monthly",
                        fColor: "#d4a017",
                        fBg: "#fff8e7",
                        amt: "₦1.2M",
                        paid: "24 / 120",
                        bar: "#d4a017",
                        pct: "60%",
                      },
                      {
                        id: "e6",
                        pb: "pb1",
                        name: "Infrastructure Development",
                        freq: "One-Time",
                        fColor: "#7c3aed",
                        fBg: "#f3eeff",
                        amt: "₦300,000",
                        paid: "24 / 120",
                        bar: "#7c3aed",
                        pct: "74%",
                      },
                      {
                        id: "e7",
                        pb: "pb2",
                        name: "End Of The Year Party",
                        freq: "Weekly",
                        fColor: "#059669",
                        fBg: "#ecfdf5",
                        amt: "₦400,500",
                        paid: "24 / 120",
                        bar: "#059669",
                        pct: "20%",
                      },
                    ].map((p) => (
                      <div
                        key={p.id}
                        id={"dbo-" + p.id}
                        style={{
                          opacity: 0,
                          transform: "translateY(10px)",
                          transition: "opacity .5s ease, transform .5s ease",
                          background: "#fff",
                          borderRadius: 8,
                          padding: "10px 12px",
                          marginBottom: 6,
                          border: "1px solid rgba(204,219,255,0.6)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 3,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#0f1d6e",
                              }}
                            >
                              {p.name}
                            </span>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: p.fColor,
                                background: p.fBg,
                                borderRadius: 99,
                                padding: "1px 6px",
                              }}
                            >
                              {p.freq}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#0f1d6e",
                            }}
                          >
                            {p.amt}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            color: "#9ca3af",
                            marginBottom: 5,
                          }}
                        >
                          {p.paid} members paid
                        </div>
                        <div
                          style={{
                            height: 4,
                            borderRadius: 99,
                            background: "#eef0f8",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            id={"dbo-" + p.pb}
                            style={{
                              height: "100%",
                              borderRadius: 99,
                              background: p.bar,
                              width: 0,
                            }}
                          />
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            color: "#9ca3af",
                            textAlign: "right",
                            marginTop: 2,
                          }}
                        >
                          {p.pct} Collected
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 10,
                      border: "1px solid #eef0f8",
                      padding: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#0f1d6e",
                        marginBottom: 10,
                      }}
                    >
                      Recent Activity
                    </div>
                    {[
                      {
                        id: "e8",
                        aBg: "#ecfdf5",
                        aColor: "#059669",
                        type: "payment",
                        name: "Joseph Alabi",
                        action: "paid",
                        detail: "₦20,200 for Infrastructure...",
                      },
                      {
                        id: "e9",
                        aBg: "#e6eeff",
                        aColor: "#002FA7",
                        type: "member",
                        name: "Grace Adekunle",
                        action: "joined the community",
                        detail: "",
                      },
                      {
                        id: "e10",
                        aBg: "#ecfdf5",
                        aColor: "#059669",
                        type: "payment",
                        name: "Emeka Nwosu",
                        action: "paid Event Fee",
                        detail: "₦15,000",
                      },
                      {
                        id: "e11",
                        aBg: "#fff8e7",
                        aColor: "#d4a017",
                        type: "reminder",
                        name: null,
                        action: "Dues Reminder Sent to",
                        detail: "12 members",
                      },
                    ].map((a, i, arr) => (
                      <div
                        key={a.id}
                        id={"dbo-" + a.id}
                        style={{
                          opacity: 0,
                          transform: "translateY(10px)",
                          transition: "opacity .5s ease, transform .5s ease",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 9,
                          padding: "9px 0",
                          borderBottom:
                            i < arr.length - 1 ? "1px solid #f3f4f8" : "none",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background: a.aBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {a.type === "payment" && (
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke={a.aColor}
                                strokeWidth="1.8"
                              />
                              <path
                                d="M12 6v2m0 8v2M9 9h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15"
                                stroke={a.aColor}
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                          {a.type === "member" && (
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                                stroke={a.aColor}
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                              <circle
                                cx="12"
                                cy="7"
                                r="4"
                                stroke={a.aColor}
                                strokeWidth="1.8"
                              />
                            </svg>
                          )}
                          {a.type === "reminder" && (
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                                stroke={a.aColor}
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                              <path
                                d="M13.73 21a2 2 0 0 1-3.46 0"
                                stroke={a.aColor}
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 11,
                              color: "#374151",
                              margin: 0,
                              lineHeight: 1.45,
                            }}
                          >
                            {a.name && (
                              <strong
                                style={{ color: "#002FA7", fontWeight: 700 }}
                              >
                                {a.name}{" "}
                              </strong>
                            )}
                            {a.action}
                            {a.detail && (
                              <>
                                {" "}
                                <strong style={{ color: "#0f1d6e" }}>
                                  {a.detail}
                                </strong>
                              </>
                            )}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              marginTop: 3,
                            }}
                          >
                            <svg
                              width="9"
                              height="9"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="#9ca3af"
                                strokeWidth="1.8"
                              />
                              <path
                                d="M12 6v6l4 2"
                                stroke="#9ca3af"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                            </svg>
                            <span style={{ fontSize: 9, color: "#9ca3af" }}>
                              5 hours ago
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Scaled dashboard ───────────────────────────────────────────────────────
// DashboardOverlay's internals are all fixed-pixel (960px-wide layout,
// fixed sidebar/grid widths) — retrofitting every value to be fluid would
// mean rebuilding it. Instead, render it at its natural size and scale the
// whole thing down to fit whatever width it's given (mobile included),
// the same approach already used for the member-side dashboard mockup.
// offsetWidth/offsetHeight always reflect the pre-transform layout size
// (CSS transform doesn't affect layout), so measuring the inner node gives
// stable natural dimensions to scale from regardless of the current scale.
const DASHBOARD_NATURAL_WIDTH = 960;

function ScaledDashboard() {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [naturalHeight, setNaturalHeight] = useState(0);

  useLayoutEffect(() => {
    function measure() {
      if (!outerRef.current || !innerRef.current) return;
      const containerWidth = outerRef.current.offsetWidth;
      const h = innerRef.current.offsetHeight;
      if (containerWidth > 0) {
        setScale(Math.min(1, containerWidth / DASHBOARD_NATURAL_WIDTH));
      }
      if (h > 0) setNaturalHeight(h);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div
      ref={outerRef}
      style={{ width: "100%", overflow: "hidden", height: naturalHeight ? naturalHeight * scale : undefined }}
    >
      <div
        ref={innerRef}
        style={{ width: DASHBOARD_NATURAL_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <DashboardOverlay />
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
export default function Hero() {
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    const prevBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      root.style.scrollBehavior = prevBehavior;
    });
  }, []);

  return (
    <>
    <style>{`
      @keyframes waveDrift {
        0%   { transform: scale(1.06) translate(0px, 0px); }
        30%  { transform: scale(1.09) translate(-16px, -8px); }
        65%  { transform: scale(1.07) translate(12px, -14px); }
        100% { transform: scale(1.06) translate(0px, 0px); }
      }
      @media (max-width: 640px) {
        .hero-wave-bg { animation: none !important; transform: scale(1.06) !important; will-change: auto !important; }
        .hero-blur-blobs { display: none !important; }
      }
    `}</style>
    <section className="relative overflow-hidden pt-[96px]">
      <div
        className="hero-wave-bg absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${waveBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          animation: "waveDrift 28s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(2,3,16,0.91) 0%, rgba(5,4,26,0.88) 40%, rgba(12,4,24,0.83) 100%)",
        }}
      />
      <canvas
        id="hero-static-canvas"
        className="absolute inset-0 pointer-events-none select-none"
        style={{ width: "100%", height: "100%", opacity: 0.035, mixBlendMode: "screen" }}
      />
      <div className="hero-blur-blobs pointer-events-none absolute inset-0 select-none overflow-hidden">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[560px]"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 100%, #5a0a5a 0%, #300840 45%, transparent 72%)",
            filter: "blur(55px)",
            opacity: 0.7,
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[320px]"
          style={{
            background:
              "radial-gradient(ellipse at bottom left, #6b0a4a 0%, transparent 60%)",
            filter: "blur(80px)",
            opacity: 0.45,
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-[200px]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(2,3,16,0.85) 0%, transparent 100%)",
          }}
        />
      </div>

      <div
        className="relative z-10 w-full max-w-[720px] mx-auto text-center px-6 pt-12 pb-8 sm:pt-20"
        style={{ fontFamily: "Inter,-apple-system,sans-serif" }}
      >
        <Reveal variant="up" delay={80}>
          <h1
            className="font-bold text-white leading-[1.05] tracking-tight mb-5 text-center max-w-[480px] lg:max-w-[720px] mx-auto"
            style={{ fontSize: "clamp(44px,7vw,70px)" }}
          >
            Community Finance{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Crystal Clear
            </span>
          </h1>
        </Reveal>
        <Reveal variant="up" delay={160}>
          <p className="text-[15px] sm:text-[16px] text-white/55 leading-relaxed max-w-[540px] mx-auto mb-8 sm:mb-6">
            Save 15–20 hours monthly chasing payments. The transparent way for
            Nigerian associations, clubs, and schools to manage funds.
          </p>
        </Reveal>
        <Reveal variant="up" delay={240}>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {/* ── FIXED: navigates to org onboarding entry point ── */}
            <button
              onClick={() => goToApp("/sign-up", navigate)}
              className="inline-flex items-center gap-2 bg-white text-[#0d1022] text-[15px] px-8 py-3.5 rounded-full shadow-lg shadow-black/30 cursor-pointer"
              style={{ fontFamily: "Inter,sans-serif", fontWeight: 500, transition: "transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.18s ease" }}
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const dx = ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * 10;
                const dy = ((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * 6;
                e.currentTarget.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(1.04)`;
                e.currentTarget.style.boxShadow = "0 18px 48px rgba(255,255,255,0.25), 0 4px 16px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translate(0,0) scale(1)";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              Create Your Community
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ display: "inline-flex", alignItems: "center" }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </button>
          </div>
        </Reveal>
      </div>

      <Reveal variant="up" delay={360}>
        <div className="relative z-10 w-full px-4 sm:px-8 pb-0">
          <div className="w-full max-w-[960px] mx-auto">
            <ScaledDashboard />
          </div>
        </div>
      </Reveal>

      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 hidden sm:block"
        style={{
          height: "130px",
          background:
            "linear-gradient(to top, rgba(229,229,229,0.97) 0%, rgba(229,229,229,0.65) 35%, rgba(229,229,229,0.1) 75%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 block sm:hidden"
        style={{
          height: "70px",
          background:
            "linear-gradient(to top, rgba(229,229,229,0.95) 0%, rgba(229,229,229,0.5) 40%, transparent 100%)",
        }}
      />
    </section>
    </>
  );
}
