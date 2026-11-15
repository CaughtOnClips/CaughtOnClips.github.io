// Hardgrain workout library: 48 original single-session workouts (4 equipment types x 3 levels x 4).
// Programming follows public guidelines (ACSM progression models; NSCA rest/rep ranges; ACE warm-up/cool-down):
// Beginner ~2-3 sets of 8-15 reps, 45-75 s rest · Intermediate 3-4 sets of 6-12, 60-120 s · Advanced 4-6 sets incl. heavy 3-6 reps with 2-4 min rest.
// Fields match plans.js: n, s, r or t (sec), rest, c (cues), side, w (track weight), st (stat override).
(function () {
"use strict";
const S = 1; // per-side marker
const X = (n, s, x, rest, cue, side) => Object.assign({ n, s, rest, c: cue.split("; ").map(x => x.charAt(0).toUpperCase() + x.slice(1)) }, typeof x === "number" ? { r: x } : { t: parseInt(x) }, side ? { side: true } : {});
const W = (id, name, focus, mins, desc, ex, warm, cool) => ({ id, name, focus, mins, desc, ex, warm, cool });

const WARM = {
  strength: "5 min easy cardio, then leg swings, arm circles, hip hinges and 1-2 light ramp-up sets of the first exercise",
  lower: "5 min brisk walk or bike, then bodyweight squats, leg swings, glute bridges and walking lunges",
  upper: "5 min easy cardio, then arm circles, band or towel pull-aparts, scap push-ups and a light set of the first press",
  cond: "5 min building from easy to moderate pace: march, jacks, inchworms and a few practice reps of each move",
  core: "3-5 min cat-cow, dead bug reach and bird dog to switch the trunk on",
  power: "8 min: easy jog or skip, leg swings, lunges with reach, then 3 practice jumps or throws at half effort"
};
const COOL = {
  strength: "5 min easy walk, then 30 s stretches for hips, hamstrings, chest and lats; slow nose breathing",
  lower: "5 min easy walk, then quad, hamstring, hip-flexor and calf stretches, 30 s each side",
  upper: "Easy walk, then doorway chest stretch, lat stretch and thread-the-needle, 30 s each",
  cond: "5 min walk until breathing settles, then child's pose and hip-flexor stretch",
  core: "Child's pose, cobra and supine twist, 30 s each, slow breathing",
  power: "5 min easy walk, then hip-flexor, calf and hamstring stretches"
};
const kind = f => /HIIT|Conditioning/.test(f) ? "cond" : /Core/.test(f) ? "core" : /Power/.test(f) ? "power" : /Lower/.test(f) ? "lower" : /Upper|Push|Pull/.test(f) ? "upper" : "strength";

const CATS = {
none: {
  label: "Bodyweight", blurb: "No equipment needed. Home, park or hotel room.",
  Beginner: [
    W("foundation-flow", "Foundation Flow", "Full body", 20, "Five basic patterns: squat, push, bridge, brace and plank. Learn clean form before adding reps.", [
      X("Bodyweight squat", 3, 12, 60, "Sit hips back and down; knees track over toes"),
      X("Incline push-up (hands on counter)", 3, 10, 60, "Body in one straight line; lower chest to the edge"),
      X("Glute bridge", 3, 12, 45, "Drive through heels; squeeze glutes at the top"),
      X("Bird dog", 2, 8, 45, "Reach long; keep hips level", S),
      X("Forearm plank", 3, "20", 45, "Elbows under shoulders; brace and squeeze glutes")]),
    W("lower-basics", "Lower Body Basics", "Lower", 20, "Squat, lunge and bridge patterns to build leg strength and balance.", [
      X("Box squat to chair", 3, 12, 60, "Tap the seat lightly; stand without rocking"),
      X("Reverse lunge", 2, 8, 60, "Step back softly; front shin stays fairly upright", S),
      X("Glute bridge (2 s hold)", 3, 12, 45, "Hold the top two seconds; ribs down"),
      X("Calf raise", 3, 15, 45, "Rise high; lower slowly"),
      X("Wall sit", 2, "30", 45, "Back flat on wall; knees over ankles")]),
    W("upper-basics", "Upper Body Basics", "Push", 18, "Gentle pushing and upper-back work to build shoulder strength safely.", [
      X("Wall push-up", 3, 12, 45, "Hands at chest height; body straight"),
      X("Incline push-up", 3, 8, 60, "Elbows about 45°; press the surface away"),
      X("Prone Y-T-W raise", 2, 8, 45, "Face down; squeeze shoulder blades"),
      X("Superman hold", 3, "20", 45, "Lift chest and legs a little; neck long"),
      X("Plank shoulder tap (knees down)", 2, 16, 45, "Wide knees; hips stay still")]),
    W("steady-engine", "Steady Engine", "Conditioning", 18, "Low-impact circuit to raise your heart rate without jumping.", [
      X("March in place", 2, "60", 30, "Knees to hip height; swing arms"),
      X("Step jack", 3, "30", 30, "Step out and in; arms overhead"),
      X("Squat to calf raise", 3, 12, 45, "Squat, stand, rise onto toes"),
      X("Step-back burpee (no jump)", 3, 6, 60, "Step to plank and back; steady pace"),
      X("Dead bug", 2, 8, 30, "Low back pressed down; slow reach", S)])
  ],
  Intermediate: [
    W("push-press-bw", "Push Power", "Push", 28, "Push-up variations and dips with slow lowering to build chest, shoulders and triceps.", [
      X("Push-up", 4, 12, 75, "Brace; chest to a fist off the floor"),
      X("Pike push-up", 3, 8, 75, "Hips high; head toward floor in front of hands"),
      X("Tempo push-up (3 s down)", 3, 8, 75, "Three-second lower; pause at bottom"),
      X("Chair dip", 3, 12, 60, "Shoulders down; elbows to about 90°"),
      X("Hollow body hold", 3, "30", 45, "Low back down; bend knees to scale")]),
    W("single-leg-strength", "Single-Leg Strength", "Lower", 30, "One leg at a time makes bodyweight hard enough to build real leg strength.", [
      X("Bulgarian split squat (rear foot on couch)", 4, 10, 75, "Lower straight down; front heel planted", S),
      X("Single-leg glute bridge", 3, 12, 60, "Hips level; pause at the top", S),
      X("Lateral lunge", 3, 10, 60, "Sit into one hip; other leg straight", S),
      X("Single-leg Romanian deadlift (bodyweight)", 3, 10, 60, "Hinge with a flat back; hips square", S),
      X("Single-leg calf raise", 3, 15, 45, "Full stretch; rise high", S)]),
    W("table-pull", "Table Pull & Core", "Pull", 26, "Back and core work using a sturdy table for rows. Test the table first.", [
      X("Table row (under a sturdy table)", 4, 10, 75, "Body straight; pull chest to the edge"),
      X("Reverse snow angel", 3, 12, 45, "Face down; sweep arms with thumbs up"),
      X("Prone Y-T-W raise", 3, 10, 45, "Squeeze shoulder blades each letter"),
      X("Side plank", 3, "30", 30, "Hips lifted in line with shoulders", S),
      X("Reverse crunch", 3, 12, 45, "Curl hips up; no swinging")]),
    W("burner-20-10", "Interval Burner", "HIIT", 24, "Short hard intervals with brief rests. Keep form sharp even when tired.", [
      X("Jumping jacks", 4, "40", 20, "Land softly; full arm reach"),
      X("Squat jump", 4, 10, 40, "Land quiet with bent knees; reset each rep"),
      X("Mountain climbers", 4, "30", 30, "Hips low; drive knees fast"),
      X("Burpee", 4, 8, 45, "Chest to floor; jump and reach"),
      X("Plank", 2, "45", 30, "Squeeze glutes; steady breath")])
  ],
  Advanced: [
    W("gravity-push", "Gravity Push", "Upper", 35, "Hard bodyweight pressing: decline, archer and elevated pike push-ups.", [
      X("Decline push-up (feet on chair)", 4, 12, 90, "Body rigid; chest to floor"),
      X("Archer push-up", 4, 6, 90, "Shift to one arm; other arm stays long", S),
      X("Elevated pike push-up (feet on chair)", 4, 8, 90, "Hips over shoulders; head forward of hands"),
      X("Pseudo planche lean hold", 3, "20", 60, "Hands by hips, fingers back; lean shoulders forward"),
      X("Feet-elevated chair dip", 3, 15, 60, "Shoulders down; full lockout"),
      X("Hollow rock", 3, 15, 45, "Hold the hollow shape and rock")]),
    W("pistol-path", "Pistol Path", "Lower", 35, "Single-leg squats and explosive lunges for strong, springy legs.", [
      X("Assisted pistol squat (hold a doorframe)", 4, 6, 90, "Sit back on one leg; use hands only as needed", S),
      X("Bulgarian split squat (3 s down)", 4, 10, 90, "Slow lower; drive through front heel", S),
      X("Single-leg hip thrust (shoulders on couch)", 4, 12, 60, "Ribs down; lock hips at top", S),
      X("Jumping lunge", 3, 8, 60, "Switch in the air; land soft", S),
      X("Single-leg calf raise (pause at top)", 3, 20, 45, "Pause one second at top", S)]),
    W("plyo-power", "Plyo Power", "Power", 30, "Explosive jumps and push-ups. Full rest so every rep is fast and crisp.", [
      X("Broad jump", 5, 4, 90, "Swing arms; stick the landing"),
      X("Tuck jump", 4, 6, 75, "Knees to chest; land quietly"),
      X("Skater hops", 4, 10, 60, "Bound side to side; stick each landing", S),
      X("Clap push-up (or explosive push-up)", 4, 6, 90, "Push hard enough for hands to leave the floor"),
      X("Lateral bound", 3, 6, 60, "Push off the outside leg; hold the landing", S)]),
    W("ladder-of-fire", "Ladder of Fire", "HIIT", 30, "High-volume conditioning circuit for a big engine. Scale reps before form breaks.", [
      X("Burpee", 5, 10, 45, "Chest to floor; jump and reach"),
      X("Jump squat", 5, 15, 45, "Smooth, quiet landings"),
      X("Push-up", 5, 15, 45, "Full range; body straight"),
      X("Mountain climbers", 5, "40", 30, "Hips low; fast knees"),
      X("Hollow body hold", 3, "40", 30, "Low back down; arms overhead")])
  ]
},
dumbbells: {
  label: "Dumbbells", blurb: "A pair of dumbbells, plus your bodyweight.",
  Beginner: [
    W("db-starter", "Dumbbell Starter", "Full body", 25, "Five big movements with light dumbbells. Pick a weight you could lift 2-3 more reps with.", [
      X("Goblet squat", 3, 10, 60, "Hold the bell at your chest; sit between heels"),
      X("Dumbbell floor press", 3, 10, 60, "Upper arms touch floor; press straight up"),
      X("One-arm dumbbell row", 3, 10, 60, "Flat back; pull elbow to hip", S),
      X("Dumbbell Romanian deadlift", 3, 10, 60, "Push hips back; bells slide down thighs"),
      X("Dead bug", 2, 8, 45, "Low back pressed down", S)]),
    W("db-lower-builder", "Lower Body Builder", "Lower", 25, "Simple dumbbell leg session: squat, lunge, hinge and bridge.", [
      X("Goblet squat", 3, 12, 60, "Chest tall; knees out"),
      X("Dumbbell reverse lunge", 3, 8, 60, "Step back softly; torso tall", S),
      X("Dumbbell glute bridge", 3, 12, 45, "Bell on hips; squeeze at top"),
      X("Dumbbell Romanian deadlift", 3, 10, 60, "Soft knees; feel hamstrings stretch"),
      X("Dumbbell calf raise", 3, 15, 45, "Full range; slow lower")]),
    W("db-upper-builder", "Upper Body Builder", "Upper", 25, "Press, row and arms with light dumbbells to build a base.", [
      X("Dumbbell bench press (bench or floor)", 3, 10, 60, "Shoulder blades pinched; bells over chest"),
      X("Bent-over dumbbell row", 3, 10, 60, "Hinge 45°; pull to ribs"),
      X("Seated dumbbell shoulder press", 3, 10, 60, "Ribs down; press overhead"),
      X("Dumbbell biceps curl", 2, 12, 45, "Elbows pinned; no swinging"),
      X("Dumbbell overhead triceps extension", 2, 12, 45, "Elbows point up; lower behind head")]),
    W("db-circuit", "Dumbbell Circuit", "Conditioning", 20, "Light-dumbbell circuit with short rests to get your heart rate up.", [
      X("Dumbbell deadlift", 3, 12, 30, "Bells by shins; stand tall"),
      X("Dumbbell squat to press", 3, 10, 30, "Squat, stand and press in one motion"),
      X("Renegade row (knees down)", 3, 6, 30, "Wide knees; hips square", S),
      X("Step-up (bodyweight)", 3, 8, 30, "Whole foot on the step; drive up", S),
      X("Dumbbell farmer carry", 3, "40", 45, "Tall posture; short quick steps")])
  ],
  Intermediate: [
    W("db-push-day", "Push Day", "Push", 35, "Chest, shoulders and triceps in the 8-12 rep zone for muscle and strength.", [
      X("Dumbbell bench press", 4, 8, 90, "Lower to chest level; press together"),
      X("Incline dumbbell press", 3, 10, 75, "Bench 30-45°; elbows about 45°"),
      X("Seated dumbbell shoulder press", 3, 10, 75, "No arching; full lockout"),
      X("Dumbbell lateral raise", 3, 12, 45, "Lead with elbows; stop at shoulder height"),
      X("Dumbbell skull crusher", 3, 12, 60, "Elbows still; lower to temples")]),
    W("db-pull-day", "Pull Day", "Pull", 35, "Back, rear shoulders and biceps for posture and pulling strength.", [
      X("One-arm dumbbell row", 4, 10, 75, "Pull to hip; pause at top", S),
      X("Dumbbell pullover", 3, 12, 60, "Slight elbow bend; feel lats stretch"),
      X("Dumbbell rear-delt fly", 3, 15, 45, "Hinge forward; arms out wide"),
      X("Dumbbell hammer curl", 3, 12, 45, "Palms face in; elbows pinned"),
      X("Dumbbell shrug", 3, 15, 45, "Shoulders straight up; pause")]),
    W("db-leg-day", "Leg Day", "Lower", 35, "Slow-tempo squats, split squats and hinges to build legs with dumbbells.", [
      X("Goblet squat (3 s down)", 4, 10, 90, "Three-second lower; drive up"),
      X("Dumbbell Bulgarian split squat", 3, 10, 75, "Rear foot on bench; lower straight down", S),
      X("Dumbbell Romanian deadlift", 4, 10, 90, "Hips back; flat back"),
      X("Dumbbell step-up", 3, 10, 60, "Drive through the top foot", S),
      X("Single-leg dumbbell calf raise", 3, 15, 45, "Full stretch; rise high", S)]),
    W("db-complex", "Complex Conditioning", "HIIT", 25, "Full-body dumbbell moves back-to-back. Choose a weight you can move with control.", [
      X("Dumbbell thruster", 4, 10, 45, "Squat deep; use legs to press"),
      X("Dumbbell renegade row", 4, 6, 45, "Wide feet; don't twist", S),
      X("Dumbbell alternating snatch", 4, 8, 45, "Hinge and pop hips; punch overhead", S),
      X("Dumbbell reverse lunge", 4, 8, 45, "Smooth reps; torso tall", S),
      X("Plank dumbbell drag", 3, 10, 30, "Hips still as you pull the bell across", S)])
  ],
  Advanced: [
    W("db-heavy-upper", "Heavy Upper", "Upper", 40, "Heavier dumbbell presses and rows in the 6-rep range with longer rest.", [
      X("Dumbbell bench press", 5, 6, 120, "Heavy but controlled; press together"),
      X("One-arm dumbbell row (heavy)", 5, 6, 90, "Brace on bench; no torso twist", S),
      X("Standing dumbbell overhead press", 4, 6, 120, "Glutes tight; ribs down"),
      X("Incline dumbbell fly", 3, 12, 60, "Soft elbows; deep stretch"),
      X("Close-grip dumbbell press", 3, 10, 60, "Bells touching; elbows tucked"),
      X("Dumbbell Zottman curl", 3, 10, 45, "Curl up palms up; lower palms down")]),
    W("db-heavy-lower", "Heavy Lower", "Lower", 42, "Heavy front-rack squats and single-leg work for strength and size.", [
      X("Dumbbell front-rack squat", 5, 6, 120, "Bells on shoulders; elbows high"),
      X("Dumbbell single-leg Romanian deadlift", 4, 8, 90, "Hips square; long back leg", S),
      X("Dumbbell Bulgarian split squat", 4, 8, 90, "Heavy and slow; full depth", S),
      X("Dumbbell hip thrust", 4, 10, 75, "Shoulders on bench; lock hips"),
      X("Dumbbell walking lunge", 3, 10, 60, "Long steps; knee kisses floor", S)]),
    W("db-power", "Dumbbell Power", "Power", 35, "Fast, explosive dumbbell lifts with full rest. Speed over weight.", [
      X("Dumbbell hang clean", 5, 4, 90, "Pop hips; catch bells on shoulders"),
      X("Dumbbell push press", 5, 5, 90, "Dip and drive; lock out overhead"),
      X("Dumbbell jump squat (light)", 4, 5, 90, "Light bells; land soft"),
      X("Dumbbell alternating snatch", 4, 6, 75, "One fast pull to lockout", S),
      X("Explosive push-up", 3, 6, 75, "Push the floor away hard")]),
    W("db-core-armor", "Core Armor", "Core", 30, "Loaded core: get-ups, carries and anti-rotation work.", [
      X("Dumbbell Turkish get-up", 3, 3, 60, "Eyes on the bell; move step by step", S),
      X("Dumbbell suitcase carry", 3, "40", 45, "One bell; don't lean", S),
      X("Dumbbell renegade row", 3, 8, 60, "Feet wide; hips square", S),
      X("Dumbbell dead bug", 3, 10, 45, "Bell over chest; low back down", S),
      X("Dumbbell Russian twist", 3, 16, 45, "Rotate from ribs; slow"),
      X("Hollow body hold", 3, "40", 30, "Arms overhead; low back down")])
  ]
},
gym: {
  label: "Full gym", blurb: "Barbells, machines and cables.",
  Beginner: [
    W("machine-circuit", "Machine Circuit", "Full body", 35, "Machines make it easy to learn safely. Set each seat so joints line up with the pivot.", [
      X("Leg press", 3, 12, 90, "Feet mid-platform; don't lock knees hard"),
      X("Chest press machine", 3, 12, 75, "Handles at mid-chest; press smoothly"),
      X("Seated cable row", 3, 12, 75, "Chest tall; elbows back"),
      X("Lat pulldown", 3, 12, 75, "Pull bar to upper chest; no leaning back"),
      X("Plank", 3, "30", 45, "Brace; squeeze glutes")]),
    W("gym-lower-basics", "Gym Lower Basics", "Lower", 35, "Squat pattern plus leg machines to build a solid base.", [
      X("Goblet squat", 3, 10, 75, "Chest tall; sit deep"),
      X("Lying leg curl", 3, 12, 60, "Hips down; curl and squeeze"),
      X("Leg extension", 3, 12, 60, "Pause at the top; lower slowly"),
      X("Barbell glute bridge", 3, 12, 75, "Pad the bar; drive hips up"),
      X("Standing calf raise machine", 3, 15, 45, "Full stretch; pause at top")]),
    W("gym-upper-basics", "Gym Upper Basics", "Upper", 35, "Balanced press-and-pull session with machines, cables and dumbbells.", [
      X("Machine shoulder press", 3, 10, 75, "Back on pad; press overhead"),
      X("Lat pulldown", 3, 10, 75, "Elbows down to ribs"),
      X("Dumbbell bench press", 3, 10, 75, "Control the lower"),
      X("Cable face pull", 3, 15, 45, "Rope to face; elbows high"),
      X("Cable triceps pushdown", 2, 12, 45, "Elbows pinned at sides"),
      X("Cable biceps curl", 2, 12, 45, "No swinging")]),
    W("cardio-intervals", "Cardio Machine Intervals", "Conditioning", 25, "Easy-to-moderate intervals on the bike and rower. Work at a hard-but-talkable effort.", [
      X("Bike warm-up (easy)", 1, "180", 30, "Easy spin; build slowly"),
      X("Bike interval (hard)", 6, "30", 60, "Push hard but stay seated"),
      X("Row machine", 4, "60", 60, "Legs, then body, then arms"),
      X("Sled push (light)", 4, "20", 60, "Low body angle; drive legs"),
      X("Incline treadmill walk", 1, "300", 0, "Steady pace; don't hold the rails")])
  ],
  Intermediate: [
    W("barbell-push", "Barbell Push", "Push", 45, "Bench and overhead press for strength, then accessories for muscle.", [
      X("Barbell bench press", 4, 6, 150, "Shoulder blades pinched; bar to mid-chest"),
      X("Overhead press", 4, 8, 120, "Glutes tight; head through at top"),
      X("Incline dumbbell press", 3, 10, 90, "Bench 30-45°"),
      X("Cable lateral raise", 3, 15, 45, "Lead with elbow; slow lower"),
      X("Dips", 3, 10, 75, "Slight lean; upper arms to parallel"),
      X("Rope pushdown", 3, 12, 45, "Split the rope at bottom")]),
    W("barbell-pull", "Barbell Pull", "Pull", 45, "Deadlifts, pull-ups and rows for a strong back.", [
      X("Barbell deadlift", 4, 5, 180, "Bar over mid-foot; push the floor away"),
      X("Pull-up (or assisted)", 4, 8, 120, "Full hang to chin over bar"),
      X("Barbell row", 3, 8, 90, "Hinge 45°; pull to lower ribs"),
      X("Face pull", 3, 15, 45, "Elbows high; squeeze upper back"),
      X("EZ-bar curl", 3, 10, 60, "Elbows still; full range")]),
    W("squat-day", "Squat Day", "Lower", 45, "Back squat for strength, plus hinge and single-leg work.", [
      X("Barbell back squat", 4, 6, 150, "Brace hard; hit depth with control"),
      X("Barbell Romanian deadlift", 3, 8, 120, "Bar slides down thighs; flat back"),
      X("Dumbbell walking lunge", 3, 10, 75, "Long steps; torso tall", S),
      X("Lying leg curl", 3, 12, 60, "Slow lower"),
      X("Seated calf raise", 3, 15, 45, "Full stretch at bottom")]),
    W("engine-builder", "Engine Builder", "Conditioning", 30, "Mixed machine and sled intervals for work capacity.", [
      X("Row machine", 5, "60", 60, "Strong leg drive"),
      X("Sled push", 5, "20", 60, "Arms locked; drive legs"),
      X("Air bike interval", 5, "20", 60, "All-out but smooth"),
      X("Battle rope waves", 4, "30", 45, "Athletic stance; fast arms"),
      X("Box step-up", 3, 10, 45, "Whole foot on box", S)])
  ],
  Advanced: [
    W("max-lower", "Max Strength Lower", "Lower", 55, "Heavy triples on the squat with full rest, then strong accessories.", [
      X("Barbell back squat (heavy)", 5, 3, 180, "Big breath and brace each rep"),
      X("Barbell Romanian deadlift", 4, 6, 150, "Hips back; bar close"),
      X("Dumbbell Bulgarian split squat", 3, 8, 90, "Full depth; controlled", S),
      X("Nordic curl (or glute-ham raise)", 3, 6, 90, "Lower as slowly as you can"),
      X("Hanging leg raise", 3, 10, 60, "No swinging; curl pelvis up")]),
    W("max-upper", "Max Strength Upper", "Upper", 55, "Heavy bench, weighted pull-ups and push press for top-end strength.", [
      X("Barbell bench press (heavy)", 5, 3, 180, "Tight arch; leg drive"),
      X("Weighted pull-up", 5, 4, 150, "Full hang; chin over bar"),
      X("Push press", 4, 5, 150, "Dip and drive; lock out"),
      X("Pendlay row", 4, 6, 120, "Bar from floor each rep; flat back"),
      X("Weighted dips", 3, 8, 90, "Upper arms to parallel")]),
    W("athletic-power", "Athletic Power", "Power", 45, "Olympic-style pull, jumps and throws. Quality reps, full recovery.", [
      X("Hang power clean", 6, 3, 150, "Jump the bar up; fast elbows"),
      X("Box jump", 5, 3, 90, "Land soft; step down"),
      X("Trap bar deadlift", 4, 4, 180, "Push the floor; stand tall"),
      X("Medicine ball slam", 4, 8, 60, "Reach tall; slam with the whole body"),
      X("Pallof press", 3, 10, 45, "Resist rotation; press straight out", S)]),
    W("forge-full-body", "Forge Full Body", "Full body", 50, "High-volume full-body session for muscle. Keep 1-2 reps in reserve.", [
      X("Barbell front squat", 4, 6, 150, "Elbows high; upright torso"),
      X("Incline barbell bench", 4, 8, 120, "Bar to upper chest"),
      X("Chest-supported row", 4, 10, 90, "Chest on pad; squeeze back"),
      X("Barbell Romanian deadlift", 3, 8, 120, "Flat back; hamstrings loaded"),
      X("Cable fly", 3, 12, 60, "Soft elbows; hug the tree"),
      X("Ab wheel rollout", 3, 10, 60, "Ribs down; roll only as far as you can control")])
  ]
},
kettlebells: {
  label: "Kettlebells", blurb: "One or two kettlebells. Swings, cleans, presses and carries.",
  Beginner: [
    W("kb-basics", "Kettlebell Basics", "Full body", 25, "The core kettlebell patterns with one light bell.", [
      X("Kettlebell deadlift", 3, 10, 60, "Bell between feet; flat back"),
      X("Kettlebell goblet squat", 3, 10, 60, "Hold the horns at chest; sit deep"),
      X("Kettlebell single-arm row", 3, 10, 60, "Pull elbow to hip", S),
      X("Kettlebell halo", 2, 6, 45, "Circle the bell around your head; ribs down", S),
      X("Kettlebell suitcase carry", 3, "30", 45, "Stand tall; don't lean", S)]),
    W("kb-hinge-school", "Hinge School", "Lower", 25, "Learn to hinge, then the two-hand swing. Hips do the work, not arms.", [
      X("Kettlebell deadlift", 3, 12, 60, "Push hips back; stand by squeezing glutes"),
      X("Kettlebell Romanian deadlift", 3, 10, 60, "Soft knees; bell close to legs"),
      X("Two-hand kettlebell swing (light)", 4, 10, 60, "Hike back; snap hips; bell floats to chest"),
      X("Kettlebell glute bridge", 3, 12, 45, "Bell on hips; pause at top"),
      X("Kettlebell goblet reverse lunge", 2, 8, 60, "Bell at chest; step back softly", S)]),
    W("kb-press-row", "Press & Row", "Upper", 25, "Single-arm presses and rows for shoulder strength and balance.", [
      X("Kettlebell floor press", 3, 10, 60, "Upper arm to floor; press straight up", S),
      X("Kettlebell bent-over row", 3, 10, 60, "Flat back; elbow to hip", S),
      X("Half-kneeling kettlebell press", 3, 8, 60, "Squeeze glute of the down knee", S),
      X("Kettlebell halo", 2, 8, 45, "Slow circles; tight core", S),
      X("Kettlebell curl", 2, 12, 45, "Hold the horns; elbows still")]),
    W("kb-swing-intervals", "Swing Intervals", "Conditioning", 20, "Short sets of swings with rest, plus carries. Stop a set when form slips.", [
      X("Two-hand kettlebell swing", 8, 15, 45, "Hips snap; arms just guide"),
      X("Kettlebell goblet squat", 3, 10, 45, "Smooth pace"),
      X("Kettlebell farmer carry", 3, "40", 45, "Tall posture; quick steps"),
      X("Dead bug", 2, 8, 30, "Low back down", S)])
  ],
  Intermediate: [
    W("kb-single-arm", "Single-Arm Strength", "Full body", 35, "Clean and press, rack squats and get-ups. One bell, lots of strength.", [
      X("Kettlebell clean and press", 4, 6, 90, "Clean to rack, then press; bell rolls, doesn't flip", S),
      X("Single-arm front-rack squat", 4, 8, 75, "Bell in rack; stay upright", S),
      X("Kettlebell single-leg Romanian deadlift", 3, 8, 60, "Hips square; reach long", S),
      X("Gorilla row (two kettlebells)", 3, 10, 60, "Hinge over bells; row one at a time", S),
      X("Turkish get-up", 3, 2, 60, "Eyes on the bell; slow steps", S)]),
    W("kb-lower", "Kettlebell Lower", "Lower", 35, "Heavy swings, paused squats and single-leg work for strong hips and legs.", [
      X("Two-hand kettlebell swing (heavy)", 5, 15, 60, "Powerful hip snap; float to chest"),
      X("Kettlebell goblet squat (pause)", 4, 10, 75, "Two-second pause at the bottom"),
      X("Kettlebell Bulgarian split squat", 3, 8, 75, "Bell at chest; lower straight down", S),
      X("Kettlebell single-leg Romanian deadlift", 3, 8, 60, "Flat back; balance", S),
      X("Goblet Cossack squat", 3, 6, 60, "Shift side to side; heel down", S)]),
    W("kb-push-upper", "Kettlebell Push", "Push", 30, "Pressing strength with push press, floor press and bottoms-up control.", [
      X("Kettlebell push press", 4, 8, 75, "Quick dip; drive bell overhead", S),
      X("Kettlebell floor press", 4, 10, 60, "Pause with elbow on the floor", S),
      X("Bottoms-up kettlebell press", 3, 6, 60, "Grip hard; bell upside down; slow", S),
      X("Kettlebell renegade row", 3, 8, 60, "Feet wide; hips still", S),
      X("Kettlebell overhead triceps extension", 3, 12, 45, "Elbows pointing up")]),
    W("kb-core", "Kettlebell Core", "Core", 25, "Get-ups, windmills and carries for a strong, stable trunk.", [
      X("Turkish get-up", 3, 3, 60, "Locked arm; eyes on bell", S),
      X("Kettlebell windmill", 3, 5, 60, "Bell overhead; hinge to the side", S),
      X("Kettlebell suitcase carry", 3, "40", 45, "No leaning", S),
      X("Kettlebell Russian twist", 3, 16, 45, "Rotate from the ribs"),
      X("Plank kettlebell pull-through", 3, 8, 45, "Hips still as the bell crosses", S)])
  ],
  Advanced: [
    W("kb-double-strength", "Double Bell Strength", "Full body", 45, "Two heavy bells: front squats, clean and press and rows.", [
      X("Double kettlebell front squat", 5, 5, 120, "Bells in rack; elbows in"),
      X("Double kettlebell clean and press", 5, 5, 120, "Clean, brace, press both"),
      X("Double kettlebell row", 4, 8, 90, "Flat back; pull to hips"),
      X("Double kettlebell swing", 4, 10, 75, "Wide stance; strong snap"),
      X("Turkish get-up (heavy)", 3, 2, 75, "Own every position", S)]),
    W("kb-snatch-engine", "Snatch Engine", "HIIT", 30, "Snatches, thrusters and burpees for a serious engine. Protect your hands.", [
      X("Kettlebell snatch", 6, 8, 60, "Swing, high pull, punch through; soft catch", S),
      X("Single-arm kettlebell thruster", 4, 8, 60, "Squat and drive into the press", S),
      X("Burpee", 4, 8, 45, "Chest to floor; jump and reach"),
      X("Kettlebell high pull", 4, 10, 45, "Hip snap, elbow high", S),
      X("Kettlebell farmer carry", 3, "45", 45, "Heavy bells; tall posture")]),
    W("kb-power", "Kettlebell Power", "Power", 40, "Heavy swings and double cleans with full rest. Every rep explosive.", [
      X("Two-hand kettlebell swing (heavy)", 6, 10, 90, "Max power each rep"),
      X("Double kettlebell clean", 5, 5, 90, "Hips snap; bells land softly in rack"),
      X("Kettlebell push press (heavy)", 5, 5, 90, "Drive with legs", S),
      X("Broad jump", 4, 4, 75, "Swing arms; stick landing"),
      X("Single-arm kettlebell swing", 4, 10, 60, "Square shoulders; hips drive", S)]),
    W("kb-steel-core", "Steel Core", "Core", 30, "Heavy get-ups, windmills and overhead carries for bulletproof stability.", [
      X("Turkish get-up (heavy)", 4, 2, 90, "Slow and owned; arm locked", S),
      X("Kettlebell windmill", 3, 6, 60, "Eyes up; hinge to side", S),
      X("Single-arm overhead carry", 3, "40", 60, "Arm locked, ribs down", S),
      X("Hollow body kettlebell hold", 3, "30", 45, "Bell over chest; low back down"),
      X("Kettlebell renegade row", 3, 8, 60, "Feet wide; no twist", S)])
  ]
}
};

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const BW = /(plank|hold|burpee|bike|row machine|treadmill|jump|broad|box|battle|hollow|dead bug|push-up|pull-up(?! )|dips$|leg raise|nordic|step-up \(bodyweight\)|sled|rope|slam|rollout|pallof)/i;
const plans = [];
for (const eq of Object.keys(CATS)) {
  const C = CATS[eq];
  LEVELS.forEach(lv => {
    const id = `lib-${eq}-${lv.toLowerCase()}`;
    const workouts = C[lv].map(w => {
      const k = kind(w.focus);
      const ex = w.ex.map(e => {
        const o = Object.assign({}, e);
        if (eq !== "none" && !o.t && (!BW.test(o.n) || /weighted/i.test(o.n))) o.w = true;
        const base = window.HG_GAME ? window.HG_GAME.statFor(o.n) : null;
        if (/HIIT|Conditioning|Core/.test(w.focus) && (!base || base === "STR")) o.st = "END";
        return o;
      });
      return Object.assign({}, w, { id: `${eq}-${w.id}`, ex, level: lv, equip: eq, warm: w.warm || WARM[k], cool: w.cool || COOL[k] });
    });
    plans.push({ id, lib: true, name: `${C.label} · ${lv}`, equip: eq, level: lv, weeks: 4, perWeek: 3, goal: ["strength", "fit", "muscle", "fat"], blurb: `${C.blurb} Four ${lv.toLowerCase()} workouts with different focuses.`, workouts });
  });
}
window.HG_LIB_PLANS = plans;
window.HG_EQUIP_LABEL = Object.assign(window.HG_EQUIP_LABEL || {}, { kettlebells: "Kettlebells" });
})();
