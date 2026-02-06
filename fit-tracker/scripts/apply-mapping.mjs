/**
 * Reads the ExerciseDB mapping JSON and updates data/exercises.ts
 * with gifUrl, instructions, and secondaryMuscles fields.
 *
 * Usage: node scripts/apply-mapping.mjs
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mappingPath = path.join(__dirname, '..', 'data', 'exercisedb-mapping.json');
const exercisesPath = path.join(__dirname, '..', 'data', 'exercises.ts');

const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

// Blacklist: exercises where fuzzy matching returned a wrong exercise
const BAD_MATCHES = new Set([
  'ex_001', // One-Arm Dumbbell Row → "upright row" (wrong exercise type)
  'ex_004', // Incline Reverse Fly → "cable incline fly" (fly ≠ reverse fly)
  'ex_008', // T-Bar Row → "barbell upright row" (completely different)
  'ex_009', // Deadlift → "band straight leg deadlift" (wrong equipment + variant)
  'ex_014', // Front Raise → "front raise and pullover" (combined exercise)
  'ex_018', // Face Pull → "snatch pull" (completely different)
  'ex_029', // Cable Crossover → "cable kickback" (completely different)
  'ex_034', // Dumbbell Curl → "l-pull-up" (completely wrong)
  'ex_038', // Incline Dumbbell Curl → "l-pull-up" (completely wrong)
  'ex_051', // Barbell Squat → "squat jump step rear lunge" (different exercise)
  'ex_055', // Leg Extension → "resistance band leg extension" (wrong equipment)
  'ex_058', // Stiff Leg Deadlift → "band stiff leg deadlift" (wrong equipment)
  'ex_061', // Hip Thrust → "resistance band hip thrusts on knees" (wrong variant)
  'ex_067', // Plank → "dumbbell side plank with rear fly" (wrong exercise)
  'ex_068', // Crunch → "run" (completely wrong)
  'ex_070', // Cable Crunch → "run" (completely wrong)
  'ex_072', // Ab Wheel Rollout → "l-pull-up" (completely wrong)
  'ex_075', // Side Plank → "dumbbell side plank with rear fly" (wrong)
  'ex_076', // Bicycle Crunch → "run" (completely wrong)
  'ex_079', // High Knees → "walking high knees lunge" (different exercise)
  'ex_080', // Box Jump → "box jump down one leg stabilization" (wrong variant)
  'ex_081', // Battle Ropes → "rope climb" (completely different)
  'ex_082', // Rowing Machine → "inverted row" (completely different)
  'ex_084', // Sprint → "smith sprint lunge" (completely different)
]);

let content = fs.readFileSync(exercisesPath, 'utf-8');
let updated = 0;
let skipped = 0;

for (const [exId, data] of Object.entries(mapping)) {
  if (BAD_MATCHES.has(exId)) {
    console.log(`  ✗ ${exId}: BLACKLISTED (${data.matchedName})`);
    skipped++;
    continue;
  }

  // Find this exercise's line and inject new fields before the closing }
  const idPattern = `id: '${exId}'`;
  const idx = content.indexOf(idPattern);
  if (idx === -1) {
    console.log(`  ✗ ${exId} not found in exercises.ts`);
    continue;
  }

  // Find the category field for this exercise (it's the last field before })
  const closingBrace = content.indexOf('},', idx);
  if (closingBrace === -1) continue;

  // Check if gifUrl already exists for this exercise
  const exerciseSlice = content.substring(idx, closingBrace);
  if (exerciseSlice.includes('gifUrl:')) {
    console.log(`  ⚠ ${exId}: already has gifUrl, skipping`);
    continue;
  }

  // Build new fields string
  const newFields = [];
  if (data.gifUrl) {
    newFields.push(`gifUrl: '${data.gifUrl}'`);
  }
  if (data.instructions && data.instructions.length > 0) {
    const instStr = data.instructions.map(i => `'${i.replace(/'/g, "\\'")}'`).join(', ');
    newFields.push(`instructions: [${instStr}]`);
  }
  if (data.secondaryMuscles && data.secondaryMuscles.length > 0) {
    const smStr = data.secondaryMuscles.map(m => `'${m}'`).join(', ');
    newFields.push(`secondaryMuscles: [${smStr}]`);
  }

  if (newFields.length === 0) continue;

  // Insert before the closing brace
  const insertPos = closingBrace;
  content = content.substring(0, insertPos) + ', ' + newFields.join(', ') + content.substring(insertPos);

  console.log(`  ✓ ${exId}: "${data.matchedName}" → +${newFields.length} fields`);
  updated++;
}

fs.writeFileSync(exercisesPath, content);
console.log(`\nDone! Updated ${updated} exercises, skipped ${skipped} bad matches.`);
console.log(`Exercises without ExerciseDB data: ${84 - updated} (will use fallback ExerciseIcon + description splitting)`);
