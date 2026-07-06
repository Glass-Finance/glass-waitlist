import { motion } from "motion/react";
import { useEffect, useRef, useState, useMemo } from "react";

const buildKeyframes = (from, steps) => {
  const keys = new Set([
    ...Object.keys(from),
    ...steps.flatMap((s) => Object.keys(s)),
  ]);
  const keyframes = {};
  keys.forEach((k) => {
    keyframes[k] = [from[k], ...steps.map((s) => s[k])];
  });
  return keyframes;
};

// On mobile, filter:blur() on individual spans creates one compositing
// layer per word and tanks scroll performance. Skip blur entirely on
// narrow screens and use a plain opacity+translate reveal instead.
const isMobileScreen =
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 640px)").matches;

const BlurText = ({
  text = "",
  delay = 200,
  className = "",
  animateBy = "words",
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  animationFrom,
  animationTo,
  easing = (t) => t,
  onAnimationComplete,
  stepDuration = 0.35,
  centered = false,
}) => {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultFrom = useMemo(
    () =>
      direction === "top"
        ? isMobileScreen
          ? { opacity: 0, y: -14 }
          : { filter: "blur(8px)", opacity: 0, y: -18 }
        : isMobileScreen
          ? { opacity: 0, y: 14 }
          : { filter: "blur(8px)", opacity: 0, y: 18 },
    [direction],
  );

  const defaultTo = useMemo(
    () =>
      isMobileScreen
        ? [{ opacity: 1, y: 0 }]
        : [
            { filter: "blur(3px)", opacity: 0.5, y: direction === "top" ? 2 : -2 },
            { filter: "blur(0px)", opacity: 1, y: 0 },
          ],
    [direction],
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;

  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) =>
    stepCount === 1 ? 0 : i / (stepCount - 1),
  );

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        justifyContent: centered ? "center" : "flex-start",
        width: centered ? "100%" : "auto",
      }}
    >
      {elements.map((segment, index) => {
        const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);
        const spanTransition = {
          duration: totalDuration,
          times,
          delay: (index * delay) / 1000,
        };
        spanTransition.ease = easing;

        return (
          <motion.span
            className={isMobileScreen
              ? "inline-block will-change-[transform,opacity]"
              : "inline-block will-change-[transform,filter,opacity]"}
            key={index}
            initial={fromSnapshot}
            animate={inView ? animateKeyframes : fromSnapshot}
            transition={spanTransition}
            onAnimationComplete={
              index === elements.length - 1 ? onAnimationComplete : undefined
            }
          >
            {segment === " " ? "\u00A0" : segment}
            {animateBy === "words" && index < elements.length - 1 && "\u00A0"}
          </motion.span>
        );
      })}
    </span>
  );
};

export default BlurText;
