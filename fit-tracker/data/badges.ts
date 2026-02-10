import type { Badge, BadgeCategory, BadgeTier, UserLevel } from '@/types';

// ============================================
// USER LEVELS — progression based on total badge points
// ============================================

export const USER_LEVELS: UserLevel[] = [
  { id: 'novice', name: 'Novice', nameFr: 'Débutant', minPoints: 0, icon: 'trophy' },
  { id: 'apprentice', name: 'Apprentice', nameFr: 'Apprenti', minPoints: 50, icon: 'trophy' },
  { id: 'athlete', name: 'Athlete', nameFr: 'Athlète', minPoints: 150, icon: 'dumbbell' },
  { id: 'warrior', name: 'Warrior', nameFr: 'Guerrier', minPoints: 400, icon: 'shield' },
  { id: 'champion', name: 'Champion', nameFr: 'Champion', minPoints: 800, icon: 'medal' },
  { id: 'master', name: 'Master', nameFr: 'Maître', minPoints: 1500, icon: 'crown' },
  { id: 'legend', name: 'Legend', nameFr: 'Légende', minPoints: 3000, icon: 'sparkles' },
  { id: 'titan', name: 'Titan', nameFr: 'Titan', minPoints: 5000, icon: 'flame' },
];

// ============================================
// HIDDEN CATEGORIES — kept for future Supabase integration
// ============================================

/** Badge IDs that are hidden from display (social + AI coach, require Supabase) */
export const HIDDEN_BADGE_IDS = new Set([
  'soc_friend1', 'soc_friend2', 'soc_friend3',
  'soc_react1', 'soc_react2', 'soc_share', 'soc_inspire',
  'ai_follow1', 'ai_follow2', 'ai_follow3',
  'ai_checkin1', 'ai_checkin2', 'ai_goal',
]);

// ============================================
// ALL BADGES — 79 total (67 original + 12 new science)
// Social/AI kept in code for future Supabase, hidden from display
// ============================================

