// src/components/common/CloudAspectImage.jsx
//
// Natural-aspect Cloudinary image (w-full h-auto) — the pattern CloudImage
// can't cover: CloudImage's inner fit needs a fixed-size box, while these
// images let their own aspect ratio define the box height (see the
// contract comment in CloudImage.jsx).
//
// One <img>, one request: the Cloudinary-optimized URL + responsive srcSet,
// rendered normally — no placeholder fetch, no blur layer, no crossfade.
// Load behavior is whatever the caller passes through (`loading="lazy"`
// etc. via props) plus `decoding="async"`.
//
// Pass `aspectRatio` (e.g. "16 / 9") whenever the surrounding layout does
// NOT already reserve the height — the wrapper then stands in for the
// image from first layout, so visitors see reserved space → image, instead
// of blank → layout snap. Use the image's intrinsic w / h.
//
// (Formerly `LqipImg`; renamed when the landing pipeline dropped LQIP —
// docs/cloudinary.md describes the current architecture.)

import { cldUrl, cldSrcSet, widthsFor } from "../../lib/cloudinary";

/**
 * @param {object} props
 * @param {string} props.publicId - e.g. "glass/work/org-go-live"
 * @param {string} props.alt
 * @param {number} props.width - largest rendered width; drives srcSet
 * @param {string} [props.sizes] - responsive sizes string, default "100vw"
 * @param {string} [props.className] - applied to the wrapper span
 * @param {string} [props.imgClassName] - applied to the real <img>
 * @param {string} [props.aspectRatio] - CSS aspect-ratio for the wrapper
 *   ("16 / 9", "563 / 303", ...) — reserves the image's space before the
 *   real image loads
 * @param {import("react").RefObject} [props.ref] - forwarded to the real <img>
 */
export default function CloudAspectImage({
  publicId,
  alt,
  width,
  sizes = "100vw",
  className = "",
  imgClassName = "",
  aspectRatio,
  ref: fwdRef,
  ...imgProps
}) {
  // Callers that position the image themselves (absolute inset, etc.) pass
  // their own position class — only default to `relative` when they don't,
  // so `relative absolute` never fights over the cascade.
  const hasOwnPosition = /\b(absolute|fixed|sticky)\b/.test(className);

  return (
    <span
      className={`block ${hasOwnPosition ? "" : "relative"} ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <img
        ref={fwdRef}
        src={cldUrl(publicId, { width })}
        srcSet={cldSrcSet(publicId, widthsFor(width))}
        sizes={sizes}
        alt={alt}
        decoding="async"
        className={`relative block w-full h-auto ${imgClassName}`}
        {...imgProps}
      />
    </span>
  );
}
