/* Rebrands the generated Capacitor Android project with Vocab Ledger icons & splash
   (all derived from the uploaded app/assets/icons/app-logo.png).
   Run: npm run brand:android                                        */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const ICONS = path.join(ROOT, "app", "assets", "icons");
const RES = path.join(ROOT, "android", "app", "src", "main", "res");
const LOGO = path.join(ICONS, "app-logo.png");
const ICON = path.join(ICONS, "icon-512.png");

const cream = { r: 255, g: 246, b: 234, alpha: 1 };

async function main() {
  // legacy launcher icons: keep only xxxhdpi, Android scales down
  for (const d of ["mdpi", "hdpi", "xhdpi", "xxhdpi"]) {
    for (const f of ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"]) {
      const p = path.join(RES, `mipmap-${d}`, f);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  }
  for (const f of ["ic_launcher.png", "ic_launcher_round.png"]) {
    await sharp(ICON).resize(192, 192).png().toFile(path.join(RES, "mipmap-xxxhdpi", f));
  }
  // adaptive foreground: logo inside the 66% safe zone of a 432px canvas
  const logoFg = await sharp(LOGO).resize(280, 280, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: 432, height: 432, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: logoFg, gravity: "center" }]).png()
    .toFile(path.join(RES, "mipmap-xxxhdpi", "ic_launcher_foreground.png"));
  const oldFg = path.join(RES, "drawable-v24", "ic_launcher_foreground.xml");
  if (fs.existsSync(oldFg)) fs.unlinkSync(oldFg);

  // splash: single cream bitmap per orientation, CENTER_INSIDE
  for (const dir of fs.readdirSync(RES)) {
    if (/^drawable-(port|land)-/.test(dir)) fs.rmSync(path.join(RES, dir), { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(RES, "drawable-land"), { recursive: true });
  const mk = await sharp(LOGO).resize(700, 700, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: 1080, height: 1920, channels: 4, background: cream } })
    .composite([{ input: mk, gravity: "center" }]).png().toFile(path.join(RES, "drawable", "splash.png"));
  await sharp({ create: { width: 1920, height: 1080, channels: 4, background: cream } })
    .composite([{ input: mk, gravity: "center" }]).png().toFile(path.join(RES, "drawable-land", "splash.png"));
  console.log("android branding done");
}
main().catch((e) => { console.error(e); process.exit(1); });
