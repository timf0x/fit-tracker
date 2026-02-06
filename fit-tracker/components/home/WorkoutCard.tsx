import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';

interface WorkoutCardProps {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  type: 'express' | 'complete';
  duration: number;
  calories: number;
}

const LEVEL_CONFIG: Record<string, { bg: string; text: string }> = {
  beginner: { bg: '#22c55e', text: '#FFFFFF' },
  intermediate: { bg: '#3b82f6', text: '#FFFFFF' },
  advanced: { bg: '#f97316', text: '#FFFFFF' },
};

// Rich gradient backgrounds to simulate workout imagery
const CARD_GRADIENTS: string[][] = [
  ['#1a0a00', '#2d1810', '#1a0f0a', '#0a0503'],
  ['#0a0f1a', '#101828', '#0f1520', '#050810'],
  ['#0f1a0a', '#152010', '#0d1808', '#050a03'],
];

export function WorkoutCard({ name, level, type, duration, calories }: WorkoutCardProps) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.intermediate;
  const levelLabel = i18n.t(`levels.${level}`);
  // Rotate gradients based on name length as a simple hash
  const gradientIndex = name.length % CARD_GRADIENTS.length;
  const gradient = CARD_GRADIENTS[gradientIndex];

  return (
    <Pressable style={styles.container}>
      {/* Background gradient simulating photo */}
      <LinearGradient
        colors={gradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      {/* Overlay gradient for text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
        locations={[0, 0.4, 1]}
        style={styles.overlay}
      />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.bottomRow}>
          <View style={styles.info}>
            <View style={styles.badges}>
              <View style={[styles.levelBadge, { backgroundColor: config.bg }]}>
                <Text style={[styles.levelText, { color: config.text }]}>{levelLabel}</Text>
              </View>
            </View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.subtitle}>
              {duration} {i18n.t('home.workoutCard.mins')} • {calories} {i18n.t('home.workoutCard.kcal')}
            </Text>
          </View>

          <View style={styles.playButton}>
            <Play size={16} color="#000" fill="#000" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 192,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 9,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  name: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(209, 213, 219, 1)',
    fontSize: 13,
    fontFamily: Fonts?.sans,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});
