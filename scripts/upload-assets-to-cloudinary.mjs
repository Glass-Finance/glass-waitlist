// scripts/upload-assets-to-cloudinary.mjs
//
// One-time (re-runnable) migration script: walks src/assets, uploads every
// image to Cloudinary, and skips non-image files (the Figma handoff .html/.md
// docs sitting in design_handoff_phone_hero/ are ignored automatically).
//
// public_id scheme: "glass/" + relative path from src/assets, extension
// stripped. This is deterministic on purpose — no manifest file to keep in
// sync. If you know the original file's path, you know its public_id.
//
// The glass-waitlist and glass-waitlist-v1 repos share the same cloud and
// the same "glass/" prefix, so matching brand assets (Glass.webp, hero/hero,
// solution/*, problem/*, ...) resolve to the SAME public id on purpose —
// the two-repo landing components are meant to render identically. Because
// the upload uses overwrite:true, whichever repo runs the script last wins
// for a shared id; keep the source files in sync between repos.
//
// Usage:
//   node scripts/upload-assets-to-cloudinary.mjs           # upload everything
//   node scripts/upload-assets-to-cloudinary.mjs --dry-run # preview only, no upload
//   node scripts/upload-assets-to-cloudinary.mjs --scope   # only the landing + auth/brand
//                                                          # assets referenced by migrated
//                                                          # components (LQIP CloudImage /
//                                                          # cldUrl / cldSrcSet) — see
//                                                          # docs/cloudinary.md
// Flags compose, e.g. `--dry-run --scope`.

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_ROOT = path.resolve(__dirname, "../src/assets");
const PUBLIC_ID_PREFIX = "glass";
const DRY_RUN = process.argv.includes("--dry-run");
const SCOPE_ONLY = process.argv.includes("--scope");

// Assets that stay bundled in src/assets by design — dashboard/member-app
// empty-states & icons, the CSV-upload cloud icon, the mobile-only auth CSS
// backdrop, usecase corner decorations (pure CSS), the .bg-problem-glow
// overlay, and non-design files (debug laptop.jpg, Figma handoff drafts).
// Expressed as PUBLIC_IDs (relative path, extension stripped). Paired with
// --scope so a batch upload never silently reaches the CDN.
const SCOPE_EXCLUDE = new Set([
  "auth/auth-background-mobile",
  "auth/mobile-auth",
  "auth/no-community",
  "background",
  "dashboard/active-plans",
  "dashboard/admin-background",
  "dashboard/empty-states/add-members-illustration",
  "dashboard/empty-states/invite-illustration",
  "dashboard/empty-states/notifications-illustration",
  "dashboard/empty-states/payment-plan-illustration",
  "dashboard/empty-states/tick-icon",
  "dashboard/inactive-members",
  "dashboard/one-time-payment",
  "dashboard/recurring-payment",
  "dashboard/timer",
  "dashboard/total-contributions",
  "dashboard/total-members",
  "dashboard/warn-sign",
  "design_handoff_phone_hero/assets/drawer",
  "design_handoff_phone_hero/assets/iphone",
  "design_handoff_phone_hero/assets/notifications-community",
  "design_handoff_phone_hero/assets/notifications-invites",
  "design_handoff_phone_hero/assets/notifications-payments",
  "design_handoff_phone_hero/assets/receipt",
  "design_handoff_phone_hero/assets/screen-autopay",
  "design_handoff_phone_hero/assets/screen-manage-payments",
  "design_handoff_phone_hero/assets/screen-my-communities",
  "design_handoff_phone_hero/assets/screen-payment-summary",
  "design_handoff_phone_hero/assets/screen-profile",
  "design_handoff_phone_hero/assets/screen-settings",
  "design_handoff_phone_hero/assets/screen-success",
  "design_handoff_phone_hero/assets/screen-transaction-details",
  "icons/upload-cloud",
  "icons/verified-badge",
  "laptop",
  "memberApp/empty-states/notifications-community-empty",
  "memberApp/empty-states/notifications-invites-empty",
  "memberApp/empty-states/notifications-payments-empty",
  "memberApp/icon-payment-history",
  "memberApp/icon-payments-due",
  "memberApp/icon-upcoming-payments",
  "problem/problem-glow",
  "usecase/corner-br",
  "usecase/corner-tl",
]);

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);
// When the same basename exists in multiple formats, prefer this order —
// stripping the extension means they'd otherwise collide on one public_id.
const FORMAT_PREFERENCE = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function walk(dir, fileList = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, fileList);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) fileList.push(fullPath);
    }
  }
  return fileList;
}

