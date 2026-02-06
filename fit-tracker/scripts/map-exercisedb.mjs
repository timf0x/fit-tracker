/**
 * One-time script to match our 84 exercises to ExerciseDB API entries.
 * Bulk-fetches ALL exercises (paginated), then fuzzy-matches locally.
 *
 * Usage: node scripts/map-exercisedb.mjs
 */

const BASE = 'https://www.exercisedb.dev/api/v1';
const PAGE_LIMIT = 100;
const DELAY_MS = 4000; // 4s between pages to avoid rate limiting

// Our exercise names (English) to search for
const OUR_EXERCISES = [
  { id: 'ex_001', name: 'One-Arm Dumbbell Row' },
  { id: 'ex_002', name: 'Dumbbell Pullover' },
  { id: 'ex_003', name: 'Incline Dumbbell Row' },
  { id: 'ex_004', name: 'Incline Reverse Fly' },
  { id: 'ex_005', name: 'Lat Pulldown' },
  { id: 'ex_006', name: 'Seated Cable Row' },
  { id: 'ex_007', name: 'Barbell Row' },
  { id: 'ex_008', name: 'T-Bar Row' },
  { id: 'ex_009', name: 'Deadlift' },
  { id: 'ex_010', name: 'Pull-Up' },
  { id: 'ex_011', name: 'Chin-Up' },
  { id: 'ex_012', name: 'Straight Arm Pulldown' },
  { id: 'ex_013', name: 'Lateral Raise' },
  { id: 'ex_014', name: 'Front Raise' },
  { id: 'ex_015', name: 'Arnold Press' },
  { id: 'ex_016', name: 'Overhead Press' },
  { id: 'ex_017', name: 'Dumbbell Shoulder Press' },
  { id: 'ex_018', name: 'Face Pull' },
  { id: 'ex_019', name: 'Upright Row' },
  { id: 'ex_020', name: 'Dumbbell Shrugs' },
  { id: 'ex_021', name: 'Barbell Shrugs' },
  { id: 'ex_022', name: 'Reverse Pec Deck' },
  { id: 'ex_023', name: 'Barbell Bench Press' },
  { id: 'ex_024', name: 'Incline Bench Press' },
  { id: 'ex_025', name: 'Decline Bench Press' },
  { id: 'ex_026', name: 'Dumbbell Bench Press' },
  { id: 'ex_027', name: 'Incline Dumbbell Press' },
  { id: 'ex_028', name: 'Dumbbell Fly' },
  { id: 'ex_029', name: 'Cable Crossover' },
  { id: 'ex_030', name: 'Push-Up' },
  { id: 'ex_031', name: 'Dips' },
  { id: 'ex_032', name: 'Machine Chest Press' },
  { id: 'ex_033', name: 'Barbell Curl' },
  { id: 'ex_034', name: 'Dumbbell Curl' },
  { id: 'ex_035', name: 'Hammer Curl' },
  { id: 'ex_036', name: 'Preacher Curl' },
  { id: 'ex_037', name: 'Concentration Curl' },
  { id: 'ex_038', name: 'Incline Dumbbell Curl' },
  { id: 'ex_039', name: 'Tricep Pushdown' },
  { id: 'ex_040', name: 'Skull Crusher' },
  { id: 'ex_041', name: 'Overhead Tricep Extension' },
  { id: 'ex_042', name: 'Close-Grip Bench Press' },
  { id: 'ex_043', name: 'Diamond Push-Up' },
  { id: 'ex_044', name: 'Tricep Dips' },
  { id: 'ex_045', name: 'Tricep Kickback' },
  { id: 'ex_046', name: 'Zottman Curl' },
  { id: 'ex_047', name: 'Wrist Curl' },
  { id: 'ex_048', name: 'Reverse Wrist Curl' },
  { id: 'ex_049', name: 'Reverse Curl' },
  { id: 'ex_050', name: 'Farmer Walk' },
  { id: 'ex_051', name: 'Barbell Squat' },
  { id: 'ex_052', name: 'Front Squat' },
  { id: 'ex_053', name: 'Leg Press' },
  { id: 'ex_054', name: 'Hack Squat' },
  { id: 'ex_055', name: 'Leg Extension' },
  { id: 'ex_056', name: 'Romanian Deadlift' },
  { id: 'ex_057', name: 'Leg Curl' },
  { id: 'ex_058', name: 'Stiff Leg Deadlift' },
  { id: 'ex_059', name: 'Bulgarian Split Squat' },
  { id: 'ex_060', name: 'Walking Lunges' },
  { id: 'ex_061', name: 'Hip Thrust' },
  { id: 'ex_062', name: 'Goblet Squat' },
  { id: 'ex_063', name: 'Standing Calf Raise' },
  { id: 'ex_064', name: 'Seated Calf Raise' },
  { id: 'ex_065', name: 'Donkey Calf Raise' },
  { id: 'ex_066', name: 'Single Leg Calf Raise' },
  { id: 'ex_067', name: 'Plank' },
  { id: 'ex_068', name: 'Crunch' },
  { id: 'ex_069', name: 'Hanging Leg Raise' },
  { id: 'ex_070', name: 'Cable Crunch' },
  { id: 'ex_071', name: 'Russian Twist' },
  { id: 'ex_072', name: 'Ab Wheel Rollout' },
  { id: 'ex_073', name: 'Dead Bug' },
  { id: 'ex_074', name: 'Mountain Climber' },
  { id: 'ex_075', name: 'Side Plank' },
  { id: 'ex_076', name: 'Bicycle Crunch' },
  { id: 'ex_077', name: 'Jumping Jacks' },
  { id: 'ex_078', name: 'Burpees' },
  { id: 'ex_079', name: 'High Knees' },
  { id: 'ex_080', name: 'Box Jump' },
  { id: 'ex_081', name: 'Battle Ropes' },
  { id: 'ex_082', name: 'Rowing Machine' },
  { id: 'ex_083', name: 'Jump Rope' },
  { id: 'ex_084', name: 'Sprint' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function normalize(str) {
  return str.toLowerCase().replace(/[-_]/g, ' ').replace(/[^a-z0-9 ]/g, '').trim();
}

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (nb.includes(na) || na.includes(nb)) return 0.85;
  const wordsA = na.split(/\s+/);
  const wordsB = nb.split(/\s+/);
  const common = wordsA.filter((w) => wordsB.some((wb) => wb === w || wb.includes(w) || w.includes(wb)));
  return common.length / Math.max(wordsA.length, wordsB.length);
}

async function fetchAllExercises() {
  const all = [];
  let offset = 0;
  let page = 1;

  while (true) {
    const url = `${BASE}/exercises?offset=${offset}&limit=${PAGE_LIMIT}`;
    console.log(`  Fetching page ${page} (offset=${offset})...`);

    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 429) {
        console.log(`  Rate limited, waiting 15s...`);
        await sleep(15000);
        continue; // retry same page
      }
      throw new Error(`HTTP ${res.status} on page ${page}`);
    }

    const json = await res.json();
    const exercises = json.data || [];
    all.push(...exercises);

    console.log(`  Got ${exercises.length} exercises (total: ${all.length})`);

    if (exercises.length < PAGE_LIMIT) break; // last page

    offset += PAGE_LIMIT;
    page++;
    await sleep(DELAY_MS);
  }

  return all;
}