export const ALL_BADGES: Badge[] = [
  // ── VOLUME — Tonnes Soulevées (8) ──
  { id: 'vol_ton_1', name: 'First Ton', nameFr: 'Première Tonne', description: 'Lift your first ton total', descriptionFr: 'Soulève ta première tonne au total', category: 'volume', tier: 'bronze', icon: 'weight', points: 15, isSecret: false, conditionType: 'volume_tons', conditionValue: 1 },
  { id: 'vol_ton_2', name: 'Mover', nameFr: 'Déménageur', description: 'Lift 10 tons total', descriptionFr: 'Soulève 10 tonnes au total', category: 'volume', tier: 'bronze', icon: 'package', points: 15, isSecret: false, conditionType: 'volume_tons', conditionValue: 10 },
  { id: 'vol_ton_3', name: 'Titan', nameFr: 'Titan', description: 'Lift 50 tons total', descriptionFr: 'Soulève 50 tonnes au total', category: 'volume', tier: 'silver', icon: 'mountain', points: 30, isSecret: false, conditionType: 'volume_tons', conditionValue: 50 },
  { id: 'vol_ton_4', name: 'Atlas', nameFr: 'Atlas', description: 'Lift 100 tons total', descriptionFr: 'Soulève 100 tonnes au total', category: 'volume', tier: 'silver', icon: 'globe', points: 30, isSecret: false, conditionType: 'volume_tons', conditionValue: 100 },
  { id: 'vol_ton_5', name: 'Hercules', nameFr: 'Hercule', description: 'Lift 500 tons total', descriptionFr: 'Soulève 500 tonnes au total', category: 'volume', tier: 'gold', icon: 'zap', points: 90, isSecret: false, conditionType: 'volume_tons', conditionValue: 500 },
  { id: 'vol_ton_6', name: 'Colossus', nameFr: 'Colosse', description: 'Lift 1,000 tons total', descriptionFr: 'Soulève 1 000 tonnes au total', category: 'volume', tier: 'gold', icon: 'landmark', points: 90, isSecret: false, conditionType: 'volume_tons', conditionValue: 1000 },
  { id: 'vol_ton_7', name: 'Legend', nameFr: 'Légende', description: 'Lift 5,000 tons total', descriptionFr: 'Soulève 5 000 tonnes au total', category: 'volume', tier: 'platinum', icon: 'crown', points: 300, isSecret: false, conditionType: 'volume_tons', conditionValue: 5000 },
  { id: 'vol_ton_8', name: 'Immortal', nameFr: 'Immortel', description: 'Lift 10,000 tons total', descriptionFr: 'Soulève 10 000 tonnes au total', category: 'volume', tier: 'platinum', icon: 'sparkles', points: 300, isSecret: false, conditionType: 'volume_tons', conditionValue: 10000 },

  // ── VOLUME — Séances (6) ──
  { id: 'vol_ses_1', name: 'First Step', nameFr: 'Premier Pas', description: 'Complete your first workout', descriptionFr: 'Termine ton premier entraînement', category: 'volume', tier: 'bronze', icon: 'footprints', points: 15, isSecret: false, conditionType: 'sessions_count', conditionValue: 1 },
  { id: 'vol_ses_2', name: 'Regular', nameFr: 'Habitué', description: 'Complete 10 workouts', descriptionFr: 'Termine 10 entraînements', category: 'volume', tier: 'bronze', icon: 'repeat', points: 15, isSecret: false, conditionType: 'sessions_count', conditionValue: 10 },
  { id: 'vol_ses_3', name: 'Dedicated', nameFr: 'Régulier', description: 'Complete 50 workouts', descriptionFr: 'Termine 50 entraînements', category: 'volume', tier: 'silver', icon: 'calendar', points: 30, isSecret: false, conditionType: 'sessions_count', conditionValue: 50 },
  { id: 'vol_ses_4', name: 'Veteran', nameFr: 'Vétéran', description: 'Complete 100 workouts', descriptionFr: 'Termine 100 entraînements', category: 'volume', tier: 'silver', icon: 'medal', points: 30, isSecret: false, conditionType: 'sessions_count', conditionValue: 100 },
  { id: 'vol_ses_5', name: 'Centurion', nameFr: 'Centurion', description: 'Complete 250 workouts', descriptionFr: 'Termine 250 entraînements', category: 'volume', tier: 'gold', icon: 'shield', points: 90, isSecret: false, conditionType: 'sessions_count', conditionValue: 250 },
  { id: 'vol_ses_6', name: 'Spartan', nameFr: 'Spartan', description: 'Complete 500 workouts', descriptionFr: 'Termine 500 entraînements', category: 'volume', tier: 'platinum', icon: 'swords', points: 300, isSecret: false, conditionType: 'sessions_count', conditionValue: 500 },

  // ── CONSISTENCY — Streaks (8) ──
  { id: 'con_str_1', name: 'Spark', nameFr: 'Étincelle', description: '3-day workout streak', descriptionFr: 'Série de 3 jours', category: 'consistency', tier: 'bronze', icon: 'flame', points: 15, isSecret: false, conditionType: 'streak_days', conditionValue: 3 },
  { id: 'con_str_2', name: 'Flame', nameFr: 'Flamme', description: '7-day workout streak', descriptionFr: 'Série de 7 jours', category: 'consistency', tier: 'bronze', icon: 'flame', points: 15, isSecret: false, conditionType: 'streak_days', conditionValue: 7 },
  { id: 'con_str_3', name: 'Blaze', nameFr: 'Brasier', description: '14-day workout streak', descriptionFr: 'Série de 14 jours', category: 'consistency', tier: 'silver', icon: 'flame', points: 30, isSecret: false, conditionType: 'streak_days', conditionValue: 14 },
  { id: 'con_str_4', name: 'Inferno', nameFr: 'Inferno', description: '30-day workout streak', descriptionFr: 'Série de 30 jours', category: 'consistency', tier: 'silver', icon: 'flame', points: 30, isSecret: false, conditionType: 'streak_days', conditionValue: 30 },
  { id: 'con_str_5', name: 'Phoenix', nameFr: 'Phénix', description: '60-day workout streak', descriptionFr: 'Série de 60 jours', category: 'consistency', tier: 'gold', icon: 'flame', points: 90, isSecret: false, conditionType: 'streak_days', conditionValue: 60 },
  { id: 'con_str_6', name: 'Eternal', nameFr: 'Éternel', description: '100-day workout streak', descriptionFr: 'Série de 100 jours', category: 'consistency', tier: 'platinum', icon: 'flame', points: 300, isSecret: false, conditionType: 'streak_days', conditionValue: 100 },
  { id: 'con_str_7', name: 'Perfect Week', nameFr: 'Semaine Parfaite', description: 'Hit your weekly goal', descriptionFr: 'Atteins ton objectif hebdomadaire', category: 'consistency', tier: 'bronze', icon: 'check-circle', points: 15, isSecret: false, conditionType: 'week_goal_hit', conditionValue: 1 },
  { id: 'con_str_8', name: 'Perfect Month', nameFr: 'Mois Parfait', description: 'Hit weekly goal 4 weeks in a row', descriptionFr: 'Atteins ton objectif 4 semaines de suite', category: 'consistency', tier: 'gold', icon: 'calendar-check', points: 90, isSecret: false, conditionType: 'week_streak', conditionValue: 4 },

  // ── STRENGTH — Personal Records (6) ──
  { id: 'str_pr_1', name: 'First PR', nameFr: 'Premier PR', description: 'Beat your first personal record', descriptionFr: 'Bats ton premier record personnel', category: 'strength', tier: 'bronze', icon: 'trophy', points: 15, isSecret: false, conditionType: 'prs_count', conditionValue: 1 },
  { id: 'str_pr_2', name: 'Record Hunter', nameFr: 'Chasseur de Records', description: 'Beat 10 personal records', descriptionFr: 'Bats 10 records personnels', category: 'strength', tier: 'bronze', icon: 'target', points: 15, isSecret: false, conditionType: 'prs_count', conditionValue: 10 },
  { id: 'str_pr_3', name: 'PR Machine', nameFr: 'Machine à PRs', description: 'Beat 50 personal records', descriptionFr: 'Bats 50 records personnels', category: 'strength', tier: 'silver', icon: 'rocket', points: 30, isSecret: false, conditionType: 'prs_count', conditionValue: 50 },
  { id: 'str_pr_4', name: 'Unstoppable', nameFr: 'Inarrêtable', description: 'Beat 100 personal records', descriptionFr: 'Bats 100 records personnels', category: 'strength', tier: 'gold', icon: 'biceps-flexed', points: 90, isSecret: false, conditionType: 'prs_count', conditionValue: 100 },
  { id: 'str_pr_5', name: '+10% Club', nameFr: 'Club +10%', description: 'Increase weight on an exercise by 10%', descriptionFr: "Augmente le poids d'un exercice de 10%", category: 'strength', tier: 'silver', icon: 'trending-up', points: 30, isSecret: false, conditionType: 'pr_increase_pct', conditionValue: 10 },
  { id: 'str_pr_6', name: '+50% Club', nameFr: 'Club +50%', description: 'Increase weight on an exercise by 50%', descriptionFr: "Augmente le poids d'un exercice de 50%", category: 'strength', tier: 'gold', icon: 'trending-up', points: 90, isSecret: false, conditionType: 'pr_increase_pct', conditionValue: 50 },

  // ── MASTERY — Muscle Specialists + Meta (14) ── (was "muscles")
  { id: 'mus_chest', name: 'Chest Specialist', nameFr: 'Spécialiste Pectoraux', description: 'Lift 5 tons with chest exercises', descriptionFr: 'Soulève 5 tonnes en exercices pectoraux', category: 'mastery', tier: 'silver', icon: 'heart', points: 30, isSecret: false, conditionType: 'muscle_volume', conditionValue: 5000, conditionExtra: { muscle: 'chest' } },
  { id: 'mus_back', name: 'Back Specialist', nameFr: 'Spécialiste Dos', description: 'Lift 5 tons with back exercises', descriptionFr: 'Soulève 5 tonnes en exercices dos', category: 'mastery', tier: 'silver', icon: 'layout-grid', points: 30, isSecret: false, conditionType: 'muscle_volume', conditionValue: 5000, conditionExtra: { muscle: 'back' } },
  { id: 'mus_shoulders', name: 'Shoulder Specialist', nameFr: 'Spécialiste Épaules', description: 'Lift 3 tons with shoulder exercises', descriptionFr: 'Soulève 3 tonnes en exercices épaules', category: 'mastery', tier: 'silver', icon: 'git-branch', points: 30, isSecret: false, conditionType: 'muscle_volume', conditionValue: 3000, conditionExtra: { muscle: 'shoulders' } },
  { id: 'mus_biceps', name: 'Biceps Specialist', nameFr: 'Spécialiste Biceps', description: 'Lift 2 tons with biceps exercises', descriptionFr: 'Soulève 2 tonnes en exercices biceps', category: 'mastery', tier: 'silver', icon: 'biceps-flexed', points: 30, isSecret: false, conditionType: 'muscle_volume', conditionValue: 2000, conditionExtra: { muscle: 'biceps' } },
  { id: 'mus_triceps', name: 'Triceps Specialist', nameFr: 'Spécialiste Triceps', description: 'Lift 2 tons with triceps exercises', descriptionFr: 'Soulève 2 tonnes en exercices triceps', category: 'mastery', tier: 'silver', icon: 'arrow-right', points: 30, isSecret: false, conditionType: 'muscle_volume', conditionValue: 2000, conditionExtra: { muscle: 'triceps' } },
  { id: 'mus_quads', name: 'Quads Specialist', nameFr: 'Spécialiste Quadriceps', description: 'Lift 5 tons with quad exercises', descriptionFr: 'Soulève 5 tonnes en exercices quadriceps', category: 'mastery', tier: 'silver', icon: 'move-vertical', points: 30, isSecret: false, conditionType: 'muscle_volume', conditionValue: 5000, conditionExtra: { muscle: 'quads' } },
  { id: 'mus_hams', name: 'Hamstrings Specialist', nameFr: 'Spécialiste Ischio-jambiers', description: 'Lift 3 tons with hamstring exercises', descriptionFr: 'Soulève 3 tonnes en exercices ischio-jambiers', category: 'mastery', tier: 'silver', icon: 'move-down', points: 30, isSecret: false, conditionType: 'muscle_volume', conditionValue: 3000, conditionExtra: { muscle: 'hamstrings' } },
  { id: 'mus_glutes', name: 'Glutes Specialist', nameFr: 'Spécialiste Fessiers', description: 'Lift 3 tons with glute exercises', descriptionFr: 'Soulève 3 tonnes en exercices fessiers', category: 'mastery', tier: 'silver', icon: 'circle', points: 30, isSecret: false, conditionType: 'muscle_volume', conditionValue: 3000, conditionExtra: { muscle: 'glutes' } },
  { id: 'mus_calves', name: 'Calves Specialist', nameFr: 'Spécialiste Mollets', description: 'Lift 2 tons with calf exercises', descriptionFr: 'Soulève 2 tonnes en exercices mollets', category: 'mastery', tier: 'silver', icon: 'footprints', points: 30, isSecret: false, conditionType: 'muscle_volume', conditionValue: 2000, conditionExtra: { muscle: 'calves' } },
  { id: 'mus_abs', name: 'Abs Specialist', nameFr: 'Spécialiste Abdos', description: 'Complete 100 ab sets', descriptionFr: "Termine 100 séries d'abdos", category: 'mastery', tier: 'silver', icon: 'align-center', points: 30, isSecret: false, conditionType: 'muscle_sets', conditionValue: 100, conditionExtra: { muscle: 'abs' } },
  { id: 'mus_upper', name: 'Upper Body Architect', nameFr: 'Architecte du Haut', description: 'Unlock all upper body specialist badges', descriptionFr: 'Débloque tous les badges spécialiste haut du corps', category: 'mastery', tier: 'gold', icon: 'building', points: 90, isSecret: false, conditionType: 'badges_unlocked', conditionValue: 5, conditionExtra: { badges: ['mus_chest', 'mus_back', 'mus_shoulders', 'mus_biceps', 'mus_triceps'] } },
  { id: 'mus_lower', name: 'Lower Body Pillar', nameFr: 'Pilier du Bas', description: 'Unlock all lower body specialist badges', descriptionFr: 'Débloque tous les badges spécialiste bas du corps', category: 'mastery', tier: 'gold', icon: 'home', points: 90, isSecret: false, conditionType: 'badges_unlocked', conditionValue: 4, conditionExtra: { badges: ['mus_quads', 'mus_hams', 'mus_glutes', 'mus_calves'] } },
  { id: 'mus_full', name: 'Full Body Master', nameFr: 'Full Body Master', description: 'Train all 10 muscle groups regularly', descriptionFr: 'Entraîne les 10 groupes musculaires régulièrement', category: 'mastery', tier: 'platinum', icon: 'dna', points: 300, isSecret: false, conditionType: 'all_muscles_trained', conditionValue: 10 },
  { id: 'mus_balance', name: 'Perfect Balance', nameFr: 'Équilibre Parfait', description: 'Balanced push/pull/legs ratio for 3 months', descriptionFr: 'Ratio push/pull/legs équilibré pendant 3 mois', category: 'mastery', tier: 'platinum', icon: 'scale', points: 300, isSecret: false, conditionType: 'balanced_training', conditionValue: 90 },

  // ── EXPLORER — Equipment + Variety (14) ── (merged from "equipment" + "variety")
  { id: 'eq_dumbbell', name: 'Dumbbell Master', nameFr: 'Maître des Haltères', description: 'Complete 100 sets with dumbbells', descriptionFr: 'Termine 100 séries avec haltères', category: 'explorer', tier: 'silver', icon: 'dumbbell', points: 30, isSecret: false, conditionType: 'equipment_sets', conditionValue: 100, conditionExtra: { equipment: 'dumbbell' } },
  { id: 'eq_barbell', name: 'Barbell King', nameFr: 'Roi de la Barre', description: 'Complete 100 sets with barbell', descriptionFr: 'Termine 100 séries avec barre', category: 'explorer', tier: 'silver', icon: 'minus', points: 30, isSecret: false, conditionType: 'equipment_sets', conditionValue: 100, conditionExtra: { equipment: 'barbell' } },
  { id: 'eq_cable', name: 'Cable Expert', nameFr: 'Expert Câbles', description: 'Complete 100 sets with cables', descriptionFr: 'Termine 100 séries aux câbles', category: 'explorer', tier: 'silver', icon: 'link', points: 30, isSecret: false, conditionType: 'equipment_sets', conditionValue: 100, conditionExtra: { equipment: 'cable' } },
  { id: 'eq_machine', name: 'Machine Dominator', nameFr: 'Dominateur Machines', description: 'Complete 100 sets with machines', descriptionFr: 'Termine 100 séries aux machines', category: 'explorer', tier: 'silver', icon: 'settings', points: 30, isSecret: false, conditionType: 'equipment_sets', conditionValue: 100, conditionExtra: { equipment: 'machine' } },
  { id: 'eq_bodyweight', name: 'Bodyweight Warrior', nameFr: 'Guerrier Poids du Corps', description: 'Complete 100 sets bodyweight', descriptionFr: 'Termine 100 séries au poids du corps', category: 'explorer', tier: 'silver', icon: 'user', points: 30, isSecret: false, conditionType: 'equipment_sets', conditionValue: 100, conditionExtra: { equipment: 'body weight' } },
  { id: 'eq_kettlebell', name: 'Kettlebell Master', nameFr: 'Maître Kettlebell', description: 'Complete 50 sets with kettlebell', descriptionFr: 'Termine 50 séries avec kettlebell', category: 'explorer', tier: 'silver', icon: 'circle-dot', points: 30, isSecret: false, conditionType: 'equipment_sets', conditionValue: 50, conditionExtra: { equipment: 'kettlebell' } },
  { id: 'eq_arsenal', name: 'Full Arsenal', nameFr: 'Arsenal Complet', description: 'Use 5+ equipment types regularly', descriptionFr: "Utilise 5+ types d'équipement régulièrement", category: 'explorer', tier: 'gold', icon: 'package', points: 90, isSecret: false, conditionType: 'unique_equipment', conditionValue: 5 },
  { id: 'eq_minimalist', name: 'Minimalist', nameFr: 'Minimaliste', description: '100 bodyweight-only workouts', descriptionFr: 'Termine 100 séances uniquement au poids du corps', category: 'explorer', tier: 'gold', icon: 'minus-circle', points: 90, isSecret: false, conditionType: 'bodyweight_sessions', conditionValue: 100 },
  { id: 'var_cur', name: 'Curious', nameFr: 'Curieux', description: 'Try 10 different exercises', descriptionFr: 'Essaie 10 exercices différents', category: 'explorer', tier: 'bronze', icon: 'search', points: 15, isSecret: false, conditionType: 'unique_exercises', conditionValue: 10 },
  { id: 'var_exp', name: 'Explorer', nameFr: 'Explorateur', description: 'Try 30 different exercises', descriptionFr: 'Essaie 30 exercices différents', category: 'explorer', tier: 'silver', icon: 'compass', points: 30, isSecret: false, conditionType: 'unique_exercises', conditionValue: 30 },
  { id: 'var_adv', name: 'Adventurer', nameFr: 'Aventurier', description: 'Try 50 different exercises', descriptionFr: 'Essaie 50 exercices différents', category: 'explorer', tier: 'gold', icon: 'map', points: 90, isSecret: false, conditionType: 'unique_exercises', conditionValue: 50 },
  { id: 'var_enc', name: 'Living Encyclopedia', nameFr: 'Encyclopédie Vivante', description: 'Try 75+ different exercises', descriptionFr: 'Essaie 75+ exercices différents', category: 'explorer', tier: 'platinum', icon: 'book-open', points: 300, isSecret: false, conditionType: 'unique_exercises', conditionValue: 75 },
  { id: 'var_jack', name: 'Jack of All Trades', nameFr: 'Touche-à-Tout', description: '5 equipment types in 1 week', descriptionFr: "5 types d'équipement en 1 semaine", category: 'explorer', tier: 'silver', icon: 'layers', points: 30, isSecret: false, conditionType: 'equipment_week', conditionValue: 5 },
  { id: 'var_cham', name: 'Chameleon', nameFr: 'Caméléon', description: 'Vary routines every week for 1 month', descriptionFr: 'Varie tes routines chaque semaine pendant 1 mois', category: 'explorer', tier: 'gold', icon: 'shuffle', points: 90, isSecret: false, conditionType: 'varied_weeks', conditionValue: 4 },

  // ── SCIENCE — RP-Behavior Badges (12 new) ──
  { id: 'sci_rir_1', name: 'RIR Logger', nameFr: 'Loggueur RIR', description: 'Log RIR in 10 sessions', descriptionFr: 'Enregistre le RIR dans 10 séances', category: 'science', tier: 'bronze', icon: 'gauge', points: 15, isSecret: false, conditionType: 'rir_logged_sessions', conditionValue: 10 },
  { id: 'sci_rir_2', name: 'Effort Master', nameFr: "Maître de l'Effort", description: 'Log RIR in 50 sessions', descriptionFr: 'Enregistre le RIR dans 50 séances', category: 'science', tier: 'silver', icon: 'activity', points: 30, isSecret: false, conditionType: 'rir_logged_sessions', conditionValue: 50 },
  { id: 'sci_zone_1', name: 'Zone Keeper', nameFr: 'Gardien de Zone', description: 'Stay in MAV zone for 4 weeks on any muscle', descriptionFr: 'Reste en zone MAV pendant 4 semaines sur un muscle', category: 'science', tier: 'silver', icon: 'crosshair', points: 30, isSecret: false, conditionType: 'weeks_in_mav', conditionValue: 4 },
  { id: 'sci_zone_2', name: 'Volume Architect', nameFr: 'Architecte Volume', description: '5 muscles in MAV zone in one week', descriptionFr: '5 muscles en zone MAV en une semaine', category: 'science', tier: 'gold', icon: 'bar-chart-3', points: 90, isSecret: false, conditionType: 'muscles_in_mav_week', conditionValue: 5 },
  { id: 'sci_deload', name: 'Deload Discipline', nameFr: 'Discipline Deload', description: 'Complete a deload week', descriptionFr: 'Complète une semaine de deload', category: 'science', tier: 'silver', icon: 'shield', points: 30, isSecret: false, conditionType: 'deload_completed', conditionValue: 1 },
  { id: 'sci_freq', name: 'Frequency Champion', nameFr: 'Champion Fréquence', description: 'Train all muscles 2x/week for 4 weeks', descriptionFr: 'Entraîne tous les muscles 2x/sem pendant 4 semaines', category: 'science', tier: 'gold', icon: 'calendar-check', points: 90, isSecret: false, conditionType: 'all_muscles_2x_weeks', conditionValue: 4 },
  { id: 'sci_overload', name: 'Progressive Beast', nameFr: 'Bête Progressive', description: '3 consecutive weight bumps on any exercise', descriptionFr: '3 augmentations de poids consécutives sur un exercice', category: 'science', tier: 'gold', icon: 'trending-up', points: 90, isSecret: false, conditionType: 'consecutive_bumps', conditionValue: 3 },
  { id: 'sci_readiness', name: 'Recovery Scholar', nameFr: 'Érudit Récupération', description: 'Complete 20 readiness checks', descriptionFr: 'Complète 20 vérifications de readiness', category: 'science', tier: 'bronze', icon: 'clipboard-check', points: 15, isSecret: false, conditionType: 'readiness_checks', conditionValue: 20 },
  { id: 'sci_feedback', name: 'The Scientist', nameFr: 'Le Scientifique', description: 'Give post-session feedback 20 times', descriptionFr: 'Donne un feedback post-séance 20 fois', category: 'science', tier: 'silver', icon: 'flask-conical', points: 30, isSecret: false, conditionType: 'feedback_sessions', conditionValue: 20 },
  { id: 'sci_intensity', name: 'Mind-Muscle', nameFr: 'Connexion Neuromusculaire', description: 'Complete 50 sets to failure (RIR 0)', descriptionFr: 'Complète 50 séries à l\'échec (RIR 0)', category: 'science', tier: 'gold', icon: 'zap', points: 90, isSecret: false, conditionType: 'failure_sets', conditionValue: 50 },
  { id: 'sci_balanced', name: 'Balanced Week', nameFr: 'Semaine Équilibrée', description: 'Train all 14 muscles in one week', descriptionFr: 'Entraîne les 14 muscles en une semaine', category: 'science', tier: 'silver', icon: 'scale', points: 30, isSecret: false, conditionType: 'all_14_muscles_week', conditionValue: 1 },
  { id: 'sci_program', name: 'Program Graduate', nameFr: 'Diplômé Programme', description: 'Complete a full training program', descriptionFr: 'Termine un programme d\'entraînement complet', category: 'science', tier: 'gold', icon: 'award', points: 90, isSecret: false, conditionType: 'program_completed', conditionValue: 1 },

  // ── SOCIAL — Community (7) — Hidden until Supabase ──
  { id: 'soc_friend1', name: 'Sociable', nameFr: 'Sociable', description: 'Add 3 friends', descriptionFr: 'Ajoute 3 amis', category: 'social', tier: 'bronze', icon: 'users', points: 15, isSecret: false, conditionType: 'friends_count', conditionValue: 3 },
  { id: 'soc_friend2', name: 'Popular', nameFr: 'Populaire', description: 'Add 10 friends', descriptionFr: 'Ajoute 10 amis', category: 'social', tier: 'silver', icon: 'star', points: 30, isSecret: false, conditionType: 'friends_count', conditionValue: 10 },
  { id: 'soc_friend3', name: 'Fitness Influencer', nameFr: 'Influenceur Fitness', description: 'Add 25 friends', descriptionFr: 'Ajoute 25 amis', category: 'social', tier: 'gold', icon: 'megaphone', points: 90, isSecret: false, conditionType: 'friends_count', conditionValue: 25 },
  { id: 'soc_react1', name: 'Encouraging', nameFr: 'Encourageant', description: 'Give 10 reactions', descriptionFr: 'Donne 10 réactions', category: 'social', tier: 'bronze', icon: 'thumbs-up', points: 15, isSecret: false, conditionType: 'reactions_given', conditionValue: 10 },
  { id: 'soc_react2', name: 'Supporter', nameFr: 'Supporter', description: 'Give 50 reactions', descriptionFr: 'Donne 50 réactions', category: 'social', tier: 'silver', icon: 'heart', points: 30, isSecret: false, conditionType: 'reactions_given', conditionValue: 50 },
  { id: 'soc_share', name: 'Sharer', nameFr: 'Partageur', description: 'Share 5 workouts to feed', descriptionFr: 'Partage 5 entraînements sur le feed', category: 'social', tier: 'bronze', icon: 'share', points: 15, isSecret: false, conditionType: 'posts_count', conditionValue: 5 },
  { id: 'soc_inspire', name: 'Inspiring', nameFr: 'Inspirant', description: 'Receive 10 reactions on your posts', descriptionFr: 'Reçois 10 réactions sur tes posts', category: 'social', tier: 'silver', icon: 'heart-handshake', points: 30, isSecret: false, conditionType: 'reactions_received', conditionValue: 10 },

  // ── AI COACH — Intelligence (6) — Hidden until Supabase ──
  { id: 'ai_follow1', name: 'Attentive Student', nameFr: 'Élève Attentif', description: 'Follow 5 AI recommendations', descriptionFr: "Suis 5 recommandations de l'IA", category: 'ai_coach', tier: 'bronze', icon: 'bot', points: 15, isSecret: false, conditionType: 'ai_recommendations', conditionValue: 5 },
  { id: 'ai_follow2', name: 'Disciple', nameFr: 'Disciple', description: 'Follow 25 AI recommendations', descriptionFr: "Suis 25 recommandations de l'IA", category: 'ai_coach', tier: 'silver', icon: 'graduation-cap', points: 30, isSecret: false, conditionType: 'ai_recommendations', conditionValue: 25 },
  { id: 'ai_follow3', name: 'Symbiosis', nameFr: 'Symbiose', description: 'Follow 100 AI recommendations', descriptionFr: "Suis 100 recommandations de l'IA", category: 'ai_coach', tier: 'gold', icon: 'brain', points: 90, isSecret: false, conditionType: 'ai_recommendations', conditionValue: 100 },
  { id: 'ai_checkin1', name: 'Regular Check-in', nameFr: 'Check-in Régulier', description: 'Complete 10 check-ins', descriptionFr: 'Complète 10 check-ins', category: 'ai_coach', tier: 'bronze', icon: 'clipboard-check', points: 15, isSecret: false, conditionType: 'checkins_count', conditionValue: 10 },
  { id: 'ai_checkin2', name: 'Communicator', nameFr: 'Communicant', description: 'Complete 30 check-ins', descriptionFr: 'Complète 30 check-ins', category: 'ai_coach', tier: 'silver', icon: 'message-circle', points: 30, isSecret: false, conditionType: 'checkins_count', conditionValue: 30 },
  { id: 'ai_goal', name: 'Goal Achieved', nameFr: 'Objectif Atteint', description: 'Achieve a goal set with AI', descriptionFr: "Atteins un objectif fixé avec l'IA", category: 'ai_coach', tier: 'gold', icon: 'flag', points: 90, isSecret: false, conditionType: 'ai_goals_achieved', conditionValue: 1 },

  // ── SPECIAL — Rare & Secret (8) ──
  { id: 'sp_early', name: 'Early Adopter', nameFr: 'Early Adopter', description: 'Account created before March 2026', descriptionFr: 'Compte créé avant Mars 2026', category: 'special', tier: 'gold', icon: 'sunrise', points: 90, isSecret: false, conditionType: 'account_created_before', conditionValue: 1709251200000 },
  { id: 'sp_early_bird', name: 'Early Bird', nameFr: 'Lève-Tôt', description: 'Workout before 6 AM', descriptionFr: 'Entraînement avant 6h du matin', category: 'special', tier: 'bronze', icon: 'sun', points: 15, isSecret: false, conditionType: 'workout_hour_before', conditionValue: 6 },
  { id: 'sp_night_owl', name: 'Night Owl', nameFr: 'Noctambule', description: 'Workout after 10 PM', descriptionFr: 'Entraînement après 22h', category: 'special', tier: 'bronze', icon: 'moon', points: 15, isSecret: false, conditionType: 'workout_hour_after', conditionValue: 22 },
  { id: 'sp_ironman', name: 'Iron Man/Woman', nameFr: 'Iron Man/Woman', description: '3+ hours workout in one day', descriptionFr: "3h+ d'entraînement en une journée", category: 'special', tier: 'gold', icon: 'shield', points: 90, isSecret: false, conditionType: 'daily_duration_hours', conditionValue: 3 },
  { id: 'sp_marathon', name: 'Marathoner', nameFr: 'Marathonien', description: '2+ hour workout session', descriptionFr: "Séance de 2h+ d'entraînement", category: 'special', tier: 'silver', icon: 'timer', points: 30, isSecret: false, conditionType: 'session_duration_hours', conditionValue: 2 },
  { id: 'sp_weekend', name: 'Weekend Warrior', nameFr: 'Guerrier du Weekend', description: 'Workout every weekend for 1 month', descriptionFr: 'Entraînement chaque weekend pendant 1 mois', category: 'special', tier: 'silver', icon: 'calendar', points: 30, isSecret: false, conditionType: 'weekend_streak', conditionValue: 4 },
  { id: 'sp_newyear', name: 'New Year New Me', nameFr: 'Nouvel An Nouveau Moi', description: 'Workout on January 1st', descriptionFr: 'Entraînement le 1er Janvier', category: 'special', tier: 'bronze', icon: 'party-popper', points: 15, isSecret: false, conditionType: 'workout_date', conditionValue: 101 },
  { id: 'sp_king', name: 'The King', nameFr: 'Le Roi', description: '365-day streak', descriptionFr: 'Série de 365 jours', category: 'special', tier: 'platinum', icon: 'crown', points: 300, isSecret: true, conditionType: 'streak_days', conditionValue: 365 },
];

