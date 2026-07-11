// One-off generator for public/og-image.png — a real branded 1200x630
// social preview card instead of the ~2KB placeholder that was there
// before. Composites an SVG (wordmark + headline + tagline) over the same
// brand-blue background used elsewhere in the app (receipt header, community
// background image) via sharp, which is already a project dependency (see
// scripts/to-webp.mjs).
import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const WIDTH = 1200;
const HEIGHT = 630;

const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#001D7A"/>
      <stop offset="100%" stop-color="#002FA7"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <!-- Subtle decorative circles, matching the app's rounded/soft visual language -->
  <circle cx="1080" cy="80" r="220" fill="#ffffff" fill-opacity="0.04"/>
  <circle cx="1150" cy="560" r="140" fill="#ffffff" fill-opacity="0.05"/>

  <!-- Wordmark -->
  <text x="90" y="180" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="800" fill="#ffffff" letter-spacing="1">GLASSPAY</text>

  <!-- Headline -->
  <text x="88" y="300" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="800" fill="#ffffff">Community Finance,</text>
  <text x="88" y="378" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="800" fill="#ffffff">Crystal Clear</text>

  <!-- Tagline -->
  <text x="90" y="450" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#C7D6FF">Collect dues, track payments, and manage your community's</text>
  <text x="90" y="486" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#C7D6FF">funds, all in one place.</text>

  <!-- Footer -->
  <text x="90" y="560" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#ffffff">glasspay.app</text>
</svg>
`;

await sharp(Buffer.from(svg))
  .png()
  .toFile(join(root, "public", "og-image.png"));

console.log("Generated public/og-image.png (1200x630)");
