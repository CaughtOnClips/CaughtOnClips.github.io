/* Hardgrain test build: plain JS, data in localStorage only. */
(function () {
"use strict";
const C = window.HG_CONFIG, PLANS = window.HG_PLANS, EQL = window.HG_EQUIP_LABEL;
const NAME = C.APP_NAME;
document.title = NAME;
const KEY = "hg.data.v1";
const $ = (s, r = document) => r.querySelector(s);
const app = $("#app"), tabs = $("#tabs"), modalRoot = $("#modal-root");
const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------- Storage ----------
const GM = window.HG_GAME;
const fresh = () => ({ profile: { goal: null, level: null, equip: null, units: "lb", agreedAt: null }, history: [], routines: [], activePlanId: null, active: null, lastWeights: {}, game: GM.newGame() });
let S = load();
function load() { try { const d = JSON.parse(localStorage.getItem(KEY)); if (!d) return fresh(); const f = fresh(); return Object.assign(f, d, { profile: Object.assign(f.profile, d.profile), game: Object.assign(f.game, d.game, { stats: Object.assign(f.game.stats, d.game && d.game.stats) }) }); } catch (e) { return fresh(); } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("Couldn't save. Storage may be full."); } }
const onboarded = () => !!S.profile.agreedAt;

// ---------- Helpers ----------
const GOALS = [["strength", "Build strength", "💪", "Get stronger on the basics"], ["fat", "Lose fat", "🔥", "Burn more and move more"], ["fit", "Get fit", "⚡", "Feel better, move better"], ["muscle", "Build muscle", "🏋️", "Add size and shape"]];
const LEVELS = [["Beginner", "New or returning to training", "🌱"], ["Intermediate", "Training regularly for 6+ months", "📈"], ["Advanced", "Years of consistent training", "🏆"]];
const EQUIPS = [["none", "No equipment", "🏠", "Bodyweight at home, park or hotel"], ["dumbbells", "Dumbbells", "🫳", "A pair of dumbbells (and bodyweight)"], ["gym", "Full gym", "🏟️", "Barbells, machines, cables, everything"]];
const equipRank = { none: 0, dumbbells: 1, gym: 2 };
const has = id => S.game.skills.includes(id);
const allPlans = () => PLANS.concat(GM.SKILL_PLANS.filter(p => has(p.skill)));
const availablePlans = (eq = S.profile.equip || "gym") => allPlans().filter(p => equipRank[p.equip] <= equipRank[eq]);
const planById = id => PLANS.concat(GM.SKILL_PLANS).find(p => p.id === id);
const fmtTime = s => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60), x = s % 60; return m + ":" + String(x).padStart(2, "0"); };
const exTarget = e => (e.t ? e.t + "s" : e.r + " reps") + (e.side ? " each side" : "");
const dayKey = d => { d = new Date(d); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const fmtDate = d => new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2400); }
function legalLinks() { return `<a href="${C.TERMS_URL}" target="_blank" rel="noopener">Terms of Use</a> and <a href="${C.PRIVACY_URL}" target="_blank" rel="noopener">Privacy Policy</a>`; }

// Streaks & stats
function stats() {
  const days = new Set(S.history.map(x => dayKey(x.date)).concat(Object.keys(S.game.activeDays || {})));
  const today = new Date(); let streak = 0; const d = new Date(today);
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
  const sorted = [...days].sort(); let best = 0, run = 0, prev = null;
  for (const k of sorted) { const dt = new Date(k + "T12:00:00"); if (prev && (dt - prev) / 864e5 < 1.5) run++; else run = 1; best = Math.max(best, run); prev = dt; }
  const wk = new Date(today); wk.setHours(0, 0, 0, 0); wk.setDate(wk.getDate() - ((wk.getDay() + 6) % 7)); // Monday
  const thisWeek = S.history.filter(x => new Date(x.date) >= wk).length;
  const minutes = Math.round(S.history.reduce((a, x) => a + (x.durationSec || 0), 0) / 60);
  return { total: S.history.length, minutes, streak, best, thisWeek, trainedToday: days.has(dayKey(today)) };
}
function suggestedPlan() {
  let p = planById(S.activePlanId);
  if (!p || !availablePlans().includes(p)) {
    const avail = availablePlans(), lvl = S.profile.level;
    p = avail.find(x => x.equip === S.profile.equip && x.goal.includes(S.profile.goal) && (x.level === lvl || x.level === "All levels"))
      || avail.find(x => x.equip === S.profile.equip && x.goal.includes(S.profile.goal))
      || avail.find(x => x.equip === S.profile.equip) || avail[0];
  }
  return p;
}
function nextWorkout(p) {
  const last = S.history.find(x => x.planId === p.id);
  if (!last) return p.workouts[0];
  const i = p.workouts.findIndex(w => w.id === last.workoutId);
  return p.workouts[(i + 1) % p.workouts.length];
}

// ---------- Sound / wake lock ----------
let actx = null, wakeLock = null;
function unlockAudio() { try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); } catch (e) {} }
function beep(n = 1) { try { unlockAudio(); for (let i = 0; i < n; i++) { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(actx.destination); const t = actx.currentTime + i * 0.25; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.start(t); o.stop(t + 0.2); } } catch (e) {} if (navigator.vibrate) navigator.vibrate(200); }
async function keepAwake(on) { try { if (on && "wakeLock" in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => wakeLock = null); } else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; } } catch (e) {} }
document.addEventListener("pointerdown", unlockAudio, { once: true });

// ---------- The Forge (game engine) ----------
const todayKey = () => dayKey(new Date());
const addDays = (k, n) => { const d = new Date(k + "T12:00:00"); d.setDate(d.getDate() + n); return dayKey(d); };
const curRank = () => GM.RANKS[S.game.rankIdx];
const nextRank = () => GM.RANKS[S.game.rankIdx + 1] || null;
const rankTrialOpen = () => { const n = nextRank(); return !!n && S.game.level >= n.level; };
const xpMult = () => GM.SKILLS.some(sk => sk.title && has(sk.id) && S.game.title === sk.title) ? 1.05 : 1;
function queue(n) {
  const Q = S.game.queue;
  if (n.kind === "levelup") { const prev = Q.find((x, i) => x.kind === "levelup" && !(i === 0 && popupOpen)); if (prev) { prev.to = n.to; prev.points += n.points; prev.all += n.all; prev.trial = n.trial || prev.trial; return; } }
  Q.push(n);
}
function vitShield() { const G = S.game, m = Math.floor(G.stats.VIT / 10); if (m > G.shieldVit) { const add = m - G.shieldVit; G.shieldVit = m; const before = G.shields; G.shields = Math.min(GM.MAX_SHIELDS, G.shields + add); if (G.shields > before) toast("VIT milestone: +1 streak shield"); } }
function markActive() {
  const G = S.game, t = todayKey(); if (G.activeDays[t]) return;
  G.activeDays[t] = 1; G.streak++; G.lastActive = t;
  if (G.streak % 7 === 0 && G.shields < GM.MAX_SHIELDS) { G.shields++; toast("7-day streak: +1 streak shield"); }
}
function ensureDaily() {
  const G = S.game, t = todayKey();
  if (G.daily && G.daily.date !== t) {
    let saved = 0, reset = false;
    for (let d = G.daily.date; d < t; d = addDays(d, 1)) if (!G.activeDays[d]) { if (G.shields > 0) { G.shields--; saved++; } else { G.streak = 0; reset = true; } }
    if (saved || reset) { G.missNotice = { saved, reset, date: t, ack: false }; G.comebackDue = true; }
    G.daily = null;
  }
  if (!G.daily) { G.daily = GM.dailyQuest(G.level, S.profile, t, !!G.comebackDue); G.comebackDue = false; save(); }
}
function addXp(n) {
  const G = S.game; n = Math.round(n); if (n <= 0) return 0;
  const startL = G.level; G.xp += n; G.totalXp += n;
  while (G.xp >= GM.xpToNext(G.level)) { G.xp -= GM.xpToNext(G.level); G.level++; G.points += GM.LEVEL_POINTS; for (const k in G.stats) G.stats[k] += GM.LEVEL_ALL_STATS; }
  if (G.level > startL) { const lv = G.level - startL; vitShield(); queue({ kind: "levelup", from: startL, to: G.level, points: lv * GM.LEVEL_POINTS, all: lv * GM.LEVEL_ALL_STATS, trial: rankTrialOpen() ? nextRank() : null }); }
  return n;
}
function train(stat, sets) {
  const G = S.game; G.trainSets[stat] = (G.trainSets[stat] || 0) + sets; let gained = 0;
  while (G.trainSets[stat] >= GM.SETS_PER_STAT) { G.trainSets[stat] -= GM.SETS_PER_STAT; G.stats[stat]++; gained++; }
  if (stat === "VIT") vitShield();
  return gained;
}
function counters() { const G = S.game; return { workouts: S.history.length, dailies: G.dailies, streak: G.streak, sets: G.totalSets, level: G.level, rank: G.rankIdx, cls: !!G.cls, early: G.early }; }
function reqList(req) {
  const G = S.game, c = counters(), out = [];
  if (req.level) out.push({ l: `Lv ${req.level}`, met: G.level >= req.level });
  if (req.stat) for (const [k, v] of Object.entries(req.stat)) out.push({ l: `${k} ${v} (now ${G.stats[k]})`, met: G.stats[k] >= v });
  if (req.equip) out.push({ l: `${EQL[req.equip]} in your equipment`, met: equipRank[S.profile.equip] >= equipRank[req.equip] });
  if (req.early) out.push({ l: `Clear ${req.early} quests before 8 AM (${c.early}/${req.early})`, met: c.early >= req.early });
  if (req.streak) out.push({ l: `${req.streak}-day streak (now ${c.streak})`, met: c.streak >= req.streak });
  return out;
}
const skillReady = sk => !has(sk.id) && reqList(sk.req).every(x => x.met);
function checkProgress() {
  const G = S.game;
  for (let loop = 0; loop < 5; loop++) {
    let changed = false; const c = counters();
    for (const a of GM.ACH) if (!G.achievements[a.id] && a.test(c)) { G.achievements[a.id] = new Date().toISOString(); queue({ kind: "ach", name: a.name, desc: a.desc, xp: a.xp }); addXp(a.xp); changed = true; }
    if (!changed) break;
  }
  const fresh = GM.SKILLS.filter(sk => skillReady(sk) && !G.notified.includes(sk.id));
  if (fresh.length) { fresh.forEach(sk => G.notified.push(sk.id)); queue({ kind: "skill-ready", names: fresh.map(sk => sk.name) }); }
}
function addDaily(id, amt, silent) {
  const G = S.game; ensureDaily(); const it = G.daily.items.find(x => x.id === id); if (!it) return;
  it.p = Math.max(0, Math.round(it.p + amt));
  if (!G.daily.done && G.daily.items.every(x => x.p >= x.target)) completeDaily();
  if (!silent) save();
}
function completeDaily() {
  const G = S.game, D = G.daily; D.done = true; G.dailies++;
  const prev = G.streak; markActive();
  if (new Date().getHours() < 8) G.early++;
  const xp = Math.round(GM.dailyClearXp(G.level) * (D.comeback ? 1.5 : 1));
  G.points += GM.DAILY_POINTS; const dis = train("DIS", 5);
  queue({ kind: "quest", xp, points: GM.DAILY_POINTS, streakFrom: prev, streakTo: G.streak, dis, comeback: D.comeback });
  addXp(xp); checkProgress(); save();
}
function logRestDay() {
  const G = S.game, t = todayKey();
  if (G.activeDays[t]) return toast("Today already counts. Rest well.");
  const recent = Object.keys(G.restDays).filter(k => k > addDays(t, -7)).length;
  if (recent >= 2) return toast("Two rest days this week already logged.");
  G.restDays[t] = 1; markActive(); G.stats.VIT += 1; vitShield();
  queue({ kind: "rest" }); checkProgress(); save(); render();
}
function workoutXp(entry) {
  const bw = +S.profile.bodyweight || 0; let reps = 0;
  for (const e of entry.ex) { const def = { n: e.n, t: e.timed ? 1 : 0, w: e.sets.some(s => s.weight) }; for (const st of e.sets) reps += GM.setXp(def, st, bw); }
  return reps;
}
const SESSION_BONUS = 20, PLAN_BONUS = 20;
function awardWorkout(entry, ref) {
  const G = S.game, t = todayKey();
  if (G.xpDay.date !== t) G.xpDay = { date: t, amt: 0 };
  const raw = Math.round(workoutXp(entry) * xpMult()), cap = GM.dailyXpCap(G.stats.DIS), room = Math.max(0, cap - G.xpDay.amt);
  const setPart = Math.min(raw, room); G.xpDay.amt += setPart;
  const bonus = entry.setsDone ? SESSION_BONUS + (ref.kind === "plan" ? PLAN_BONUS : 0) : 0;
  G.totalSets += entry.setsDone;
  const boosts = {};
  for (const e of entry.ex) { if (!e.sets.length) continue; const st = GM.statFor(e.n); const g = train(st, e.sets.length); if (g) boosts[st] = (boosts[st] || 0) + g;
    for (const it of G.daily.items) if (new RegExp(it.match, "i").test(e.n) && it.timed === !!e.timed) addDaily(it.id, e.timed ? e.sets.reduce((a, x) => a + (x.sec || 0), 0) : e.sets.reduce((a, x) => a + (x.reps || 0), 0), true); }
  if (entry.setsDone) markActive();
  const passed = entry.setsTotal && entry.setsDone / entry.setsTotal >= 0.8;
  queue({ kind: "xp", xp: setPart + bonus, raw, capped: raw > setPart, sets: entry.setsDone, boosts, title: entry.title });
  addXp(setPart + bonus);
  if (ref.kind === "rank" && passed && rankTrialOpen()) { G.rankIdx++; const r = curRank(); queue({ kind: "rankup", r }); }
  else if (ref.kind === "rank" && !passed) toast("Trial needs 80% of sets done. Try again anytime.");
  if (ref.kind === "class" && passed && G.level >= GM.CLASS_LEVEL && !G.cls) { G.classTrialDone = true; queue({ kind: "class-ready" }); }
  checkProgress(); save();
  return setPart + bonus;
}
const workoutXpPreview = (A) => { const e = { ex: A.ex.map((x, k) => ({ n: x.n, timed: !!x.t, sets: A.log[k].filter(s => s.done) })) }; const sets = e.ex.reduce((a, x) => a + x.sets.length, 0); return Math.round(workoutXp(e) * xpMult()) + (sets ? SESSION_BONUS + (A.ref.kind === "plan" ? PLAN_BONUS : 0) : 0); };
const planXpEstimate = w => w.ex.reduce((a, e) => a + e.s * GM.setXp({ n: e.n, t: e.t, w: false }, { reps: e.r, sec: e.t }, 0), 0) + SESSION_BONUS + PLAN_BONUS;

