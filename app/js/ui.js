/* ============================================================
   Vocab Ledger — UI kit: icons, drawer, dropdowns, modals,
   toasts, confetti, sounds, speech
   ============================================================ */
(function () {
  /* ---------- inline icon set (rounded retro strokes) ---------- */
  const P = {
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    home: '<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.5V19h11v-8.5"/><path d="M10 19v-5h4v5"/>',
    book: '<path d="M12 7c-2-1.6-5-2.2-8-2v13c3-.2 6 .4 8 2 2-1.6 5-2.2 8-2V5c-3-.2-6 .4-8 2z"/><path d="M12 7v13"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
    pencil: '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1z"/><path d="M14.5 6.5l3 3"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4.5h-4.5"/>',
    alert: '<path d="M12 4 3 19h18L12 4z"/><path d="M12 10v4"/><circle cx="12" cy="16.6" r=".9" fill="currentColor" stroke="none"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".9" fill="currentColor" stroke="none"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.8 19.4c1.3-3.4 4-5 7.2-5s5.9 1.6 7.2 5"/>',
    cal: '<rect x="4" y="5.5" width="16" height="14.5" rx="3"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    flame: '<path d="M12 3.5c1 3-4 4.8-4 9a4.6 4.6 0 0 0 9.2.4c.2-2.6-1.2-4-2-5.4-.6 1-1.2 1.5-2 1.8.6-2.2.2-4.2-1.2-5.8z"/>',
    chart: '<path d="M5 19V11M10 19V5M15 19v-6M20 19V8"/>',
    lock: '<rect x="5.5" y="10.5" width="13" height="9" rx="2.6"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    check: '<path d="M5 12.8 9.6 17.5 19 7"/>',
    cross: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    star: '<path d="M12 4l2.2 4.9 5.3.6-4 3.6 1.1 5.2L12 15.6l-4.6 2.7 1.1-5.2-4-3.6 5.3-.6z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 5.5H5a3 3 0 0 0 3 4M16 5.5h3a3 3 0 0 1-3 4"/><path d="M12 13v3M9 20h6M10.5 16.5h3l.7 3.5h-4.4z"/>',
    caret: '<path d="M6 9.5l6 6 6-6"/>',
    back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-9.6A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.8c0 5-7.5 9.6-7.5 9.6z"/>',
    send: '<path d="M20 4 3.5 10.5l6.2 2.3L12 19.5 20 4z"/><path d="M9.7 12.8 20 4"/>',
    speaker: '<path d="M4 10v4h3l4 3.5v-11L7 10H4z"/><path d="M14.5 9a4 4 0 0 1 0 6M17 6.8a7 7 0 0 1 0 10.4"/>',
    bulb: '<path d="M9.5 17.5a6 6 0 1 1 5 0V19h-5v-1.5z"/><path d="M10 21h4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18"/>',
    grad: '<path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5z"/><path d="M7 11.5V16c1.4 1.6 3.1 2.4 5 2.4s3.6-.8 5-2.4v-4.5"/><path d="M21 9.5V14"/>',
  };
  function icon(name, cls) {
    return `<svg class="${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ""}</svg>`;
  }
  const tickSVG = (size, cls) => `<svg class="mk ${cls || ""}" width="${size || 17}" height="${size || 17}" viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="#BFE6CC"/><path d="M20 33.5 28.5 42 45 24" fill="none" stroke="#2F7A53" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const crossSVG = (size, cls) => `<svg class="mk ${cls || ""}" width="${size || 17}" height="${size || 17}" viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="#F5C9C4"/><path d="M23 23l18 18M41 23 23 41" fill="none" stroke="#B34A41" stroke-width="7" stroke-linecap="round"/></svg>`;
  const dotSVG = (size) => `<svg class="mk" width="${size || 17}" height="${size || 17}" viewBox="0 0 64 64"><circle cx="32" cy="32" r="12" fill="#E9B949"/></svg>`;

  /* ---------- tiny dom helper ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- sounds (WebAudio, no assets) ---------- */
  let AC = null;
  function ctx() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); return AC; }
  function tone(freq, dur, type, vol, when) {
    if (!Store.state.sound) return;
    try {
      const c = ctx(), o = c.createOscillator(), g = c.createGain();
      o.type = type || "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0, c.currentTime + (when || 0));
      g.gain.linearRampToValueAtTime(vol || 0.12, c.currentTime + (when || 0) + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (when || 0) + dur);
      o.connect(g); g.connect(c.destination);
      o.start(c.currentTime + (when || 0)); o.stop(c.currentTime + (when || 0) + dur + 0.05);
    } catch (e) {}
  }
  const sfx = {
    click: () => tone(520, 0.09, "triangle", 0.07),
    flip: () => tone(360, 0.12, "sine", 0.08),
    good: () => { tone(660, 0.12, "sine", 0.1); tone(880, 0.16, "sine", 0.1, 0.09); },
    bad: () => { tone(220, 0.18, "square", 0.05); tone(160, 0.22, "square", 0.05, 0.1); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, "triangle", 0.11, i * 0.12)),
    open: () => tone(440, 0.1, "sine", 0.06),
  };

  /* ---------- toast ---------- */
  let toastT = null;
  function toast(msg) {
    let t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add("on"));
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("on"), 2600);
  }

  /* ---------- modal ---------- */
  function modal({ tint = "var(--grad-sunset)", glyph = "trophy", title, html, buttons = [] }) {
    const root = document.createElement("div");
    root.id = "modal-root";
    root.innerHTML = `
      <div class="modal-scrim"></div>
      <div class="modal" role="dialog" aria-modal="true">
        <div class="big-emoji" style="background:${tint}">${icon(glyph)}</div>
        <h3>${esc(title)}</h3>
        ${html || ""}
        <div class="btn-row"></div>
      </div>`;
    const row = $(".btn-row", root);
    buttons.forEach((b) => {
      const el = document.createElement("button");
      el.className = "btn " + (b.style || "");
      el.innerHTML = (b.icon ? icon(b.icon) : "") + esc(b.label);
      el.onclick = () => { close(); b.onClick && b.onClick(); };
      row.appendChild(el);
    });
    document.body.appendChild(root);
    requestAnimationFrame(() => root.classList.add("on"));
    function close() {
      root.classList.remove("on");
      setTimeout(() => root.remove(), 320);
    }
    $(".modal-scrim", root).onclick = close;
    return close;
  }
  function confirmBox({ title, text, okLabel = "Yes, do it", cancelLabel = "Cancel", danger = true, onOk }) {
    modal({
      tint: danger ? "var(--grad-rose)" : "var(--grad-mint)",
      glyph: danger ? "alert" : "info",
      title, html: `<p>${esc(text)}</p>`,
      buttons: [
        { label: cancelLabel, style: "ghost" },
        { label: okLabel, style: danger ? "" : "mint", onClick: onOk },
      ],
    });
  }

  /* ---------- confetti ---------- */
  function confetti(ms = 2600) {
    let cv = $("#fx");
    if (!cv) { cv = document.createElement("canvas"); cv.id = "fx"; document.body.appendChild(cv); }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    const c = cv.getContext("2d"); c.scale(dpr, dpr);
    const colors = ["#FFC48A", "#FF9E7D", "#F6A6C0", "#9FDBC4", "#A9D3F0", "#C9B8F0", "#FFE08A"];
    const parts = Array.from({ length: 130 }, () => ({
      x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.4,
      w: 6 + Math.random() * 8, h: 8 + Math.random() * 10,
      vy: 2.2 + Math.random() * 3, vx: -1.4 + Math.random() * 2.8,
      r: Math.random() * Math.PI, vr: -0.12 + Math.random() * 0.24,
      col: colors[(Math.random() * colors.length) | 0],
    }));
    const t0 = performance.now();
    (function frame(t) {
      c.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vy += 0.03;
        c.save(); c.translate(p.x, p.y); c.rotate(p.r);
        c.fillStyle = p.col; c.globalAlpha = 0.95;
        c.beginPath();
        if (typeof c.roundRect === "function") c.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 3);
        else c.rect(-p.w / 2, -p.h / 2, p.w, p.h);
        c.fill();
        c.restore();
      });
      if (t - t0 < ms) requestAnimationFrame(frame);
      else c.clearRect(0, 0, innerWidth, innerHeight);
    })(t0);
  }

  /* ---------- dropdown ---------- */
  function dropdown(mountEl, { options, value, onChange, ariaLabel }) {
    mountEl.classList.add("dd");
    mountEl.innerHTML = `
      <button type="button" aria-label="${esc(ariaLabel || "options")}">
        <span class="dd-label"></span>${icon("caret", "caret")}
      </button>
      <div class="panel" role="listbox"></div>`;
    const btn = $("button", mountEl), label = $(".dd-label", mountEl), panel = $(".panel", mountEl);
    function render() {
      const cur = options.find((o) => o.value === value) || options[0];
      value = cur.value;
      label.textContent = cur.label;
      panel.innerHTML = "";
      options.forEach((o) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "opt" + (o.value === value ? " sel" : "");
        b.setAttribute("role", "option");
        b.innerHTML = `<span>${esc(o.label)}</span>${o.hint ? `<small class="mut" style="font-weight:700">&nbsp;· ${esc(o.hint)}</small>` : ""}${icon("check", "tick")}`;
        b.onclick = (e) => {
          e.stopPropagation();
          value = o.value; render(); close(); sfx.click();
          onChange && onChange(o.value);
        };
        panel.appendChild(b);
      });
    }
    function open() { mountEl.classList.add("open"); sfx.open(); }
    function close() { mountEl.classList.remove("open"); }
    btn.onclick = (e) => { e.stopPropagation(); mountEl.classList.contains("open") ? close() : open(); };
    document.addEventListener("click", () => close());
    render();
    return { get value() { return value; }, set value(v) { value = v; render(); }, rerender: render };
  }

  /* ---------- calendar ---------- */
  function calendar(mountEl, state) {
    const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let view = state ? state.clone() : new Date();
    view.setDate(1);
    function render() {
      const y = view.getFullYear(), m = view.getMonth();
      const first = new Date(y, m, 1);
      const startDow = first.getDay();
      const days = new Date(y, m + 1, 0).getDate();
      const monthName = view.toLocaleString("en-US", { month: "long", year: "numeric" });
      let cells = "";
      for (let i = 0; i < startDow; i++) cells += `<div class="cal-cell blank"></div>`;
      for (let d = 1; d <= days; d++) {
        const key = Store.dkey(new Date(y, m, d));
        const st = Store.calendarStatus(key);
        const mk = st === "done" ? tickSVG() : st === "missed" ? crossSVG() : st === "partial" ? dotSVG() : "";
        cells += `<div class="cal-cell ${st}" title="${key}"><span class="d">${d}</span>${mk}</div>`;
      }
      mountEl.innerHTML = `
        <div class="cal-head">
          <button class="iconbtn mini" data-nav="-1" aria-label="Previous month">${icon("back")}</button>
          <div class="mlabel">${monthName}</div>
          <button class="iconbtn mini" data-nav="1" aria-label="Next month">${icon("back", "flipx")}</button>
        </div>
        <div class="cal-grid">${DOW.map((d) => `<div class="cal-dow">${d}</div>`).join("")}${cells}</div>
        <div class="cal-legend">
          <span><i style="background:var(--mint-soft);border:1px solid rgba(62,138,98,.4)"></i>Goal done</span>
          <span><i style="background:var(--butter-soft);border:1px solid rgba(214,164,60,.45)"></i>Started</span>
          <span><i style="background:var(--rose-soft);border:1px solid rgba(198,91,82,.4)"></i>Missed</span>
        </div>`;
      const next = $('[data-nav="1"] svg', mountEl);
      next.style.transform = "rotate(180deg)";
      $$("[data-nav]", mountEl).forEach((b) => {
        b.onclick = () => {
          view.setMonth(view.getMonth() + Number(b.dataset.nav));
          sfx.click(); render();
        };
      });
    }
    render();
    return { render };
  }

  /* ---------- score ring ---------- */
  function ring(pct, pass) {
    const R = 74, C = 2 * Math.PI * R;
    return `
    <div class="ring-wrap"><div class="ring">
      <svg width="172" height="172" viewBox="0 0 172 172">
        <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${pass ? "#8FD8B9" : "#F5A0B8"}"/><stop offset="1" stop-color="${pass ? "#3E8A62" : "#E86A8A"}"/>
        </linearGradient></defs>
        <circle class="bgc" cx="86" cy="86" r="${R}"/>
        <circle class="fgc" cx="86" cy="86" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-target="${C * (1 - pct / 100)}"/>
      </svg>
      <div class="val"><div><div class="pct">${pct}%</div><div class="cap">${pass ? "passed" : "keep going"}</div></div></div>
    </div></div>`;
  }
  function animateRing(root) {
    const c = $(".fgc", root);
    if (!c) return;
    requestAnimationFrame(() => requestAnimationFrame(() => { c.style.strokeDashoffset = c.dataset.target; }));
  }

  window.UI = { icon, tickSVG, crossSVG, dotSVG, $, $$, esc, sfx, toast, modal, confirmBox, confetti, dropdown, calendar, ring, animateRing };
})();
