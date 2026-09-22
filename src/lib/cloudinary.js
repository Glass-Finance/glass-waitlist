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
  if (!name && import.meta.env.DEV) {
    // Loud in dev, silent in prod build — a missing env var here means every
    // image on the page breaks, so this should never fail quietly.
    console.error("VITE_CLOUDINARY_CLOUD_NAME is not set — Cloudinary images will 404.");
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
 * @param {boolean} [opts.blur] - low-quality blurred placeholder variant
 */
export function cldUrl(publicId, opts = {}) {
  const { width, dpr, crop = "limit", quality = "auto", blur = false } = opts;

  const parts = ["f_auto", `q_${quality}`, `c_${crop}`];
  if (width) parts.push(`w_${width}`);
  if (dpr) parts.push(`dpr_${dpr}`);
  if (blur) parts.push("e_blur:1200", "q_auto:low", "w_32");

  return `https://res.cloudinary.com/${cloudName()}/image/upload/${parts.join(",")}/${publicId}`;
}

/**
 * Build a srcSet string across a set of widths, for responsive delivery.
 * @param {string} publicId
 * @param {number[]} widths - e.g. [400, 800, 1200, 1600]
 */
export function cldSrcSet(publicId, widths) {
  return widths.map((w) => `${cldUrl(publicId, { width: w })} ${w}w`).join(", ");
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
