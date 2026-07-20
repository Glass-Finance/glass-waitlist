import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

function buildPath(p1, p2, offset, bendY) {
  const dir = p2.x >= p1.x ? 1 : -1;
  const x1 = p1.x - dir * offset;
  const x2 = p2.x + dir * offset;
  const yMid = bendY ?? (p1.y + p2.y) / 2;
  const r = Math.min(40, Math.max(8, Math.min(Math.abs(yMid - p1.y), Math.abs(p2.y - yMid)) - 4));
  return [
    `M ${x1} ${p1.y}`,
    `L ${x1} ${yMid - r}`,
    `Q ${x1} ${yMid} ${x1 + r * dir} ${yMid}`,
    `L ${x2 - r * dir} ${yMid}`,
    `Q ${x2} ${yMid} ${x2} ${yMid + r}`,
    `L ${x2} ${p2.y}`,
  ].join(" ");
}

const OFFSETS = [0, 10, 20];
const STROKE_W = [2, 1.3, 0.8];
const ALPHAS = [1, 0.55, 0.28];

export default function StepConnector({ p1, p2, bendY, stepRef }) {
  const mainPathRef = useRef(null);
  const dotRef = useRef(null);
  const dotRingRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: stepRef,
    offset: ["start 70%", "end 5%"],
  });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const sectionOpacity = useTransform(
    scrollYProgress,
    [0, 0.03, 0.97, 1],
    [0, 1, 1, 0],
  );

  // Update the leading dot position imperatively on each progress change
  useEffect(() => {
    return progress.on("change", (v) => {
      const path = mainPathRef.current;
      const dot = dotRef.current;
      const ring = dotRingRef.current;
      if (!path || !dot) return;
      const len = path.getTotalLength();
      if (!len) return;
      const pt = path.getPointAtLength(v * len);
      const visible = v > 0.015 && v < 0.985;
      dot.setAttribute("cx", pt.x);
      dot.setAttribute("cy", pt.y);
      dot.style.opacity = visible ? "1" : "0";
      if (ring) {
        ring.setAttribute("cx", pt.x);
        ring.setAttribute("cy", pt.y);
        ring.style.opacity = visible ? "0.35" : "0";
      }
    });
  }, [progress]);

  return (
    <motion.g style={{ opacity: sectionOpacity }}>
      {OFFSETS.map((off, i) => {
        const d = buildPath(p1, p2, off, bendY);
        return (
          <g key={i} opacity={ALPHAS[i]}>
            {/* Ghost track */}
            <path
              d={d}
              stroke="#D7DAE3"
              strokeWidth={STROKE_W[i]}
              strokeLinecap="round"
              fill="none"
            />
            {/* Animated fill */}
            <motion.path
              ref={i === 0 ? mainPathRef : undefined}
              d={d}
              stroke={i === 0 ? "#002FA7" : "#3b4fc8"}
              strokeWidth={STROKE_W[i]}
              strokeLinecap="round"
              fill="none"
              className={i === 0 ? "[filter:drop-shadow(0_0_2px_rgba(0,47,167,0.9))_drop-shadow(0_0_5px_rgba(79,70,229,0.45))]" : ""}
              style={{ pathLength: progress }}
            />
          </g>
        );
      })}

      {/* Outer glow ring around dot */}
      <circle
        ref={dotRingRef}
        r={7}
        fill="none"
        stroke="#4f46e5"
        strokeWidth={1.5}
        className="blur-[2px]"
        style={{ opacity: 0 }}
      />
      {/* Leading dot */}
      <circle
        ref={dotRef}
        r={3.5}
        fill="#4f46e5"
        className="[filter:drop-shadow(0_0_3px_rgba(99,102,241,1))_drop-shadow(0_0_7px_rgba(79,70,229,0.7))]"
        style={{ opacity: 0 }}
      />
    </motion.g>
  );
}