// ---------- Notices (full-screen) ----------
let popupOpen = false;
function fanfare(kind) {
  try { unlockAudio(); const notes = kind === "levelup" || kind === "rankup" ? [523, 659, 784, 1047] : kind === "quest" ? [659, 880, 1175] : [784, 1047];
    notes.forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = "triangle"; o.frequency.value = f; o.connect(g); g.connect(actx.destination); const t = actx.currentTime + i * 0.12; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); o.start(t); o.stop(t + 0.4); }); } catch (e) {}
  if (navigator.vibrate) navigator.vibrate(kind === "levelup" ? [60, 40, 60, 40, 160] : [80]);
}
const chip = (txt, blue) => `<span class="chip ${blue ? "blue" : ""}">${txt}</span>`;
const boostChips = b => Object.entries(b || {}).map(([k, v]) => chip(`${k} +${v}`, true)).join("");
function showQueue() {
  const G = S.game; if (popupOpen || !G.queue.length || location.hash.startsWith("#/train")) return;
  const n = G.queue[0]; let title = "Notice", label = "", big = "", from = "", line = "", chips = "", bar = false, primary = ["Continue", null], later = false;
  if (n.kind === "levelup") { label = "Level up"; big = n.to; from = `LV <b>${n.from}</b> → LV <b>${n.to}</b>`; line = `Your body adapted. ${n.points} points are waiting.`; chips = chip(`+${n.points} attribute pts`) + chip(`+${n.all} all stats`, true) + (n.trial ? chip(`Rank Trial ${n.trial.k} open`, true) : ""); bar = true; primary = ["Allocate points", "#/home"]; later = true; }
  else if (n.kind === "quest") { title = "Daily quest"; label = "Quest clear"; line = "The work counted."; chips = chip(`+${n.xp} XP`, true) + chip(`+${n.points} attribute pts`) + chip(`Streak ${n.streakFrom} → ${n.streakTo}`, true) + (n.dis ? chip(`DIS +${n.dis}`, true) : "") + (n.comeback ? chip("Comeback bonus ×1.5", true) : ""); }
  else if (n.kind === "xp") { title = "Session complete"; label = "XP gained"; big = `+${n.xp}`; line = `${h(n.title)} · ${n.sets} sets logged.${n.capped ? " Daily XP cap reached; extra reps still count for stats." : ""}`; chips = boostChips(n.boosts); }
  else if (n.kind === "ach") { title = "Achievement"; label = h(n.name); line = h(n.desc); chips = n.xp ? chip(`+${n.xp} XP`, true) : ""; }
  else if (n.kind === "skill-ready") { const nm = n.names || [n.name]; title = "Skills"; label = nm.length > 1 ? `${nm.length} skills ready` : "Skill ready"; line = "New programs can be unlocked in Skills."; chips = nm.map(x => chip(h(x), true)).join(""); primary = ["Open skills", "#/skills"]; later = true; }
  else if (n.kind === "skill") { title = "Skills"; label = "Skill unlocked"; line = `${h(n.name)}. ${h(n.desc)}`; }
  else if (n.kind === "rankup") { title = "Rank"; label = `Rank ${n.r.k}: ${n.r.name}`; big = `<span class="rank-badge" data-rank="${n.r.k}" style="width:72px;height:80px;font-size:34px">${n.r.k}</span>`; line = "Harder quests are now open to you."; }
  else if (n.kind === "class-ready") { title = "Class change"; label = "Trial clear"; line = "You've proven the work. Choose your class."; primary = ["Choose class", "#/quests"]; }
  else if (n.kind === "class") { title = "Class change"; label = h(n.name); line = "New class set. The Ascendant path is yours."; chips = boostChips(n.boost); }
  else if (n.kind === "rest") { title = "Rest day"; label = "Rest logged"; line = "Recovery is training."; chips = chip("VIT +1", true) + chip("Streak kept", true); }
  else if (n.kind === "welcome") { title = "Notice"; label = "Lifter registered"; big = "1"; from = `RANK <b>E</b> · SPARK`; line = "Your first Daily Quest is ready. Clear it before midnight."; chips = chip(`+${GM.DAILY_POINTS} attribute pts on clear`) + chip(`${S.game.shields} streak shield`, true); primary = ["Open status", "#/home"]; }
  popupOpen = true;
  const el = document.createElement("div"); el.className = "levelup-overlay"; el.setAttribute("role", "alertdialog"); el.setAttribute("aria-label", (label || title).replace(/<[^>]+>/g, ""));
  const need = GM.xpToNext(G.level);
  el.innerHTML = `<div class="rays" aria-hidden="true"></div><div class="levelup-popup system-window">
    <div class="system-window__title">${title}</div>${label ? `<div class="levelup-popup__label">${label}</div>` : ""}${big !== "" ? `<div class="levelup-popup__level">${big}</div>` : ""}
    ${from ? `<div class="lu-from">${from}</div>` : ""}${line ? `<p class="lu-line">${line}</p>` : ""}${chips ? `<div class="reward">${chips}</div>` : ""}
    ${bar ? `<div class="xp-bar" style="margin:6px 0 18px"><div class="xp-bar__fill" style="--xp:${(G.xp / need * 100).toFixed(1)}%"></div></div>` : ""}
    <button class="btn" id="lu-ok">${primary[0]}</button>${later ? `<button class="btn link" id="lu-close">Later</button>` : ""}</div>`;
  document.body.appendChild(el); fanfare(n.kind);
  const done = to => { G.queue.shift(); save(); el.remove(); popupOpen = false; if (to && location.hash !== to) go(to.slice(1)); else if (G.queue.length) showQueue(); else if (to) render(); };
  $("#lu-ok", el).onclick = () => done(primary[1]); if ($("#lu-close", el)) $("#lu-close", el).onclick = () => done(null);
  setTimeout(() => $("#lu-ok", el) && $("#lu-ok", el).focus(), 50);
}

