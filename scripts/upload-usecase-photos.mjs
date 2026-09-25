// scripts/upload-usecase-photos.mjs
//
// Manifest-driven upload for the Use Cases carousel photos. Reads
// src/components/usecasePhotos.js (source of truth for public_ids and the
// original Pexels URLs) and uploads every photo that is not already in the
// Cloudinary account. Re-runnable: existing public_ids are skipped, so it is
// safe to run again after adding photos to the manifest.
//
// public_id scheme: glass/usecase/<category>/<code> — set in the manifest.
//
// Usage:
//   node scripts/upload-usecase-photos.mjs           # upload missing photos
//   node scripts/upload-usecase-photos.mjs --dry-run # preview only, no upload

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { USECASE_PHOTOS } from "../src/components/usecasePhotos.js";

dotenv.config();

const DRY_RUN = process.argv.includes("--dry-run");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Pulls the real reason out of whatever shape the error actually has
// (see upload-assets-to-cloudinary.mjs for background).
function describeError(err) {
  if (err?.error?.message) return `${err.error.message} (http_code: ${err.error.http_code ?? "?"})`;
  if (err?.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

async function exists(publicId) {
  try {
    await cloudinary.api.resource(publicId, { resource_type: "image" });
    return true;
  } catch (err) {
    if (err?.error?.http_code === 404 || err?.error?.message?.includes("not found")) return false;
    throw err;
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

  const photos = Object.entries(USECASE_PHOTOS).flatMap(([category, list]) =>
    list.map((photo) => ({ category, ...photo })),
  );
  console.log(
    `Manifest: ${photos.length} photos across ${Object.keys(USECASE_PHOTOS).length} categories.`,
  );

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const { category, publicId, src } of photos) {
    try {
      if (await exists(publicId)) {
        skipped++;
        console.log(`↷ ${publicId} (already uploaded)`);
        continue;
      }
      if (DRY_RUN) {
        console.log(`[dry-run] ${category} ${publicId} ← ${src}`);
        continue;
      }
      await cloudinary.uploader.upload(src, {
        public_id: publicId,
        overwrite: false,
        invalidate: true,
        resource_type: "image",
      });
      uploaded++;
      console.log(`✔ ${publicId}`);
    } catch (err) {
      failed++;
      console.error(`✘ ${publicId}: ${describeError(err)}`);
    }
  }

  console.log(`\nDone. Uploaded: ${uploaded}, Skipped (existing): ${skipped}, Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

main();
