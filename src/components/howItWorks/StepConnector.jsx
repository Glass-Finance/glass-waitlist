import { motion, useScroll, useTransform } from "framer-motion";

// Grey flowchart-style track (matches the Figma reference — neutral lines
// with rounded right-angle turns, not a smooth purple S-curve) with a
// blue "progress" line drawn on top of it. The progress line's length is
// driven directly by scroll position (useTransform on scrollYProgress),
// not a fixed-duration whileInView animation — so it actually traces in
// sync with how far you've scrolled, the way Stripe's marketing pages do
// it, rather than just firing a canned animation once you cross a
// viewport threshold.
export default function StepConnector({ fromDir, stepRef }) {
  const { scrollYProgress } = useScroll({
    target: stepRef,
    offset: ["center center", "end 25%"],
  });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const sectionOpacity = useTransform(
    scrollYProgress,
    [0, 0.05, 0.95, 1],
    [0, 1, 1, 0],
  );

  const isLTR = fromDir === "ltr";
  const R = 46;
  const x1 = isLTR ? 975 : 25;
  const x2 = isLTR ? 25 : 975;
  const yTop = 5;
  const yMid = 110;
  const yBot = 215;

  const path = isLTR
    ? [
        `M ${x1} ${yTop}`,
        `L ${x1} ${yMid - R}`,
        `Q ${x1} ${yMid} ${x1 - R} ${yMid}`,
        `L ${x2 + R} ${yMid}`,
        `Q ${x2} ${yMid} ${x2} ${yMid + R}`,
        `L ${x2} ${yBot}`,
      ].join(" ")
    : [
        `M ${x1} ${yTop}`,
        `L ${x1} ${yMid - R}`,
        `Q ${x1} ${yMid} ${x1 + R} ${yMid}`,
        `L ${x2 - R} ${yMid}`,
        `Q ${x2} ${yMid} ${x2} ${yMid + R}`,
        `L ${x2} ${yBot}`,
      ].join(" ");

  return (
    <motion.div
      className="hidden md:block"
      style={{
        opacity: sectionOpacity,
        height: "200px",
        marginTop: "-10px",
        marginBottom: "-10px",
        position: "relative",
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      <svg
        viewBox="0 0 1000 220"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
        fill="none"
      >
        {/* Grey track — always visible, the static "rail" the progress draws over */}
        <path
          d={path}
          stroke="#D7DAE3"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Blue progress line — length tied directly to scroll position */}
        <motion.path
          d={path}
          stroke="#002FA7"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pathLength: progress }}
        />

        {/* Soft glow at the leading tip, fades in once progress starts */}
        <motion.circle
          r={5}
          fill="#002FA7"
          opacity={0.25}
          style={{
            offsetDistance: useTransform(progress, (p) => `${p * 100}%`),
            offsetPath: `path("${path}")`,
          }}
        />
      </svg>
    </motion.div>
  );
}