// ---------- Modal ----------
function sheet(html, onMount) {
  modalRoot.innerHTML = `<div class="sheet-bg" data-close><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  const bg = modalRoot.firstChild; bg.addEventListener("click", e => { if (e.target === bg || e.target.closest("[data-close-btn]")) closeSheet(); });
  onMount && onMount(bg.firstChild);
}
const closeSheet = () => { modalRoot.innerHTML = ""; };
function confirmSheet(title, body, okLabel, onOk, danger) {
  sheet(`<h2>${h(title)}</h2><p class="muted">${body}</p><div class="stack"><button class="btn ${danger ? "danger" : ""}" id="ok">${h(okLabel)}</button><button class="btn ghost" data-close-btn>Cancel</button></div>`,
    el => $("#ok", el).onclick = () => { closeSheet(); onOk(); });
}

// ---------- Router ----------
const go = r => { location.hash = r; };
window.addEventListener("hashchange", render);
const TABS = [["home", "Status", "◈"], ["quests", "Quests", "❖"], ["plans", "Plans", "▤"], ["skills", "Skills", "✦"], ["history", "Log", "◷"]];
function setTabs(active) {
  if (!active) { tabs.hidden = true; document.body.classList.add("no-tabs"); return; }
  document.body.classList.remove("no-tabs"); tabs.hidden = false;
  tabs.innerHTML = TABS.map(([k, l, i]) => `<a href="#/${k}" class="${k === active ? "on" : ""}" ${k === active ? 'aria-current="page"' : ""}><span class="ti" aria-hidden="true">${i}</span>${l}</a>`).join("");
}
let ticker = null;
function render() {
  clearInterval(ticker); ticker = null; closeSheet();
  const parts = (location.hash.replace(/^#\/?/, "") || "").split("/");
  let r = parts[0] || (onboarded() ? "home" : "welcome");
  if (!onboarded() && !["welcome", "onboard", "disclaimer"].includes(r)) r = "welcome";
  if (onboarded()) ensureDaily();
  const V = VIEWS[r] || VIEWS.home;
  window.scrollTo(0, 0);
  V(...parts.slice(1));
  keepAwake(r === "train");
  if (r !== "train") showQueue();
}

// ---------- Views ----------
const VIEWS = {};
function hudTop(extra = "") {
  const G = S.game, need = GM.xpToNext(G.level);
  return `<div class="hudtop"><a class="lv" href="#/home"><img src="icons/mark.svg" alt="" height="26" width="22"><div><b>LV ${G.level}</b><small>${G.xp.toLocaleString()} / ${need.toLocaleString()} XP</small></div></a>
    <div class="mini-xp xp-bar" aria-hidden="true"><div class="xp-bar__fill" style="--xp:${(G.xp / need * 100).toFixed(1)}%"></div></div>${extra}</div>`;
}
VIEWS.welcome = () => {
  setTabs(null);
  app.innerHTML = `<div class="welcome">
    <img class="logo" src="icons/icon-192.png" alt="${h(NAME)}">
    <div class="system-window"><div class="system-window__title">Notice</div>
      <p class="center hud" style="font-size:22px">Enter the Forge</p>
      <p class="center">Your training is the game. Every rep earns XP, every level gives you points to spend, and every skill unlocks a new plan.</p>
      <p class="center muted small">Free test version. Your data stays on this phone. No account needed.</p>
      <button class="btn" id="start">Begin</button></div>
    <p class="small muted center">Tip: in Safari tap Share › Add to Home Screen to use ${h(NAME)} like an app.</p></div>`;
  $("#start").onclick = () => { unlockAudio(); go("/onboard/0"); };
};
VIEWS.onboard = (step = "0") => {
  setTabs(null); step = +step;
  const steps = [
    { key: "goal", title: "Choose your goal", sub: "What do you want the work to build?", opts: GOALS.map(([v, l, i, d]) => [v, l, i, d]) },
    { key: "level", title: "Set your level", sub: "Your Daily Quest scales from this.", opts: LEVELS.map(([v, d, i]) => [v, v, i, d]) },
    { key: "equip", title: "Check your gear", sub: "Plans are filtered by what you have.", opts: EQUIPS.map(([v, l, i, d]) => [v, l, i, d]) }
  ];
  const prog = `<div class="progress">${[0, 1, 2, 3, 4].map(i => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>`;
  const top = `<div class="top"><button class="iconbtn" id="back" aria-label="Back">‹</button><span class="spacer"></span><span class="label">Setup ${step + 1} / 5</span></div>`;
  if (step === 3) {
    app.innerHTML = `${top}${prog}<div class="system-window"><div class="system-window__title">Lifter</div>
      <label class="field"><span>Lifter name (optional)</span><input id="hname" maxlength="20" autocomplete="nickname" placeholder="Lifter" value="${h(S.game.name)}"></label>
      <p class="muted small" style="margin:0">Shown in your Status window. Stored only on this phone.</p></div><div style="height:16px"></div><button class="btn" id="next">Continue</button>`;
    $("#back").onclick = () => go("/onboard/2");
    $("#next").onclick = () => { S.game.name = $("#hname").value.trim().slice(0, 20); save(); go("/disclaimer"); };
    return;
  }
  const st = steps[step]; if (!st) return go("/disclaimer");
  app.innerHTML = `${top}${prog}<h1>${st.title}</h1><p class="muted">${st.sub} You can change this later in Settings.</p>
    <div class="opts" role="radiogroup">${st.opts.map(([v, l, i, d]) => `<button class="opt" role="radio" aria-checked="${S.profile[st.key] === v}" data-v="${v}"><span class="oi" aria-hidden="true">${i}</span><span><b>${h(l)}</b><span>${h(d)}</span></span></button>`).join("")}</div>
    <button class="btn" id="next" ${S.profile[st.key] ? "" : "disabled"}>Continue</button>`;
  $("#back").onclick = () => step > 0 ? go("/onboard/" + (step - 1)) : go("/welcome");
  app.querySelectorAll(".opt").forEach(b => b.onclick = () => { S.profile[st.key] = b.dataset.v; save(); app.querySelectorAll(".opt").forEach(x => x.setAttribute("aria-checked", x === b)); $("#next").disabled = false; });
  $("#next").onclick = () => go("/onboard/" + (step + 1));
};
function disclaimerHTML() {
  return `<div class="disc"><p><strong>${h(NAME)} gives general fitness guidance, not medical advice.</strong></p><ul>
    <li>Check with your doctor before starting a new exercise program, especially if you're pregnant, injured, or have a heart, joint, or other health condition.</li>
    <li>Work out in a clear, safe space, and use any equipment the way it's meant to be used.</li>
    <li>Stop right away if you feel pain, dizziness, or shortness of breath.</li>
    <li>You exercise at your own risk.</li></ul></div>`;
}
VIEWS.disclaimer = () => {
  setTabs(null);
  if (!S.profile.goal || !S.profile.level || !S.profile.equip) return go("/onboard/0");
  app.innerHTML = `<div class="top"><button class="iconbtn" id="back" aria-label="Back">‹</button><span class="spacer"></span><span class="label">Setup 5 / 5</span></div>
    <div class="progress"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i></div>
    <div class="system-window"><div class="system-window__title">Before you start</div>${disclaimerHTML()}
    <p class="small muted" style="margin:0">Quests and streaks are a game. Your safety comes first: scale down, rest, or skip whenever you need to.</p></div>
    <div style="height:14px"></div>
    <label class="check"><input type="checkbox" id="agree"><span>I've read this and agree to the ${legalLinks()}.</span></label>
    <div style="height:18px"></div><button class="btn" id="go" disabled>Let's go</button>`;
  $("#back").onclick = () => go("/onboard/3");
  $("#agree").onchange = e => { $("#go").disabled = !e.target.checked; };
  $("#go").onclick = () => {
    if (!$("#agree").checked) return; S.profile.agreedAt = new Date().toISOString(); S.activePlanId = suggestedPlan().id;
    S.game.daily = null; ensureDaily(); queue({ kind: "welcome" }); save(); go("/home");
  };
};

let pend = {}, sessionSpent = {};
function statusWindow() {
  const G = S.game, r = curRank(), need = GM.xpToNext(G.level), nr = nextRank();
  const used = Object.values(pend).reduce((a, b) => a + b, 0), left = G.points - used, spent = Object.values(sessionSpent).reduce((a, b) => a + b, 0);
  return `<div class="system-window" id="status"><div class="system-window__title">Status</div>
    <div class="head"><span class="rank-badge" data-rank="${r.k}" aria-label="Rank ${r.k} ${r.name}">${r.k}</span><div><b>${h(G.name || "Lifter")} · LV ${G.level}</b><small>Rank ${r.k} · ${r.name} · streak ${G.streak} day${G.streak === 1 ? "" : "s"}</small><small>${h(G.cls ? GM.CLASSES.find(c => c.id === G.cls).name : "No class")} · ${h(G.title)} · 🛡 ${G.shields}</small></div></div>
    <div class="xp-bar" role="progressbar" aria-label="XP" aria-valuemin="0" aria-valuemax="${need}" aria-valuenow="${G.xp}"><div class="xp-bar__fill" style="--xp:${(G.xp / need * 100).toFixed(1)}%"></div></div>
    <div class="xpline"><span>${G.xp.toLocaleString()} / ${need.toLocaleString()} XP</span><span>${nr ? (G.level >= nr.level ? `<a href="#/quests">Rank Trial ${nr.k} open ›</a>` : `Rank ${nr.k} at Lv ${nr.level}`) : "Max rank"}</span></div>
    <div class="pts"><span>Attribute points</span><b id="pts">${left}</b></div>
    ${GM.STATS.map(([k, full, src, col]) => { const v = G.stats[k], p = pend[k] || 0; return `<div class="stat-row" style="--sc:var(${col})"><span class="stat-row__label">${k}<small>${src}</small></span><span class="stat-row__value">${v}${p ? ` <em>+${p}</em>` : ""}</span><button class="stat-row__plus" data-stat="${k}" aria-label="Add a point to ${full}" ${left > 0 ? "" : "disabled"}>+</button></div>`; }).join("")}
    ${used ? `<div class="row" style="margin-top:14px"><button class="btn sm ghost" style="flex:1" id="preset">Reset</button><button class="btn sm" style="flex:2" id="pconfirm">Confirm ${used} pt${used === 1 ? "" : "s"}</button></div>`
      : spent ? `<button class="btn sm ghost" style="width:100%;margin-top:14px" id="respec">Re-spec this session (${spent} pt${spent === 1 ? "" : "s"})</button>`
      : `<p class="small muted" style="margin:12px 0 0">Where does the work go? Each level gives +${GM.LEVEL_POINTS} points and +${GM.LEVEL_ALL_STATS} to every stat. A quest clear gives +${GM.DAILY_POINTS}. Training also raises stats: every ${GM.SETS_PER_STAT} sets of a move type adds +1.</p>`}</div>`;
}
function bindStats(rerender) {
  app.querySelectorAll("[data-stat]").forEach(b => b.onclick = () => { const used = Object.values(pend).reduce((a, x) => a + x, 0); if (used < S.game.points) { pend[b.dataset.stat] = (pend[b.dataset.stat] || 0) + 1; rerender(); } });
  if ($("#preset")) $("#preset").onclick = () => { pend = {}; rerender(); };
  if ($("#pconfirm")) $("#pconfirm").onclick = () => { const G = S.game; let used = 0; for (const [k, v] of Object.entries(pend)) { G.stats[k] += v; used += v; sessionSpent[k] = (sessionSpent[k] || 0) + v; } G.points -= used; pend = {}; vitShield(); checkProgress(); save(); toast(`${used} point${used === 1 ? "" : "s"} assigned`); rerender(); showQueue(); };
  if ($("#respec")) $("#respec").onclick = () => { const G = S.game; let back = 0; for (const [k, v] of Object.entries(sessionSpent)) { G.stats[k] -= v; back += v; } G.points += back; sessionSpent = {}; save(); toast(`${back} point${back === 1 ? "" : "s"} returned`); rerender(); };
}
function missHTML() {
  const M = S.game.missNotice; if (!M || M.ack) return "";
  const msg = M.reset ? "Streak reset to 0. Nothing you built is lost. Start again today." : "Missed yesterday. Your streak shield held. Comeback Quest is ready.";
  return `<div class="system-window miss"><div class="system-window__title">Notice</div><p style="margin:0 0 6px">${msg}</p>
    <p class="small muted">Today's quest is a lighter Comeback Quest (60% volume) with a ×1.5 clear bonus. No XP or stats are ever taken away. Shields left: ${S.game.shields}.</p>
    <div class="row"><a class="btn sm" style="flex:2" href="#/quests">Open quest</a><button class="btn sm ghost" style="flex:1" id="miss-x">OK</button></div></div>`;
}
function bindMiss() { if ($("#miss-x")) $("#miss-x").onclick = () => { S.game.missNotice.ack = true; save(); render(); }; }
function resetIn() { const n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0); const s = Math.floor((m - n) / 1000); return [s / 3600, s % 3600 / 60, s % 60].map(x => String(Math.floor(x)).padStart(2, "0")).join(":"); }
function dailyMini() {
  const D = S.game.daily, done = D.items.filter(x => x.p >= x.target).length;
  return `<a class="system-window" href="#/quests"><div class="system-window__title">Daily quest</div>
    <div class="sub">${h(D.name)} · no equipment · Lv ${S.game.level}</div>
    ${D.items.map(it => `<div class="quest-item ${it.p >= it.target ? "is-done" : ""}"><span class="quest-item__name">${h(it.name)}</span><span class="quest-item__count">${Math.min(it.p, it.target)}/${it.target}${it.timed ? "s" : ""}</span></div>`).join("")}
    <div class="xpline" style="margin-top:10px"><span>${D.done ? "Cleared · new quest at midnight" : `${done}/${D.items.length} done · resets in <b class="mono glowblue" data-reset>${resetIn()}</b>`}</span><span>Open ›</span></div></a>`;
}
VIEWS.home = () => {
  setTabs("home");
  const p = suggestedPlan(), w = nextWorkout(p);
  const rerender = () => { const y = window.scrollY; VIEWS.home(); window.scrollTo(0, y); };
  app.innerHTML = `${hudTop(`<a class="iconbtn sm" href="#/settings" aria-label="Settings">⚙</a>`)}
    ${S.active ? `<div class="system-window" style="--hg-bracket-color:var(--color-warning)"><div class="system-window__title">In progress</div><p class="center">${h(S.active.title)}</p><div class="row"><button class="btn sm" style="flex:2" id="resume">Resume</button><button class="btn sm ghost" style="flex:1" id="discard">Discard</button></div></div>` : ""}
    ${missHTML()}
    ${statusWindow()}
    ${dailyMini()}
    <div class="system-window"><div class="system-window__title">Today's session</div><div class="row between"><span class="pill">${h(p.name)}</span><span class="muted small">${EQL[p.equip]}</span></div>
      <h2 style="margin-top:12px">${h(w.name)}</h2><p class="muted">${w.ex.length} exercises · about ${w.mins} min · ~${planXpEstimate(w)} XP</p>
      <div class="stack"><a class="btn ghost" href="#/workout/${p.id}/${w.id}">Start session</a><a class="btn link" href="#/plan/${p.id}">View plan</a></div></div>
    <p class="center small muted" style="margin-top:16px"><a href="#/pro">${h(NAME)} Pro</a> · <a href="#/settings">Settings</a></p>`;
  bindStats(rerender); bindMiss();
  if (S.active) { $("#resume").onclick = () => go("/train"); $("#discard").onclick = () => confirmSheet("Discard workout?", "Sets you've logged in this workout will be lost.", "Discard", () => { S.active = null; save(); render(); }, true); }
  clearInterval(ticker); ticker = setInterval(() => { const r = $("[data-reset]"); if (r) r.textContent = resetIn(); }, 1000);
};

let planFilter = null;
VIEWS.plans = () => {
  setTabs("plans");
  const eq = S.profile.equip; if (!planFilter) planFilter = "all";
  const avail = availablePlans(eq);
  const cats = [["all", "All for me"], ...["none", "dumbbells", "gym"].filter(k => equipRank[k] <= equipRank[eq]).map(k => [k, EQL[k]])];
  const list = planFilter === "all" ? avail : avail.filter(p => p.equip === planFilter);
  const locked = GM.SKILL_PLANS.filter(bp => !has(bp.skill));
  app.innerHTML = `<div class="top"><h1>Plans</h1><span class="spacer"></span><a class="btn sm ghost" href="#/routines">My routines</a></div><p class="muted">Showing plans for: <b style="color:var(--color-text)">${h(EQL[eq])}</b>. <a href="#/settings">Change</a></p>
    <div class="chips" role="tablist">${cats.map(([k, l]) => `<button class="chip ${planFilter === k ? "on" : ""}" data-k="${k}" role="tab" aria-selected="${planFilter === k}">${h(l)}</button>`).join("")}</div>
    ${list.map(p => `<a class="card" href="#/plan/${p.id}"><div class="row between"><h3 style="margin:0">${h(p.name)}</h3>${p.pro ? `<span class="pill volt">PRO</span>` : p.skill ? `<span class="pill good">Skill</span>` : ""}</div>
      <div class="meta"><span class="pill">${p.weeks} weeks</span><span class="pill">${p.perWeek}×/week</span><span class="pill">${h(p.level)}</span><span class="pill">${h(EQL[p.equip])}</span></div>
      <p class="muted small" style="margin:0">${h(p.blurb)}</p></a>`).join("")}
    ${locked.length ? `<h2 style="margin-top:22px">Unlock with skills</h2>` + locked.map(bp => { const sk = GM.SKILLS.find(x => x.id === bp.skill); return `<a class="card" href="#/skills" style="opacity:.8"><div class="row between"><h3 style="margin:0">🔒 ${h(bp.name)}</h3><span class="pill locked">Skill: ${h(sk.name)}</span></div><p class="muted small" style="margin:6px 0 0">${h(bp.blurb)}</p><p class="small" style="margin:6px 0 0">Requires: ${reqList(sk.req).map(r => `<span style="color:${r.met ? "var(--color-success)" : "var(--color-text-muted)"}">${h(r.l)}</span>`).join(" · ")}</p></a>`; }).join("") : ""}
    ${PLANS.length > availablePlans(eq).filter(x => PLANS.includes(x)).length ? `<p class="small muted center" style="margin-top:16px">More plans need equipment you haven't selected.</p>` : ""}
    <p class="small muted center">PRO plans are free during testing.</p>`;
  app.querySelectorAll(".chip").forEach(c => c.onclick = () => { planFilter = c.dataset.k; VIEWS.plans(); });
};
VIEWS.plan = id => {
  setTabs("plans"); const p = planById(id); if (!p) return go("/plans");
  const isActive = S.activePlanId === p.id;
  app.innerHTML = `<div class="top"><a class="iconbtn" href="#/plans" aria-label="Back">‹</a></div>
    <div class="row wrapr" style="gap:6px">${p.pro ? `<span class="pill volt">PRO · free in beta</span>` : ""}<span class="pill">${h(EQL[p.equip])}</span></div>
    <h1 style="margin-top:10px">${h(p.name)}</h1><p class="muted">${h(p.blurb)}</p>
    <div class="meta"><span class="pill">${p.weeks} weeks</span><span class="pill">${p.perWeek} workouts/week</span><span class="pill">${h(p.level)}</span></div>
    <button class="btn ${isActive ? "ghost" : ""}" id="setActive" style="margin:12px 0 20px">${isActive ? "✓ Your current plan" : "Make this my plan"}</button>
    ${p.workouts.map(w => `<div class="card"><div class="row between"><h3 style="margin:0">${h(w.name)}</h3><span class="muted small">~${w.mins} min</span></div>
      <ul class="exlist">${w.ex.map(e => `<li><b>${h(e.n)}</b><div class="muted small">${e.s} sets × ${exTarget(e)} · rest ${e.rest}s</div></li>`).join("")}</ul>
      <a class="btn" href="#/workout/${p.id}/${w.id}">Start workout</a></div>`).join("")}`;
  $("#setActive").onclick = () => { S.activePlanId = p.id; save(); toast("Set as your plan"); VIEWS.plan(id); };
};
// Preview of a workout before starting
VIEWS.workout = (pid, wid) => {
  setTabs(null);
  const p = planById(pid), w = p && p.workouts.find(x => x.id === wid);
  if (!w) return go("/plans");
  startPreview(w.name, p.name, w.ex, { kind: "plan", planId: p.id, workoutId: w.id }, `#/plan/${p.id}`);
};
function startPreview(title, sub, ex, ref, back) {
  app.innerHTML = `<div class="top"><a class="iconbtn" href="${back}" aria-label="Back">‹</a></div>
    <p class="muted" style="margin:0">${h(sub)}</p><h1>${h(title)}</h1>
    <p class="muted">${ex.length} exercises · ${ex.reduce((a, e) => a + e.s, 0)} sets</p>
    <div class="card"><ul class="exlist">${ex.map((e, i) => `<li><b>${i + 1}. ${h(e.n)}</b><div class="muted small">${e.s} × ${exTarget(e)} · rest ${e.rest}s</div></li>`).join("")}</ul></div>
    <div style="height:16px"></div><button class="btn" id="go">Start</button>
    <p class="small muted center" style="margin-top:12px">Warm up for a few minutes first. Stop if anything hurts.</p>`;
  $("#go").onclick = () => {
    const begin = () => { unlockAudio(); S.active = newSession(title, ex, ref); save(); go("/train"); };
    if (S.active) confirmSheet("Replace workout in progress?", `You have "${h(S.active.title)}" in progress. Starting this will discard it.`, "Start new workout", begin, true); else begin();
  };
}
function newSession(title, ex, ref) {
  const units = S.profile.units;
  return { id: uid(), title, ref, startedAt: Date.now(), i: 0, ex: structuredClone(ex),
    log: ex.map(e => Array.from({ length: e.s }, () => ({ reps: e.r || 0, sec: e.t || 0, weight: e.w ? (S.lastWeights[e.n + "|" + units] || 0) : null, done: false }))),
    rest: null, timer: null };
}

// ---------- Workout screen ----------
VIEWS.train = () => {
  setTabs(null); const A = S.active; if (!A) return go("/home");
  const e = A.ex[A.i], L = A.log[A.i];
  let si = L.findIndex(x => !x.done); const allDone = si === -1; if (allDone) si = L.length - 1;
  const cur = L[si];
  const totalSets = A.log.flat().length, doneSets = A.log.flat().filter(x => x.done).length;
  const unit = S.profile.units, wStep = unit === "kg" ? 2.5 : 5;
  app.innerHTML = `<div class="trainview">
    <div class="row"><button class="iconbtn" id="end" aria-label="End workout">✕</button><div class="spacer center"><div class="muted small">${h(A.title)}</div><div class="num" id="elapsed" style="font-size:20px">0:00</div></div><button class="iconbtn" id="list" aria-label="All exercises">☰</button></div>
    <div class="pbar" aria-label="Progress"><i style="width:${(doneSets / totalSets * 100).toFixed(0)}%"></i></div>
    <div class="muted small">Exercise ${A.i + 1} of ${A.ex.length}</div>
    <div class="exname">${h(e.n)}</div>
    <div class="muted">${e.s} sets × ${exTarget(e)} · rest ${e.rest}s</div>
    <div class="setdots" aria-hidden="true">${L.map((x, k) => `<i class="${x.done ? "done" : k === si ? "cur" : ""}"></i>`).join("")}</div>
    <h3 style="margin-top:6px">${allDone ? "All sets done ✓" : `Set ${si + 1} of ${L.length}`}</h3>
    ${e.t ? `<div class="big" id="timer">${fmtTime(A.timer ? timerLeft() : cur.sec)}</div>
        <div class="stepper" style="margin-bottom:12px"><button data-adj="sec" data-d="-5" aria-label="Less time">−</button><div class="lbl"><div class="v">${cur.sec}s</div><div class="u">target time</div></div><button data-adj="sec" data-d="5" aria-label="More time">+</button></div>`
      : `<div class="stepper" style="margin:8px 0 12px"><button data-adj="reps" data-d="-1" aria-label="Fewer reps">−</button><div class="lbl"><div class="v">${cur.reps}</div><div class="u">reps${e.side ? " each side" : ""}</div></div><button data-adj="reps" data-d="1" aria-label="More reps">+</button></div>`}
    ${e.w ? `<div class="stepper" style="margin-bottom:12px"><button data-adj="weight" data-d="-${wStep}" aria-label="Less weight">−</button><div class="lbl"><div class="v">${cur.weight || 0}</div><div class="u">${unit} (tap to type)</div></div><button data-adj="weight" data-d="${wStep}" aria-label="More weight">+</button></div>` : ""}
    <details open><summary class="linkbtn" style="list-style:none">Form cues</summary><ul class="cues">${e.c.map(c => `<li>${h(c)}</li>`).join("")}</ul></details>
    ${GM.VARIATIONS.filter(v => has(v.skill) && v.re.test(e.n)).map(v => `<div class="system-window skillhint small"><span class="label">Skill · ${h(GM.SKILLS.find(x => x.id === v.skill).name)}</span><p style="margin:6px 0 0">${h(v.text)}</p></div>`).join("")}
    <div class="spacer"></div>
    <div class="stack" style="margin-top:16px">
      ${allDone ? `<button class="btn" id="nextEx">${A.i < A.ex.length - 1 ? "Next exercise ›" : "Finish workout"}</button>`
        : e.t ? `<button class="btn" id="timerBtn">${A.timer ? (A.timer.running ? "Pause" : "Resume") : "Start timer"}</button><button class="btn ghost" id="doneSet">Mark set done</button>`
        : `<button class="btn" id="doneSet">✓ Set done</button>`}
      <div class="row"><button class="btn sm ghost" style="flex:1" id="prev" ${A.i === 0 ? "disabled" : ""}>‹ Prev</button><button class="btn sm ghost" style="flex:1" id="skip">${A.i < A.ex.length - 1 ? "Skip ›" : "Finish"}</button></div>
    </div></div>
    ${A.rest ? restHTML() : ""}`;
  // handlers
  app.querySelectorAll("[data-adj]").forEach(b => b.onclick = () => {
    const k = b.dataset.adj, d = +b.dataset.d; cur[k] = Math.max(0, Math.round(((cur[k] || 0) + d) * 10) / 10);
    if (k === "sec" && cur.sec < 5) cur.sec = 5; save(); VIEWS.train();
  });
  const wv = app.querySelector('[data-adj="weight"]')?.parentElement.querySelector(".lbl");
  if (wv) wv.onclick = () => { const v = prompt(`Weight (${unit})`, cur.weight || 0); if (v !== null && !isNaN(parseFloat(v))) { cur.weight = Math.max(0, parseFloat(v)); save(); VIEWS.train(); } };
  $("#end").onclick = endPrompt;
  $("#list").onclick = () => sheet(`<h2>Exercises</h2>${A.ex.map((x, k) => `<button class="opt" data-k="${k}" style="margin-bottom:8px"><span class="oi">${A.log[k].every(s => s.done) ? "✓" : k + 1}</span><span><b>${h(x.n)}</b><span>${A.log[k].filter(s => s.done).length}/${x.s} sets</span></span></button>`).join("")}<button class="btn ghost" data-close-btn>Close</button>`,
    el => el.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { A.i = +b.dataset.k; A.timer = null; A.rest = null; save(); closeSheet(); VIEWS.train(); }));
  $("#prev").onclick = () => { if (A.i > 0) { A.i--; A.timer = null; A.rest = null; save(); VIEWS.train(); } };
  $("#skip").onclick = () => { A.timer = null; A.rest = null; if (A.i < A.ex.length - 1) { A.i++; save(); VIEWS.train(); } else finish(); };
  if ($("#nextEx")) $("#nextEx").onclick = () => { if (A.i < A.ex.length - 1) { A.i++; A.timer = null; save(); VIEWS.train(); } else finish(); };
  if ($("#doneSet")) $("#doneSet").onclick = () => completeSet(si);
  if ($("#timerBtn")) $("#timerBtn").onclick = () => {
    unlockAudio();
    if (!A.timer) A.timer = { running: true, startedAt: Date.now(), before: 0, total: cur.sec, si };
    else if (A.timer.running) { A.timer.before += (Date.now() - A.timer.startedAt) / 1000; A.timer.running = false; }
    else { A.timer.startedAt = Date.now(); A.timer.running = true; }
    save(); VIEWS.train();
  };
  bindRest();
  clearInterval(ticker); ticker = setInterval(tick, 250); tick();
};
function timerLeft() { const T = S.active.timer; if (!T) return 0; const el = T.before + (T.running ? (Date.now() - T.startedAt) / 1000 : 0); return Math.max(0, T.total - el); }
function restLeft() { const R = S.active.rest; return R ? Math.max(0, (R.until - Date.now()) / 1000) : 0; }
function restHTML() {
  const A = S.active, R = A.rest; const nx = A.ex[R.nextI];
  return `<div class="rest" role="dialog" aria-label="Rest"><div class="center muted">REST</div>
    <div class="ring"><svg width="240" height="240" viewBox="0 0 240 240"><circle class="track" cx="120" cy="120" r="108" stroke-width="14" fill="none"/><circle id="ringp" class="prog" cx="120" cy="120" r="108" stroke-width="14" fill="none" stroke-linecap="round" stroke-dasharray="${2 * Math.PI * 108}" stroke-dashoffset="0"/></svg><div class="big" id="restc">${fmtTime(restLeft())}</div></div>
    <p class="center" style="margin-top:20px"><span class="muted">Up next</span><br><b style="font-size:20px">${h(nx ? nx.n : "")}</b><br><span class="muted">${R.label || ""}</span></p>
    <div class="row" style="margin:18px 0"><button class="btn ghost" id="rminus">−15s</button><button class="btn ghost" id="rplus">+15s</button></div>
    <button class="btn" id="rskip">Skip rest</button></div>`;
}
function bindRest() {
  if (!S.active.rest) return;
  $("#rplus").onclick = () => { S.active.rest.until += 15000; S.active.rest.total += 15; save(); };
  $("#rminus").onclick = () => { S.active.rest.until -= 15000; save(); };
  $("#rskip").onclick = endRest;
}
function endRest() { const A = S.active; if (!A || !A.rest) return; A.i = A.rest.nextI; A.rest = null; save(); VIEWS.train(); }
function tick() {
  const A = S.active; if (!A) return;
  const el = $("#elapsed"); if (el) el.textContent = fmtTime((Date.now() - A.startedAt) / 1000);
  if (A.rest) {
    const left = restLeft(), c = $("#restc"), rp = $("#ringp");
    if (c) c.textContent = fmtTime(Math.ceil(left));
    if (rp) rp.setAttribute("stroke-dashoffset", (2 * Math.PI * 108 * (1 - left / A.rest.total)).toFixed(1));
    if (left <= 0) { beep(2); endRest(); }
    return;
  }
  if (A.timer) {
    const left = timerLeft(), t = $("#timer"); if (t) t.textContent = fmtTime(Math.ceil(left));
    if (left <= 0 && A.timer.running) { beep(3); const si = A.timer.si; A.timer = null; completeSet(si); }
  }
}
function completeSet(si) {
  const A = S.active, e = A.ex[A.i], L = A.log[A.i];
  L[si].done = true; L[si].at = Date.now();
  if (e.t && A.timer) { const T = A.timer; L[si].sec = Math.round(T.before + (T.running ? (Date.now() - T.startedAt) / 1000 : 0)) || L[si].sec; }
  A.timer = null;
  if (e.w && L[si].weight != null) { S.lastWeights[e.n + "|" + S.profile.units] = L[si].weight; for (let k = si + 1; k < L.length; k++) if (!L[k].done) L[k].weight = L[si].weight; }
  if (!e.t) for (let k = si + 1; k < L.length; k++) if (!L[k].done && L[k].reps === e.r) L[k].reps = L[si].reps;
  const moreSets = L.some(x => !x.done);
  const nextI = moreSets ? A.i : A.ex.findIndex((x, k) => k > A.i && A.log[k].some(s => !s.done));
  if (!moreSets && nextI === -1) { save(); return finish(); }
  const rest = Math.round(e.rest * (has("quick-recovery") ? 0.85 : 1));
  if (rest > 0) {
    const nl = A.log[nextI]; const ns = nl.findIndex(x => !x.done);
    A.rest = { until: Date.now() + rest * 1000, total: rest, nextI, label: `Set ${ns + 1} of ${nl.length}` };
  } else A.i = nextI;
  save(); VIEWS.train();
}
function endPrompt() {
  const A = S.active, done = A.log.flat().filter(x => x.done).length;
  sheet(`<h2>End workout?</h2><p class="muted">${done} set${done === 1 ? "" : "s"} logged so far.</p><div class="stack">
    ${done ? `<button class="btn" id="fin">Finish & review</button>` : ""}<button class="btn danger" id="disc">Discard workout</button><button class="btn ghost" data-close-btn>Keep going</button></div>`,
    el => { if ($("#fin", el)) $("#fin", el).onclick = () => { closeSheet(); finish(); }; $("#disc", el).onclick = () => { S.active = null; save(); closeSheet(); go("/home"); }; });
}
function finish() { S.active.endedAt = Date.now(); S.active.rest = null; S.active.timer = null; save(); go("/summary"); }

