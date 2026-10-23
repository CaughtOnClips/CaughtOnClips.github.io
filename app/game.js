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
  { id: "iron-core", line: "STR", node: "I", name: "Iron Core I", desc: "Adds the Core Forge plan (2 wks).", req: { level: 2, stat: { STR: 11 } } },
  { id: "push-mastery", line: "STR", node: "II", pro: true, name: "Push Mastery", desc: "Adds Push Mastery and harder push-up variation tips during workouts.", req: { level: 6, stat: { STR: 16 } } },
  { id: "loaded-carry", line: "STR", node: "III", pro: true, name: "Loaded Carry", desc: "Adds the Loaded Carry dumbbell plan.", req: { level: 15, stat: { STR: 30 }, equip: "dumbbells" } },
  { id: "barbell-basics", line: "STR", node: "IV", pro: true, name: "Barbell Basics", desc: "Adds the Barbell Basics gym plan.", req: { level: 20, stat: { STR: 36 }, equip: "gym" } },
  { id: "engine-room", line: "END", node: "I", name: "Engine Room", desc: "Adds 20-minute conditioning circuits.", req: { level: 3, stat: { END: 12 } } },
  { id: "5k-builder", line: "END", node: "II", pro: true, name: "5K Builder", desc: "Adds a walk-run plan that builds to 5K.", req: { level: 10, stat: { END: 22 } } },
  { id: "spring-step", line: "AGI", node: "I", name: "Spring Step", desc: "Adds plyometric basics.", req: { level: 4, stat: { AGI: 13 } } },
  { id: "sprint-intervals", line: "AGI", node: "II", pro: true, name: "Sprint Intervals", desc: "Adds short sprint sessions.", req: { level: 12, stat: { AGI: 24 } } },
  { id: "mobility-reset", line: "VIT", node: "I", name: "Mobility Reset", desc: "Adds short mobility flows.", req: { level: 2, stat: { VIT: 11 } } },
  { id: "deload-week", line: "VIT", node: "II", pro: true, name: "Deload Week", desc: "Adds a lighter recovery week.", req: { level: 8, stat: { VIT: 18 } } },
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
    missNotice: null, queue: [], xpDay: { date: null, amt: 0 }, name: "" };
}
window.HG_GAME = { STATS, RANKS, xpToNext, LEVEL_POINTS, LEVEL_ALL_STATS, DAILY_POINTS, SETS_PER_STAT, CLASS_LEVEL, MAX_SHIELDS, dailyClearXp, dailyXpCap, CARDIO, statFor, setXp, dailyQuest, rankTrial, CLASS_TRIAL, CLASSES, SKILL_PLANS, SKILLS, VARIATIONS, ACH, newGame };
})();
