/**
 * Builds every raster brand asset from the uploaded logo
 * (app/assets/icons/app-logo.png) composited onto the retro pastel gradient.
 * Run: npm run build:icons
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const ICONS = path.join(ROOT, "app", "assets", "icons");
const LOGO = path.join(ICONS, "app-logo.png");

const bgSVG = (rounded) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFE7C2"/>
      <stop offset=".55" stop-color="#FFC9A8"/>
      <stop offset="1" stop-color="#F6A6C0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${rounded ? 116 : 0}" fill="url(#bg)"/>
</svg>`;

async function icon(size, logoRatio, rounded) {
  const bg = await sharp(Buffer.from(bgSVG(rounded)), { density: 300 }).resize(size, size).png().toBuffer();
  const logo = await sharp(LOGO).resize(Math.round(size * logoRatio), Math.round(size * logoRatio), {
    fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 },
  }).png().toBuffer();
  return sharp(bg).composite([{ input: logo, gravity: "center" }]).png().toBuffer();
}

async function main() {
  const jobs = [
    ["icon-512.png", 512, 0.72, true],
    ["icon-192.png", 192, 0.74, true],
    ["apple-touch-icon.png", 180, 0.76, true],
    ["favicon-96.png", 96, 0.78, true],
    ["favicon-32.png", 32, 0.84, true],
    ["icon-maskable-512.png", 512, 0.6, false],
    ["logo-mark-256.png", 256, 0.92, false],
  ];
  for (const [name, size, ratio, rounded] of jobs) {
    fs.writeFileSync(path.join(ICONS, name), await icon(size, ratio, rounded));
    console.log("wrote", name);
  }

  // splash: cream field with the logo centred (Capacitor + PWA)
  const mk = await sharp(LOGO).resize(760, 760, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  for (const [name, w, h] of [["splash-2732.png", 2732, 2732]]) {
    await sharp({ create: { width: w, height: h, channels: 4, background: { r: 255, g: 246, b: 234, alpha: 1 } } })
      .composite([{ input: mk, gravity: "center" }]).png().toFile(path.join(ICONS, name));
    console.log("wrote", name);
  }

  // tick / cross marks
  for (const [src, name] of [["tick-src.svg", "tick-64.png"], ["cross-src.svg", "cross-64.png"]]) {
    await sharp(Buffer.from(fs.readFileSync(path.join(ICONS, src))), { density: 300 })
      .resize(64, 64).png().toFile(path.join(ICONS, name));
    console.log("wrote", name);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
