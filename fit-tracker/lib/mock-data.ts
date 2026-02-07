export const mockUser = {
  name: 'Chrislin',
  avatar: null, // placeholder — no image for now
};

export const mockStats = {
  recovery: 42,
  recoveryMax: 100,
  steps: 0,
  stepsGoal: 10000,
};

// currentDayIndex: Mon=0 … Sun=6 (JS getDay() returns Sun=0, Mon=1 … Sat=6)
const jsDay = new Date().getDay();
const todayIndex = jsDay === 0 ? 6 : jsDay - 1;

export const mockWeekly = {
  completedDays: [true, true, false, false, false, false, false], // L-D
  currentDayIndex: todayIndex,
  workoutsCompleted: 2,
  workoutsGoal: 3,
  streak: 0,
};

export const mockWorkouts = [
  {
    id: '1',
    name: 'Jambes Bete',
    level: 'advanced' as const,
    type: 'complete' as const,
    duration: 45,
    calories: 380,
    imageUrl: null,
  },
  {
    id: '2',
    name: 'Upper Body Power',
    level: 'intermediate' as const,
    type: 'complete' as const,
    duration: 45,
    calories: 320,
    imageUrl: null,
  },
  {
    id: '3',
    name: 'Core Foundations',
    level: 'beginner' as const,
    type: 'express' as const,
    duration: 15,
    calories: 100,
    imageUrl: null,
  },
];

export const mockBrowse = {
  totalWorkouts: 50,
};

// Mock recovery data — simulates a user who trained push yesterday and legs 3 days ago
export const mockRecoveryOverview = {
  overallScore: 62,
  muscles: [
    { bodyPart: 'chest' as const, status: 'fatigued' as const, hoursSinceTraining: 18, totalSets: 12 },
    { bodyPart: 'shoulders' as const, status: 'fatigued' as const, hoursSinceTraining: 18, totalSets: 8 },
    { bodyPart: 'triceps' as const, status: 'fatigued' as const, hoursSinceTraining: 18, totalSets: 6 },
    { bodyPart: 'upper back' as const, status: 'fresh' as const, hoursSinceTraining: 72, totalSets: 10 },
    { bodyPart: 'lats' as const, status: 'fresh' as const, hoursSinceTraining: 72, totalSets: 8 },
    { bodyPart: 'lower back' as const, status: 'fresh' as const, hoursSinceTraining: 96, totalSets: 4 },
    { bodyPart: 'biceps' as const, status: 'fresh' as const, hoursSinceTraining: 72, totalSets: 6 },
    { bodyPart: 'forearms' as const, status: 'undertrained' as const, hoursSinceTraining: null, totalSets: 0 },
    { bodyPart: 'quads' as const, status: 'fresh' as const, hoursSinceTraining: 72, totalSets: 12 },
    { bodyPart: 'hamstrings' as const, status: 'fresh' as const, hoursSinceTraining: 72, totalSets: 8 },
    { bodyPart: 'glutes' as const, status: 'fresh' as const, hoursSinceTraining: 72, totalSets: 6 },
    { bodyPart: 'calves' as const, status: 'undertrained' as const, hoursSinceTraining: null, totalSets: 0 },
    { bodyPart: 'abs' as const, status: 'undertrained' as const, hoursSinceTraining: null, totalSets: 0 },
    { bodyPart: 'obliques' as const, status: 'undertrained' as const, hoursSinceTraining: null, totalSets: 0 },
  ],
  freshCount: 7,
  fatiguedCount: 3,
  undertrainedCount: 4,
};

// Mock steps history — simulates 30 days of step data
export function generateMockStepsHistory(days: number) {
  const data: { date: string; steps: number }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseSteps = isWeekend ? 5000 : 7500;
    const variance = Math.sin(i * 0.7) * 3000 + (Math.random() * 2000 - 1000);
    const steps = Math.max(1200, Math.round(baseSteps + variance));

    data.push({
      date: date.toISOString(),
      steps: i === 0 ? 4827 : steps, // Today's steps fixed for consistent mock
    });
  }

  return data;
}

// Mock badge progress — simulates a user with ~180 points (Athlete level)
// Unlocked: 8 badges (mix of bronze/silver from volume + consistency + variety + special)
export const MOCK_UNLOCKED_BADGE_IDS: string[] = [
  'vol_ton_1',   // First Ton (bronze, 15pts)
  'vol_ton_2',   // Mover (bronze, 15pts)
  'vol_ses_1',   // First Step (bronze, 15pts)
  'vol_ses_2',   // Regular (bronze, 15pts)
  'con_str_1',   // Spark — 3-day streak (bronze, 15pts)
  'con_str_2',   // Flame — 7-day streak (bronze, 15pts)
  'con_str_7',   // Perfect Week (bronze, 15pts)
  'str_pr_1',    // First PR (bronze, 15pts)
  'str_pr_2',    // Record Hunter (bronze, 15pts)
  'var_cur',     // Curious — 10 exercises (bronze, 15pts)
  'soc_friend1', // Sociable — 3 friends (bronze, 15pts)
  'sp_early',    // Early Adopter (gold, 90pts)
];
// Total: 11 * 15 + 90 = 255 points => Athlete level (150+)

// Mock weekly volume (sets per muscle this week)
export const mockWeeklyVolume: Record<string, number> = {
  chest: 12,
  shoulders: 8,
  triceps: 6,
  'upper back': 10,
  lats: 8,
  'lower back': 4,
  biceps: 6,
  forearms: 0,
  quads: 12,
  hamstrings: 8,
  glutes: 6,
  calves: 0,
  abs: 0,
  obliques: 0,
};
