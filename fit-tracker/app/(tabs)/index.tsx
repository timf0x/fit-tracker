import { useMemo, useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Spacing } from '@/constants/theme';
import { HeaderGreeting } from '@/components/home/HeaderGreeting';
import { RecoveryCard } from '@/components/home/RecoveryCard';
import { StepsCard } from '@/components/home/StepsCard';
import { WeeklyActivity } from '@/components/home/WeeklyActivity';
import { VolumeCard } from '@/components/home/VolumeCard';
import { ActiveProgramCard } from '@/components/home/ActiveProgramCard';
import { RecommendedSection } from '@/components/home/RecommendedSection';
import { BrowseButton } from '@/components/home/BrowseButton';
import { DraggableCardList } from '@/components/home/DraggableCardList';
import { useWorkoutStore } from '@/stores/workoutStore';

// Default card order — these keys match the cards map below
const DEFAULT_ORDER = ['recovery', 'steps', 'weekly', 'program', 'volume', 'recommended'];

// Card sizes: half cards pair side-by-side, full cards take the whole row
const CARD_SIZES: Record<string, 'full' | 'half'> = {
  recovery: 'half',
  steps: 'half',
  weekly: 'full',
  program: 'full',
  volume: 'full',
  recommended: 'full',
};

const CARD_COMPONENTS: Record<string, React.ReactNode> = {
  recovery: <RecoveryCard />,
  steps: <StepsCard />,
  weekly: <WeeklyActivity />,
  program: <ActiveProgramCard />,
  volume: <VolumeCard />,
  recommended: <RecommendedSection />,
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const fadeHeight = insets.top + 30;

  const [isDragging, setIsDragging] = useState(false);
  const { homeCardOrder, setHomeCardOrder } = useWorkoutStore();

  // Resolve order: use persisted order if valid, otherwise default
  const cardOrder = useMemo(() => {
    if (
      homeCardOrder.length === DEFAULT_ORDER.length &&
      DEFAULT_ORDER.every((k) => homeCardOrder.includes(k))
    ) {
      return homeCardOrder;
    }
    return DEFAULT_ORDER;
  }, [homeCardOrder]);

  const handleReorder = useCallback((newOrder: string[]) => {
    setHomeCardOrder(newOrder);
  }, [setHomeCardOrder]);

  return (
    <View style={styles.screen}>
      {/* Ambient decorative orbs */}
      <View style={styles.orbOrange} />
      <View style={styles.orbBlue} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDragging}
      >
        {/* Header is always pinned at top */}
        <HeaderGreeting />

        {/* Draggable cards — grid layout with full/half sizes */}
        <DraggableCardList
          order={cardOrder}
          sizes={CARD_SIZES}
          onReorder={handleReorder}
          cards={CARD_COMPONENTS}
          onDragStateChange={setIsDragging}
        />

        {/* Browse button always at bottom */}
        <BrowseButton />
      </ScrollView>

      {/* Gradient-masked blur behind status bar / notch */}
      <MaskedView
        style={[styles.topFade, { height: fadeHeight }]}
        maskElement={
          <LinearGradient
            colors={['#000', '#000', 'transparent']}
            locations={[0, 0.5, 1]}
            style={{ flex: 1 }}
          />
        }
        pointerEvents="none"
      >
        <BlurView
          intensity={50}
          tint="dark"
          style={{ flex: 1 }}
        />
      </MaskedView>
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
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    gap: Spacing.md,
    paddingBottom: 120,
  },
});