VIEWS.summary = () => {
  setTabs(null); const A = S.active; if (!A) return go("/home");
  const dur = Math.round(((A.endedAt || Date.now()) - A.startedAt) / 1000);
  const sets = A.log.flat().filter(x => x.done).length, total = A.log.flat().length;
  const vol = A.log.reduce((a, L, k) => a + L.filter(x => x.done && x.weight).reduce((b, x) => b + x.weight * (x.reps || 0), 0), 0);
  const xpPrev = workoutXpPreview(A);
  app.innerHTML = `<div class="center" style="margin-top:20px"><span class="pill volt">Session complete · +${xpPrev} XP on save</span><h1 style="margin-top:14px">${h(A.title)}</h1><p class="muted">${fmtDate(A.startedAt)}</p></div>
    <div class="stats"><div class="stat"><div class="v">${fmtTime(dur)}</div><div class="l">Time</div></div><div class="stat"><div class="v">${sets}<span class="muted" style="font-size:20px">/${total}</span></div><div class="l">Sets done</div></div>
    ${vol ? `<div class="stat" style="grid-column:span 2"><div class="v">${Math.round(vol).toLocaleString()}</div><div class="l">Volume (${S.profile.units} × reps)</div></div>` : ""}</div>
    <div class="card"><ul class="exlist">${A.ex.map((e, k) => { const d = A.log[k].filter(x => x.done); return `<li><b>${h(e.n)}</b><div class="muted small">${d.length ? d.map(x => e.t ? x.sec + "s" : (x.reps + (x.weight ? " × " + x.weight + S.profile.units : ""))).join(" · ") : "Skipped"}</div></li>`; }).join("")}</ul></div>
    <div class="stack" style="margin-top:18px"><button class="btn" id="save">Save &amp; claim XP</button><button class="btn ghost" id="back">Back to workout</button><button class="btn danger" id="disc">Discard</button></div>`;
  $("#save").onclick = () => {
    const entry = { id: A.id, date: new Date(A.startedAt).toISOString(), title: A.title, planId: A.ref.planId || null, workoutId: A.ref.workoutId || null, routineId: A.ref.routineId || null, durationSec: dur, setsDone: sets, setsTotal: total, volume: Math.round(vol), units: S.profile.units,
      ex: A.ex.map((e, k) => ({ n: e.n, timed: !!e.t, sets: A.log[k].filter(x => x.done).map(x => ({ reps: x.reps, sec: x.sec, weight: x.weight })) })) };
    S.history.unshift(entry); const ref = A.ref; S.active = null; save(); awardWorkout(entry, ref); go(ref.kind === "trial" ? "/quests" : "/home");
  };
  $("#back").onclick = () => { delete A.endedAt; save(); go("/train"); };
  $("#disc").onclick = () => confirmSheet("Discard this workout?", "It won't be saved to your history.", "Discard", () => { S.active = null; save(); go("/home"); }, true);
};

