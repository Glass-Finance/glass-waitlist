// src/components/common/CloudImage.jsx
//
// Drop-in replacement for a raw <img src={localImport} />. Renders a tiny
// (~1-2kb) blurred placeholder immediately — visible even on a slow
// connection before the real image finishes — then cross-fades to the
// full image once it loads. Always serves f_auto/q_auto (best format +
// compression for the requesting browser) and a responsive srcSet so
// phones don't download desktop-sized files.
//
// Usage (replacing the old pattern):
//   Before: import signupIcon from "../../assets/howItWorks/icon-signup.png";
//           <img src={signupIcon} alt="" className="w-[42px] h-[42px]" />
//
//   After:  <CloudImage publicId="glass/howItWorks/icon-signup" alt=""
//                        width={70} className="w-[42px] h-[42px] lg:w-[70px] lg:h-[70px]" />
//
// `width` should be the LARGEST size this image ever renders at (usually
// the desktop/lg width) — srcSet is generated from it, letting the browser
// pick the right one for the actual layout size and screen density.
//
// This component is for images rendered inside a fixed-size box (cover),
// or a fixed-size container with objectFit="contain" (icons/logos). For
// images whose natural aspect ratio defines the box height (e.g.
// `w-full h-auto` work illustrations), render a plain
// <img src={cldUrl(...)} srcSet={cldSrcSet(...)}> instead — a h-full
// absolute-object fit can't size itself without a known height.

import { useState } from "react";
import { cldUrl, cldSrcSet, widthsFor } from "../../lib/cloudinary";

/**
 * @param {object} props
 * @param {string} props.publicId - e.g. "glass/hero/hero"
 * @param {string} props.alt
 * @param {number} props.width - largest rendered width in px; drives srcSet
 * @param {string} [props.sizes] - responsive sizes string, default "100vw"
 * @param {string} [props.className] - applied to the wrapper span
 * @param {boolean} [props.priority] - eager + fetchpriority=high (LCP images)
 * @param {"cover"|"contain"} [props.objectFit] - default "cover"
 * @param {object} [props.style] - applied to the wrapper span
 * @param {string} [props.imgClassName] - extra classes for the rendered <img>
 * @param {boolean} [props.draggable] - forwarded to the rendered <img>s
 * @param {import("react").RefObject} [props.imgRef] - forwarded to the real <img>
 * @param {function} [props.onClick]
 */
export default function CloudImage({
  publicId,
  alt,
  width,
  sizes = "100vw",
  className = "",
  priority = false,
  objectFit = "cover",
  style,
  imgClassName = "",
  draggable,
  imgRef,
  onClick,
}) {
  const [loaded, setLoaded] = useState(false);

  const src = cldUrl(publicId, { width });
  const srcSet = cldSrcSet(publicId, widthsFor(width));
  const placeholder = cldUrl(publicId, { blur: true });
  const fitCls = objectFit === "contain" ? "object-contain" : "object-cover";

  return (
    <span
      className={`relative inline-block overflow-hidden ${className}`}
      style={style}
      onClick={onClick}
    >
      {/* Blur placeholder — tiny payload, shows instantly on slow networks */}
      <img
        src={placeholder}
        alt=""
        aria-hidden="true"
        draggable={draggable}
        className={`absolute inset-0 w-full h-full ${fitCls} ${imgClassName} transition-opacity duration-500 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
        style={{ filter: "blur(8px)" }}
      />
      {/* Real image */}
      <img
        ref={imgRef}
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        draggable={draggable}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`relative w-full h-full ${fitCls} ${imgClassName} transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}
