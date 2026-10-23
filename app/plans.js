// Guided plan content. Original text only; no third-party media.
// Exercise fields: n=name, s=sets, r=reps, t=seconds (timed), rest=seconds, side=true if per side, w=true if weight is tracked, c=form cues
(function(){
const E = (n, s, x, rest, c, opts={}) => Object.assign({ n, s, rest, c }, typeof x === "number" ? { r: x } : { t: parseInt(x) }, opts);

window.HG_PLANS = [
// ---------------- NO EQUIPMENT ----------------
{
  id: "home-foundations", name: "Home Foundations", equip: "none", level: "Beginner", weeks: 4, perWeek: 3, goal: ["fit","fat","strength"],
  blurb: "Learn the basic movement patterns with your bodyweight. Three short full-body sessions a week.",
  workouts: [
    { id: "hf-a", name: "Day A · Full body", mins: 22, ex: [
      E("Bodyweight squat", 3, 12, 60, ["Feet shoulder-width, toes slightly out", "Sit hips back and down, chest tall", "Knees track over toes", "Drive through the whole foot to stand"]),
      E("Incline push-up (hands on couch or counter)", 3, 10, 60, ["Hands just wider than shoulders", "Body in one straight line, squeeze glutes", "Lower chest to the edge, elbows about 45°", "Press the surface away"]),
      E("Glute bridge", 3, 12, 45, ["Lie on back, knees bent, feet flat", "Push through heels to lift hips", "Squeeze glutes at the top for a second", "Don't arch the lower back"]),
      E("Bird dog", 3, 8, 45, ["On hands and knees, back flat", "Reach opposite arm and leg long", "Keep hips level, no rotating", "Pause, return slowly, switch sides"], { side: true }),
      E("Forearm plank", 3, "25", 45, ["Elbows under shoulders", "Squeeze glutes and brace your belly", "Head in line with spine", "Breathe slowly; stop if your back sags"])
    ]},
    { id: "hf-b", name: "Day B · Full body", mins: 22, ex: [
      E("Reverse lunge", 3, 8, 60, ["Step back, lower the back knee toward the floor", "Front shin stays fairly vertical", "Torso tall", "Push through the front heel to return"], { side: true }),
      E("Knee push-up", 3, 8, 60, ["Knees down, body straight from knees to head", "Lower chest between hands", "Elbows about 45° from body", "Full lockout at the top"]),
      E("Superman hold", 3, "20", 45, ["Lie face down, arms overhead", "Lift arms, chest and legs slightly", "Look at the floor, neck long", "Squeeze glutes and upper back"]),
      E("Wall sit", 3, "30", 45, ["Back flat on the wall", "Slide down until thighs are near parallel", "Knees over ankles", "Keep breathing"]),
      E("Dead bug", 3, 8, 45, ["Lie on back, arms up, knees over hips", "Press lower back into the floor", "Extend opposite arm and leg slowly", "Return and switch sides"], { side: true })
    ]},
    { id: "hf-c", name: "Day C · Conditioning", mins: 20, ex: [
      E("Marching in place", 2, "45", 30, ["Drive knees up to hip height", "Swing arms naturally", "Stay tall, light on feet"]),
      E("Squat to calf raise", 3, 10, 45, ["Squat down with chest tall", "Stand and rise onto your toes", "Lower heels with control"]),
      E("Step-back burpee (no jump)", 3, 6, 60, ["Hands to floor, step feet back to plank", "Step feet forward one at a time", "Stand tall and reach up", "Move steadily, not rushed"]),
      E("Side plank (knees down)", 2, "20", 30, ["Elbow under shoulder", "Hips lifted in line with shoulders", "Don't let hips drop"], { side: true }),
      E("Standing hip hinge (good morning)", 3, 12, 45, ["Hands on hips, soft knees", "Push hips back, flat back", "Feel a stretch in hamstrings", "Squeeze glutes to stand"])
    ]}
  ]
},
{
  id: "bodyweight-strength", name: "Bodyweight Strength", equip: "none", level: "Intermediate", weeks: 6, perWeek: 3, goal: ["strength","muscle"],
  blurb: "Harder bodyweight progressions with slow tempo and single-leg work to build real strength at home.",
  workouts: [
    { id: "bs-push", name: "Push + Core", mins: 30, ex: [
      E("Push-up", 4, 12, 75, ["Hands under shoulders, slightly wider", "Brace core and squeeze glutes", "Chest to a fist's height off the floor", "Press up to full lockout"]),
      E("Pike push-up", 3, 8, 75, ["Hips high, body in an upside-down V", "Lower the top of your head toward the floor in front of your hands", "Elbows angle back, not flared", "Press back up"]),
      E("Tempo push-up (3 s down)", 3, 8, 75, ["Count three seconds on the way down", "Pause one second at the bottom", "Push up strong", "Drop to knees if form breaks"]),
      E("Chair dip", 3, 10, 60, ["Hands on a sturdy chair edge behind you", "Shoulders down away from ears", "Bend elbows to about 90°", "Press back up; keep hips close to the chair"]),
      E("Hollow body hold", 3, "30", 45, ["Lower back pressed down", "Arms and legs extended, off the floor", "Bend knees to make it easier", "Breathe shallow, stay tight"])
    ]},
    { id: "bs-legs", name: "Legs", mins: 32, ex: [
      E("Bulgarian split squat (rear foot on couch)", 4, 10, 75, ["Front foot far enough forward to keep heel down", "Lower straight down", "Slight forward lean is fine", "Drive through front heel"], { side: true }),
      E("Jump squat", 3, 10, 75, ["Squat to a comfortable depth", "Explode up", "Land softly, knees bent", "Reset before the next rep"]),
      E("Single-leg glute bridge", 3, 12, 60, ["One foot planted, other leg up", "Drive through the planted heel", "Keep hips level", "Pause at the top"], { side: true }),
      E("Cossack squat", 3, 8, 60, ["Wide stance, toes slightly out", "Shift to one side, sitting into that hip", "Other leg straight, toes up", "Go only as deep as you can control"], { side: true }),
      E("Single-leg calf raise", 3, 15, 45, ["Hold a wall for balance", "Full stretch at the bottom", "Rise as high as possible", "Lower slowly"], { side: true })
    ]},
    { id: "bs-pull", name: "Back + Core", mins: 28, ex: [
      E("Prone Y-T-W raise", 3, 8, 60, ["Lie face down, forehead near the floor", "Lift arms into a Y, then T, then W", "Squeeze shoulder blades together", "One Y-T-W is one rep"]),
      E("Reverse snow angel", 3, 10, 60, ["Face down, arms by your sides, hovering", "Sweep arms overhead in an arc", "Keep thumbs up and arms off the floor", "Move slowly"]),
      E("Superman pulse", 3, "30", 45, ["Hold a superman position", "Pull elbows toward ribs, then reach long", "Keep the neck neutral"]),
      E("Side plank", 3, "30", 45, ["Elbow under shoulder, feet stacked", "Body in one straight line", "Push the floor away"], { side: true }),
      E("Reverse crunch", 3, 12, 45, ["Lie on back, knees bent at 90°", "Curl hips off the floor toward your chest", "Lower slowly", "Don't swing the legs"])
    ]}
  ]
},
{
  id: "home-hiit", name: "20-Minute Home Burn", equip: "none", level: "All levels", weeks: 4, perWeek: 3, goal: ["fat","fit"],
  blurb: "Short timed intervals to raise your heart rate. Work at a pace you can sustain; slow down whenever you need to.",
  workouts: [
    { id: "hh-1", name: "Interval Circuit 1", mins: 20, ex: [
      E("Jumping jacks (or step jacks)", 3, "40", 20, ["Land softly", "Arms all the way overhead", "Step side to side for a low-impact version"]),
      E("Squat", 3, "40", 20, ["Chest tall", "Hips back and down", "Smooth, steady pace"]),
      E("Mountain climbers", 3, "30", 30, ["Hands under shoulders, hips low", "Drive knees toward chest one at a time", "Slow down to keep your back flat"]),
      E("Push-up (knees if needed)", 3, "30", 30, ["Straight line head to knees or heels", "Quality over speed"]),
      E("High knees", 3, "30", 30, ["Knees to hip height", "Stay on the balls of your feet", "March instead of jog to make it easier"])
    ]},
    { id: "hh-2", name: "Interval Circuit 2", mins: 20, ex: [
      E("Skater hops", 3, "40", 20, ["Leap sideways onto one foot", "Land softly with a bent knee", "Step instead of hop to make it easier"]),
      E("Alternating reverse lunge", 3, "40", 20, ["Step back, knee toward the floor", "Alternate legs", "Stay tall"]),
      E("Plank shoulder taps", 3, "30", 30, ["Wide feet for balance", "Tap opposite shoulder", "Keep hips from rocking"]),
      E("Squat thrust", 3, "30", 30, ["Hands down, jump or step feet back", "Return feet to hands", "Stand up fully"]),
      E("Fast feet", 3, "20", 40, ["Quick small steps in place", "Stay low and light", "Pump your arms"])
    ]},
    { id: "hh-3", name: "Core Finisher", mins: 15, ex: [
      E("Bicycle crunch", 3, "30", 20, ["Lower back stays down", "Rotate shoulder toward the opposite knee", "Slow and controlled"]),
      E("Plank", 3, "40", 20, ["Elbows under shoulders", "Squeeze glutes", "Brace like someone will poke your belly"]),
      E("Flutter kicks", 3, "30", 30, ["Hands under hips", "Small fast kicks, legs straight", "Bend knees or raise legs higher to make it easier"]),
      E("Bear hold", 3, "30", 30, ["On hands and toes, knees hovering an inch off the floor", "Back flat", "Breathe steadily"])
    ]}
  ]
},
{
  id: "mobility-core", name: "Mobility & Core Reset", equip: "none", level: "Beginner", weeks: 3, perWeek: 3, goal: ["fit"],
  blurb: "Gentle sessions to move better and build a stable core. Great on rest days or for getting started.", pro: true,
  workouts: [
    { id: "mc-1", name: "Hips & Spine", mins: 15, ex: [
      E("Cat-cow", 2, 10, 20, ["On hands and knees", "Round the back, then let the belly drop", "Move with your breath"]),
      E("World's greatest stretch", 2, 5, 20, ["Lunge forward, hand inside the front foot", "Rotate and reach the other arm up", "Hold a breath at the top"], { side: true }),
      E("90/90 hip switch", 2, 8, 30, ["Sit with both knees bent at 90°", "Rotate knees side to side", "Use hands for support if needed"]),
      E("Dead bug", 3, 8, 30, ["Back pressed down", "Opposite arm and leg extend", "Slow exhale as you reach"], { side: true }),
      E("Child's pose breathing", 1, "60", 0, ["Knees wide, hips to heels", "Arms long", "Slow breaths into your back"])
    ]},
    { id: "mc-2", name: "Shoulders & Core", mins: 15, ex: [
      E("Arm circles", 2, "30", 15, ["Arms straight out to the sides", "Small circles growing larger", "Reverse halfway"]),
      E("Thread the needle", 2, 6, 20, ["On hands and knees", "Slide one arm under your body, rotating", "Then reach it to the ceiling"], { side: true }),
      E("Bird dog", 3, 8, 30, ["Opposite arm and leg long", "Hips level", "Pause at full reach"], { side: true }),
      E("Side plank (knees down)", 2, "25", 30, ["Hips lifted", "Shoulder over elbow"], { side: true }),
      E("Glute bridge hold", 2, "30", 30, ["Hips up, squeeze glutes", "Ribs down"])
    ]}
  ]
},
// ---------------- DUMBBELLS ----------------
{
  id: "db-full-body", name: "Dumbbell Full-Body", equip: "dumbbells", level: "Beginner", weeks: 6, perWeek: 3, goal: ["strength","muscle","fit"],
  blurb: "Two alternating full-body workouts with a pair of dumbbells. Add a little weight when every set feels solid.",
  workouts: [
    { id: "dbf-a", name: "Workout A", mins: 35, ex: [
      E("Goblet squat", 3, 10, 90, ["Hold one dumbbell at your chest, elbows down", "Sit between your heels", "Chest up, knees out", "Stand by driving the floor away"], { w: true }),
      E("Dumbbell floor press", 3, 10, 90, ["Lie on the floor, knees bent", "Dumbbells over chest", "Lower until upper arms touch the floor", "Press up and slightly together"], { w: true }),
      E("One-arm dumbbell row", 3, 10, 75, ["Hand and knee on a bench or chair", "Flat back, dumbbell hanging", "Pull elbow toward your hip", "Lower with control"], { w: true, side: true }),
      E("Dumbbell Romanian deadlift", 3, 10, 90, ["Soft knees, dumbbells in front of thighs", "Push hips back, keep the weights close", "Stop when hamstrings are stretched", "Squeeze glutes to stand"], { w: true }),
      E("Plank", 3, "30", 45, ["Elbows under shoulders", "Squeeze glutes", "Breathe"])
    ]},
    { id: "dbf-b", name: "Workout B", mins: 35, ex: [
      E("Dumbbell reverse lunge", 3, 8, 90, ["Dumbbells at your sides", "Step back, knee toward the floor", "Front shin fairly vertical", "Drive through the front foot"], { w: true, side: true }),
      E("Seated dumbbell shoulder press", 3, 10, 90, ["Sit tall, back supported", "Dumbbells at shoulder height", "Press up without arching", "Lower to ear level"], { w: true }),
      E("Dumbbell glute bridge", 3, 12, 60, ["Dumbbell resting on hips", "Drive through heels", "Squeeze at the top"], { w: true }),
      E("Dumbbell bent-over row", 3, 10, 75, ["Hinge forward, flat back", "Pull both elbows back", "Squeeze shoulder blades"], { w: true }),
      E("Dumbbell biceps curl", 2, 12, 60, ["Elbows pinned at your sides", "Curl without swinging", "Lower slowly"], { w: true })
    ]}
  ]
},
{
  id: "db-upper-lower", name: "Dumbbell Upper / Lower", equip: "dumbbells", level: "Intermediate", weeks: 8, perWeek: 4, goal: ["muscle","strength"],
  blurb: "Four days a week split into upper and lower body. More volume for building muscle at home.", pro: true,
  workouts: [
    { id: "dbu-u1", name: "Upper 1", mins: 45, ex: [
      E("Dumbbell bench press (bench or floor)", 4, 8, 90, ["Shoulder blades pinched back", "Lower to chest level", "Press up in a slight arc"], { w: true }),
      E("One-arm dumbbell row", 4, 10, 75, ["Pull elbow to hip", "Don't twist the torso"], { w: true, side: true }),
      E("Standing dumbbell shoulder press", 3, 8, 90, ["Brace core and glutes", "Press straight up", "Don't lean back"], { w: true }),
      E("Dumbbell lateral raise", 3, 12, 60, ["Slight bend in elbows", "Raise to shoulder height", "Lead with the elbows"], { w: true }),
      E("Hammer curl", 3, 12, 60, ["Palms facing each other", "Elbows still"], { w: true })
    ]},
    { id: "dbu-l1", name: "Lower 1", mins: 45, ex: [
      E("Goblet squat", 4, 10, 90, ["Elbows inside knees at the bottom", "Chest up"], { w: true }),
      E("Dumbbell Romanian deadlift", 4, 10, 90, ["Hips back, flat back", "Weights close to legs"], { w: true }),
      E("Dumbbell walking lunge", 3, 10, 75, ["Long steps", "Back knee toward the floor"], { w: true, side: true }),
      E("Dumbbell calf raise", 3, 15, 45, ["Full range", "Pause at the top"], { w: true }),
      E("Dead bug", 3, 8, 45, ["Lower back down", "Slow reach"], { side: true })
    ]},
    { id: "dbu-u2", name: "Upper 2", mins: 45, ex: [
      E("Dumbbell incline press (bench) or push-up", 4, 10, 90, ["Elbows about 45°", "Control the lowering"], { w: true }),
      E("Dumbbell bent-over row", 4, 10, 75, ["Hinge to about 45°", "Pull to lower ribs"], { w: true }),
      E("Arnold press", 3, 10, 75, ["Start palms facing you", "Rotate as you press"], { w: true }),
      E("Dumbbell rear-delt fly", 3, 12, 60, ["Hinge forward", "Open arms wide", "Squeeze upper back"], { w: true }),
      E("Overhead triceps extension", 3, 12, 60, ["One dumbbell held with both hands", "Elbows point forward", "Lower behind head"], { w: true })
    ]},
    { id: "dbu-l2", name: "Lower 2", mins: 45, ex: [
      E("Dumbbell Bulgarian split squat", 4, 8, 90, ["Rear foot on bench or couch", "Lower straight down"], { w: true, side: true }),
      E("Dumbbell sumo squat", 3, 12, 75, ["Wide stance, toes out", "Hold one dumbbell between legs"], { w: true }),
      E("Single-leg dumbbell RDL", 3, 8, 75, ["Hinge on one leg", "Hips square to the floor", "Hold a wall if needed"], { w: true, side: true }),
      E("Dumbbell glute bridge", 3, 12, 60, ["Squeeze at the top"], { w: true }),
      E("Side plank", 3, "30", 45, ["Body in one line"], { side: true })
    ]}
  ]
},
// ---------------- FULL GYM ----------------
{
  id: "gym-strength-basics", name: "Gym Strength Basics", equip: "gym", level: "Beginner", weeks: 8, perWeek: 3, goal: ["strength","muscle"],
  blurb: "Learn the big barbell lifts with simple A/B workouts. Start light, add small amounts of weight each week.",
  workouts: [
    { id: "gsb-a", name: "Workout A", mins: 50, ex: [
      E("Barbell back squat", 3, 5, 150, ["Bar on upper back, hands just outside shoulders", "Brace, then sit down between your hips", "Knees track over toes", "Stand up driving your back into the bar"], { w: true }),
      E("Barbell bench press", 3, 5, 150, ["Eyes under the bar, feet planted", "Shoulder blades squeezed back", "Lower to mid-chest", "Press up and slightly back; use a spotter or safety pins"], { w: true }),
      E("Seated cable row", 3, 10, 90, ["Sit tall, slight knee bend", "Pull handle to your belly", "Squeeze shoulder blades", "Don't rock your torso"], { w: true }),
      E("Leg press", 2, 12, 90, ["Feet mid-platform, shoulder-width", "Lower until knees are near 90°", "Don't lock knees hard at the top"], { w: true }),
      E("Cable or band Pallof press", 2, 10, 45, ["Stand side-on to the cable", "Press handle straight out from your chest", "Resist the rotation"], { w: true, side: true })
    ]},
    { id: "gsb-b", name: "Workout B", mins: 50, ex: [
      E("Barbell deadlift", 3, 5, 180, ["Bar over mid-foot", "Hinge and grip just outside legs", "Chest up, back flat, take the slack out", "Push the floor away; bar stays close"], { w: true }),
      E("Overhead press", 3, 5, 150, ["Bar on front of shoulders", "Squeeze glutes, brace", "Press straight up, head moves through", "Lock out overhead"], { w: true }),
      E("Lat pulldown", 3, 10, 90, ["Grip a little wider than shoulders", "Pull bar to upper chest", "Elbows drive down", "Control it back up"], { w: true }),
      E("Dumbbell walking lunge", 2, 10, 90, ["Long steps, upright torso"], { w: true, side: true }),
      E("Hanging knee raise", 2, 10, 60, ["Hang from a bar, shoulders engaged", "Lift knees to hip height", "No swinging"])
    ]}
  ]
},
{
  id: "gym-ppl", name: "Gym Push / Pull / Legs", equip: "gym", level: "Intermediate", weeks: 8, perWeek: 3, goal: ["muscle","strength"],
  blurb: "A classic split for building muscle. Run it three days a week, or twice through for six.",
  workouts: [
    { id: "ppl-push", name: "Push", mins: 55, ex: [
      E("Barbell bench press", 4, 8, 120, ["Shoulder blades back and down", "Bar to mid-chest", "Use a spotter or safety pins"], { w: true }),
      E("Incline dumbbell press", 3, 10, 90, ["Bench at about 30°", "Lower to upper chest"], { w: true }),
      E("Seated dumbbell shoulder press", 3, 10, 90, ["Back supported", "Press to just short of lockout"], { w: true }),
      E("Cable lateral raise", 3, 12, 60, ["Cable at low setting", "Raise to shoulder height", "Slow lowering"], { w: true, side: true }),
      E("Triceps rope pushdown", 3, 12, 60, ["Elbows pinned to sides", "Spread the rope at the bottom"], { w: true })
    ]},
    { id: "ppl-pull", name: "Pull", mins: 55, ex: [
      E("Pull-up or assisted pull-up", 4, 6, 120, ["Start from a dead hang", "Pull chest toward the bar", "Lower all the way"], { w: true }),
      E("Barbell row", 3, 8, 120, ["Hinge to about 45°, flat back", "Pull bar to lower ribs", "No jerking"], { w: true }),
      E("Seated cable row", 3, 10, 90, ["Sit tall", "Squeeze shoulder blades"], { w: true }),
      E("Face pull", 3, 15, 60, ["Rope at face height", "Pull toward your forehead, elbows high", "Rotate hands back"], { w: true }),
      E("EZ-bar curl", 3, 10, 60, ["Elbows still", "Full range"], { w: true })
    ]},
    { id: "ppl-legs", name: "Legs", mins: 60, ex: [
      E("Barbell back squat", 4, 6, 150, ["Brace before each rep", "Depth you can control", "Use safety bars"], { w: true }),
      E("Romanian deadlift", 3, 8, 120, ["Soft knees, hips back", "Bar slides down thighs", "Stop at a hamstring stretch"], { w: true }),
      E("Leg press", 3, 12, 90, ["Feet mid-platform", "Controlled depth"], { w: true }),
      E("Lying leg curl", 3, 12, 60, ["Hips pressed into the pad", "Curl and squeeze", "Lower slowly"], { w: true }),
      E("Standing calf raise", 3, 15, 60, ["Full stretch at the bottom", "Pause at the top"], { w: true })
    ]}
  ]
}
];
window.HG_EQUIP_LABEL = { none: "No equipment", dumbbells: "Dumbbells", gym: "Full gym" };
})();