VIEWS.history = () => {
  setTabs("history"); const st = stats();
  app.innerHTML = `<h1>History</h1>
    <div class="stats"><div class="stat hl"><div class="v">${S.game.streak}</div><div class="l">Streak (days)</div></div><div class="stat"><div class="v">${S.game.totalXp.toLocaleString()}</div><div class="l">Total XP</div></div>
    <div class="stat"><div class="v">${st.total}</div><div class="l">Workouts done</div></div><div class="stat"><div class="v">${st.minutes}</div><div class="l">Total minutes</div></div>
    <div class="stat" style="grid-column:span 2"><div class="v">${st.thisWeek}</div><div class="l">Workouts this week</div></div></div>
    ${weekStrip()}
    <h2 style="margin-top:20px">Past workouts</h2>
    ${S.history.length ? S.history.map(x => `<a class="card" href="#/session/${x.id}"><div class="row between"><b>${h(x.title)}</b><span class="muted small">${fmtDate(x.date)}</span></div><div class="muted small">${fmtTime(x.durationSec)} · ${x.setsDone} sets${x.volume ? " · " + x.volume.toLocaleString() + " " + x.units : ""}</div></a>`).join("")
      : `<div class="card center"><p class="muted">No workouts yet. Your first one will show up here.</p><a class="btn" href="#/home">Start a workout</a></div>`}`;
};
function weekStrip() {
  const days = new Set(S.history.map(x => dayKey(x.date))); const out = [];
  for (let k = 13; k >= 0; k--) { const d = new Date(); d.setDate(d.getDate() - k); out.push(`<div style="flex:1;text-align:center"><div style="height:28px;border-radius:8px;background:${days.has(dayKey(d)) ? "var(--color-primary)" : "var(--color-surface-2)"}"></div><div class="small muted" style="font-size:11px;margin-top:4px">${"SMTWTFS"[d.getDay()]}</div></div>`); }
  return `<div class="card"><div class="small muted" style="margin-bottom:8px">Last 14 days</div><div class="row" style="gap:4px">${out.join("")}</div></div>`;
}
VIEWS.session = id => {
  setTabs("history"); const x = S.history.find(s => s.id === id); if (!x) return go("/history");
  app.innerHTML = `<div class="top"><a class="iconbtn" href="#/history" aria-label="Back">‹</a></div><h1>${h(x.title)}</h1><p class="muted">${new Date(x.date).toLocaleString()} · ${fmtTime(x.durationSec)} · ${x.setsDone} sets</p>
    <div class="card"><ul class="exlist">${x.ex.map(e => `<li><b>${h(e.n)}</b><div class="muted small">${e.sets.length ? e.sets.map(s => e.timed ? s.sec + "s" : s.reps + (s.weight ? " × " + s.weight + x.units : "")).join(" · ") : "Skipped"}</div></li>`).join("")}</ul></div>
    <div style="height:16px"></div><button class="btn danger" id="del">Delete this entry</button>`;
  $("#del").onclick = () => confirmSheet("Delete this workout?", "It will be removed from your history and stats.", "Delete", () => { S.history = S.history.filter(s => s.id !== id); save(); go("/history"); }, true);
};

