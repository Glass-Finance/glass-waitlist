// scripts/verify-cloudinary-build.mjs
//
// Post-build smoke check: after `vite build`, walk dist/ and assert that the
// Cloudinary cloud name is actually baked into the shipped JS and that no
// broken `res.cloudinary.com/undefined` URL slipped through.
//
// Why this exists: Vite inlines import.meta.env.VITE_* at build time. If
// VITE_CLOUDINARY_CLOUD_NAME is missing when the bundle compiles, every image
// URL silently becomes res.cloudinary.com/undefined/... and the deployed page
// renders blank. scripts/check-build-env.mjs prevents that before the build;
// this script catches anything that could still produce a broken bundle —
// a guard removed or bypassed, `vite build` invoked directly, a refactor that
// renames the helper, or a build that suddenly stops shipping the cloud name
// for any other reason.

// import.meta.env is only inlined by Vite during `vite build`. This script runs
// after the build as its own process, so load .env explicitly the same way
// scripts/check-build-env.mjs does.

import "dotenv/config";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const collectionError = (message) => {
  console.error(`\n  Cloudinary build check failed: ${message}\n`);
  process.exit(1);
};

const cloud = process.env.VITE_CLOUDINARY_CLOUD_NAME;
if (!cloud) {
  collectionError(
    "VITE_CLOUDINARY_CLOUD_NAME is not set in this environment — run this " +
      "after `vite build`, or via `npm run build` which sets it first.",
  );
}

const distDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");

const jsFiles = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry.endsWith(".js")) jsFiles.push(full);
  }
};
walk(distDir);

if (jsFiles.length === 0) {
  collectionError(
    `no .js files found in dist/ — did \`vite build\` actually run (dist dir: ${distDir})?`,
  );
}

const source = jsFiles
  .map((file) => ({ file, text: readFileSync(file, "utf8") }))
  .reduce((acc, { text }) => acc + text, "");

// Must be a plain (single-quoted) string: a backtick template would
// interpolate ${void 0} at runtime to "undefined" and never match the literal
// text the minifier writes into a broken bundle.
const UNDEFINED_URLS = ["res.cloudinary.com/${void 0}", "res.cloudinary.com/undefined"];

const badUrl = UNDEFINED_URLS.find((pattern) => source.includes(pattern));
if (badUrl) {
  collectionError(
    `found "${badUrl}" in the bundle — the cloud name was inlined as ` +
      "undefined at build time. Set VITE_CLOUDINARY_CLOUD_NAME and rebuild.",
  );
}
if (!source.includes(cloud)) {
  collectionError(
    `the cloud name "${cloud}" does not appear in any built .js — image URLs ` +
      "are not referencing the expected Cloudinary cloud. Something changed " +
      "in how URLs are built; investigate before deploying.",
  );
}

console.log(
  `  cloudinary build check passed: ${jsFiles.length} JS asset(s), ` +
    `cloud name "${cloud}" baked in, no undefined URL.`,
);
