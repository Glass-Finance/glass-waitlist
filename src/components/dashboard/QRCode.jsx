import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export default function QRCodeCanvas({ value, size = 160, color = "#002FA7" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: color, light: "#E5E5E5" }, // ← match page bg, no white box
    }).catch(() => {});
  }, [value, size, color]);

  if (!value) return null;
  return <canvas ref={canvasRef} width={size} height={size} />;
}
