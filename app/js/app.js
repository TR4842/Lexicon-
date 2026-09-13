/* ============================================================
   Vocab Ledger — app shell, router & screens
   ============================================================ */
(function () {
  const { icon, $, $$, esc, sfx, toast, modal, confirmBox, confetti, dropdown, calendar, ring, animateRing } = UI;
  const C = Store.CURRICULUM;

  const App = { screen: "home", params: {}, exam: null, cal: null };

  const AVATARS = {
    boy: ["assets/avatars/boy-1.png", "assets/avatars/boy-2.png", "assets/avatars/boy-3.png"],
    girl: ["assets/avatars/girl-1.png", "assets/avatars/girl-2.png", "assets/avatars/girl-3.png"],
  };
  const LIST_TINTS = [
    "linear-gradient(135deg,#FFB27D,#F58AA9)", "linear-gradient(135deg,#8FD8B9,#5CB691)",
    "linear-gradient(135deg,#9CCBEF,#6FA8D8)", "linear-gradient(135deg,#C6B2F0,#9F86DE)",
    "linear-gradient(135deg,#FFD98A,#F2B544)", "linear-gradient(135deg,#F7A8C4,#E86A8A)",
    "linear-gradient(135deg,#9FD8CF,#5FA99E)", "linear-gradient(135deg,#F3B8A0,#DE8B84)",
    "linear-gradient(135deg,#A8C8F0,#7E9BD8)", "linear-gradient(135deg,#D8B8F0,#B08FDE)",
    "linear-gradient(135deg,#FFE09A,#E8B84B)", "linear-gradient(135deg,#F0A8B8,#D8708A)",
  ];

  /* ============================================================ router */
  function go(screen, params) {
    App.screen = screen; App.params = params || {};
    renderShell();
    const v = $("#view");
    v.scrollTop = 0; window.scrollTo(0, 0);
  }

  const TITLES = {
    home: ["Vocab Ledger", "your word journey"],
    lists: ["Word Lists", "12 lists · 120 groups"],
    study: ["Study", "learn the words"],
    examSetup: ["Exam Hall", "pick your challenge"],
    exam: ["Exam", "in progress"],
    result: ["Results", "how it went"],
    mistakes: ["Mistake Book", "review & heal"],
    about: ["About", "credits & contact"],
    profile: ["Profile", "make it yours"],
  };

  function renderShell() {
    const shell = $("#shell");
    const [t, s] = TITLES[App.screen] || TITLES.home;
    const onb = App.screen === "onboarding";
    if (onb) { shell.innerHTML = `<div id="view"></div>`; SCREENS.onboarding(); return; }

    shell.innerHTML = `
      <header class="topbar">
        <button class="iconbtn" id="burger" aria-label="Open menu">${icon("menu")}</button>
        <div class="title"><small>${esc(s)}</small>${esc(t)}</div>
        <button class="iconbtn" id="soundBtn" aria-label="Toggle sound">${icon(App.screen === "exam" ? "spark" : "speaker")}</button>
      </header>
      <div id="view"></div>
      ${drawerHTML()}`;
    $("#burger").onclick = () => openDrawer(true);
    const sb = $("#soundBtn");
    syncSoundBtn(sb);
    sb.onclick = () => { Store.state.sound = !Store.state.sound; Store.save(); syncSoundBtn(sb); sfx.click(); toast(Store.state.sound ? "Sound on" : "Sound off"); };
    SCREENS[App.screen]();
  }
  function syncSoundBtn(b) {
    b.style.opacity = Store.state.sound ? "1" : ".45";
    b.innerHTML = icon("speaker");
  }

  /* ============================================================ drawer */
  function drawerHTML() {
    const p = Store.state.profile || {};
    const mcount = Object.keys(Store.state.mistakes).length;
    const items = [
      ["home", "home", "Home"],
      ["today", "target", "Today's Goal"],
      ["lists", "book", "Word Lists"],
      ["mistakes", "alert", "Mistake Book", mcount],
      ["about", "info", "About"],
      ["profile", "user", "Edit Profile"],
    ];
    return `
    <div id="scrim"></div>
    <aside id="drawer" aria-label="Main menu">
      <div class="dhead">
        <div class="row">
          <img class="avatar" src="${esc(p.avatar || AVATARS.boy[0])}" alt="avatar">
          <div>
            <div class="dname">${esc(p.name || "Friend")}</div>
            <div class="dsub">Day ${Math.min(Store.state.currentDay, C.totalDays)} of ${C.totalDays} · List ${Store.unlockedList()}</div>
          </div>
        </div>
      </div>
      <nav>
        ${items.map(([sc, ic, label, badge]) => `
          <button class="navitem ${App.screen === sc ? "active" : ""}" data-go="${sc}">
            ${icon(ic)}<span>${esc(label)}</span>${badge ? `<span class="badge">${badge}</span>` : ""}
          </button>`).join("")}
      </nav>
      <div class="dfoot">
        Credit: Engr. Tanjim Ahmed Khan<br>
        Prepared with <span class="love">♥</span> by Tusher Khan
      </div>
    </aside>`;
  }
  function openDrawer(on) {
    const d = $("#drawer"), s = $("#scrim");
    if (!d) return;
    d.classList.toggle("on", on); s.classList.toggle("on", on);
    if (on) {
      sfx.open();
      $$("[data-go]", d).forEach((b) => {
        b.onclick = () => {
          openDrawer(false);
          const t = b.dataset.go;
          if (t === "today") return nextAction(true);
          go(t);
        };
      });
      s.onclick = () => openDrawer(false);
    }
  }

  /* ============================================================ helpers */
  function nextAction(navigate) {
    const d = Store.state.currentDay;
    if (d > C.totalDays) { if (navigate) go("home"); return null; }
    const info = Store.dayInfo(d);
    const unstudied = info.groups.filter((g) => !Store.isStudied(info.list, g));
    let a;
    if (unstudied.length) a = { type: "study", day: d, list: info.list, group: unstudied[0] };
    else if (!Store.dayExamPassed(d)) a = { type: "exam", day: d };
    else if (info.rev && !Store.dayRevPassed(d)) a = { type: "rev", day: d };
    else a = null;
    if (navigate && a) {
      if (a.type === "study") go("study", { list: a.list, group: a.group });
      else go("examSetup", { mode: a.type, day: a.day });
    }
    return a;
  }

  function statCard(tint, ic, num, lbl) {
    return `<div class="stat ${tint}"><div class="ic">${icon(ic)}</div><div class="num">${num}</div><div class="lbl">${lbl}</div></div>`;
  }

  /* ============================================================ screens */
  const SCREENS = {};

  /* ---------- onboarding ---------- */
  SCREENS.onboarding = function (edit) {
    const shell = $("#shell");
    const cur = Store.state.profile || {};
    let gender = cur.gender || null, avatar = cur.avatar || null, name = cur.name || "";
    shell.innerHTML = `
      <div class="onb">
        <div class="logo-wrap"><img src="assets/icons/icon-192.png" alt="Vocab Ledger logo"></div>
        <h1>Vocab Ledger</h1>
        <svg class="wave" viewBox="0 0 150 12"><path d="M2 8c12-8 24 8 36 0s24 8 36 0 24 8 36 0 24 8 38 0" fill="none" stroke="#F58AA9" stroke-width="4" stroke-linecap="round"/></svg>
        <p class="tag">12 word lists · 1200 words · a gentle daily ritual.<br>Tell us about yourself to begin.</p>
        <div class="card pad-lg">
          <div class="field">
            <label for="nm">Your name</label>
            <input id="nm" type="text" maxlength="24" placeholder="e.g. Tusher" value="${esc(name)}" autocomplete="given-name">
          </div>
          <div class="field">
            <label>Gender</label>
            <div class="seg" id="seg">
              <button type="button" data-g="boy">${icon("user")} Boy</button>
              <button type="button" data-g="girl">${icon("user")} Girl</button>
            </div>
          </div>
          <div class="field">
            <label>Pick your avatar</label>
            <div class="avatar-grid" id="avs"></div>
            <div class="locknote" id="avHint">${icon("info")} Choose a gender first — avatars appear here.</div>
          </div>
          <button class="btn block mt12" id="begin" disabled>${icon("spark")} ${edit ? "Save profile" : "Begin my journey"}</button>
        </div>
      </div>`;
    if (edit) {
      const back = document.createElement("button");
      back.className = "iconbtn";
      back.style.cssText = "position:fixed;top:16px;left:16px;z-index:5";
      back.setAttribute("aria-label", "Back");
      back.innerHTML = icon("back");
      back.onclick = () => go("home");
      shell.prepend(back);
    }
    const avs = $("#avs"), hint = $("#avHint"), begin = $("#begin");
    function paintAvatars() {
      if (!gender) { avs.innerHTML = ""; hint.classList.remove("hidden"); return; }
      hint.classList.add("hidden");
      avs.innerHTML = AVATARS[gender].map((src) => `<button type="button" data-a="${src}" class="${avatar === src ? "sel" : ""}"><img src="${src}" alt="avatar option"></button>`).join("");
      $$("button", avs).forEach((b) => b.onclick = () => { avatar = b.dataset.a; sfx.click(); paintAvatars(); validate(); });
    }
    function validate() { begin.disabled = !(name.trim() && gender && avatar); }
    $("#nm").oninput = (e) => { name = e.target.value; validate(); };
    $$("#seg button").forEach((b) => b.onclick = () => {
      gender = b.dataset.g;
      if (avatar && !AVATARS[gender].includes(avatar)) avatar = null;
      $$("#seg button").forEach((x) => x.classList.toggle("sel", x === b));
      sfx.click(); paintAvatars(); validate();
    });
    if (gender) $(`#seg button[data-g="${gender}"]`).classList.add("sel");
    paintAvatars(); validate();
    begin.onclick = () => {
      sfx.win();
      if (!edit) {
        Store.setProfile({ name: name.trim(), gender, avatar });
        modal({
          tint: "var(--grad-sunset)", glyph: "spark",
          title: `Welcome, ${name.trim()}!`,
          html: `<p>Every day you'll learn <b>2 groups</b> (20 words) and take a short exam.
                 Every 2 days a <b>revision exam</b> guards the gate — score <b>90%</b> to move on.</p>`,
          buttons: [{ label: "Let's go", icon: "spark", onClick: () => go("home") }],
        });
      } else {
        Store.state.profile = Object.assign({}, Store.state.profile, { name: name.trim(), gender, avatar });
        Store.save(); toast("Profile updated"); go("home");
      }
    };
  };

  /* ---------- home ---------- */
  SCREENS.home = function () {
    const S = Store.state, p = S.profile;
    const d = Math.min(S.currentDay, C.totalDays);
    const info = Store.dayInfo(d);
    const done = S.currentDay > C.totalDays;
    const act = nextAction(false);
    const mk = Store.mistakeList().length;

    let ctaLabel = "You did it all! 🎉", ctaGo = null;
    if (act) {
      if (act.type === "study") { ctaLabel = `Start today's learning`; ctaGo = () => go("study", { list: act.list, group: act.group }); }
      if (act.type === "exam") { ctaLabel = `Take today's exam`; ctaGo = () => go("examSetup", { mode: "exam", day: act.day }); }
      if (act.type === "rev") { ctaLabel = `Take ${Store.dayInfo(act.day).rev.kind}`; ctaGo = () => go("examSetup", { mode: "rev", day: act.day }); }
    }

    const checkRow = (ok, label, sub) => `
      <div class="flex" style="margin:7px 0">
        <span style="width:22px;height:22px;flex:0 0 auto;display:inline-flex">${ok ? UI.tickSVG(22) : `<svg viewBox="0 0 64 64" style="width:22px;height:22px"><circle cx="32" cy="32" r="27" fill="rgba(255,255,255,.65)" stroke="rgba(74,59,46,.25)" stroke-width="3" stroke-dasharray="4 6"/></svg>`}</span>
        <span class="grow" style="font-weight:800;font-size:.92rem">${label}<small class="mut" style="display:block;font-weight:700;font-size:.74rem">${sub}</small></span>
      </div>`;

    $("#view").innerHTML = `
      <div class="profile-head">
        <div class="avatar-ring"><img src="${esc(p.avatar)}" alt="avatar of ${esc(p.name)}"></div>
        <div class="grow">
          <div class="hi">Welcome back</div>
          <div class="name">${esc(p.name)}</div>
          <div class="sub">${done ? "Journey complete — legend!" : `Day <b>${d}</b> of ${C.totalDays} · Word List <b>${info.list}</b>`}</div>
        </div>
        <button class="iconbtn" id="editP" aria-label="Edit profile">${icon("user")}</button>
      </div>

      <div class="stats">
        ${statCard("s-mint", "book", Store.wordsLearned(), "words learned")}
        ${statCard("s-butter", "flame", Store.streak(), "day streak")}
        ${statCard("s-sky", "chart", Store.accuracy() + "%", "accuracy")}
        ${statCard("s-lav", "trophy", S.stats.examsPassed, "exams passed")}
      </div>

      <div class="card grad-sunset pad-lg">
        <div class="card-title-row">
          <h3>${icon("target")} ${done ? "All lists complete" : `Today's goal · Day ${d}`}</h3>
          <span class="chip" style="background:rgba(255,255,255,.6)">List ${info.list}</span>
        </div>
        <p class="hint" style="color:rgba(74,59,46,.75)">Learn <b>Group ${info.groups[0]}</b> & <b>Group ${info.groups[1]}</b> — then pass the daily exam.</p>
        ${checkRow(Store.isStudied(info.list, info.groups[0]), `Study Group ${info.groups[0]}`, "10 words · flip every card")}
        ${checkRow(Store.isStudied(info.list, info.groups[1]), `Study Group ${info.groups[1]}`, "10 words · flip every card")}
        ${checkRow(Store.dayExamPassed(d), "Daily exam", `${S.examCount} questions · pass at 80%`)}
        ${info.rev ? checkRow(Store.dayRevPassed(d), info.rev.kind, `${C.revisionQuestions} questions on ${info.rev.span} · pass at 90%`) : ""}
        ${ctaGo ? `<button class="btn block mt12" id="cta">${icon("spark")} ${esc(ctaLabel)}</button>` : `<div class="locknote mt12" style="background:rgba(255,255,255,.5)">${icon("trophy")} Everything for today is done. Rest well!</div>`}
      </div>

      ${mk ? `<button class="btn ghost block" id="mkGo">${icon("alert")} ${mk} word${mk > 1 ? "s" : ""} waiting in your Mistake Book</button>` : ""}

      <div class="card">
        <div class="card-title-row"><h3>${icon("cal")} Consistency calendar</h3><span class="chip mint">${Store.streak()}🔥 streak</span></div>
        <div id="cal" class="mt12"></div>
      </div>

      <div class="card grad-mint">
        <h3>${icon("chart")} Journey progress</h3>
        <div class="flex spread mt12"><span style="font-weight:800;font-size:.9rem">Word List ${info.list}</span><span class="chip">${Store.listProgress(info.list).done}/10 groups</span></div>
        <div class="pbar mint mt8"><i style="width:${Store.listProgress(info.list).done * 10}%"></i></div>
        <div class="flex spread mt12"><span style="font-weight:800;font-size:.9rem">Overall</span><span class="chip">${S.currentDay - 1}/${C.totalDays} days</span></div>
        <div class="pbar sky mt8"><i style="width:${((S.currentDay - 1) / C.totalDays) * 100}%"></i></div>
      </div>
      <div style="height:8px"></div>`;

    App.cal = calendar($("#cal"));
    const cta = $("#cta"); if (cta) cta.onclick = () => { sfx.click(); ctaGo(); };
    $("#editP").onclick = () => go("profile");
    const mb = $("#mkGo"); if (mb) mb.onclick = () => go("mistakes");
  };

  /* ---------- word lists ---------- */
  SCREENS.lists = function () {
    const unlocked = Store.unlockedList();
    const rows = [];
    for (let l = 1; l <= C.lists; l++) {
      const locked = l > unlocked;
      const prog = Store.listProgress(l);
      rows.push(`
      <div class="acc ${locked ? "lockedlist" : ""}" data-l="${l}">
        <button class="ahead">
          <span class="lbadge" style="background:${LIST_TINTS[l - 1]}">${locked ? icon("lock") : l}</span>
          <span class="ameta">
            <span class="atitle">Word List ${l}</span>
            <span class="asub">${locked ? `Complete Word List ${l - 1} to unlock` : `${prog.done}/10 groups studied · 100 words`}</span>
          </span>
          ${icon("caret", "caret")}
        </button>
        <div class="abody"><div class="abody-inner">
          ${Array.from({ length: 10 }, (_, i) => i + 1).map((g) => {
            const av = Store.groupAvailability(l, g);
            const info = Store.dayInfo(Store.state.currentDay);
            const isToday = av === "today";
            const st = av === "studied" || av === "review" ? UI.tickSVG() : av === "locked" ? `<span class="st" style="color:var(--ink-faint)">${icon("lock")}</span>` : `<span class="st" style="color:var(--coral)">${icon("spark")}</span>`;
            const label = av === "studied" ? "Studied — tap to review" : av === "review" ? "Unlocked for review" : av === "today" ? "Today's group — study now" : "Locked";
            return `<button class="group-row ${av === "locked" ? "locked" : ""} ${isToday ? "today" : ""}" data-g="${g}" data-av="${av}">
              <span class="gn">${g}</span>
              <span class="gmeta"><span class="gt">Group ${g}</span><span class="gs">${label}</span></span>
              ${st}
            </button>`;
          }).join("")}
        </div></div>
      </div>`);
    }
    $("#view").innerHTML = `
      <div class="card grad-lav" style="margin-top:16px">
        <h3>${icon("book")} The shelf</h3>
        <p class="hint">12 lists × 10 groups × 10 words. Finish a list (all groups + exams) to unlock the next one.</p>
      </div>${rows.join("")}`;
    $$(".acc").forEach((acc) => {
      const l = Number(acc.dataset.l);
      const locked = l > Store.unlockedList();
      $(".ahead", acc).onclick = () => {
        if (locked) { sfx.bad(); toast(`Finish Word List ${l - 1} first 💪`); return; }
        sfx.click();
        acc.classList.toggle("open");
        const body = $(".abody", acc);
        body.style.maxHeight = acc.classList.contains("open") ? body.scrollHeight + 40 + "px" : "0px";
      };
      $$(".group-row", acc).forEach((r) => {
        r.onclick = () => {
          const av = r.dataset.av;
          if (av === "locked") { sfx.bad(); toast("This group unlocks with its day's goal"); return; }
          sfx.click(); go("study", { list: l, group: Number(r.dataset.g) });
        };
      });
    });
  };

  /* ---------- study ---------- */
  SCREENS.study = function () {
    const { list, group } = App.params;
    const ids = Store.wordsOf(list, group);
    const skey = `${list}-${group}`;
    Store.state.seen = Store.state.seen || {};
    const seen = new Set(Store.state.seen[skey] || []);
    const info = Store.dayInfo(Store.state.currentDay);
    const isToday = info.list === list && info.groups.includes(group);

    $("#view").innerHTML = `
      <div class="card grad-sky" style="margin-top:16px">
        <div class="card-title-row">
          <h3>${icon("book")} List ${list} · Group ${group}</h3>
          <span class="chip ${isToday ? "" : "sky"}">${isToday ? "today's group" : "review"}</span>
        </div>
        <p class="hint">Tap a card to flip it. See all 10 to mark the group studied.</p>
        <div class="pbar thin mt8"><i id="seenbar" style="width:${seen.size * 10}%"></i></div>
        <div class="flex spread mt8"><span class="mut" style="font-size:.78rem;font-weight:800"><span id="seenn">${seen.size}</span>/10 seen</span><span id="doneTag"></span></div>
      </div>
      <div id="cards"></div>
      <div style="height:76px"></div>
      <div class="actionbar">
        <button class="btn ghost" id="backB">${icon("back")} Lists</button>
        <button class="btn mint" id="markB">${icon("check")} Mark studied</button>
      </div>`;

    const wrap = $("#cards");
    function paintDone() {
      $("#seenn").textContent = seen.size;
      $("#seenbar").style.width = seen.size * 10 + "%";
      const studied = Store.isStudied(list, group);
      $("#doneTag").innerHTML = studied ? `<span class="chip solid-mint">studied ✓</span>` : "";
      $("#markB").disabled = studied || seen.size < 10;
      $("#markB").innerHTML = studied ? `${icon("check")} Studied` : `${icon("check")} Mark studied`;
    }
    wrap.innerHTML = ids.map((id, i) => {
      const e = window.VOCAB.words[id];
      return `
      <div class="wcard ${seen.has(i) ? "seen" : ""}" data-i="${i}">
        <div class="inner">
          <div class="face front">
            <span class="idx">${i + 1}/10</span>
            <div class="word">${esc(e.w)}</div>
            <div class="bnline bn">${esc(e.bn)}</div>
            <div class="tap">tap to flip</div>
          </div>
          <div class="face back">
            <span class="idx">${i + 1}/10</span>
            <div class="row"><span class="k">Meaning</span><span class="v bn">${esc(e.bn)}</span></div>
            <div class="row"><span class="k">English</span><span class="v">${esc(e.en)}</span></div>
            <div class="row"><span class="k">Synonyms</span><span class="v">${esc(e.syn.join(", ") || "—")}</span></div>
            <div class="row"><span class="k">Antonyms</span><span class="v">${esc(e.ant.join(", ") || "—")}</span></div>
            <div class="ex">“${esc(e.ex)}”</div>
          </div>
        </div>
      </div>`;
    }).join("");
    paintDone();

    $$(".wcard", wrap).forEach((card) => {
      card.onclick = (ev) => {
        card.classList.toggle("flipped");
        sfx.flip();
        const i = Number(card.dataset.i);
        if (!seen.has(i)) {
          seen.add(i);
          Store.state.seen[skey] = Array.from(seen);
          Store.save();
          card.classList.add("seen");
          paintDone();
        }
      };
    });
    $("#backB").onclick = () => go("lists");
    $("#markB").onclick = () => {
      if (Store.isStudied(list, group)) return go("lists");
      Store.markStudy(list, group);
      sfx.win();
      const other = info.list === list ? info.groups.find((g) => g !== group && !Store.isStudied(list, g)) : null;
      if (other) {
        modal({
          tint: "var(--grad-mint)", glyph: "trophy", title: `Group ${group} studied!`,
          html: `<p>Beautiful. <b>Group ${other}</b> is waiting — finish it to unlock today's exam.</p>`,
          buttons: [
            { label: "Later", style: "ghost", onClick: () => go("home") },
            { label: `Open Group ${other}`, icon: "book", onClick: () => go("study", { list, group: other }) },
          ],
        });
      } else {
        modal({
          tint: "var(--grad-sunset)", glyph: "spark", title: "Learning goal done!",
          html: `<p>Both groups for today are studied. The <b>daily exam</b> is now open.</p>`,
          buttons: [
            { label: "Home", style: "ghost", onClick: () => go("home") },
            { label: "Take exam", icon: "pencil", onClick: () => go("examSetup", { mode: "exam", day: Store.state.currentDay }) },
          ],
        });
      }
    };
  };

  /* ---------- exam setup ---------- */
  SCREENS.examSetup = function () {
    const mode = App.params.mode === "rev" ? "rev" : "exam";
    const day = App.params.day || Store.state.currentDay;
    const info = Store.dayInfo(day);
    const pool = mode === "rev" ? Store.revWords(day) : Store.dayWords(day);
    const rev = info.rev;
    const canStart = mode === "rev" ? Store.dayExamPassed(day) : Store.dayStudied(day);

    $("#view").innerHTML = `
      <div class="card ${mode === "rev" ? "grad-rose" : "grad-butter"} pad-lg" style="margin-top:16px">
        <h3>${icon(mode === "rev" ? "refresh" : "pencil")} ${mode === "rev" ? rev.kind : `Daily exam · Day ${day}`}</h3>
        <p class="hint">${mode === "rev"
          ? `Syllabus: <b>List ${info.list}, ${rev.span}</b> — the last 4 groups you learned.`
          : `Syllabus: <b>List ${info.list}, Groups ${info.groups[0]} & ${info.groups[1]}</b> — today's learning goal.`}</p>
        <div class="flex mt12" style="flex-wrap:wrap">
          <span class="chip">${pool.length} words in syllabus</span>
          <span class="chip mint">pass: ${mode === "rev" ? "90%" : "80%"}</span>
          <span class="chip sky">${mode === "rev" ? C.revisionQuestions : Store.state.examCount} questions</span>
        </div>
      </div>

      ${mode === "exam" ? `
      <div class="card">
        <h3>${icon("gear")} Number of questions</h3>
        <p class="hint">More questions, more practice on the same 20 words.</p>
        <div id="qdd" class="mt12"></div>
      </div>` : ""}

      <div class="card">
        <h3>${icon("bulb")} How it works</h3>
        <p class="hint">Instant feedback after each answer. Wrong words go to your <b>Mistake Book</b> so you can heal them later. ${mode === "rev" ? "Score <b>90%+</b> to unlock the next days." : "Score <b>80%+</b> to complete the day."}</p>
      </div>

      ${canStart ? `<button class="btn block mt12" id="start">${icon("spark")} Start ${mode === "rev" ? rev.kind.toLowerCase() : "exam"}</button>`
        : `<div class="locknote">${icon("lock")} ${mode === "rev" ? "Pass the daily exam first to unlock this revision." : "Study both of today's groups first."}</div>`}
      <div style="height:20px"></div>`;

    if (mode === "exam") {
      dropdown($("#qdd"), {
        ariaLabel: "number of questions",
        options: [
          { value: 20, label: "20 questions", hint: "quick" },
          { value: 25, label: "25 questions", hint: "balanced" },
          { value: 30, label: "30 questions", hint: "thorough" },
        ],
        value: Store.state.examCount,
        onChange: (v) => { Store.state.examCount = v; Store.save(); $(".chip.sky").textContent = v + " questions"; },
      });
    }
    const st = $("#start");
    if (st) st.onclick = () => startExam(mode, day, mode === "rev" ? C.revisionQuestions : Store.state.examCount);
  };

  /* ---------- exam runner ---------- */
  function startExam(mode, day, count, poolOverride, title) {
    const pool = poolOverride || (mode === "rev" ? Store.revWords(day) : Store.dayWords(day));
    const qs = Exam.makeQuestions(pool, Math.min(count, pool.length * 3));
    App.exam = { mode, day, pool, qs, i: 0, score: 0, answered: false, wrong: [], t0: Date.now(), title: title || (mode === "rev" ? Store.dayInfo(day).rev.kind : `Daily exam · Day ${day}`) };
    go("exam");
  }

  SCREENS.exam = function () {
    const E = App.exam;
    if (!E) return go("home");
    let q = E.qs[E.i];
    const mm = () => {
      const s = Math.floor((Date.now() - E.t0) / 1000);
      return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    };
    $("#view").innerHTML = `
      <div class="exam-top">
        <button class="iconbtn mini" id="quit" aria-label="Quit exam">${icon("cross")}</button>
        <div class="qcount">${esc(E.title)} · Q ${E.i + 1}/${E.qs.length}</div>
<div class="timer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg><span id="tm">${mm()}</span></div>
      </div>
      <div class="pbar thin mt8"><i id="qp" style="width:${(E.i / E.qs.length) * 100}%"></i></div>
      <div id="qwrap"></div>
      <div style="height:80px"></div>
      <div class="actionbar"><button class="btn block" id="nextB" disabled>Next ${icon("back", "rot")}</button></div>`;
    const nxt = $("#nextB");
    nxt.querySelector("svg").style.transform = "rotate(180deg)";
    const timerInt = setInterval(() => { const t = $("#tm"); if (t) t.textContent = mm(); else clearInterval(timerInt); }, 1000);

    function paintQ() {
      const keys = ["A", "B", "C", "D"];
      q = E.qs[E.i];
      $("#qp").style.width = (E.i / E.qs.length) * 100 + "%";
      $(".qcount").textContent = `${E.title} · Q ${E.i + 1}/${E.qs.length}`;
      const prompt = q.prompt.word ? `<div class="qtext">${esc(q.prompt.word)}</div>`
        : q.prompt.bn ? `<div class="qtext bn">${esc(q.prompt.bn)}</div>` : "";
      $("#qwrap").innerHTML = `
        <div class="qcard">
          <div class="qtype">${icon("spark")} ${esc(q.label)}</div>
          ${prompt}
          ${q.blank ? `<div class="qblank">“${esc(q.blank)}”</div>` : ""}
          <div class="mut" style="font-weight:700;font-size:.84rem;margin-top:6px">${esc(q.sub || q.prompt.sub || "")}</div>
          <div class="opts">
            ${q.options.map((o, i) => `<button class="opt-btn" data-i="${i}"><span class="key">${keys[i]}</span><span class="${q.bn ? "bn" : ""}">${esc(o)}</span></button>`).join("")}
          </div>
          <div id="expl"></div>
        </div>`;
      E.answered = false;
      nxt.disabled = true;
      nxt.innerHTML = E.i === E.qs.length - 1 ? `Finish ${icon("trophy")}` : `Next ${icon("back")}`;
      nxt.querySelector("svg").style.transform = "rotate(180deg)";
      $$(".opt-btn").forEach((b) => {
        b.onclick = () => answer(Number(b.dataset.i));
      });
    }

    function answer(idx) {
      if (E.answered) return;
      E.answered = true;
      const ok = idx === q.correctIdx;
      const e = q.entry;
      Store.recordAnswer(ok);
      if (ok) {
        sfx.good();
        E.score++;
        if (Store.state.mistakes[e.id]) {
          const cleared = Store.healMistake(e.id);
          if (cleared) setTimeout(() => toast(`“${e.w}” healed — out of the Mistake Book 💚`), 500);
        }
      } else {
        sfx.bad();
        Store.addMistake(e.id);
        E.wrong.push(e);
      }
      $$(".opt-btn").forEach((b, i) => {
        b.disabled = true;
        if (i === q.correctIdx) b.classList.add("correct");
        else if (i === idx) b.classList.add("wrong");
        else b.classList.add("dim");
      });
      $("#expl").innerHTML = `
        <div class="explain ${ok ? "good" : "bad"}">
          ${ok ? `<b>Correct!</b>` : `<b>Not quite.</b> Answer: <b>${esc(q.answer)}</b>`}<br>
          <b>${esc(e.w)}</b> <span class="bn">(${esc(e.bn)})</span> — ${esc(e.en)}${e.syn.length ? ` · syn: ${esc(e.syn.slice(0, 3).join(", "))}` : ""}
        </div>`;
      nxt.disabled = false;
    }

    nxt.onclick = () => {
      if (!E.answered) return;
      if (E.i < E.qs.length - 1) { E.i++; paintQ(); window.scrollTo({ top: 0, behavior: "smooth" }); }
      else { clearInterval(timerInt); finishExam(); }
    };
    $("#quit").onclick = () => confirmBox({
      title: "Leave this exam?", text: "Progress in this attempt will be lost.",
      okLabel: "Leave", onOk: () => { clearInterval(timerInt); go("home"); },
    });
    paintQ();
  };

  function finishExam() {
    const E = App.exam;
    const total = E.qs.length;
    const pct = Math.round((E.score / total) * 100);
    const isRev = E.mode === "rev" || E.mode === "practice-rev";
    const isPractice = E.mode === "practice";
    const threshold = isRev ? 90 : 80;
    const passed = pct >= threshold;
    let unlockedNote = "";
    if (!isPractice) {
      const ok = Store.recordExam(isRev ? "rev" : "daily", E.day, E.score, total);
      if (ok) {
        const info = Store.dayInfo(E.day);
        if (isRev) unlockedNote = E.day % 5 === 0 ? `Word List ${info.list + 1} is now open!` : `Day ${E.day + 1} is unlocked.`;
        else if (!info.rev) unlockedNote = "";
        else unlockedNote = `${info.rev.kind} unlocked — ${info.rev.span}.`;
      }
    }
    App.result = { pct, score: E.score, total, passed, wrong: E.wrong, isRev, isPractice, threshold, unlockedNote, title: E.title, pool: E.pool, day: E.day };
    go("result");
    if (passed) {
      setTimeout(() => {
        confetti();
        sfx.win();
        modal({
          tint: "var(--grad-sunset)", glyph: "trophy",
          title: `Congratulations, ${Store.state.profile.name}! 🎉`,
          html: `<p>You passed the <b>${esc(E.title)}</b> with <b>${pct}%</b> (${E.score}/${total}).${unlockedNote ? `<br><b>${esc(unlockedNote)}</b>` : ""}</p>`,
          buttons: [{ label: "Wonderful!", icon: "spark", onClick: () => {} }],
        });
      }, 650);
    } else {
      setTimeout(() => sfx.bad(), 400);
    }
  }

  /* ---------- result ---------- */
  SCREENS.result = function () {
    const R = App.result;
    if (!R) return go("home");
    $("#view").innerHTML = `
      <div class="card pad-lg center" style="margin-top:16px;background:${R.passed ? "var(--grad-mint)" : "var(--grad-rose)"}">
        <h3 style="justify-content:center">${icon(R.passed ? "trophy" : "heart")} ${esc(R.title)}</h3>
        ${ring(R.pct, R.passed)}
        <p style="font-weight:800">${R.score} of ${R.total} correct · pass mark ${R.threshold}%</p>
        <p class="hint">${R.passed
          ? (R.isPractice ? "Great practice — those words are getting weaker already." : R.unlockedNote || "Day complete. Lovely work!")
          : `Almost! You need ${R.threshold}% to pass. Review the words below and try again — you've got this.`}</p>
      </div>
      ${R.wrong.length ? `
      <div class="card">
        <h3>${icon("alert")} Words to review (${R.wrong.length})</h3>
        <p class="hint">They're now in your Mistake Book.</p>
        <div class="mt8">${R.wrong.map((w) => `<div class="mrow"><span class="freq">${icon("alert")}</span><span class="mword"><span class="w">${esc(w.w)}</span><span class="m bn">${esc(w.bn)} · ${esc(w.en)}</span></span></div>`).join("")}</div>
      </div>` : `<div class="card grad-butter center"><h3 style="justify-content:center">${icon("star")} Flawless run — zero mistakes!</h3></div>`}
      <div class="btn-row mt16">
        ${R.passed ? `<button class="btn mint grow" id="cont">${icon("home")} Continue</button>`
                   : `<button class="btn grow" id="retry">${icon("refresh")} Try again</button>`}
        <button class="btn ghost grow" id="home2">${icon("home")} Home</button>
      </div>
      <div style="height:20px"></div>`;
    animateRing($("#view"));
    const rt = $("#retry");
    if (rt) rt.onclick = () => {
      if (R.isPractice) startExam("practice", 0, R.total, R.pool, R.title);
      else startExam(R.isRev ? "rev" : "exam", R.day, R.total);
    };
    const ct = $("#cont");
    if (ct) ct.onclick = () => {
      const d = Store.state.currentDay;
      const info = Store.dayInfo(Math.min(d, C.totalDays));
      if (!R.isPractice && !R.isRev && info.rev && !Store.dayRevPassed(Math.min(d, C.totalDays)) && Store.dayExamPassed(Math.min(d, C.totalDays))) {
        go("examSetup", { mode: "rev", day: Math.min(d, C.totalDays) });
      } else go("home");
    };
    $("#home2").onclick = () => go("home");
  };

  /* ---------- mistakes ---------- */
  SCREENS.mistakes = function () {
    let filter = 0;
    function paint() {
      const all = Store.mistakeList();
      const list = filter ? all.filter((m) => m.l === filter) : all;
      const totalMisses = all.reduce((a, m) => a + m.c, 0);
      $("#view").innerHTML = `
        <div class="card grad-rose pad-lg" style="margin-top:16px">
          <h3>${icon("alert")} Mistake Book</h3>
          <p class="hint">Every wrong answer lands here with its frequency. Answer a flagged word correctly twice (anywhere) and it heals.</p>
          <div class="flex mt12" style="flex-wrap:wrap">
            <span class="chip solid-rose">${all.length} words flagged</span>
            <span class="chip">${totalMisses} total misses</span>
          </div>
        </div>
        <div class="card">
          <div class="card-title-row">
            <h3>${icon("gear")} Filter & practice</h3>
          </div>
          <div class="flex mt12">
            <div class="grow" id="fdd"></div>
            <div style="width:132px" id="cdd"></div>
          </div>
          <button class="btn block mt12" id="prac" ${list.length ? "" : "disabled"}>${icon("pencil")} Practice these words</button>
        </div>
        <div id="mrows">
          ${list.length ? list.map((m) => `
            <div class="mrow">
              <span class="freq" title="missed ${m.c}×">${m.c}×</span>
              <span class="mword">
                <span class="w">${esc(m.w)} <span class="chip lav" style="padding:2px 8px;font-size:.64rem">L${m.l}·G${m.g}</span></span>
                <span class="m bn">${esc(m.bn)} · ${esc(m.en)}</span>
              </span>
              <span class="acts">
                <button class="iconbtn mini" data-drop="${m.id}" aria-label="remove">${icon("cross")}</button>
              </span>
            </div>`).join("")
          : `<div class="empty"><div class="art">🌤️</div>No mistakes here — clean sheet!<br><span class="mut" style="font-size:.84rem">Wrong answers will collect in this book.</span></div>`}
        </div>
        <div style="height:20px"></div>`;

      dropdown($("#fdd"), {
        ariaLabel: "filter by list",
        options: [{ value: 0, label: "All word lists" }, ...Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Word List ${i + 1}` }))],
        value: filter,
        onChange: (v) => { filter = v; paint(); },
      });
      dropdown($("#cdd"), {
        ariaLabel: "practice length",
        options: [{ value: 10, label: "10 Q" }, { value: 15, label: "15 Q" }, { value: 20, label: "20 Q" }],
        value: App.practiceCount || 10,
        onChange: (v) => { App.practiceCount = v; },
      });
      $("#prac").onclick = () => {
        const pool = list.map((m) => m.id);
        const n = Math.min(App.practiceCount || 10, pool.length);
        startExam("practice", 0, n, pool, "Mistake practice");
        App.result = App.result || {};
        App.practicePool = pool;
      };
      $$("[data-drop]").forEach((b) => b.onclick = () => { Store.dropMistake(b.dataset.drop); sfx.click(); toast("Removed from Mistake Book"); paint(); });
    }
    paint();
  };

  /* ---------- about ---------- */
  SCREENS.about = function () {
    $("#view").innerHTML = `
      <div class="card pad-lg center" style="margin-top:16px;background:var(--grad-sunset)">
        <div class="about-logo"><img src="assets/icons/icon-192.png" alt="Vocab Ledger logo"></div>
        <h3 style="justify-content:center;font-size:1.5rem">Vocab Ledger</h3>
        <p class="hint" style="color:rgba(74,59,46,.75)">version 1.0 · fully offline · made with love</p>
      </div>
      <div class="card">
        <h3>${icon("heart")} Credits</h3>
        <div class="credit-line mt8">
          <span class="ic" style="background:var(--grad-sky)">${icon("star")}</span>
          <span>Credit: <b>Engr. Tanjim Ahmed Khan</b><small>word lists & curriculum</small></span>
        </div>
        <div class="credit-line">
          <span class="ic" style="background:var(--grad-rose)">${icon("heart")}</span>
          <span>Prepared with Love by <b>Tusher Khan</b><small>design & development</small></span>
        </div>
        <div class="credit-line">
          <span class="ic" style="background:var(--grad-mint)">${icon("send")}</span>
          <span>Contact on Telegram<small><a href="https://t.me/tusherkhan42" style="color:var(--rose-deep);font-weight:800">@tusherkhan42</a></small></span>
        </div>
      </div>
      <div class="card">
        <h3>${icon("info")} Good to know</h3>
        <p class="hint">· 12 word lists · 10 groups each · 10 words per group (1200 words).<br>
        · Daily goal: 2 groups + a daily exam (80% to pass).<br>
        · Every 2 days: a 40-question revision exam — 90% to unlock the next days.<br>
        · Everything is stored on this device. No internet needed, ever.</p>
      </div>
      <div class="btn-row">
        <button class="btn ghost grow" id="edit2">${icon("user")} Edit profile</button>
        <button class="btn ghost grow" id="reset">${icon("refresh")} Reset progress</button>
      </div>
      <div style="height:20px"></div>`;
    $("#edit2").onclick = () => go("profile");
    $("#reset").onclick = () => confirmBox({
      title: "Reset everything?", text: "Name, avatar, calendar, exams and mistakes will be erased. This cannot be undone.",
      okLabel: "Erase all", onOk: () => { Store.resetAll(); location.reload(); },
    });
  };

  /* ---------- profile edit ---------- */
  SCREENS.profileEdit = function () { SCREENS.onboarding(true); };
  SCREENS.profile = SCREENS.profileEdit;

  /* ============================================================ boot */
  function boot() {
    if (!Store.state.profile) { App.screen = "onboarding"; renderShell(); }
    else { Store.recalcCurrentDay(); go("home"); }
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }
  if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", boot);
  else boot();
  window.App = App;
})();
