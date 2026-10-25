/* Hardgrain game layer ("the Forge"): levels, ranks, stats, Daily Quest, streak shields, skills, trials.
   Mechanics follow brand-direction.md §7. Original wording only (§8, §10). */
(function () {
"use strict";
const E = (n, s, x, rest, c, o = {}) => Object.assign({ n, s, rest, c }, typeof x === "number" ? { r: x } : { t: parseInt(x) }, o);

const STATS = [
  ["STR", "Strength", "Push-ups, presses, squats, weights", "--stat-str"],
  ["END", "Endurance", "Cardio, long sets, holds", "--stat-end"],
  ["AGI", "Agility", "Jumps, sprints, footwork", "--stat-agi"],
  ["VIT", "Vitality", "Mobility, stretching, rest days", "--stat-vit"],
  ["DIS", "Discipline", "Streaks and quests cleared", "--stat-dis"]
];
// E Spark · D Iron · C Steel · B Forged · A Tempered · S Legend  (level gate + Rank Trial)
const RANKS = [
  { k: "E", name: "Spark", level: 1 }, { k: "D", name: "Iron", level: 10 }, { k: "C", name: "Steel", level: 20 },
  { k: "B", name: "Forged", level: 35, pro: true }, { k: "A", name: "Tempered", level: 55, pro: true }, { k: "S", name: "Legend", level: 80, pro: true }
];
const xpToNext = L => Math.max(10, Math.round(60 * Math.pow(L, 1.5) / 10) * 10);   // 60 × L^1.5, rounded to 10
const MAX_LEVEL = 9999;
const LEVEL_POINTS = 5, LEVEL_ALL_STATS = 1, DAILY_POINTS = 3, SETS_PER_STAT = 10, CLASS_LEVEL = 25, START_SHIELDS = 1, MAX_SHIELDS = 3;
const dailyClearXp = L => 10 * L;
const dailyXpCap = dis => 800 + 20 * dis;     // sanity cap on workout XP per day

const CARDIO = /(jack|high knees|mountain|burpee|thrust|march|run|jog|walk|climber|fast feet|skater|shuffle|sprint|cardio|bike|row machine|interval)/i;
function statFor(name) {
  const n = name.toLowerCase();
  if (/(jump|hop|skater|shuffle|tuck|broad|sprint|bound|footwork)/.test(n) && !/jumping jack/.test(n)) return "AGI";
  if (/(stretch|cat-cow|90\/90|thread|child|circle|mobility|bird dog|dead bug|y-t-w|snow angel|breathing|walk-out|hip flexor)/.test(n)) return "VIT";
  if (CARDIO.test(n) || /(plank|hold|hollow|wall sit|crunch|sit-up|flutter|bicycle|bear)/.test(n)) return "END";
  return "STR";
}
// XP for one completed set (brand-direction §7)
function setXp(e, set, bodyweight) {
  if (e.t) { const sec = set.sec || e.t; return CARDIO.test(e.n) ? Math.round(sec / 60 * 5) : Math.round(sec / 5); }
  const reps = set.reps || 0; let mult = 1;
  if (e.w && set.weight && bodyweight > 0) mult = Math.min(2, 1 + set.weight / bodyweight);
  return Math.round(reps * mult);
}

// ---------- Daily Quest: "Foundation Set" (no equipment, 4 moves, ~+4%/level) ----------
const DAILY_POOL = {
  push: [{ name: "Push-ups", note: "Knees down is fine. Form first.", base: 10, match: "push-up" }],
  legs: [{ name: "Air squats", note: "Hips back, chest up", base: 14, match: "squat" }, { name: "Reverse lunges", note: "Count each leg. Torso tall.", base: 12, match: "lunge" }],
  core: [{ name: "Plank hold", note: "Brace. Breathe. Hips level.", base: 20, timed: true, match: "plank" }, { name: "Dead bugs", note: "Low back stays down", base: 10, match: "dead bug" }],
  cardio: [{ name: "Jumping jacks", note: "Step-jacks are fine", base: 20, match: "jack" }, { name: "March or jog in place", note: "Any pace you can talk at", base: 60, timed: true, match: "march|jog|high knees|run" }]
};
function dailyQuest(level, prof, dateKey, comeback) {
  const lvl = { Beginner: 1, Intermediate: 1.3, Advanced: 1.6 }[prof.level] || 1;
  const grow = Math.pow(1.04, level - 1) * lvl * (comeback ? 0.6 : 1);
  const day = Math.floor(new Date(dateKey + "T12:00:00").getTime() / 864e5);
  const items = ["push", "legs", "core", "cardio"].map((slot, i) => {
    const pool = DAILY_POOL[slot], pick = pool[(day + i) % pool.length];
    const cap = pick.timed ? 180 : 80;
    return { id: slot, name: pick.name, note: pick.note, timed: !!pick.timed, match: pick.match, target: Math.min(cap, Math.max(pick.timed ? 10 : 3, Math.round(pick.base * grow))), p: 0 };
  });
  return { date: dateKey, name: comeback ? "Comeback Quest" : "Foundation Set", comeback: !!comeback, items, done: false };
}

// ---------- Rank Trials and Class Trial ----------
function rankTrial(idx) {
  const r = RANKS[idx], m = 1 + idx * 0.25;
  return { name: `Rank Trial: ${r.k} · ${r.name}`, ex: [
    E("Push-up", 3, Math.round(10 * m), 60, ["Full range", "Knees down for the last set if needed"]),
    E("Air squat", 3, Math.round(20 * m), 60, ["Hips back, chest up", "Steady pace"]),
    E("Plank", 3, String(Math.round(40 * m)), 45, ["Brace and breathe", "Stop if your back sags"]),
    E("Jumping jacks (or step-jacks)", 3, String(Math.round(45 * m)), 45, ["Land softly", "Step it out to make it easier"]),
    E("Reverse lunge", 2, Math.round(10 * m), 60, ["Knee toward the floor", "Count each leg"], { side: true })
  ]};
}
const CLASS_TRIAL = { name: "Class Trial", ex: [
  E("Push-up", 5, 15, 45, ["Full range", "Knees allowed for later sets"]),
  E("Air squat", 5, 25, 45, ["Chest tall", "Steady pace"]),
  E("Dead bug", 4, 12, 45, ["Low back stays down"], { side: true }),
  E("March or jog in place", 3, "120", 60, ["Easy, steady pace"]),
  E("Plank", 3, "60", 45, ["Brace and breathe"])
]};
const CLASSES = [
  { id: "vanguard", name: "Vanguard", desc: "Frontline strength. +3 STR, +2 VIT.", boost: { STR: 3, VIT: 2 } },
  { id: "striker", name: "Striker", desc: "Speed and engine. +3 AGI, +2 END.", boost: { AGI: 3, END: 2 } },
  { id: "warden", name: "Warden", desc: "Control and grit. +3 VIT, +2 DIS.", boost: { VIT: 3, DIS: 2 } }
];

// ---------- Skill-unlocked programs ----------
const SKILL_PLANS = [
  { id: "core-forge", skill: "iron-core", name: "Core Forge", equip: "none", level: "Beginner", weeks: 2, perWeek: 3, goal: ["strength", "fit"], blurb: "Two weeks of focused core work. Unlocked by Iron Core I.", workouts: [
    { id: "cf-1", name: "Core Forge A", mins: 18, ex: [E("Dead bug", 3, 10, 40, ["Low back down", "Slow reach"], { side: true }), E("Plank", 3, "35", 40, ["Squeeze glutes", "Brace"]), E("Glute bridge", 3, 15, 40, ["Squeeze at the top"]), E("Side plank", 2, "25", 30, ["Hips lifted"], { side: true }), E("Hollow body hold", 2, "20", 40, ["Bend knees to scale"])] },
    { id: "cf-2", name: "Core Forge B", mins: 18, ex: [E("Bird dog", 3, 10, 30, ["Hips level"], { side: true }), E("Reverse crunch", 3, 12, 40, ["Curl hips up, no swing"]), E("Bear hold", 3, "25", 40, ["Knees an inch off the floor"]), E("Plank shoulder taps", 3, 16, 40, ["Wide feet, hips still"])] }
  ]},
  { id: "push-mastery", skill: "push-mastery", name: "Push Mastery", equip: "none", level: "Intermediate", weeks: 4, perWeek: 3, goal: ["strength", "muscle"], blurb: "Push-up progressions from incline to diamond and decline. Unlocked by Push Mastery.", workouts: [
    { id: "pm-1", name: "Progressions", mins: 25, ex: [E("Incline push-up", 2, 12, 60, ["Warm-up sets, smooth reps"]), E("Push-up", 4, 10, 75, ["Chest to a fist's height"]), E("Diamond push-up", 3, 6, 75, ["Hands close under chest", "Elbows tucked"]), E("Decline push-up (feet on couch)", 3, 6, 90, ["Body straight", "Lower with control"]), E("Tempo push-up (3 s down)", 2, 6, 75, ["Count three seconds down"])] }
  ]},
  { id: "loaded-carry", skill: "loaded-carry", name: "Loaded Carry", equip: "dumbbells", level: "Intermediate", weeks: 4, perWeek: 2, goal: ["strength"], blurb: "Carries and holds that build grip and full-body strength. Unlocked by Loaded Carry.", workouts: [
    { id: "lc-1", name: "Carry Day", mins: 30, ex: [E("Farmer carry (walk or hold)", 4, "40", 75, ["Heavy dumbbells at sides", "Tall posture, short steps"], { w: true }), E("Suitcase carry (one side)", 3, "30", 60, ["Don't lean", "Switch sides each set"], { w: true, side: true }), E("Goblet squat", 3, 10, 90, ["Chest up"], { w: true }), E("Dumbbell row", 3, 10, 75, ["Pull elbow to hip"], { w: true, side: true })] }
  ]},
  { id: "barbell-basics", skill: "barbell-basics", name: "Barbell Basics", equip: "gym", level: "Intermediate", weeks: 6, perWeek: 3, goal: ["strength", "muscle"], blurb: "Five-by-five on the main barbell lifts. Unlocked by Barbell Basics.", workouts: [
    { id: "bb-1", name: "Day A", mins: 55, ex: [E("Barbell back squat", 5, 5, 150, ["Brace, sit between hips", "Use safety bars"], { w: true }), E("Barbell bench press", 5, 5, 150, ["Bar to mid-chest", "Spotter or pins"], { w: true }), E("Barbell row", 5, 5, 120, ["Flat back, pull to ribs"], { w: true })] },
    { id: "bb-2", name: "Day B", mins: 55, ex: [E("Barbell back squat", 5, 5, 150, ["Same weight as Day A or a little more"], { w: true }), E("Overhead press", 5, 5, 150, ["Glutes tight", "Head through at the top"], { w: true }), E("Barbell deadlift", 1, 5, 180, ["Bar over mid-foot", "Push the floor away"], { w: true })] }
  ]},
  { id: "engine-room", skill: "engine-room", name: "Engine Room", equip: "none", level: "All levels", weeks: 3, perWeek: 3, goal: ["fat", "fit"], blurb: "20-minute conditioning circuits. Unlocked by Engine Room.", workouts: [
    { id: "er-1", name: "Engine 20", mins: 20, ex: [E("Jumping jacks (or step-jacks)", 4, "45", 15, ["Land softly"]), E("Mountain climbers", 4, "30", 30, ["Hips low"]), E("Air squat", 4, "40", 20, ["Smooth pace"]), E("High knees (or march)", 4, "30", 30, ["Knees to hip height"])] }
  ]},
  { id: "5k-builder", skill: "5k-builder", name: "5K Builder", equip: "none", level: "Beginner", weeks: 6, perWeek: 3, goal: ["fit", "fat"], blurb: "Walk-run intervals that build to a continuous 5K. Unlocked by 5K Builder.", workouts: [
    { id: "5k-1", name: "Intervals W1", mins: 25, ex: [E("Brisk walk warm-up", 1, "300", 0, ["Easy pace"]), E("Run (easy)", 6, "60", 90, ["Talk-test pace", "Walk during rest"]), E("Walk cool-down", 1, "300", 0, ["Breathe slow"])] },
    { id: "5k-2", name: "Intervals W3", mins: 28, ex: [E("Brisk walk warm-up", 1, "300", 0, ["Easy pace"]), E("Run (easy)", 4, "180", 90, ["Relaxed shoulders"]), E("Walk cool-down", 1, "300", 0, ["Breathe slow"])] }
  ]},
  { id: "spring-step", skill: "spring-step", name: "Spring Step", equip: "none", level: "Intermediate", weeks: 4, perWeek: 2, goal: ["fit"], blurb: "Plyometric basics. Land softly every rep. Unlocked by Spring Step.", workouts: [
    { id: "ss-1", name: "Plyo Basics", mins: 22, ex: [E("Squat jump", 4, 6, 60, ["Land softly, knees bent", "Reset each rep"]), E("Skater hops", 3, "30", 45, ["Stick each landing"]), E("Lateral shuffle", 3, "30", 45, ["Stay low"]), E("Broad jump (or long step)", 3, 5, 60, ["Swing arms", "Walk back to reset"])] }
  ]},
  { id: "sprint-intervals", skill: "sprint-intervals", name: "Sprint Intervals", equip: "none", level: "Advanced", weeks: 4, perWeek: 2, goal: ["fat", "fit"], blurb: "Short hard efforts with full recovery. Unlocked by Sprint Intervals.", workouts: [
    { id: "si-1", name: "Sprints", mins: 25, ex: [E("Easy jog warm-up", 1, "300", 60, ["Gradually build pace"]), E("Sprint (hill or flat)", 8, "15", 90, ["Fast but relaxed", "Walk back during rest"]), E("Walk cool-down", 1, "240", 0, ["Breathe slow"])] }
  ]},
  { id: "mobility-reset", skill: "mobility-reset", name: "Mobility Reset", equip: "none", level: "Beginner", weeks: 2, perWeek: 3, goal: ["fit"], blurb: "Short mobility flows for hips, spine and shoulders. Unlocked by Mobility Reset.", workouts: [
    { id: "mr-1", name: "Reset Flow", mins: 15, ex: [E("Cat-cow", 2, 10, 15, ["Move with your breath"]), E("World's greatest stretch", 2, 5, 20, ["Rotate and reach"], { side: true }), E("90/90 hip switch", 2, 8, 20, ["Use hands for support"]), E("Thread the needle", 2, 6, 20, ["Slow rotation"], { side: true }), E("Child's pose breathing", 1, "60", 0, ["Slow breaths"])] }
  ]},
  { id: "deload-week", skill: "deload-week", name: "Deload Week", equip: "none", level: "All levels", weeks: 1, perWeek: 3, goal: ["fit"], blurb: "A lighter week to recover and come back stronger. Unlocked by Deload Week.", workouts: [
    { id: "dw-1", name: "Easy Session", mins: 20, ex: [E("Brisk walk", 1, "600", 60, ["Easy pace"]), E("Air squat", 2, 10, 60, ["Smooth and easy"]), E("Incline push-up", 2, 8, 60, ["Leave reps in the tank"]), E("Cat-cow", 2, 10, 20, ["Move with breath"])] }
  ]}
];
// Skill tree lines (node I is free; later nodes are Pro content, free during testing)
const SKILLS = [
  { id: "iron-core", line: "STR", node: "I", name: "Iron Core I", desc: "Adds the Core Forge plan (2 wks). Rank Battle: Iron Guard.", req: { level: 2, stat: { STR: 11 } } },
  { id: "push-mastery", line: "STR", node: "II", pro: true, name: "Push Mastery", desc: "Adds Push Mastery and harder push-up tips. Rank Battle: Crushing Blow.", req: { level: 6, stat: { STR: 16 } } },
  { id: "loaded-carry", line: "STR", node: "III", pro: true, name: "Loaded Carry", desc: "Adds the Loaded Carry dumbbell plan. Rank Battle: Burden Slam.", req: { level: 15, stat: { STR: 30 }, equip: "dumbbells" } },
  { id: "barbell-basics", line: "STR", node: "IV", pro: true, name: "Barbell Basics", desc: "Adds the Barbell Basics gym plan. Rank Battle: Bar Drop.", req: { level: 20, stat: { STR: 36 }, equip: "gym" } },
  { id: "engine-room", line: "END", node: "I", name: "Engine Room", desc: "Adds 20-minute conditioning circuits. Rank Battle: Overheat Burst.", req: { level: 3, stat: { END: 12 } } },
  { id: "5k-builder", line: "END", node: "II", pro: true, name: "5K Builder", desc: "Adds a walk-run plan that builds to 5K. Rank Battle: Steady Burn.", req: { level: 10, stat: { END: 22 } } },
  { id: "spring-step", line: "AGI", node: "I", name: "Spring Step", desc: "Adds plyometric basics. Rank Battle: Spring Strike.", req: { level: 4, stat: { AGI: 13 } } },
  { id: "sprint-intervals", line: "AGI", node: "II", pro: true, name: "Sprint Intervals", desc: "Adds short sprint sessions. Rank Battle: Blitz Dash.", req: { level: 12, stat: { AGI: 24 } } },
  { id: "mobility-reset", line: "VIT", node: "I", name: "Mobility Reset", desc: "Adds short mobility flows. Rank Battle: Flow Mend.", req: { level: 2, stat: { VIT: 11 } } },
  { id: "deload-week", line: "VIT", node: "II", pro: true, name: "Deload Week", desc: "Adds a lighter recovery week. Rank Battle: Soft Reset.", req: { level: 8, stat: { VIT: 18 } } },
  { id: "early-riser", line: "DIS", node: "I", name: "Title: Early Riser", title: "Early Riser", desc: "Title. +5% XP while equipped.", req: { stat: { DIS: 12 }, early: 3 } },
  { id: "week-warrior", line: "DIS", node: "II", name: "Title: Week Warrior", title: "Week Warrior", desc: "Title. +5% XP while equipped.", req: { streak: 7 } },
  { id: "streak-30", line: "DIS", node: "III", pro: true, name: "Title: 30-Day Streak", title: "30-Day Streak", desc: "Title. +5% XP while equipped.", req: { streak: 30, stat: { DIS: 20 } } }
];
const VARIATIONS = [{ skill: "push-mastery", re: /push-up/i, text: "Try a diamond push-up on your last set: hands close under your chest, elbows tucked. Drop back if form breaks." }];
const ACH = [
  { id: "first-session", name: "First Session", desc: "Save your first workout", xp: 30, test: c => c.workouts >= 1 },
  { id: "first-clear", name: "First Clear", desc: "Clear your first Daily Quest", xp: 30, test: c => c.dailies >= 1 },
  { id: "streak-3", name: "Three in a Row", desc: "Reach a 3-day streak", xp: 50, test: c => c.streak >= 3 },
  { id: "sessions-5", name: "Regular", desc: "Save 5 workouts", xp: 80, test: c => c.workouts >= 5 },
  { id: "sets-100", name: "Hundred Sets", desc: "Complete 100 sets", xp: 120, test: c => c.sets >= 100 },
  { id: "dailies-7", name: "Week of Quests", desc: "Clear 7 Daily Quests", xp: 150, test: c => c.dailies >= 7 },
  { id: "rank-d", name: "Rank D: Iron", desc: "Pass the Iron Rank Trial", xp: 0, test: c => c.rank >= 1 },
  { id: "sessions-25", name: "Veteran", desc: "Save 25 workouts", xp: 250, test: c => c.workouts >= 25 },
  { id: "class", name: "Class Change", desc: "Clear the Class Trial and choose a class", xp: 400, test: c => c.cls }
];
function newGame() {
  return { level: 1, xp: 0, totalXp: 0, points: 0, stats: { STR: 10, END: 10, AGI: 10, VIT: 10, DIS: 10 }, trainSets: {}, totalSets: 0,
    skills: [], title: "Initiate", cls: null, classTrialDone: false, rankIdx: 0, achievements: {}, notified: [],
    daily: null, activeDays: {}, restDays: {}, dailies: 0, early: 0, streak: 0, lastActive: null, shields: START_SHIELDS, shieldVit: 1,
    missNotice: null, queue: [], xpDay: { date: null, amt: 0 }, name: "",
    heroId: "twist",
    battles: { cleared: {} } };
}

// ---------- Rank Battle (turn-based forge bosses) ----------
const BATTLE_FIRST_UNLOCK = 3, BATTLE_UNLOCK_STEP = 2, BATTLE_LIST_AHEAD = 20;
const battleUnlockLevel = i => BATTLE_FIRST_UNLOCK + i * BATTLE_UNLOCK_STEP;
// Hand-crafted openers (original forge / metal / beast names only)
const BOSSES_HAND = [
  // Stats raised ~40–55% vs early drafts so Defend + specials matter. Humans mid-list.
  // ATK pass (v0.1.10): ~1.9x boss ATK so counterattacks hurt (Ember ~18–28 vs early def).
  { id: "ember-whelp", name: "Ember Whelp", blurb: "A coal-born hatchling with a hot temper.", hp: 130, atk: 55, def: 6, art: "battle/bosses/ember-whelp.jpg" },
  { id: "scrap-hound", name: "Scrap Hound", blurb: "Junkyard jaws. Packs a mean bite.", hp: 175, atk: 70, def: 9, art: "battle/bosses/scrap-hound.jpg" },
  { id: "cinder-boar", name: "Cinder Boar", blurb: "Tusks of cooled slag. Charges hard.", hp: 230, atk: 85, def: 12, art: "battle/bosses/cinder-boar.jpg" },
  { id: "anvil-beetle", name: "Anvil Beetle", blurb: "Shell like a workbench. Slow, stubborn.", hp: 300, atk: 78, def: 21, art: "battle/bosses/anvil-beetle.jpg" },
  { id: "iron-warden", name: "Iron Warden", blurb: "Human rival. Plate greaves and a cold stare.", hp: 280, atk: 92, def: 16, art: "battle/bosses/iron-warden.jpg", human: true },
  { id: "rust-serpent", name: "Rust Serpent", blurb: "Coils of oxidized cable and spite.", hp: 265, atk: 110, def: 14, art: "battle/bosses/rust-serpent.jpg" },
  { id: "coal-golem", name: "Coal Golem", blurb: "Walking furnace. Heavy fists.", hp: 390, atk: 100, def: 25, art: "battle/bosses/coal-golem.jpg" },
  { id: "brass-lynx", name: "Brass Lynx", blurb: "Quick paws, polished claws.", hp: 285, atk: 130, def: 15, art: "battle/bosses/brass-lynx.jpg" },
  { id: "slag-pugilist", name: "Slag Pugilist", blurb: "Human rival. Forge-scarred fists, no mercy.", hp: 340, atk: 125, def: 18, art: "battle/bosses/slag-pugilist.jpg", human: true },
  { id: "forge-drake", name: "Forge Drake", blurb: "Bellows breath and tempered scales.", hp: 490, atk: 130, def: 28, art: "battle/bosses/forge-drake.jpg" },
  { id: "ironback", name: "Ironback Tortoise", blurb: "Plate shell. Hits like a drop-hammer.", hp: 580, atk: 120, def: 37, art: "battle/bosses/ironback.jpg" },
  { id: "slag-wyrm", name: "Slag Wyrm", blurb: "Molten spit. Don't stand still.", hp: 520, atk: 160, def: 25, art: "battle/bosses/slag-wyrm.jpg" },
  { id: "temper-sphinx", name: "Temper Sphinx", blurb: "Riddles in heat. Sharp mind, sharper bite.", hp: 650, atk: 150, def: 34, art: "battle/bosses/temper-sphinx.jpg" },
  { id: "quench-leviathan", name: "Quench Leviathan", blurb: "Steam and steel from the cooling trough.", hp: 820, atk: 175, def: 44, art: "battle/bosses/quench-leviathan.jpg" }
];
const HEROES = [
  { id: "twist", name: "Vega", blurb: "Twist-forged striker. Default forge hero.", log: "battle/chars/twist-log.jpg", pixel: "battle/chars/twist-pixel.jpg" },
  { id: "pink", name: "Ember", blurb: "Hot-tempered ember fighter.", log: "battle/chars/pink-log.jpg", pixel: "battle/chars/pink-pixel.jpg" },
  { id: "blue", name: "Flux", blurb: "Cool flux runner. Precision hits.", log: "battle/chars/blue-log.jpg", pixel: "battle/chars/blue-pixel.jpg" },
  { id: "green", name: "Quench", blurb: "Tempered quench tank. Steady power.", log: "battle/chars/green-log.jpg", pixel: "battle/chars/green-pixel.jpg" }
];
const HERO_SHOWCASE_ART = "battle/hero.jpg"; // twist fallback / legacy
const HERO_BATTLE_ART = "battle/hero-pixel.jpg"; // twist fallback / legacy
const HERO_ART = HERO_SHOWCASE_ART; // status thumb / legacy
function heroById(id) { return HEROES.find(h => h.id === id) || HEROES[0]; }
function activeHero(game) { return heroById((game && game.heroId) || "twist"); }
function heroLogArt(game) { const h = activeHero(game); return (h && h.log) || HERO_SHOWCASE_ART; }
function heroBattleArt(game) { const h = activeHero(game); return (h && h.pixel) || HERO_BATTLE_ART; }
const BOSS_ART_FALLBACK = ["battle/bosses/ember-whelp.jpg", "battle/bosses/scrap-hound.jpg", "battle/bosses/cinder-boar.jpg", "battle/bosses/coal-golem.jpg", "battle/bosses/forge-drake.jpg", "battle/bosses/slag-wyrm.jpg"];
const BOSS_PREFIX = ["Ember", "Slag", "Brass", "Iron", "Cinder", "Tempered", "Quench", "Ore", "Flux", "Spark", "Anvil", "Bellows", "Crucible", "Hammer", "Ingots", "Molten", "Rust", "Coal", "Forge", "Steel"];
const BOSS_SUFFIX = ["Whelp", "Hound", "Boar", "Beetle", "Serpent", "Golem", "Lynx", "Drake", "Tortoise", "Wyrm", "Sphinx", "Leviathan", "Raven", "Mantis", "Ox", "Viper", "Crab", "Moth", "Stag", "Ape"];
function _seed(n) { let x = (n * 1103515245 + 12345) >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }
function makeBoss(i) {
  const unlock = battleUnlockLevel(i);
  if (i < BOSSES_HAND.length) {
    const b = BOSSES_HAND[i];
    return Object.assign({ unlock, idx: i, xpClear: 40 + unlock * 8, xpRematch: 0 }, b);
  }
  const rnd = _seed(i * 9973 + 17);
  const name = BOSS_PREFIX[Math.floor(rnd() * BOSS_PREFIX.length)] + " " + BOSS_SUFFIX[Math.floor(rnd() * BOSS_SUFFIX.length)];
  const tier = unlock;
  // ~45% harder than the original procedural curve
  const hp = Math.round(115 + tier * 24 + rnd() * tier * 6);
  const atk = Math.round(48 + tier * 4.2 + rnd() * 12);
  const def = Math.round(5 + tier * 1.05 + rnd() * 5);
  const id = "forge-" + i;
  const art = BOSS_ART_FALLBACK[i % BOSS_ART_FALLBACK.length];
  return { id, name, blurb: "A forge-born challenger scaled to your climb.", hp, atk, def, art, unlock, idx: i, xpClear: 40 + unlock * 8, xpRematch: 0 };
}
function bossById(id) {
  if (!id) return null;
  const hand = BOSSES_HAND.findIndex(b => b.id === id);
  if (hand >= 0) return makeBoss(hand);
  const m = /^forge-(\d+)$/.exec(id);
  if (m) return makeBoss(+m[1]);
  return null;
}
function listBosses(level, cleared) {
  cleared = cleared || {};
  const out = [], seen = new Set();
  // All cleared (by stored index or id)
  const clearedIdx = Object.keys(cleared).map(id => {
    const b = bossById(id); return b ? b.idx : -1;
  }).filter(i => i >= 0);
  const maxCleared = clearedIdx.length ? Math.max(...clearedIdx) : -1;
  // How far the schedule has opened
  let openCount = 0;
  while (battleUnlockLevel(openCount) <= level) openCount++;
  const aheadStart = Math.max(0, openCount);
  const aheadEnd = aheadStart + BATTLE_LIST_AHEAD;
  const from = 0;
  const to = Math.max(maxCleared + 1, aheadEnd, BOSSES_HAND.length);
  for (let i = from; i < to; i++) {
    const b = makeBoss(i);
    const unlocked = level >= b.unlock;
    const isCleared = !!cleared[b.id];
    // Keep list usable: include cleared, available, and next locked window
    if (isCleared || unlocked || i < aheadEnd) {
      if (!seen.has(b.id)) { seen.add(b.id); out.push(Object.assign({}, b, { unlocked, cleared: isCleared })); }
    }
  }
  // Cap: all cleared + available + next BATTLE_LIST_AHEAD locked
  const availOrCleared = out.filter(b => b.cleared || b.unlocked);
  const locked = out.filter(b => !b.cleared && !b.unlocked).slice(0, BATTLE_LIST_AHEAD);
  return availOrCleared.concat(locked).sort((a, b) => a.idx - b.idx);
}
// Base specials + skill-mapped Rank Battle moves
const BATTLE_BASICS = [
  { id: "temper-strike", name: "Temper Strike", cost: 1, kind: "dmg", mult: 1.35, desc: "A focused hit. No skill required." },
  { id: "brace-pulse", name: "Brace Pulse", cost: 1, kind: "heal", heal: 0.18, desc: "Steady breath. Mend a little HP." }
];
const BATTLE_SKILL_MOVES = {
  "iron-core": { id: "iron-guard", name: "Iron Guard", cost: 2, kind: "defend+", mult: 0.35, turns: 2, desc: "Core brace. Extra damage cut for 2 turns." },
  "push-mastery": { id: "crushing-blow", name: "Crushing Blow", cost: 2, kind: "dmg", mult: 2.1, desc: "All power into one strike." },
  "loaded-carry": { id: "burden-slam", name: "Burden Slam", cost: 2, kind: "dmg", mult: 1.7, shred: 0.15, desc: "Heavy slam. Softens enemy defense." },
  "barbell-basics": { id: "bar-drop", name: "Bar Drop", cost: 3, kind: "dmg", mult: 2.4, desc: "Commit everything. Massive hit." },
  "engine-room": { id: "overheat-burst", name: "Overheat Burst", cost: 2, kind: "multi", hits: 3, mult: 0.7, desc: "Three quick engine hits." },
  "5k-builder": { id: "steady-burn", name: "Steady Burn", cost: 2, kind: "dot", turns: 3, mult: 0.45, desc: "Chip damage over 3 turns." },
  "spring-step": { id: "spring-strike", name: "Spring Strike", cost: 2, kind: "dmg", mult: 1.5, crit: 0.5, desc: "Leap in. High crit chance." },
  "sprint-intervals": { id: "blitz-dash", name: "Blitz Dash", cost: 2, kind: "multi", hits: 2, mult: 1.0, desc: "Two lightning strikes." },
  "mobility-reset": { id: "flow-mend", name: "Flow Mend", cost: 2, kind: "heal", heal: 0.32, desc: "Mobility flow. Strong mend." },
  "deload-week": { id: "soft-reset", name: "Soft Reset", cost: 1, kind: "cleanse", heal: 0.12, desc: "Clear your burn and mend lightly." }
};
function battleMoves(skillIds) {
  const out = BATTLE_BASICS.slice();
  const set = new Set(skillIds || []);
  for (const [sk, mv] of Object.entries(BATTLE_SKILL_MOVES)) if (set.has(sk)) out.push(mv);
  return out;
}
const BATTLE_VIDEOS = {
  attack: { src: "battle/fx/attack.mp4", poster: "battle/fx/attack-poster.jpg" },
  "attack-magic": { src: "battle/fx/attack-magic.mp4", poster: "battle/fx/attack-magic-poster.jpg" },
  defend: { src: "battle/fx/defend.mp4", poster: "battle/fx/defend-poster.jpg" },
  "brace-pulse": { src: "battle/fx/brace.mp4", poster: "battle/fx/brace-poster.jpg" },
  "iron-guard": { src: "battle/fx/iron-guard.mp4", poster: "battle/fx/iron-guard-poster.jpg" },
  "overheat-burst": { src: "battle/fx/overheat.mp4", poster: "battle/fx/overheat-poster.jpg" },
  "spring-strike": { src: "battle/fx/spring.mp4", poster: "battle/fx/spring-poster.jpg" },
  "flow-mend": { src: "battle/fx/flow-mend.mp4", poster: "battle/fx/flow-mend-poster.jpg" },
  "soft-reset": { src: "battle/fx/soft-reset.mp4", poster: "battle/fx/soft-reset-poster.jpg" },
  "blitz-dash": { src: "battle/fx/blitz-dash.mp4", poster: "battle/fx/blitz-dash-poster.jpg" },
  "crushing-blow": { src: "battle/fx/crushing-blow.mp4", poster: "battle/fx/crushing-blow-poster.jpg" },
  "burden-slam": { src: "battle/fx/burden-slam.mp4", poster: "battle/fx/burden-slam-poster.jpg" },
  "bar-drop": { src: "battle/fx/bar-drop.mp4", poster: "battle/fx/bar-drop-poster.jpg" },
  "steady-burn": { src: "battle/fx/steady-burn.mp4", poster: "battle/fx/steady-burn-poster.jpg" },
  enemy: { src: "battle/fx/enemy.mp4", poster: "battle/fx/enemy-poster.jpg" },
  idle: { src: "battle/fight-clash.mp4", poster: "battle/fight-clash-poster.jpg" },
  fallback: { src: "battle/fx/attack.mp4", poster: "battle/fx/attack-poster.jpg" }
};
/** Hand-crafted Vega-vs-boss idle clips for the first 14 bosses (BOSSES_HAND). */
const BOSS_FX_IDS = [
  "ember-whelp", "scrap-hound", "cinder-boar", "anvil-beetle", "iron-warden",
  "rust-serpent", "coal-golem", "brass-lynx", "slag-pugilist", "forge-drake",
  "ironback", "slag-wyrm", "temper-sphinx", "quench-leviathan"
];
const BOSS_FX_SET = new Set(BOSS_FX_IDS);
function hasBossFx(bossId) {
  return !!(bossId && BOSS_FX_SET.has(bossId));
}
/** Kept for callers. Boss-fx clips are not the fight stage (they played as the same cutscene). */
function bossBattleVideo(bossId) {
  if (hasBossFx(bossId)) {
    return { src: "battle/boss-fx/" + bossId + ".mp4", poster: "battle/boss-fx/" + bossId + "-poster.jpg" };
  }
  return BATTLE_VIDEOS.idle;
}
/** Per-boss scenery + attack motion. Player commands stay the shared move FX. */
const BOSS_STAGE = {
  "ember-whelp": { scene: "coal", move: "bite", x: 156, ms: 540 },
  "scrap-hound": { scene: "junk", move: "lunge", x: 210, ms: 460 },
  "cinder-boar": { scene: "slag", move: "charge", x: 236, ms: 500 },
  "anvil-beetle": { scene: "anvil", move: "slam", x: 124, ms: 820 },
  "iron-warden": { scene: "hall", move: "punch", x: 176, ms: 480 },
  "rust-serpent": { scene: "rust", move: "coil", x: 188, ms: 720 },
  "coal-golem": { scene: "furnace", move: "slam", x: 132, ms: 880 },
  "brass-lynx": { scene: "brass", move: "pounce", x: 214, ms: 440 },
  "slag-pugilist": { scene: "pit", move: "punch", x: 198, ms: 420 },
  "forge-drake": { scene: "bellows", move: "breath", x: 168, ms: 840 },
  "ironback": { scene: "plate", move: "bash", x: 108, ms: 920 },
  "slag-wyrm": { scene: "molten", move: "breath", x: 204, ms: 760 },
  "temper-sphinx": { scene: "dusk", move: "pounce", x: 172, ms: 640 },
  "quench-leviathan": { scene: "steam", move: "bash", x: 148, ms: 900 }
};
const BOSS_STAGE_MOVES = ["bite", "lunge", "charge", "slam", "punch", "coil", "pounce", "breath", "bash"];
const BOSS_STAGE_SCENES = ["coal", "junk", "slag", "anvil", "hall", "rust", "furnace", "brass", "pit", "bellows", "plate", "molten", "dusk", "steam"];
function bossStage(bossId) {
  if (bossId && BOSS_STAGE[bossId]) return BOSS_STAGE[bossId];
  let n = 0;
  const m = /^forge-(\d+)$/.exec(bossId || "");
  if (m) n = +m[1];
  return {
    scene: BOSS_STAGE_SCENES[n % BOSS_STAGE_SCENES.length],
    move: BOSS_STAGE_MOVES[n % BOSS_STAGE_MOVES.length],
    x: 140 + (n % 5) * 18,
    ms: 520 + (n % 4) * 90
  };
}
/** Clips that depict the picked fighter instead of the shared Vega set. */
const HERO_FX_CLIP = {
  attack: ["attack.mp4", "attack-poster.jpg"],
  "attack-magic": ["attack-magic.mp4", "attack-magic-poster.jpg"],
  defend: ["defend.mp4", "defend-poster.jpg"],
  "brace-pulse": ["brace.mp4", "brace-poster.jpg"],
  "temper-strike": ["temper.mp4", "temper-poster.jpg"]
};
const HERO_FX_IDS = new Set(["pink", "blue", "green"]);
function heroFxClip(heroId, key) {
  const pair = HERO_FX_CLIP[key];
  if (!pair || !HERO_FX_IDS.has(heroId)) return null;
  return { src: "battle/hero-fx/" + heroId + "/" + pair[0], poster: "battle/hero-fx/" + heroId + "/" + pair[1] };
}
/** Player-command FX. Idle and enemy are not clips — scenery, boss art, and bossStage moves cover those.
 *  Shared battle/fx/temper.mp4 is a medieval knight placeholder and is never returned. */
function battleVideoFor(key, bossId, heroId) {
  if (!key || key === "idle" || key === "enemy") return null;
  const own = heroFxClip(heroId || "twist", key);
  if (own) return own;
  if (key === "temper-strike") return BATTLE_VIDEOS["attack-magic"];
  return BATTLE_VIDEOS[key] || null;
}
function battlePlayerStats(stats) {
  const s = stats || {};
  const STR = s.STR || 10, END = s.END || 10, AGI = s.AGI || 10, VIT = s.VIT || 10, DIS = s.DIS || 10;
  return {
    maxHp: Math.round(70 + VIT * 9),
    atk: Math.round(6 + STR * 1.4),
    def: Math.round(3 + END * 0.55 + VIT * 0.25),
    crit: Math.min(0.45, 0.05 + AGI * 0.006),
    acc: Math.min(0.98, 0.78 + DIS * 0.004),
    resist: Math.min(0.35, DIS * 0.004),
    staminaMax: Math.max(3, 2 + Math.floor(END / 8))
  };
}

window.HG_GAME = { STATS, RANKS, xpToNext, MAX_LEVEL, LEVEL_POINTS, LEVEL_ALL_STATS, DAILY_POINTS, SETS_PER_STAT, CLASS_LEVEL, MAX_SHIELDS, dailyClearXp, dailyXpCap, CARDIO, statFor, setXp, dailyQuest, rankTrial, CLASS_TRIAL, CLASSES, SKILL_PLANS, SKILLS, VARIATIONS, ACH, newGame, BATTLE_FIRST_UNLOCK, BATTLE_UNLOCK_STEP, BATTLE_LIST_AHEAD, battleUnlockLevel, BOSSES_HAND, HEROES, heroById, activeHero, heroLogArt, heroBattleArt, HERO_ART, HERO_BATTLE_ART, HERO_SHOWCASE_ART, BOSS_ART_FALLBACK, makeBoss, bossById, listBosses, BATTLE_BASICS, BATTLE_SKILL_MOVES, battleMoves, battlePlayerStats, BATTLE_VIDEOS, BOSS_FX_IDS, hasBossFx, bossBattleVideo, bossStage, battleVideoFor };
})();
