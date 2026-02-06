import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { WorkoutCard } from './WorkoutCard';
import { mockWorkouts } from '@/lib/mock-data';
import i18n from '@/lib/i18n';

export function RecommendedSection() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('home.recommended.title')}</Text>
        <Pressable>
          <Text style={styles.viewAll}>{i18n.t('home.recommended.viewAll')}</Text>
        </Pressable>
      </View>

      <View style={styles.cards}>
        {mockWorkouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            name={workout.name}
            level={workout.level}
            type={workout.type}
            duration={workout.duration}
            calories={workout.calories}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    gap: 20,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  viewAll: {
    color: '#f97316',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  cards: {
    gap: 16,
  },
});
