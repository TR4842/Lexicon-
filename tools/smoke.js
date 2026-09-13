/* Headless end-to-end smoke test: boots the app in jsdom and plays a full
   learning cycle (onboarding → study → daily exam → revision gate → mistakes).
   Run: node tools/smoke.js                                             */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..", "app");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

const dom = new JSDOM(html, { url: "http://localhost:8080/", pretendToBeVisual: true, runScripts: "dangerously" });
const w = dom.window;

/* ---- browser stubs ---- */
w.AudioContext = class {
  createOscillator() { return { connect() {}, start() {}, stop() {}, type: "", frequency: { value: 0 } }; }
  createGain() { return { connect() {}, gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
  get currentTime() { return 0; }
  get destination() { return {}; }
};
w.HTMLCanvasElement.prototype.getContext = function () {
  return new Proxy({}, { get: (t, p) => (p in t ? t[p] : () => undefined), set: (t, p, v) => ((t[p] = v), true) });
};
w.scrollTo = () => {};

for (const f of ["data/vocab.js", "js/store.js", "js/ui.js", "js/exam.js", "js/app.js"]) {
  const s = w.document.createElement("script");
  s.textContent = fs.readFileSync(path.join(ROOT, f), "utf8");
  w.document.body.appendChild(s);
}

const $ = (s) => w.document.querySelector(s);
const $$ = (s) => Array.from(w.document.querySelectorAll(s));
const click = (el) => el && el.click();
const lastModal = () => { const m = w.document.querySelectorAll("#modal-root"); return m[m.length - 1]; };
const clickModal = async (i) => { const m = lastModal(); if (!m) return; const b = m.querySelectorAll(".btn"); const el = i < 0 ? b[b.length - 1] : b[i]; el.click(); await wait(380); };
const dismissModal = async () => { if (lastModal()) await clickModal(0); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const ok = (cond, label) => {
  console.log((cond ? "  ✔ " : "  ✘ ") + label);
  if (!cond) failed++;
};

/* A store-only jsdom instance, optionally pre-seeded with an old save file. */
function freshStore(seedKey, seedValue) {
  const d = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost:8080/", pretendToBeVisual: true, runScripts: "dangerously",
  });
  if (seedKey) d.window.localStorage.setItem(seedKey, seedValue);
  for (const f of ["data/vocab.js", "js/store.js"]) {
    const s = d.window.document.createElement("script");
    s.textContent = fs.readFileSync(path.join(ROOT, f), "utf8");
    d.window.document.body.appendChild(s);
  }
  return d;
}

/* Upgrading from an older build must keep every bit of learner progress. */
function upgradeChecks() {
  const legacy = {
    v: 1,
    profile: { name: "Ayesha", gender: "girl", avatar: "assets/avatars/girl-2.png", createdAt: "2026-01-04" },
    currentDay: 7,
    studied: { "1-1": true, "1-2": true, "1-3": true },
    days: { 1: { date: "2026-01-04", exam: { s: 19, t: 20, p: true, at: "2026-01-04" } } },
    activity: { "2026-01-04": true },
    mistakes: { w010101: { c: 2, healed: 1, last: "2026-01-05" } },
    stats: { answered: 40, correct: 35, exams: 2, examsPassed: 1 },   // older build: no rev/revPassed
    examCount: 42,                                                    // out-of-range value from an old build
    sound: false,
    seen: { "1-1": [0, 1, 2] },                                       // field blank() never declared
  };
  const raw = JSON.stringify(legacy);

  const d = freshStore("vocabLedger.state.v1", raw);
  const S = d.window.Store;
  ok(S.state.profile.name === "Ayesha", "profile survived the upgrade");
  ok(S.state.currentDay >= 7, "currentDay survived the upgrade");
  ok(Object.keys(S.state.studied).length === 3, "studied groups survived");
  ok(S.state.days[1] && S.state.days[1].exam.p === true, "exam results survived");
  ok(S.state.mistakes.w010101.c === 2, "mistake book survived");
  ok(S.state.stats.answered === 40, "old statistics kept");
  ok(S.state.stats.revPassed === 0 && S.state.stats.rev === 0, "statistics added by the new version default safely");
  ok(S.accuracy() === 88, `derived stats still compute (${S.accuracy()}% accuracy)`);
  ok(S.state.sound === false, "settings survived");
  ok(JSON.stringify(S.state.seen) === JSON.stringify({ "1-1": [0, 1, 2] }), "fields unknown to the old defaults survived");
  ok(S.state.examCount === 20, "out-of-range examCount normalised by the migration");
  ok(S.state.v === S.SCHEMA, "state stamped with the current schema version");
  ok(!!d.window.localStorage.getItem("vocabLedger.state.v1.bak"), "pre-migration snapshot (.bak) written");

  /* a save written under an older key must be adopted, not ignored */
  const d2 = freshStore("vocabLedger.state", raw);
  ok(d2.window.Store.state.profile.name === "Ayesha", "state under a legacy storage key is adopted");
  ok(!!d2.window.localStorage.getItem("vocabLedger.state.v1"), "adopted state is written to the canonical key");

  /* corrupt storage must not brick the app */
  const d3 = freshStore("vocabLedger.state.v1", "{not json");
  ok(d3.window.Store.state.profile === null, "corrupt save falls back to a fresh state instead of crashing");

  /* export → import round trip */
  const blob = S.exportState();
  ok(JSON.parse(blob).state.profile.name === "Ayesha", "export contains the full state");
  const d4 = freshStore(null, null);
  const res = d4.window.Store.importState(blob);
  ok(res.ok === true, "import accepts an exported backup");
  ok(d4.window.Store.state.profile.name === "Ayesha" && Object.keys(d4.window.Store.state.studied).length === 3, "import restores progress");
  ok(d4.window.Store.importState("nope").ok === false, "import rejects garbage without touching current state");
  ok(d4.window.Store.state.profile.name === "Ayesha", "failed import left the restored state intact");
}

(async function main() {
  const { Store, UI, App } = w;
  await wait(120); // let DOMContentLoaded fire & boot run

  console.log("\n— onboarding —");
  ok($("#nm"), "onboarding rendered");
  $("#nm").value = "Tusher";
  $("#nm").dispatchEvent(new w.Event("input", { bubbles: true }));
  click($('#seg button[data-g="boy"]'));
  ok($$("#avs button").length === 3, "3 boy avatars offered");
  click($$("#avs button")[0]);
  ok(!$("#begin").disabled, "begin enabled after name+gender+avatar");
  click($("#begin"));
  ok(!!$("#modal-root"), "welcome modal shown");
  await clickModal(0);

  console.log("\n— home —");
  ok($(".profile-head .name").textContent === "Tusher", "name on landing screen");
  ok($("#cal .cal-grid"), "calendar rendered");
  ok($("#cta"), "today CTA present");

  async function studyGroup(list, group) {
    // open via Word Lists accordion
    click($("#burger")); await wait(10);
    click($('.navitem[data-go="lists"]')); await wait(20);
    const acc = $(`.acc[data-l="${list}"]`);
    click(acc.querySelector(".ahead"));
    await wait(20);
    click(acc.querySelector(`.group-row[data-g="${group}"]`));
    await wait(20);
    ok(App.screen === "study" && App.params.group === group, `study screen L${list} G${group}`);
    $$("#cards .wcard").forEach((c) => click(c));
    ok(!$("#markB").disabled, "mark-studied enabled after flipping all cards");
    click($("#markB"));
    await wait(20);
    await clickModal(-1); // continue to next group / exam
  }

  async function runExam(answerCorrectly) {
    ok(App.screen === "exam", "exam running");
    const total = App.exam.qs.length;
    for (let i = 0; i < total; i++) {
      const q = App.exam.qs[i];
      const idx = answerCorrectly ? q.correctIdx : (q.correctIdx + 1) % 4;
      click($$(".opt-btn")[idx]);
      await wait(2);
      ok(i === 0 ? $$(".opt-btn.correct").length === 1 : true, i === 0 ? "correct option highlighted" : "");
      click($("#nextB"));
      await wait(5);
    }
    ok(App.screen === "result", "result screen reached");
    console.log("   dbg result:", JSON.stringify(App.result && { pct: App.result.pct, score: App.result.score, total: App.result.total, passed: App.result.passed }));
  }

  console.log("\n— day 1: study + daily exam —");
  await studyGroup(1, 1);
  // after modal we may be on study of group 2 or home
  if (App.screen === "study") {
    $$("#cards .wcard").forEach((c) => click(c));
    click($("#markB")); await wait(20);
    await clickModal(1); // take exam
  } else {
    await studyGroup(1, 2);
  }
  ok(App.screen === "examSetup", "exam setup reached");
  ok(!!$("#qdd"), "question-count dropdown present");
  click($("#start"));
  await wait(20);
  await runExam(true);
  ok(Store.dayExamPassed(1), "day-1 exam recorded as passed");
  await wait(900); // congrats modal
  ok(!!lastModal(), "congratulations shown on pass");
  await dismissModal();
  click($("#cont") || $("#home2")); await wait(20);

  console.log("\n— day 2: study + exam + revision gate —");
  await studyGroup(1, 3);
  if (App.screen === "study") { $$("#cards .wcard").forEach((c) => click(c)); click($("#markB")); await wait(20); await clickModal(1); }
  click($("#start")); await wait(20);
  await runExam(false); // deliberately fail to test gating + mistakes
  ok(!Store.dayExamPassed(2), "failed exam does not pass the day");
  const mistakesAfterFail = Object.keys(Store.state.mistakes).length;
  ok(mistakesAfterFail > 0, "mistakes recorded in Mistake Book");

  console.log("\n— mistake book & practice —");
  click($("#home2")); await wait(20);
  click($("#burger")); await wait(10);
  click($('.navitem[data-go="mistakes"]')); await wait(20);
  ok($(".mrow"), "mistake rows listed with frequency");
  ok($("#fdd"), "filter dropdown present");
  click($("#prac")); await wait(20);
  ok(App.exam.mode === "practice", "practice exam starts from mistakes");
  for (let i = 0; i < App.exam.qs.length; i++) { click($$(".opt-btn")[App.exam.qs[i].correctIdx]); await wait(2); click($("#nextB")); await wait(4); }
  await wait(20);
  click($("#home2")); await wait(20);

  console.log("\n— retry day-2 exam —");
  click($("#cta")); await wait(20);           // CTA = take today's exam
  ok(App.screen === "examSetup", "exam setup reachable from home CTA");
  click($("#start")); await wait(20);
  await runExam(true);
  const mistakesNow = Object.keys(Store.state.mistakes).length;
  ok(mistakesNow < mistakesAfterFail, `healing works (${mistakesAfterFail} -> ${mistakesNow} flagged)`);
  click($("#cont") || $("#home2")); await wait(20);
  ok(App.screen === "examSetup" && App.params.mode === "rev", "revision exam offered after 4 groups");
  click($("#start")); await wait(20);
  ok(App.exam.qs.length === 40, "revision exam has 40 questions");
  await runExam(true);
  await wait(900);
  ok(Store.state.currentDay === 3, "day 3 unlocked after 90% revision");
  await dismissModal();
  click($("#cont") || $("#home2")); await wait(20);

  console.log("\n— calendar —");
  ok(Store.calendarStatus(Store.today()) !== "missed", "today shows activity on calendar");

  console.log("\n— lists & locking —");
  click($("#burger")); await wait(10);
  click($('.navitem[data-go="lists"]')); await wait(20);
  ok($$(".acc").length === 12, "12 word lists listed");
  ok($(".acc[data-l='2']").classList.contains("lockedlist"), "list 2 still locked");

  console.log("\n— upgrading over a previous version (no data loss) —");
  upgradeChecks();

  console.log("\n— about screen —");
  click($("#burger")); await wait(10);
  click($('.navitem[data-go="about"]')); await wait(20);
  ok($("#view").innerHTML.includes(Store.APP_VERSION), "about screen shows the real app version");
  ok($("#bkOut") && $("#bkIn"), "backup & restore offered");
  click($("#bkOut")); await wait(20);
  const ta = $("#modal-root textarea");
  ok(ta && JSON.parse(ta.value).state.profile, "backup modal contains a parsable state");
  click($$("#modal-root .btn")[0]); await wait(400);

  console.log(failed ? `\n${failed} CHECK(S) FAILED\n` : "\nALL CHECKS PASSED ✅\n");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("SMOKE CRASH:", e); process.exit(1); });