// ---------- Custom routines (free: up to 3) ----------
function allExercises() {
  const m = new Map();
  for (const p of availablePlans()) for (const w of p.workouts) for (const e of w.ex) if (!m.has(e.n)) m.set(e.n, Object.assign({}, e, { equip: p.equip }));
  return [...m.values()].sort((a, b) => a.n.localeCompare(b.n));
}
VIEWS.routines = () => {
  setTabs("plans"); const n = S.routines.length, lim = C.FREE_ROUTINE_LIMIT;
  app.innerHTML = `<div class="top"><a class="iconbtn" href="#/plans" aria-label="Back">‹</a><h1>My routines</h1></div><p class="muted">Build your own workouts from the exercise library. Free plan: <b style="color:var(--color-text)">${n} of ${lim}</b> saved.</p>
    ${S.routines.map(r => `<div class="card"><h3>${h(r.name)}</h3><p class="muted small">${r.ex.length} exercises · ${r.ex.map(e => h(e.n)).slice(0, 3).join(", ")}${r.ex.length > 3 ? "…" : ""}</p>
      <div class="row"><a class="btn sm" style="flex:2" href="#/rstart/${r.id}">Start</a><a class="btn sm ghost" style="flex:1" href="#/redit/${r.id}">Edit</a></div></div>`).join("")}
    <div style="height:12px"></div><button class="btn ${n >= lim ? "ghost" : ""}" id="new">+ New routine</button>
    ${n >= lim ? `<p class="small muted center" style="margin-top:10px">You've reached the free limit. <a href="#/pro">Pro</a> will remove it.</p>` : ""}`;
  $("#new").onclick = () => {
    if (n >= lim) return sheet(`<span class="pill volt">PRO</span><h2 style="margin-top:10px">Free limit reached</h2><p class="muted">The free version saves up to ${lim} custom routines. Pro (coming soon) will remove the limit. For now, edit or delete a routine to make room.</p><div class="stack"><a class="btn" href="#/pro">See Pro</a><button class="btn ghost" data-close-btn>OK</button></div>`);
    go("/redit/new");
  };
};
VIEWS.rstart = id => { setTabs(null); const r = S.routines.find(x => x.id === id); if (!r) return go("/routines"); startPreview(r.name, "My routine", r.ex, { kind: "routine", routineId: r.id }, "#/routines"); };
let draft = null;
VIEWS.redit = id => {
  setTabs("plans");
  if (!draft || draft._for !== id) { const ex = id === "new" ? null : S.routines.find(x => x.id === id); if (id !== "new" && !ex) return go("/routines"); if (id === "new" && S.routines.length >= C.FREE_ROUTINE_LIMIT) return go("/routines"); draft = ex ? structuredClone(ex) : { id: uid(), name: "", ex: [] }; draft._for = id; }
  app.innerHTML = `<div class="top"><button class="iconbtn" id="back" aria-label="Back">‹</button><h2>${id === "new" ? "New routine" : "Edit routine"}</h2></div>
    <label class="field"><span>Name</span><input id="rname" maxlength="40" placeholder="e.g. Quick upper body" value="${h(draft.name)}"></label>
    ${draft.ex.length ? draft.ex.map((e, k) => `<div class="card"><div class="row between"><b>${k + 1}. ${h(e.n)}</b><button class="linkbtn" data-rm="${k}" style="color:var(--color-danger)">Remove</button></div>
      <div class="row" style="margin-top:8px;gap:8px"><label class="field" style="flex:1;margin:0"><span class="small">Sets</span><input type="number" inputmode="numeric" min="1" max="10" data-k="${k}" data-f="s" value="${e.s}"></label>
      <label class="field" style="flex:1;margin:0"><span class="small">${e.t ? "Seconds" : "Reps"}</span><input type="number" inputmode="numeric" min="1" max="300" data-k="${k}" data-f="${e.t ? "t" : "r"}" value="${e.t || e.r}"></label>
      <label class="field" style="flex:1;margin:0"><span class="small">Rest (s)</span><input type="number" inputmode="numeric" min="0" max="600" data-k="${k}" data-f="rest" value="${e.rest}"></label></div></div>`).join("")
      : `<div class="card center muted">No exercises yet.</div>`}
    <div class="stack" style="margin-top:14px"><button class="btn ghost" id="add">+ Add exercise</button><button class="btn" id="save" ${draft.ex.length ? "" : "disabled"}>Save routine</button>
    ${id !== "new" ? `<button class="btn danger" id="del">Delete routine</button>` : ""}</div>`;
  $("#rname").oninput = e => draft.name = e.target.value;
  app.querySelectorAll("input[data-k]").forEach(inp => inp.onchange = () => { const v = parseInt(inp.value); if (!isNaN(v)) draft.ex[+inp.dataset.k][inp.dataset.f] = Math.max(inp.dataset.f === "rest" ? 0 : 1, v); });
  app.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { draft.ex.splice(+b.dataset.rm, 1); VIEWS.redit(id); });
  $("#back").onclick = () => { draft = null; go("/routines"); };
  $("#add").onclick = () => pickExercise(e => { draft.ex.push({ n: e.n, s: e.s, rest: e.rest, c: e.c, ...(e.t ? { t: e.t } : { r: e.r }), ...(e.side ? { side: true } : {}), ...(e.w ? { w: true } : {}) }); VIEWS.redit(id); });
  $("#save").onclick = () => {
    if (!draft.ex.length) return; const r = structuredClone(draft); delete r._for; r.name = r.name.trim() || "My routine " + (S.routines.length + 1);
    const i = S.routines.findIndex(x => x.id === r.id);
    if (i >= 0) S.routines[i] = r; else { if (S.routines.length >= C.FREE_ROUTINE_LIMIT) return toast("Free limit reached"); S.routines.push(r); }
    save(); draft = null; toast("Routine saved"); go("/routines");
  };
  if ($("#del")) $("#del").onclick = () => confirmSheet("Delete routine?", "This can't be undone.", "Delete", () => { S.routines = S.routines.filter(x => x.id !== id); save(); draft = null; go("/routines"); }, true);
};
function pickExercise(cb) {
  const all = allExercises();
  sheet(`<div class="row between"><h2 style="margin:0">Add exercise</h2><button class="iconbtn" data-close-btn aria-label="Close">✕</button></div>
    <label class="field" style="margin-top:12px"><input id="q" type="search" placeholder="Search ${all.length} exercises" autocomplete="off"></label><div id="res"></div>`, el => {
    const draw = q => { const list = all.filter(e => e.n.toLowerCase().includes(q.toLowerCase())).slice(0, 60);
      $("#res", el).innerHTML = list.map((e, k) => `<button class="opt" data-n="${h(e.n)}" style="margin-bottom:8px"><span><b>${h(e.n)}</b><span>${h(EQL[e.equip])} · ${e.s} × ${exTarget(e)}</span></span></button>`).join("") || `<p class="muted">No matches.</p>`;
      $("#res", el).querySelectorAll("[data-n]").forEach(b => b.onclick = () => { closeSheet(); cb(all.find(x => x.n === b.dataset.n)); }); };
    draw(""); $("#q", el).oninput = e => draw(e.target.value);
  });
}

