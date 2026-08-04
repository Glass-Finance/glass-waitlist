import { useLayoutEffect, useRef, useState } from "react";
import DashboardOverlay from "./DashboardOverlay";
import { DASHBOARD_NATURAL_WIDTH } from "./constants";

// offsetWidth/offsetHeight always reflect the pre-transform layout size (CSS
// transform doesn't affect layout), so measuring the inner node gives stable
// natural dimensions to scale from regardless of the current scale.
export default function ScaledDashboard() {
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
