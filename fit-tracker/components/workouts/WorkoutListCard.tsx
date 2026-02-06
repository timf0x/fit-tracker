import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  Flame,
  Dumbbell,
  Footprints,
  Zap,
  User,
  Clock,
} from 'lucide-react-native';
import { Fonts } from '@/constants/theme';
import { Workout } from '@/types';
import type { LucideIcon } from 'lucide-react-native';

const FOCUS_COLORS: Record<string, string> = {
  push: '#ff7043',
  pull: '#42a5f5',
  legs: '#66bb6a',
  core: '#fbbf24',
  cardio: '#ff4444',
  full_body: '#ff7043',
  upper: '#42a5f5',
  lower: '#66bb6a',
};

const ICON_MAP: Record<string, LucideIcon> = {
  flame: Flame,
  barbell: Dumbbell,
  walk: Footprints,
  flash: Zap,
  body: User,
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  all: 'Tous niveaux',
};

interface WorkoutListCardProps {
  workout: Workout;
  onPress?: () => void;
}

export function WorkoutListCard({ workout, onPress }: WorkoutListCardProps) {
  const color = FOCUS_COLORS[workout.focus || 'full_body'] || '#ff7043';
  const IconComponent = ICON_MAP[workout.icon || 'flame'] || Flame;
  const levelLabel = LEVEL_LABELS[workout.level] || workout.level;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: `${color}14`,
            borderColor: `${color}30`,
            shadowColor: color,
          },
        ]}
      >
        <IconComponent size={22} color={color} strokeWidth={2.2} />
      </View>

      <View style={styles.textContent}>
        <Text style={styles.name} numberOfLines={1}>
          {workout.nameFr}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {levelLabel} · {workout.exerciseCount} exercices
        </Text>
      </View>

      <View style={styles.metaColumn}>
        <View style={styles.durationBadge}>
          <Clock size={10} color="rgba(180, 180, 190, 1)" strokeWidth={2.5} />
          <Text style={styles.durationText}>{workout.durationMinutes}m</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
  cardPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  textContent: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: 'rgba(230, 230, 240, 1)',
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: 'rgba(120, 120, 130, 1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  metaColumn: {
    alignItems: 'flex-end',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  durationText: {
    color: 'rgba(180, 180, 190, 1)',
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
});
