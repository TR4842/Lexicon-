/**
 * Rasterizes the SVG brand sources in app/assets/icons into the PNG sizes the
 * PWA manifest / Capacitor splash need. Run: npm run build:icons
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const ICONS = path.join(ROOT, "app", "assets", "icons");

const read = (f) => fs.readFileSync(path.join(ICONS, f), "utf8");

async function main() {
  const logo = read("logo-src.svg");
  const maskable = read("logo-maskable-src.svg");
  const mark = read("logo-mark-src.svg");

  const jobs = [
    [logo, "icon-512.png", 512],
    [logo, "icon-192.png", 192],
    [logo, "apple-touch-icon.png", 180],
    [logo, "favicon-96.png", 96],
    [logo, "favicon-32.png", 32],
    [maskable, "icon-maskable-512.png", 512],
    [mark, "logo-mark-256.png", 256],
    [read("tick-src.svg"), "tick-64.png", 64],
    [read("cross-src.svg"), "cross-64.png", 64],
  ];

  for (const [svg, name, size] of jobs) {
    await sharp(Buffer.from(svg), { density: 300 })
      .resize(size, size)
      .png()
      .toFile(path.join(ICONS, name));
    console.log("wrote", name);
  }

  // Splash: cream background with the mark centred (Capacitor portrait splash).
  const splashSize = 2732;
  const markBuf = await sharp(Buffer.from(mark)).resize(900, 900).png().toBuffer();
  await sharp({
    create: { width: splashSize, height: splashSize, channels: 4, background: { r: 255, g: 246, b: 234, alpha: 1 } },
  })
    .composite([{ input: markBuf, gravity: "center" }])
    .png()
    .toFile(path.join(ICONS, "splash-2732.png"));
  console.log("wrote splash-2732.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
