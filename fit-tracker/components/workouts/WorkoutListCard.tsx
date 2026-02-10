import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Flame,
  Anchor,
  Mountain,
  Target,
  Dumbbell,
  Footprints,
  Zap,
  User,
  ChevronRight,
} from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { Fonts } from '@/constants/theme';
import { getCategoryIcon } from '@/constants/icons';
import { getExerciseById } from '@/data/exercises';
import { Workout } from '@/types';
import type { LucideIcon } from 'lucide-react-native';
import i18n from '@/lib/i18n';

const LUCIDE_MAP: Record<string, LucideIcon> = {
  flame: Flame,
  anchor: Anchor,
  mountain: Mountain,
  target: Target,
  zap: Zap,
  user: User,
  dumbbell: Dumbbell,
  footprints: Footprints,
};

// Preset workouts use legacy icon names — map them to Lucide keys
const LEGACY_ICON_ALIAS: Record<string, string> = {
  body: 'user',
  barbell: 'dumbbell',
  walk: 'footprints',
  flash: 'zap',
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: i18n.t('levels.beginner'),
  intermediate: i18n.t('levels.intermediate'),
  advanced: i18n.t('levels.advanced'),
  all: i18n.t('levels.all'),
};

// BodyPart → French labels (for exercise body parts)
const BODY_PART_LABELS_FR: Record<string, string> = {
  back: i18n.t('bodyParts.back'),
  shoulders: i18n.t('bodyParts.shoulders'),
  chest: i18n.t('bodyParts.chest'),
  'upper arms': i18n.t('bodyParts.upperArms'),
  'lower arms': i18n.t('bodyParts.forearms'),
  'upper legs': i18n.t('bodyParts.upperLegs'),
  'lower legs': i18n.t('bodyParts.lowerLegs'),
  waist: i18n.t('bodyParts.waist'),
  cardio: i18n.t('bodyParts.cardio'),
};

// ─── Card ────────────────────────────────────────

interface WorkoutListCardProps {
  workout: Workout;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function WorkoutListCard({ workout, onPress, onLongPress }: WorkoutListCardProps) {
  const focusKey = workout.focus || 'full_body';
  const iconKey = workout.icon || focusKey;
  // Resolve icon: legacy alias → direct Lucide name → category lookup
  const resolvedLucide = LEGACY_ICON_ALIAS[iconKey] || iconKey;
  const categoryInfo = getCategoryIcon(focusKey);
  const IconComponent =
    LUCIDE_MAP[resolvedLucide] ||
    LUCIDE_MAP[categoryInfo.icon] ||
    Flame;
  const levelLabel = LEVEL_LABELS[workout.level] || workout.level;
  // Subtle category color for badge (warm tint instead of all-gray)
  const badgeColor = categoryInfo.color;
  const badgeBg = categoryInfo.bgColor;

  const muscleText = useMemo(() => {
    const parts = new Set<string>();
    workout.exercises.forEach(({ exerciseId }) => {
      const ex = getExerciseById(exerciseId);
      if (ex) parts.add(ex.bodyPart);
    });
    const labels = Array.from(parts)
      .slice(0, 3)
      .map((p) => BODY_PART_LABELS_FR[p] || p);
    return labels.join(', ');
  }, [workout.exercises]);

  const exoCount = workout.exerciseCount || workout.exercises.length;

  return (
    <PressableScale
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      {/* Focus badge — subtle category tint */}
      <View style={[styles.iconBadge, { backgroundColor: badgeBg }]}>
        <IconComponent
          size={14}
          color={badgeColor}
          strokeWidth={2}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {workout.nameFr}
          </Text>
          <Text style={styles.duration}>~{workout.durationMinutes}m</Text>
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {levelLabel}
          {muscleText ? ` · ${muscleText}` : ''}
          {` · ${exoCount} ${i18n.t('common.exosAbbr')}`}
        </Text>
      </View>

      <ChevronRight size={14} color="rgba(100,100,110,1)" />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 12,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    flex: 1,
  },
  duration: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginLeft: 8,
  },
  meta: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
