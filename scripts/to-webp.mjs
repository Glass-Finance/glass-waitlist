import sharp from "sharp";
import { readdir, stat } from "fs/promises";
import { join, extname, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const DIRS = [
  join(root, "src", "assets"),
  join(root, "public"),
];

const EXTS = new Set([".jpg", ".jpeg", ".png"]);
const SKIP = new Set(["og-image.png"]); // keep og:image as PNG — some scrapers don't handle WebP

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) { await walk(full); continue; }
    const ext = extname(e.name).toLowerCase();
    if (!EXTS.has(ext) || SKIP.has(e.name)) continue;
    const out = full.replace(/\.(jpg|jpeg|png)$/i, ".webp");
    try {
      const { size: inSize } = await stat(full);
      await sharp(full).webp({ quality: 82 }).toFile(out);
      const { size: outSize } = await stat(out);
      const saved = (((inSize - outSize) / inSize) * 100).toFixed(0);
      console.log(`  ${e.name} → ${basename(out)}  (${(inSize/1024).toFixed(0)}KB → ${(outSize/1024).toFixed(0)}KB, -${saved}%)`);
    } catch (err) {
      console.error(`  FAILED ${full}: ${err.message}`);
    }
  }
}

console.log("Converting images to WebP...\n");
for (const dir of DIRS) await walk(dir);
console.log("\nDone. Update imports in .jsx files to use .webp extensions.");
