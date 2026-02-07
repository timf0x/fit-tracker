import { View, ScrollView, StyleSheet } from 'react-native';
import { Spacing } from '@/constants/theme';
import { HeaderGreeting } from '@/components/home/HeaderGreeting';
import { StatsRow } from '@/components/home/StatsRow';
import { WeeklyActivity } from '@/components/home/WeeklyActivity';
import { VolumeCard } from '@/components/home/VolumeCard';
import { RecommendedSection } from '@/components/home/RecommendedSection';
import { BrowseButton } from '@/components/home/BrowseButton';

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      {/* Ambient decorative orbs */}
      <View style={styles.orbOrange} />
      <View style={styles.orbBlue} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HeaderGreeting />
        <StatsRow />
        <WeeklyActivity />
        <VolumeCard />
        <RecommendedSection />
        <BrowseButton />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0C0C0C',
    position: 'relative',
    overflow: 'hidden',
  },
  // Decorative ambient orbs
  orbOrange: {
    position: 'absolute',
    top: -96,
    right: -96,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(249, 115, 22, 0.10)',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 100,
  },
  orbBlue: {
    position: 'absolute',
    top: '50%',
    left: -128,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 120,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    gap: Spacing.md,
    paddingBottom: 120,
  },
});
