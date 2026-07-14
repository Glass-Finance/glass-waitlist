// Generator for public/og-image.png — a real branded 1200x630 social
// preview card. Background is the actual auth-panel.webp asset (the same
// image used behind the sign-in/sign-up panel) rather than a flat gradient
// or an approximated texture — cropped to the card's landscape ratio,
// anchored to the top since that's where the panel's linework/badge detail
// sits in the source portrait image. A darkening gradient keeps the white
// text legible over the lighter diagonal band in that image.
//
// Logo mark is composited as a flat white silhouette (recolored via the
// master file's own alpha channel, not the raw purple/blue gradient) next
// to a plain-text "Glass" wordmark, forming one unified lockup — matching
// how the logo/wordmark pairing looks elsewhere (e.g. the secondary logo
// lockups in brand-assets/logo-files), rather than a lone icon floating
// disconnected from a separate all-caps wordmark treatment.
import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const WIDTH = 1200;
const HEIGHT = 630;

const bg = await sharp(join(root, "src/assets/auth/auth-panel.webp"))
  .resize(WIDTH, HEIGHT, { fit: "cover", position: "top" })
  .toBuffer();

const legibilityOverlay = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0%" y1="0%" x2="70%" y2="100%">
      <stop offset="0%" stop-color="#001040" stop-opacity="0.35"/>
      <stop offset="45%" stop-color="#001040" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#001040" stop-opacity="0.2"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#fade)"/>
</svg>
`;

const textSvg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <text x="90" y="330" font-family="Arial, Helvetica, sans-serif" font-size="66" font-weight="800" fill="#ffffff">Community Finance,</text>
  <text x="90" y="408" font-family="Arial, Helvetica, sans-serif" font-size="66" font-weight="800" fill="#ffffff">Crystal Clear</text>
  <text x="90" y="472" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#E4EBFF">Collect dues, track payments, and manage your community's</text>
  <text x="90" y="508" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#E4EBFF">funds, all in one place.</text>
  <text x="90" y="570" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#ffffff" fill-opacity="0.75">glasspay.app</text>
</svg>
`;

const LOGO_PATH = join(root, "brand-assets", "glass-logo-master.png");
const LOGO_HEIGHT = 76;
const LOGO_TOP = 78;
const LOGO_LEFT = 90;
const WORDMARK_GAP = 22;

const trimmedLogo = await sharp(LOGO_PATH).trim().toBuffer({ resolveWithObject: true });
const whiteLogo = await sharp(trimmedLogo.data)
  .ensureAlpha()
  .composite([{
    input: Buffer.from([255, 255, 255, 255]),
    raw: { width: 1, height: 1, channels: 4 },
    tile: true,
    blend: "in",
  }])
  .png()
  .toBuffer();
const logo = await sharp(whiteLogo).resize({ height: LOGO_HEIGHT }).toBuffer();
const logoMeta = await sharp(logo).metadata();

const wordmarkSvg = `
<svg width="300" height="${LOGO_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="${LOGO_HEIGHT * 0.78}" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="700" fill="#ffffff">Glass</text>
</svg>
`;

await sharp(bg)
  .composite([
    { input: Buffer.from(legibilityOverlay) },
    { input: logo, left: LOGO_LEFT, top: LOGO_TOP },
    { input: Buffer.from(wordmarkSvg), left: LOGO_LEFT + logoMeta.width + WORDMARK_GAP, top: LOGO_TOP - 8 },
    { input: Buffer.from(textSvg) },
  ])
  .png()
  .toFile(join(root, "public", "og-image.png"));

console.log("Generated public/og-image.png (1200x630)");
