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
//
// SECURITY: every caller feeds this component a URL straight out of an API
// payload — `user.profileImage.url` (/user/me), `logo.url` (invites),
// `item.logo.url` (admin payments) — so the scheme is attacker-influenced the
// same way the four profile-image sinks were before PR #79. Validate here,
// once, rather than at each call site: all four consumers route through this
// component, so centralising the check closes them together.
//
// Reuse the existing `safeImageUrl` validator (pure; returns null rather than
// repairing) — do NOT add a second sanitizer here. A rejected URL takes the
// same no-render path a missing src already took, which is why the component
// keeps its "renders nothing" contract instead of guessing a fallback image.
//
// `srcSet` is destructured out and discarded. `...imgProps` is spread BEFORE
// `src`, and an HTML `srcset` with a matching candidate makes the browser
// ignore `src` entirely — so an unvalidated `srcSet` would otherwise be a
// straight bypass of the check below.

import { useState } from "react";
import { safeImageUrl } from "../../utils/safeImageUrl";

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
  // eslint-disable-next-line no-unused-vars -- deliberately discarded, see note above
  srcSet: _discardedSrcSet,
  ...imgProps
}) {
  const [loaded, setLoaded] = useState(false);

  const safeSrc = safeImageUrl(src);
  if (!safeSrc) return null;

  return (
    <span className={`relative block overflow-hidden ${className}`}>
      {!loaded && (
        <span
          aria-hidden="true"
          className={`absolute inset-0 animate-pulse ${skeletonClassName}`}
        />
      )}
      <img
        {...imgProps}
        src={safeSrc}
        alt={alt}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`block w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${imgClassName}`}
      />
    </span>
  );
}