function toPublicId(relativePath) {
  const parsed = path.parse(relativePath);
  // Sanitize: Cloudinary public_ids don't like spaces/parens (seen in
  // "frame2 (1).png" etc.) — collapse to underscores.
  const safeName = parsed.name.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/_+/g, "_");
  const safeDir = parsed.dir.split(path.sep).filter(Boolean).join("/");
  return [PUBLIC_ID_PREFIX, safeDir, safeName].filter(Boolean).join("/");
}

function inScope(publicId) {
  if (!SCOPE_ONLY) return true;
  const idWithoutPrefix = publicId.slice(PUBLIC_ID_PREFIX.length).replace(/^\/+/, "");
  return !SCOPE_EXCLUDE.has(idWithoutPrefix);
}

function dedupeByPublicId(files) {
  const byPublicId = new Map();
  for (const filePath of files) {
    const relative = path.relative(ASSETS_ROOT, filePath);
    const publicId = toPublicId(relative);
    if (!inScope(publicId)) continue;
    const ext = path.extname(filePath).toLowerCase();

    if (!byPublicId.has(publicId)) {
      byPublicId.set(publicId, { filePath, relative, publicId, ext });
      continue;
    }

    // Collision: same public_id from a different extension. Keep whichever
    // format ranks higher in FORMAT_PREFERENCE.
    const existing = byPublicId.get(publicId);
    if (FORMAT_PREFERENCE.indexOf(ext) < FORMAT_PREFERENCE.indexOf(existing.ext)) {
      console.log(`  ↳ collision on ${publicId}: preferring ${ext} over ${existing.ext}`);
      byPublicId.set(publicId, { filePath, relative, publicId, ext });
    } else {
      console.log(`  ↳ collision on ${publicId}: keeping ${existing.ext}, skipping ${ext}`);
    }
  }
  return [...byPublicId.values()];
}

// Pulls the real reason out of whatever shape the error actually has.
// Cloudinary's SDK typically rejects with `{ error: { message, http_code } }`
// rather than a flat `Error` — reading `err.message` directly on that shape
// is `undefined`, which is why failures were printing as "undefined"
// instead of the actual reason (file too large, bad format, auth, timeout).
function describeError(err) {
  if (err?.error?.message) return `${err.error.message} (http_code: ${err.error.http_code ?? "?"})`;
  if (err?.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

async function main() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.error(
      "Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in .env",
    );
    process.exit(1);
  }

  console.log(`Scanning ${ASSETS_ROOT} ...`);
  const allFiles = walk(ASSETS_ROOT);
  console.log(`Found ${allFiles.length} image files.`);

  const deduped = dedupeByPublicId(allFiles);
  console.log(
    `Uploading ${deduped.length} unique assets${SCOPE_ONLY ? " (--scope: landing + auth/brand only)" : " (after de-duping same-name .png/.webp pairs)"}.`,
  );

  let uploaded = 0;
  let failed = 0;

  for (const { filePath, relative, publicId } of deduped) {
    if (DRY_RUN) {
      console.log(`[dry-run] ${relative} → ${publicId}`);
      continue;
    }
    try {
      await cloudinary.uploader.upload(filePath, {
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        resource_type: "image",
      });
      uploaded++;
      console.log(`✔ ${relative} → ${publicId}`);
    } catch (err) {
      failed++;
      console.error(`✘ ${relative} → ${publicId}: ${describeError(err)}`);
    }
  }

  console.log(
    `\nDone. Uploaded: ${uploaded}, Failed: ${failed}, Skipped (collisions): ${allFiles.length - deduped.length}`,
  );
}

main();
