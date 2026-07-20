// Prints the CSP 'sha256-<hash>' source for every inline <script> in the
// built index.html (i.e. one with no src attribute) -- run after `npm run
// build` whenever the structured-data, font-preload-listener, or Pendo
// bootstrap script in index.html changes, and paste the matching hash into
// vercel.json's Content-Security-Policy-Report-Only script-src.
//
// Usage: node scripts/compute-csp-hashes.mjs
import { readFileSync } from "fs";
import { createHash } from "crypto";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = join(root, "dist", "index.html");

let html;
try {
  html = readFileSync(htmlPath, "utf8");
} catch {
  console.error(`Couldn't read ${htmlPath} -- run \`npm run build\` first.`);
  process.exit(1);
}

// Strip HTML comments before matching so an explanatory comment that
// mentions "<script>" in prose can't be mistaken for a real tag.
const withoutComments = html.replace(/<!--[\s\S]*?-->/g, "");
const inlineScripts = [...withoutComments.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)];

if (inlineScripts.length === 0) {
  console.log("No inline <script> tags (without src) found in dist/index.html.");
}

inlineScripts.forEach((match, i) => {
  const content = match[1];
  const hash = createHash("sha256").update(content, "utf8").digest("base64");
  const preview = content.trim().slice(0, 60).replace(/\s+/g, " ");
  console.log(`#${i}  sha256-${hash}`);
  console.log(`    ${preview}${content.trim().length > 60 ? "..." : ""}\n`);
});