// ============================================
// DISPLAYABLE BADGES — Excludes social/AI coach
// ============================================

/** Badges visible in the trophies screen (76 displayable) */
export function getDisplayableBadges(): Badge[] {
  return ALL_BADGES.filter((b) => !HIDDEN_BADGE_IDS.has(b.id));
}

// ============================================
// CATEGORY METADATA — 7 displayable categories
// ============================================

export const BADGE_CATEGORIES: {
  id: BadgeCategory;
  label: string;
  labelFr: string;
  icon: string;
  color: string;
}[] = [
  { id: 'science', label: 'Science', labelFr: 'Science', icon: 'flask-conical', color: '#3B82F6' },
  { id: 'volume', label: 'Volume', labelFr: 'Volume', icon: 'weight', color: '#f97316' },
  { id: 'consistency', label: 'Consistency', labelFr: 'Régularité', icon: 'flame', color: '#ef4444' },
  { id: 'strength', label: 'Strength', labelFr: 'Force', icon: 'trophy', color: '#eab308' },
  { id: 'mastery', label: 'Mastery', labelFr: 'Maîtrise', icon: 'crown', color: '#22c55e' },
  { id: 'explorer', label: 'Explorer', labelFr: 'Exploration', icon: 'compass', color: '#a855f7' },
  { id: 'special', label: 'Special', labelFr: 'Spécial', icon: 'sparkles', color: '#f59e0b' },
];

// Tier colors and labels
export const TIER_CONFIG: Record<BadgeTier, { color: string; label: string; labelFr: string }> = {
  bronze: { color: '#CD7F32', label: 'Bronze', labelFr: 'Bronze' },
  silver: { color: '#C0C0C0', label: 'Silver', labelFr: 'Argent' },
  gold: { color: '#FFD700', label: 'Gold', labelFr: 'Or' },
  platinum: { color: '#E5E4E2', label: 'Platinum', labelFr: 'Platine' },
};
