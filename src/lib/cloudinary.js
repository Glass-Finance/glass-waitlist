// src/lib/cloudinary.js
//
// Plain URL building — no Cloudinary SDK shipped to the browser. Every
// transformation is just a string in the URL, resolved by Cloudinary's CDN
// on request.
//
// publicId matches the upload script's scheme 1:1, e.g.:
//   "glass/hero/hero"
//   "glass/usecase/icon-schools"
//
// The upload script lives at scripts/upload-assets-to-cloudinary.mjs — it
// walks src/assets and uploads every image to the same cloud, deriving
// public ids from the relative path (see docs/cloudinary.md).

// Read the cloud name lazily, not at module scope. Were it captured at import
// time, Vitest's `stubEnv` (which runs after the module graph loads) could
// never override it — the URL tests would read `undefined` in CI, where no
// .env file exists. Reading on every call keeps dev, prod build and the test
// suite consistent.
function cloudName() {
  const name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!name) {
    if (import.meta.env.DEV) {
      // Loud but non-blocking in dev — you can still iterate on layout while
      // images are 404ing, which is enough to notice and fix it.
      console.error("VITE_CLOUDINARY_CLOUD_NAME is not set — Cloudinary images will 404.");
    } else {
      // Production build: a missing name compiles every URL to
      // res.cloudinary.com/undefined/... and ships a blank page with no build
      // error — exactly how the live site broke. scripts/check-build-env.mjs
      // makes that unreachable via `npm run build`; this throw is the
      // belt-and-braces backstop for anything that bypasses it (e.g.
      // `npx vite build`), so it fails loudly instead of silently.
      throw new Error(
        "VITE_CLOUDINARY_CLOUD_NAME is missing — refusing to render broken image URLs. " +
          "Set it in the build environment (Vercel project settings) and rebuild.",
      );
    }
  }
  return name;
}

/**
 * Build a Cloudinary delivery URL.
 * @param {string} publicId - e.g. "glass/hero/hero"
 * @param {object} [opts]
 * @param {number} [opts.width] - target width in px (w_)
 * @param {number} [opts.dpr] - device pixel ratio (dpr_), e.g. 2 for retina
 * @param {string} [opts.crop] - crop mode (c_), default "limit" (never upscale)
 * @param {string} [opts.quality] - default "auto"
 * @param {boolean} [opts.blur] - small LQIP placeholder variant (w_64; the
 *   caller applies the visual blur via CSS filter). width/dpr are ignored —
 *   a placeholder's size is fixed by design, not by render size.
 */
export function cldUrl(publicId, opts = {}) {
  const { width, dpr, crop = "limit", quality = "auto", blur = false } = opts;

  const parts = ["f_auto", `q_${quality}`, `c_${crop}`];
  if (blur) {
    // Plain small downscale only. The old `e_blur:1200,q_auto:low,w_32`
    // chain quantized this to a ~145-byte 1-bit PNG — a posterized blob
    // that read as garbage colors once CSS blurred and upscaled it ~35x.
    // The tiny real-color image + the consumer's `filter: blur(8px)` gives
    // an honest, cheap LQIP.
    parts.push("w_64");
  } else {
    if (width) parts.push(`w_${width}`);
    if (dpr) parts.push(`dpr_${dpr}`);
  }

  return `https://res.cloudinary.com/${cloudName()}/image/upload/${parts.join(",")}/${publicId}`;
}

/**
 * Build a srcSet string across a set of widths, for responsive delivery.
 * @param {string} publicId
 * @param {number[]} widths - e.g. [400, 800, 1200, 1600]
 * @param {object} [opts] - forwarded to cldUrl per width (quality, crop, ...)
 */
export function cldSrcSet(publicId, widths, opts = {}) {
  return widths.map((w) => `${cldUrl(publicId, { ...opts, width: w })} ${w}w`).join(", ");
}

// Standard width buckets used to derive a responsive srcSet from a single
// `width` (see CloudImage.jsx). Kept here so CloudImage.jsx and any tests
// can share one source of truth.
export const WIDTH_STEPS = [200, 400, 600, 800, 1000, 1200, 1600, 2000];

/**
 * Convert a target render width into the srcSet widths to serve: every
 * standard bucket up to 2x the target (retina headroom), plus the exact
 * target so 1x displays stay crisp.
 * @param {number} targetWidth
 * @returns {number[]}
 */
export function widthsFor(targetWidth) {
  const steps = WIDTH_STEPS.filter((w) => w <= targetWidth * 2);
  if (!steps.includes(targetWidth)) steps.push(targetWidth);
  return [...new Set(steps)].sort((a, b) => a - b);
}
