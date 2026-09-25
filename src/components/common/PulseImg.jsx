// src/components/common/PulseImg.jsx
//
// Avatar/logo <img> for tiny fixed-size remote assets: shows a pulsing
// skeleton while the file fetches, then fades the real image in. A CSS
// skeleton beats a fetched blur placeholder here — zero extra requests,
// and something is visible before the request even starts (an LQIP fetch
// for a 36px avatar is pure overhead).
//
// The skeleton sits BEHIND the img (the img is opacity-0 until loaded), so
// containers that already carry a background (gradient, initials fallback)
// keep showing it through `bg-transparent` on the skeleton.

import { useState } from "react";

/**
 * @param {object} props
 * @param {string} props.src - remote image URL (no src → renders nothing)
 * @param {string} [props.alt]
 * @param {string} [props.className] - applied to the wrapper span
 * @param {string} [props.imgClassName] - applied to the rendered <img>
 * @param {string} [props.skeletonClassName] - extra classes for the skeleton
 */
export default function PulseImg({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  skeletonClassName = "bg-black/10",
  ...imgProps
}) {
  const [loaded, setLoaded] = useState(false);
  if (!src) return null;

  return (
    <span className={`relative block overflow-hidden ${className}`}>
      {!loaded && (
        <span
          aria-hidden="true"
          className={`absolute inset-0 animate-pulse ${skeletonClassName}`}
        />
      )}
      <img
        src={src}
        alt={alt}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`block w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${imgClassName}`}
        {...imgProps}
      />
    </span>
  );
}
