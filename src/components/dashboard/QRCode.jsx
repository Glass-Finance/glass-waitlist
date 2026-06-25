import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export default function QRCodeCanvas({ value, size = 160 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: "#002FA7", light: "#FFFFFF" },
    }).catch(() => {});
  }, [value, size]);

  if (!value) return null;
  return <canvas ref={canvasRef} width={size} height={size} />;
}
