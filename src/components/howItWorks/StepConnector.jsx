import { motion, useScroll, useTransform } from "framer-motion";

// Builds a flowchart-style path (two rounded right-angle turns) between two
// arbitrary points, generalizing the old fixed-symmetric-viewBox version so
// it can connect two real measured badge positions instead of guessed
// offsets. `offset` nudges the vertical run inward/outward per line, the
// way the 3 lines bundle together in the Figma reference.
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

// Renders the 3-line bundle between two badge anchor points (p1, p2 — real
// measured coordinates from HowItWorksSection, not guessed positions). Each
// line's draw-in is tied directly to scroll position via pathLength, so it
// traces as you scroll rather than firing a fixed-duration reveal.
export default function StepConnector({ p1, p2, bendY, stepRef }) {
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

  return (
    <motion.g style={{ opacity: sectionOpacity }}>
      {OFFSETS.map((off, i) => {
        const d = buildPath(p1, p2, off, bendY);
        return (
          <g key={i} opacity={ALPHAS[i]}>
            <path d={d} stroke="#D7DAE3" strokeWidth={STROKE_W[i]} strokeLinecap="round" fill="none" />
            <motion.path
              d={d}
              stroke="#002FA7"
              strokeWidth={STROKE_W[i]}
              strokeLinecap="round"
              fill="none"
              style={{ pathLength: progress }}
            />
          </g>
        );
      })}
    </motion.g>
  );
}
