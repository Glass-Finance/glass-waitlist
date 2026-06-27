import { motion } from "motion/react";

export default function MobileDivider() {
  return (
    <div className="flex md:hidden items-center justify-center gap-[5px] py-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-px rounded-full"
          style={{ height: 32, background: "linear-gradient(to bottom, #002FA7, rgba(0,47,167,0.25))" }}
          animate={{ scaleY: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}
