/* Rebrands the generated Capacitor Android project with Vocab Ledger icons & splash. */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const ROOT = path.join(__dirname, "..");
const ICONS = path.join(ROOT, "app", "assets", "icons");
const RES = path.join(ROOT, "android", "app", "src", "main", "res");

async function main() {
  const logo = fs.readFileSync(path.join(ICONS, "logo-src.svg"));
  const mark = fs.readFileSync(path.join(ICONS, "logo-mark-src.svg"));

  // legacy launcher icons (only xxxhdpi; Android scales down)
  for (const d of ["mdpi", "hdpi", "xhdpi", "xxhdpi"]) {
    for (const f of ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"]) {
      const p = path.join(RES, `mipmap-${d}`, f);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  }
  await sharp(Buffer.from(logo)).resize(192, 192).png().toFile(path.join(RES, "mipmap-xxxhdpi", "ic_launcher.png"));
  await sharp(Buffer.from(logo)).resize(192, 192).png().toFile(path.join(RES, "mipmap-xxxhdpi", "ic_launcher_round.png"));
  // adaptive foreground (432 = xxxhdpi 108dp)
  const fg = await sharp(Buffer.from(mark))
    .resize(432, 432, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer();
  fs.writeFileSync(path.join(RES, "mipmap-xxxhdpi", "ic_launcher_foreground.png"), fg);
  const oldFg = path.join(RES, "drawable-v24", "ic_launcher_foreground.xml");
  if (fs.existsSync(oldFg)) fs.unlinkSync(oldFg);

  // splash: single cream portrait/landscape bitmap, CENTER_INSIDE
  for (const dir of fs.readdirSync(RES)) {
    if (/^drawable-(port|land)-/.test(dir)) fs.rmSync(path.join(RES, dir), { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(RES, "drawable-land"), { recursive: true });
  const splashP = await sharp(Buffer.from(mark)).resize(760, 760).png().toBuffer();
  await sharp({ create: { width: 1080, height: 1920, channels: 4, background: { r: 255, g: 246, b: 234, alpha: 1 } } })
    .composite([{ input: splashP, gravity: "center" }]).png().toFile(path.join(RES, "drawable", "splash.png"));
  await sharp({ create: { width: 1920, height: 1080, channels: 4, background: { r: 255, g: 246, b: 234, alpha: 1 } } })
    .composite([{ input: splashP, gravity: "center" }]).png().toFile(path.join(RES, "drawable-land", "splash.png"));
  console.log("android branding done");
}
main().catch((e) => { console.error(e); process.exit(1); });
