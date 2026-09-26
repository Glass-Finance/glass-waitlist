// src/components/common/LqipImg.jsx
//
// Natural-aspect photo (w-full h-auto) with a blur-up LQIP behind it — the
// pattern CloudImage can't cover: CloudImage's inner fit needs a fixed-size
// box, while these images let their own aspect ratio define the box height
// (see the contract comment in CloudImage.jsx).
//
// Wrapper is `relative block` with no height of its own: it takes the real
// img's height as soon as metadata lands, at which point the already-fetched
// 64px placeholder fills the box (CSS-blurred) while the full image streams
// in. The real img stays opacity-0 until load, same as CloudImage, so the
// cross-fade is one consistent behavior across both components.

import { useState } from "react";
import { cldUrl, cldSrcSet, widthsFor } from "../../lib/cloudinary";

/**
 * @param {object} props
 * @param {string} props.publicId - e.g. "glass/howItWorks/step-1"
 * @param {string} props.alt
 * @param {number} props.width - largest rendered width; drives srcSet
 * @param {string} [props.sizes] - responsive sizes string, default "100vw"
 * @param {string} [props.className] - applied to the wrapper span
 * @param {string} [props.imgClassName] - applied to the real <img>
 */
export default function LqipImg({
  publicId,
  alt,
  width,
  sizes = "100vw",
  className = "",
  imgClassName = "",
  ...imgProps
}) {
  const [loaded, setLoaded] = useState(false);
  // Callers that position the image themselves (absolute inset, etc.) pass
  // their own position class — only default to `relative` when they don't,
  // so `relative absolute` never fights over the cascade.
  const hasOwnPosition = /\b(absolute|fixed|sticky)\b/.test(className);

  return (
    <span className={`block ${hasOwnPosition ? "" : "relative"} ${className}`}>
      <img
        src={cldUrl(publicId, { blur: true })}
        alt=""
        aria-hidden="true"
        decoding="async"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
        style={{ filter: "blur(8px)" }}
      />
      <img
        src={cldUrl(publicId, { width })}
        srcSet={cldSrcSet(publicId, widthsFor(width))}
        sizes={sizes}
        alt={alt}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`relative block w-full h-auto transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${imgClassName}`}
        {...imgProps}
      />
    </span>
  );
}
