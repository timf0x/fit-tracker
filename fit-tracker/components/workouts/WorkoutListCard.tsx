import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  Flame,
  Anchor,
  Mountain,
  Target,
  Dumbbell,
  Footprints,
  Zap,
  User,
  Clock,
} from 'lucide-react-native';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Circle,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Fonts } from '@/constants/theme';
import { getCategoryIcon } from '@/constants/icons';
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
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  all: 'Tous niveaux',
};

// ─── Kinetic Orb ─────────────────────────────────

const ORB_SIZE = 48;
const STROKE_W = 1.5;
const ORB_R = (ORB_SIZE - STROKE_W) / 2;

function KineticOrb({ color, icon: Icon }: { color: string; icon: LucideIcon }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 6000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={orbStyles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, ringStyle]}>
        <Svg width={ORB_SIZE} height={ORB_SIZE}>
          <Defs>
            <SvgGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.12" />
              <Stop offset="0.35" stopColor={color} stopOpacity="0.5" />
              <Stop offset="0.55" stopColor={color} stopOpacity="0.06" />
              <Stop offset="0.85" stopColor={color} stopOpacity="0.4" />
              <Stop offset="1" stopColor={color} stopOpacity="0.1" />
            </SvgGradient>
          </Defs>
          <Circle
            cx={ORB_SIZE / 2}
            cy={ORB_SIZE / 2}
            r={ORB_R}
            stroke="url(#g)"
            strokeWidth={STROKE_W}
            fill="#0d0d0d"
          />
        </Svg>
      </Animated.View>
      <Icon size={18} color={`${color}B3`} strokeWidth={2} />
    </View>
  );
}

const orbStyles = StyleSheet.create({
  container: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Card ────────────────────────────────────────

interface WorkoutListCardProps {
  workout: Workout;
  onPress?: () => void;
}

export function WorkoutListCard({ workout, onPress }: WorkoutListCardProps) {
  const color = FOCUS_COLORS[workout.focus || 'full_body'] || '#ff7043';
  const iconKey = workout.icon || workout.focus || 'push';
  // Resolve icon: legacy alias → direct Lucide name → category lookup
  const resolvedLucide = LEGACY_ICON_ALIAS[iconKey] || iconKey;
  const IconComponent = LUCIDE_MAP[resolvedLucide] || LUCIDE_MAP[getCategoryIcon(iconKey).icon] || Flame;
  const levelLabel = LEVEL_LABELS[workout.level] || workout.level;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <KineticOrb color={color} icon={IconComponent} />

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
