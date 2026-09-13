/* ============================================================
   Vocab Ledger — question generation engine (fully offline)
   ============================================================ */
(function () {
  const V = () => window.VOCAB;
  const W = (id) => V().words[id];

  const shuffle = (a) => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  function stemOf(word) {
    const w = word.replace(/[^A-Za-z]/g, "");
    return w.slice(0, Math.max(4, w.length - 3));
  }
  function blankSentence(entry) {
    if (!entry.ex) return null;
    const re = new RegExp("\\b" + stemOf(entry.w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[a-z]*", "i");
    if (!re.test(entry.ex)) return null;
    return entry.ex.replace(re, "______");
  }

  /* distractor pools: same group → same list → anywhere */
  function distractors(entry, n, filter, map) {
    const out = [];
    const seen = new Set([map(entry)]);
    const pools = [
      V().lists[entry.l - 1].groups[entry.g - 1].words.map(W),
      V().lists[entry.l - 1].groups.flatMap((g) => g.words).map(W),
      shuffle(Object.keys(V().words)).map(W),
    ];
    for (const pool of pools) {
      for (const cand of shuffle(pool)) {
        if (out.length >= n) break;
        const val = map(cand);
        if (!val || seen.has(val) || (filter && !filter(cand))) continue;
        seen.add(val); out.push(val);
      }
      if (out.length >= n) break;
    }
    return out;
  }

  const TYPES = {
    bn2word: {
      label: "Bengali → Word",
      make(e) {
        return {
          prompt: { bn: e.bn }, sub: "Which word matches this meaning?",
          answer: e.w, opts: distractors(e, 3, null, (c) => c.w),
        };
      },
    },
    word2bn: {
      label: "Word → Bengali",
      make(e) {
        return {
          prompt: { word: e.w }, sub: "সঠিক বাংলা অর্থ বেছে নিন · pick the correct Bengali meaning",
          answer: e.bn, opts: distractors(e, 3, (c) => c.bn, (c) => c.bn), bn: true,
        };
      },
    },
    word2en: {
      label: "Word → Meaning",
      make(e) {
        return {
          prompt: { word: e.w }, sub: "Choose the closest English meaning",
          answer: e.en, opts: distractors(e, 3, (c) => c.en, (c) => c.en),
        };
      },
    },
    word2syn: {
      label: "Synonyms",
      make(e) {
        return {
          prompt: { word: e.w }, sub: "Which set is a list of synonyms?",
          answer: e.syn.join(", "), opts: distractors(e, 3, (c) => c.syn.length, (c) => c.syn.join(", ")),
        };
      },
    },
    word2ant: {
      label: "Antonyms",
      make(e) {
        return {
          prompt: { word: e.w }, sub: "Which set is a list of antonyms?",
          answer: e.ant.join(", "), opts: distractors(e, 3, (c) => c.ant.length, (c) => c.ant.join(", ")),
        };
      },
    },
    blank: {
      label: "Fill the blank",
      make(e) {
        const s = blankSentence(e);
        if (!s) return null;
        return {
          prompt: { sub: "Choose the word that completes the sentence" }, blank: s,
          answer: e.w, opts: distractors(e, 3, null, (c) => c.w),
        };
      },
    },
  };

  function eligible(type, e) {
    if (type === "word2syn") return e.syn.length > 0;
    if (type === "word2ant") return e.ant.length > 0;
    if (type === "blank") return !!blankSentence(e);
    return true;
  }

  /* build `count` questions from a word-id pool */
  function makeQuestions(poolIds, count) {
    const weights = [
      ["bn2word", 0.2], ["word2bn", 0.18], ["word2en", 0.16],
      ["blank", 0.2], ["word2syn", 0.14], ["word2ant", 0.12],
    ];
    const plan = [];
    weights.forEach(([t, w]) => plan.push(...Array(Math.round(count * w)).fill(t)));
    while (plan.length < count) plan.push(pick(weights)[0]);
    const shuffledPlan = shuffle(plan).slice(0, count);

    const used = new Set();
    const qs = [];
    const pool = shuffle(poolIds);
    let pi = 0;
    for (const type of shuffledPlan) {
      let made = null;
      for (let tries = 0; tries < pool.length && !made; tries++) {
        const id = pool[pi++ % pool.length];
        const e = W(id);
        const key = type + ":" + id;
        if (used.has(key) || !eligible(type, e)) continue;
        const q = TYPES[type].make(e);
        if (!q) continue;
        used.add(key);
        made = { type, label: TYPES[type].label, wid: id, entry: e, ...q };
      }
      if (!made) {   // fallback: any type for a fresh word
        for (const id of pool) {
          const e = W(id);
          const t2 = shuffle(Object.keys(TYPES)).find((t) => !used.has(t + ":" + id) && eligible(t, e));
          if (!t2) continue;
          used.add(t2 + ":" + id);
          made = { type: t2, label: TYPES[t2].label, wid: id, entry: e, ...TYPES[t2].make(e) };
          break;
        }
      }
      if (made) qs.push(made);
    }
    // assemble options
    for (const q of qs) {
      const opts = shuffle([q.answer, ...q.opts].slice(0, 4));
      q.options = opts;
      q.correctIdx = opts.indexOf(q.answer);
      delete q.opts;
    }
    return qs;
  }

  window.Exam = { makeQuestions, shuffle, blankSentence };
})();