function findBestMatch(ourName, allDbExercises) {
  let best = null;
  let bestScore = 0;

  for (const r of allDbExercises) {
    const score = similarity(ourName, r.name);
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }

  return bestScore >= 0.4 ? { ...best, score: bestScore } : null;
}

function cleanInstruction(instruction) {
  // Remove "Step:N " prefix from ExerciseDB instructions
  return instruction.replace(/^Step:\d+\s*/i, '').trim();
}

async function main() {
  console.log('Step 1: Fetching all exercises from ExerciseDB...\n');

  const allDbExercises = await fetchAllExercises();
  console.log(`\nFetched ${allDbExercises.length} exercises total.\n`);

  console.log('Step 2: Matching our exercises locally...\n');

  const mapping = {};
  const unmatched = [];

  for (const ex of OUR_EXERCISES) {
    const match = findBestMatch(ex.name, allDbExercises);

    if (match) {
      console.log(`  ✓ ${ex.name} → "${match.name}" (score: ${match.score.toFixed(2)})`);
      mapping[ex.id] = {
        exerciseDbId: match.exerciseId,
        matchedName: match.name,
        gifUrl: match.gifUrl,
        instructions: (match.instructions || []).map(cleanInstruction),
        secondaryMuscles: match.secondaryMuscles || [],
        score: match.score,
      };
    } else {
      console.log(`  ✗ ${ex.name} → no match`);
      unmatched.push(ex);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Matched: ${Object.keys(mapping).length}/${OUR_EXERCISES.length}`);
  console.log(`Unmatched: ${unmatched.length}`);

  if (unmatched.length) {
    console.log('\nUnmatched exercises:');
    unmatched.forEach((e) => console.log(`  - ${e.id}: ${e.name}`));
  }

  // Output as JSON for integration
  const outputPath = new URL('../data/exercisedb-mapping.json', import.meta.url);
  const fs = await import('fs');
  fs.writeFileSync(new URL(outputPath), JSON.stringify(mapping, null, 2));
  console.log(`\nMapping saved to data/exercisedb-mapping.json`);
}

main().catch(console.error);
