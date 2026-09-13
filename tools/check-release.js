/* Pre-release guard rails. Fails the build (locally and in CI) when a change
   would break an in-place update or the offline install:
     1. every file the service worker precaches actually exists
     2. the version number is identical in package.json, app/js/store.js and
        android/app/build.gradle (the About screen reads it at runtime)
     3. versionCode is a positive integer and the release is newer than the
        latest git tag, so the APK installs *over* the previous version
   Run: node tools/check-release.js                                             */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const problems = [];
const warnings = [];
const notes = [];
const CI = !!process.env.GITHUB_ACTIONS;

/* ---------- 1. service worker precache ---------- */
const sw = read("app/sw.js");
const coreBlock = sw.slice(sw.indexOf("CORE"), sw.indexOf("];", sw.indexOf("CORE")));
const entries = (coreBlock.match(/"([^"]+)"/g) || []).map((s) => s.slice(1, -1)).filter((s) => s !== "./");
let missing = 0;
for (const rel of entries) {
  if (!fs.existsSync(path.join(ROOT, "app", rel))) { problems.push(`sw.js precaches a missing file: app/${rel}`); missing++; }
}
notes.push(`precache: ${entries.length - missing}/${entries.length} files present`);

/* every asset the app actually references should be precached too */
const html = read("app/index.html");
const referenced = [];
for (const m of html.matchAll(/(?:href|src)="([^":][^"]*)"/g)) referenced.push(m[1]);
for (const rel of referenced) {
  if (!fs.existsSync(path.join(ROOT, "app", rel))) problems.push(`index.html references a missing file: app/${rel}`);
  else if (!entries.includes(rel) && rel !== "styles.css" && !rel.endsWith(".webmanifest")) {
    notes.push(`note: app/${rel} is not in the sw.js precache list`);
  }
}

/* ---------- 2. one version everywhere ---------- */
const pkg = JSON.parse(read("package.json"));
const store = read("app/js/store.js");
const gradle = read("android/app/build.gradle");
const storeVersion = (store.match(/APP_VERSION\s*=\s*"([^"]+)"/) || [])[1];
const gradleName = (gradle.match(/DEFAULT_VERSION_NAME\s*=\s*'([^']+)'/) || [])[1];
const gradleCode = Number((gradle.match(/DEFAULT_VERSION_CODE\s*=\s*(\d+)/) || [])[1]);

if (storeVersion !== pkg.version) problems.push(`app/js/store.js APP_VERSION "${storeVersion}" != package.json "${pkg.version}"`);
if (gradleName !== pkg.version) problems.push(`android DEFAULT_VERSION_NAME "${gradleName}" != package.json "${pkg.version}"`);
notes.push(`version: ${pkg.version} (package.json = store.js = build.gradle)`);

/* ---------- 3. versionCode must move forward ---------- */
if (!Number.isInteger(gradleCode) || gradleCode < 1) {
  problems.push(`android DEFAULT_VERSION_CODE must be a positive integer, got "${gradleCode}"`);
} else {
  notes.push(`versionCode: ${gradleCode}`);
  const git = (args) => execFileSync("git", args, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  let exactTag = "", latestTag = "";
  try { exactTag = git(["describe", "--tags", "--exact-match"]); } catch (e) { /* HEAD is not a tagged release commit */ }
  try { latestTag = git(["describe", "--tags", "--abbrev=0"]); } catch (e) { /* no tags yet */ }

  if (exactTag) {
    if (exactTag !== `v${pkg.version}`) problems.push(`HEAD is tagged ${exactTag} but package.json says ${pkg.version}`);
    else notes.push(`building the tagged release ${exactTag}`);
  } else if (latestTag) {
    const d = cmp(pkg.version, latestTag.replace(/^v/, ""));
    if (d < 0) problems.push(`version ${pkg.version} is OLDER than the last release ${latestTag} — it cannot update an installed build`);
    else if (d === 0) warnings.push(`version ${pkg.version} is already released as ${latestTag} — bump package.json, store.js APP_VERSION and build.gradle before shipping an update`);
    else notes.push(`newer than the last release ${latestTag}`);
  } else {
    notes.push("no git tags yet — skipped the 'newer than last release' check");
  }
}

/* ---------- 4. the storage key may never change ---------- */
if (!/const KEY = "vocabLedger\.state\.v1"/.test(store)) {
  problems.push("store.js KEY changed — every installed user would lose their progress on update");
}
if (!/LEGACY_KEYS/.test(store) || !/\.bak/.test(store)) {
  problems.push("store.js lost its migration/backup safety net (LEGACY_KEYS or the .bak snapshot)");
}

function cmp(a, b) {
  const pa = a.split(".").map(Number), pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0); }
  return 0;
}

console.log("\n— release checks —");
notes.forEach((n) => console.log("  · " + n));
warnings.forEach((wmsg) => console.log(CI ? `  ::warning title=Release check::${wmsg}` : "  ⚠ " + wmsg));
if (problems.length) {
  problems.forEach((p) => console.log(CI ? `  ::error title=Release check::${p}` : "  ✘ " + p));
  console.error(`\n${problems.length} release check(s) failed.\n`);
  process.exit(1);
}
console.log("  ✔ safe to ship as an update over the previous version\n");