// ---------- Quests ----------
VIEWS.quests = () => {
  setTabs("quests"); const G = S.game, D = G.daily, nr = nextRank();
  const rerender = () => { const y = window.scrollY; VIEWS.quests(); window.scrollTo(0, y); };
  const clearXp = Math.round(GM.dailyClearXp(G.level) * (D.comeback ? 1.5 : 1));
  const restOk = !G.activeDays[todayKey()];
  app.innerHTML = `${hudTop()}
    ${missHTML()}
    <div class="system-window" id="daily"><div class="system-window__title">Daily quest</div>
      <div class="sub">${h(D.name)} · no equipment · Lv ${G.level}${D.comeback ? " · 60% volume" : ""}</div>
      <div class="timer"><span>${D.done ? "CLEARED" : "RESETS IN"}</span><b data-reset>${D.done ? "✓" : resetIn()}</b></div>
      ${D.items.map(it => { const ok = it.p >= it.target; return `<div class="quest-item ${ok ? "is-done" : ""}" data-q="${it.id}">
        <span class="quest-item__name">${h(it.name)}<small>${h(it.note)}</small></span><span class="quest-item__count">${Math.min(it.p, it.target)}/${it.target}${it.timed ? "s" : ""}</span>
        ${ok ? "" : `<div class="qx"><div class="xp-bar thin"><div class="xp-bar__fill" style="--xp:${Math.min(100, it.p / it.target * 100).toFixed(0)}%"></div></div>
        <div class="qbtns">${it.timed ? `<button data-add="-10" aria-label="Minus 10 seconds">−10s</button><button data-add="10">+10s</button><button data-add="30">+30s</button>` : `<button data-add="-1" aria-label="Minus one">−1</button><button data-add="1">+1</button><button data-add="5">+5</button>`}<button class="fill" data-add="max" aria-label="Mark ${h(it.name)} done">Done</button></div></div>`}</div>`; }).join("")}
      <div class="box"><h4>Reward</h4><div class="reward" style="justify-content:flex-start;margin:0">${chip(`+${clearXp} XP`, true)}${chip(`+${GM.DAILY_POINTS} attribute pts`)}${chip(`Streak ${G.streak} → ${D.done ? G.streak : G.streak + (G.activeDays[todayKey()] ? 0 : 1)}`, true)}</div></div>
      <div class="box"><h4>If missed</h4><div class="note">${G.shields ? `Streak shield absorbs it (${G.shields} left).` : "No shield left, so the streak resets."} A short Comeback Quest unlocks tomorrow. No XP or stats are ever lost. Reps from workouts count here too.</div></div>
      <p class="small muted" style="margin:12px 0 0">The health disclaimer applies: split reps across the day, scale down, or stop if anything hurts.</p></div>

    <div class="system-window"><div class="system-window__title">Rest day</div>
      <p class="small muted">Planned rest keeps your streak and adds VIT +1. Up to 2 per week.</p>
      <button class="btn ghost" id="rest" ${restOk ? "" : "disabled"}>${restOk ? "Log a rest day" : "Today already counts"}</button></div>

    <div class="system-window"><div class="system-window__title">Rank trial</div>
      ${nr ? (G.level >= nr.level ? `<div class="head"><span class="rank-badge" data-rank="${nr.k}">${nr.k}</span><div><b>Rank ${nr.k} · ${nr.name}</b><small>Clear 80% of the sets to rank up${nr.pro ? " · PRO, free in beta" : ""}</small></div></div><a class="btn ghost" href="#/rtrial">Start Rank Trial</a>`
        : `<div class="head"><span class="rank-badge" data-rank="${nr.k}" style="opacity:.5">${nr.k}</span><div><b>Rank ${nr.k} · ${nr.name}</b><small>🔒 Opens at Lv ${nr.level} (now Lv ${G.level})${nr.pro ? " · PRO" : ""}</small></div></div>`) : `<p class="center">Rank S · Legend reached.</p>`}</div>

    <div class="system-window"><div class="system-window__title">Class change</div>
      ${G.cls ? `<p class="center">Class: <b>${h(GM.CLASSES.find(c => c.id === G.cls).name)}</b>. Quest complete.</p>`
      : G.level < GM.CLASS_LEVEL ? `<p class="center">🔒 Opens at <b>Lv ${GM.CLASS_LEVEL}</b> (now Lv ${G.level}).</p><p class="small muted center" style="margin:0">A milestone quest: clear the Class Trial, then choose Vanguard, Striker or Warden for bonus stats and a class title.</p>`
      : G.classTrialDone ? `<p class="center">Trial clear. Choose your class:</p>${GM.CLASSES.map(c => `<button class="opt" data-cls="${c.id}" style="margin-bottom:8px"><span class="oi">◆</span><span><b>${h(c.name)}</b><span>${h(c.desc)}</span></span></button>`).join("")}`
      : `<p class="center">The Class Trial is open.</p><p class="small muted center">${GM.CLASS_TRIAL.ex.map(e => h(e.n)).join(" · ")}</p><a class="btn ghost" href="#/ctrial">Start Class Trial</a>`}</div>

    <div class="system-window"><div class="system-window__title">Achievements</div>${GM.ACH.map(a => { const got = G.achievements[a.id]; return `<div class="quest-item ${got ? "is-done" : ""}"><span class="quest-item__name">${h(a.name)}<small>${h(a.desc)}${a.xp ? " · +" + a.xp + " XP" : ""}</small></span><span class="quest-item__count">${got ? fmtDate(got) : "—"}</span></div>`; }).join("")}</div>`;
  app.querySelectorAll("[data-q]").forEach(row => row.querySelectorAll("[data-add]").forEach(b => b.onclick = () => {
    const it = D.items.find(x => x.id === row.dataset.q); const v = b.dataset.add === "max" ? it.target - it.p : +b.dataset.add;
    addDaily(it.id, v); rerender(); showQueue();
  }));
  $("#rest").onclick = logRestDay;
  app.querySelectorAll("[data-cls]").forEach(b => b.onclick = () => {
    const c = GM.CLASSES.find(x => x.id === b.dataset.cls);
    confirmSheet(`Become a ${c.name}?`, h(c.desc) + " This choice stays with this profile (Delete my data resets everything).", "Confirm class", () => {
      G.cls = c.id; for (const [k, v] of Object.entries(c.boost)) G.stats[k] += v; G.title = c.name; queue({ kind: "class", name: c.name, boost: c.boost }); checkProgress(); save(); render();
    });
  });
  bindMiss();
  clearInterval(ticker); ticker = setInterval(() => { const r = $("[data-reset]"); if (r && !D.done) r.textContent = resetIn(); }, 1000);
};
VIEWS.rtrial = () => { setTabs(null); if (!rankTrialOpen()) return go("/quests"); const t = GM.rankTrial(S.game.rankIdx + 1); startPreview(t.name, "Rank Trial", t.ex, { kind: "rank" }, "#/quests"); };
VIEWS.ctrial = () => { setTabs(null); if (S.game.level < GM.CLASS_LEVEL) return go("/quests"); startPreview(GM.CLASS_TRIAL.name, "Class change", GM.CLASS_TRIAL.ex, { kind: "class" }, "#/quests"); };

