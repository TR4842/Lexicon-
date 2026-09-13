/* ============================================================
   Vocab Ledger — state, curriculum rules & persistence
   ============================================================ */
(function () {
  const KEY = "vocabLedger.state.v1";
  const V = () => window.VOCAB;

  const CURRICULUM = {
    lists: 12,
    groupsPerList: 10,
    groupsPerDay: 2,
    daysPerList: 5,           // 10 groups / 2 per day
    totalDays: 60,
    dailyPass: 0.8,           // 80% on the daily exam
    revisionPass: 0.9,        // 90% on revision exams
    revisionQuestions: 40,
  };

  function blank() {
    return {
      v: 1,
      profile: null,                       // {name, gender, avatar, createdAt}
      currentDay: 1,
      studied: {},                         // "l-g" -> true
      days: {},                            // dayIdx -> {date, exam:{s,t,p}, rev:{s,t,p}}
      activity: {},                        // 'YYYY-MM-DD' -> true (any study/exam action)
      mistakes: {},                        // wid -> {c, healed, last}
      stats: { answered: 0, correct: 0, exams: 0, examsPassed: 0, rev: 0, revPassed: 0 },
      examCount: 20,
      sound: true,
    };
  }

  /* storage with in-memory fallback (some embedded webviews block localStorage) */
  const mem = {};
  const LS = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return k in mem ? mem[k] : null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } },
  };

  let S = load();

  function load() {
    try {
      const raw = LS.get(KEY);
      if (raw) return Object.assign(blank(), JSON.parse(raw));
    } catch (e) { /* corrupted -> start fresh */ }
    return blank();
  }
  function save() { LS.set(KEY, JSON.stringify(S)); }

  /* ---------- date helpers ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const dkey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => dkey(new Date());
  function parseKey(k) { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); }

  /* ---------- curriculum mapping ---------- */
  function dayInfo(dayIdx) {
    const list = Math.ceil(dayIdx / CURRICULUM.daysPerList);
    const di = ((dayIdx - 1) % CURRICULUM.daysPerList) + 1;
    const groups = [di * 2 - 1, di * 2];
    // revision checkpoints: after 4 groups (day 2), after 8 groups (day 4), list final (day 5)
    let rev = null;
    if (di === 2) rev = { groups: [1, 2, 3, 4], kind: "Revision Exam", span: "Groups 1–4" };
    if (di === 4) rev = { groups: [5, 6, 7, 8], kind: "Revision Exam", span: "Groups 5–8" };
    if (di === 5) rev = { groups: [9, 10], kind: "List Final Exam", span: "Groups 9–10" };
    return { day: dayIdx, list, dayInList: di, groups, rev };
  }
  function wordsOf(list, group) { return V().lists[list - 1].groups[group - 1].words; }
  function dayWords(dayIdx) {
    const i = dayInfo(dayIdx);
    return i.groups.flatMap((g) => wordsOf(i.list, g));
  }
  function revWords(dayIdx) {
    const i = dayInfo(dayIdx);
    if (!i.rev) return [];
    return i.rev.groups.flatMap((g) => wordsOf(i.list, g));
  }

  /* ---------- progress predicates ---------- */
  const gkey = (l, g) => `${l}-${g}`;
  const isStudied = (l, g) => !!S.studied[gkey(l, g)];
  const dayRec = (d) => (S.days[d] = S.days[d] || {});
  const dayStudied = (d) => dayInfo(d).groups.every((g) => isStudied(dayInfo(d).list, g));
  const dayExamPassed = (d) => !!(S.days[d] && S.days[d].exam && S.days[d].exam.p);
  const dayRevPassed = (d) => !!(S.days[d] && S.days[d].rev && S.days[d].rev.p);
  const dayComplete = (d) => dayStudied(d) && dayExamPassed(d) && (!dayInfo(d).rev || dayRevPassed(d));

  function recalcCurrentDay() {
    let d = S.currentDay || 1;
    while (d < CURRICULUM.totalDays && dayComplete(d)) d++;
    S.currentDay = d;
    return d;
  }
  const unlockedList = () => dayInfo(recalcCurrentDay()).list;

  /* list progress: groups completed (studied) out of 10 */
  function listProgress(list) {
    let done = 0;
    for (let g = 1; g <= 10; g++) if (isStudied(list, g)) done++;
    return { done, total: 10 };
  }
  function groupAvailability(list, group) {
    const cur = dayInfo(recalcCurrentDay());
    if (isStudied(list, group)) return "studied";
    if (list < cur.list) return "review";
    if (list > cur.list) return "locked";
    return cur.groups.includes(group) ? "today" : "locked";
  }

  /* ---------- mutations ---------- */
  function setProfile(p) {
    S.profile = Object.assign({ createdAt: today() }, p);
    markActivity(); save();
  }
  function markStudy(list, group) {
    S.studied[gkey(list, group)] = true;
    markActivity(); save();
  }
  function markActivity() { S.activity[today()] = true; }

  function recordExam(kind, dayIdx, score, total) {
    const passed = score / total >= (kind === "rev" ? CURRICULUM.revisionPass : CURRICULUM.dailyPass);
    const rec = dayRec(dayIdx);
    if (kind === "rev") rec.rev = { s: score, t: total, p: passed, at: today() };
    else rec.exam = { s: score, t: total, p: passed, at: today() };
    S.stats.exams++;
    if (kind === "rev") S.stats.rev++;
    if (passed) {
      S.stats.examsPassed++;
      if (kind === "rev") S.stats.revPassed++;
    }
    if (passed && dayComplete(dayIdx)) rec.date = today();
    markActivity(); recalcCurrentDay(); save();
    return passed;
  }

  function addMistake(wid) {
    const m = S.mistakes[wid] || (S.mistakes[wid] = { c: 0, healed: 0, last: null });
    m.c++; m.last = today(); m.healed = 0;
    save();
  }
  function healMistake(wid) {
    const m = S.mistakes[wid];
    if (!m) return false;
    m.healed++;
    if (m.healed >= 2) { delete S.mistakes[wid]; save(); return true; }
    save(); return false;
  }
  function dropMistake(wid) { delete S.mistakes[wid]; save(); }
  const mistakeList = () =>
    Object.entries(S.mistakes)
      .map(([id, m]) => Object.assign({ id }, m, V().words[id]))
      .sort((a, b) => b.c - a.c || (a.w < b.w ? -1 : 1));

  function recordAnswer(correct) {
    S.stats.answered++;
    if (correct) S.stats.correct++;
    markActivity(); save();
  }

  function accuracy() {
    return S.stats.answered ? Math.round((S.stats.correct / S.stats.answered) * 100) : 0;
  }
  function wordsLearned() {
    let n = 0;
    for (const k in S.studied) if (S.studied[k]) n += 10;
    return n;
  }

  /* ---------- streak & calendar ---------- */
  function completedDates() {
    const set = {};
    for (const d in S.days) if (S.days[d].date) set[S.days[d].date] = true;
    return set;
  }
  function streak() {
    const done = completedDates();
    let n = 0;
    const d = new Date();
    if (!done[dkey(d)]) d.setDate(d.getDate() - 1);   // today still in progress is ok
    while (done[dkey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function calendarStatus(key) {
    const done = completedDates();
    if (done[key]) return "done";
    const t = today();
    if (key === t) return S.activity[key] ? "partial" : "today";
    if (key > t) return "future";
    if (!S.profile || key < S.profile.createdAt) return "blank";
    return S.activity[key] ? "partial" : "missed";
  }

  function resetAll() {
    S = blank();
    save();
  }

  window.Store = {
    CURRICULUM,
    get state() { return S; },
    save, load,
    today, dkey, parseKey,
    dayInfo, wordsOf, dayWords, revWords,
    isStudied, markStudy, dayStudied, dayExamPassed, dayRevPassed, dayComplete,
    recalcCurrentDay, unlockedList, listProgress, groupAvailability,
    setProfile, recordExam, recordAnswer,
    addMistake, healMistake, dropMistake, mistakeList,
    accuracy, wordsLearned, streak, calendarStatus, completedDates,
    resetAll,
  };
})();