// ---------- Skill tree ----------
VIEWS.skills = () => {
  setTabs("skills"); const G = S.game;
  const titles = ["Initiate"].concat(GM.SKILLS.filter(sk => sk.title && has(sk.id)).map(sk => sk.title)).concat(G.cls ? [GM.CLASSES.find(c => c.id === G.cls).name] : []);
  const lines = ["STR", "END", "AGI", "VIT", "DIS"];
  app.innerHTML = `${hudTop()}
    <div class="system-window"><div class="system-window__title">Skills</div>
      <p class="small muted center" style="margin-top:-6px">Skills unlock programs and titles. Learned ${G.skills.length} / ${GM.SKILLS.length}. The first node of each line is free; PRO nodes are free during testing.</p>
      ${lines.map(L => `<div class="skline"><div class="label">${L} line</div>${GM.SKILLS.filter(sk => sk.line === L).map(sk => { const learned = has(sk.id), ready = skillReady(sk), req = reqList(sk.req);
        return `<div class="skill"><div class="hex ${learned ? "on" : ""}">${sk.node}</div><div><b>${h(sk.name)}</b><span>${h(sk.desc)}</span>
          ${learned ? "" : `<span class="req">${req.map(r => `<i class="${r.met ? "met" : ""}">${r.met ? "✓" : "○"} ${h(r.l)}</i>`).join("")}</span>`}
          ${ready ? `<button class="btn sm" style="width:100%;margin-top:8px" data-learn="${sk.id}">Unlock</button>` : ""}</div>
          <span class="tag ${learned ? "new" : ready ? "new" : sk.pro ? "pro" : "lock"}">${learned ? "ON" : ready ? "NEW" : sk.pro ? "PRO" : "LOCKED"}</span></div>`; }).join("")}</div>`).join("")}</div>
    <div class="system-window"><div class="system-window__title">Title</div><div class="chips" style="margin-bottom:0">${titles.map(t => `<button class="chip ${G.title === t ? "on" : ""}" data-title="${h(t)}">${h(t)}</button>`).join("")}</div><p class="small muted" style="margin:8px 0 0">Earned titles add +5% XP while equipped.</p></div>`;
  app.querySelectorAll("[data-learn]").forEach(b => b.onclick = () => {
    const sk = GM.SKILLS.find(x => x.id === b.dataset.learn); if (!skillReady(sk)) return;
    G.skills.push(sk.id); if (sk.title) G.title = sk.title;
    const plan = GM.SKILL_PLANS.find(p => p.skill === sk.id);
    queue({ kind: "skill", name: sk.name, desc: plan ? `${plan.name} plan added to Plans.` : sk.desc }); checkProgress(); save(); render();
  });
  app.querySelectorAll("[data-title]").forEach(b => b.onclick = () => { G.title = b.dataset.title; save(); VIEWS.skills(); });
};

// ---------- Pro ----------
VIEWS.pro = () => {
  setTabs(null);
  app.innerHTML = `<div class="top"><button class="iconbtn" id="back" aria-label="Back">‹</button></div>
    <span class="pill volt">PRO</span><h1 style="margin-top:12px">${h(NAME)} Pro</h1>
    <div class="notice" style="margin-bottom:16px"><b>Coming soon. Free during testing.</b> Nothing is charged in this test version, and there's no way to pay here.</div>
    <div class="card" style="margin-bottom:14px"><ul class="cues" style="margin:0"><li>The full skill tree: every program, including equipment and gym lines</li><li>Rank Trials for B, A and S</li><li>Advanced quests: weekly challenges and boss sessions</li><li>Detailed stat history and unlimited saved routines (free: ${C.FREE_ROUTINE_LIMIT})</li><li><b>Never stats or XP.</b> Pro sells content, not power.</li></ul></div>
    <p class="small muted">Free always includes the Daily Quest, XP, levels, stats, ranks E to C, the first node of every skill line, and workout logging.</p>
    <div class="pricecard best"><div class="row between"><b>Yearly</b><span class="pill ember">Best value</span></div><div class="p" style="margin-top:8px">${C.PRO_YEARLY}<span class="muted" style="font:500 16px var(--font-ui)"> / year</span></div><div class="muted small">About $2.08/month · ${C.PRO_TRIAL_DAYS}-day free trial</div></div>
    <div class="pricecard"><b>Monthly</b><div class="p" style="margin-top:8px">${C.PRO_MONTHLY}<span class="muted" style="font:500 16px var(--font-ui)"> / month</span></div><div class="muted small">${C.PRO_TRIAL_DAYS}-day free trial</div></div>
    <button class="btn" disabled>Start ${C.PRO_TRIAL_DAYS}-day free trial · Coming soon</button>
    <button class="btn outline" style="margin-top:10px" disabled>Restore purchases · Coming soon</button>
    <p class="small muted" style="margin-top:14px">Planned pricing, shown for testing. When Pro launches, it will be an auto-renewing subscription bought through Apple. Payment is charged to your Apple ID when you confirm. It renews automatically unless you turn off auto-renew at least 24 hours before the current period ends. Manage or cancel any time in your Apple ID account settings. Any unused part of a free trial ends when you buy a subscription.</p>
    <p class="small">${legalLinks()}</p>`;
  $("#back").onclick = () => history.length > 1 ? history.back() : go("/home");
};

// ---------- Settings ----------
VIEWS.settings = () => {
  setTabs("home"); const P = S.profile;
  const chips = (key, opts) => `<div class="chips" style="margin-bottom:6px">${opts.map(([v, l]) => `<button class="chip ${P[key] === v ? "on" : ""}" data-key="${key}" data-v="${v}">${h(l)}</button>`).join("")}</div>`;
  app.innerHTML = `<div class="top"><a class="iconbtn" href="#/home" aria-label="Back">‹</a><h1>Settings</h1></div>
    <label class="field"><span>Lifter name</span><input id="hname" maxlength="20" placeholder="Lifter" value="${h(S.game.name)}"></label>
    <h3>Goal</h3>${chips("goal", GOALS.map(g => [g[0], g[1]]))}
    <h3>Level</h3>${chips("level", LEVELS.map(l => [l[0], l[0]]))}
    <h3>Equipment</h3>${chips("equip", EQUIPS.map(e => [e[0], e[1]]))}
    <h3>Weight units</h3>${chips("units", [["lb", "Pounds (lb)"], ["kg", "Kilograms (kg)"]])}
    <div style="height:10px"></div>
    <a class="card" href="#/routines"><b>My routines ›</b><div class="muted small">${S.routines.length} of ${C.FREE_ROUTINE_LIMIT} saved on the free plan</div></a>
    <a class="card" href="#/pro"><div class="row between"><b>${h(NAME)} Pro</b><span class="pill volt">Coming soon</span></div><span class="muted small">Free during testing</span></a>
    <button class="card" id="disc"><b>Health disclaimer</b><div class="muted small">Agreed ${P.agreedAt ? new Date(P.agreedAt).toLocaleDateString() : ""}</div></button>
    <a class="card" href="${C.TERMS_URL}" target="_blank" rel="noopener"><b>Terms of Use ›</b></a>
    <a class="card" href="${C.PRIVACY_URL}" target="_blank" rel="noopener"><b>Privacy Policy ›</b></a>
    <a class="card" href="${C.SUPPORT_URL}" target="_blank" rel="noopener"><b>Support ›</b></a>
    <a class="card" href="mailto:${C.SUPPORT_EMAIL}?subject=${encodeURIComponent(NAME + " beta feedback")}"><b>Email support ›</b><div class="muted small">${h(C.SUPPORT_EMAIL)}</div></a>
    <div class="card"><b>Your data</b><p class="muted small">Everything is stored only on this device, in this browser. No account, no ads, no tracking. Removing the app or clearing Safari website data also deletes it.</p><button class="btn danger" id="wipe">Delete my data</button></div>
    <p class="small muted center" style="margin-top:16px">${h(NAME)} ${h(C.VERSION)} · test build</p>`;
  $("#hname").onchange = e => { S.game.name = e.target.value.trim().slice(0, 20); save(); toast("Name saved"); };
  app.querySelectorAll("[data-key]").forEach(b => b.onclick = () => { P[b.dataset.key] = b.dataset.v; if (b.dataset.key === "equip") { planFilter = "all"; const sp = planById(S.activePlanId); if (sp && equipRank[sp.equip] > equipRank[P.equip]) S.activePlanId = null; } save(); VIEWS.settings(); });
  $("#disc").onclick = () => sheet(`<h2>Before you start</h2>${disclaimerHTML()}<p class="small">See the ${legalLinks()}.</p><button class="btn ghost" data-close-btn>Close</button>`);
  $("#wipe").onclick = () => confirmSheet("Delete all your data?", `This permanently erases your Lifter profile (level, XP, stats, skills, quests), profile, workout history, streak and custom routines from this device. You'll start over from the welcome screen.`, "Delete everything", () => {
    localStorage.removeItem(KEY); S = fresh(); pend = {}; sessionSpent = {}; draft = null; planFilter = null; toast("Your data was deleted"); go("/welcome");
  }, true);
};

// ---------- Boot ----------
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js", { scope: "/" }).catch(() => navigator.serviceWorker.register("sw.js").catch(() => {})));
document.addEventListener("visibilitychange", () => { if (!document.hidden && location.hash.startsWith("#/train")) { keepAwake(true); tick(); } });
render();
})();
