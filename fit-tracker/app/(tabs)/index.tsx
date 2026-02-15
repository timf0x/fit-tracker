import { useMemo, useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
import { Spacing } from '@/constants/theme';
import { HeaderGreeting } from '@/components/home/HeaderGreeting';
import { RecoveryCard } from '@/components/home/RecoveryCard';
import { StepsCard } from '@/components/home/StepsCard';
import { CalendarCard } from '@/components/home/CalendarCard';
import { VolumeCard } from '@/components/home/VolumeCard';
import { ActiveProgramCard } from '@/components/home/ActiveProgramCard';
import { AchievementCard } from '@/components/home/AchievementCard';
import { DraggableCardList } from '@/components/home/DraggableCardList';
import { AmbientBackground } from '@/components/home/AmbientBackground';
import { useWorkoutStore } from '@/stores/workoutStore';
import { HomeRefreshContext } from '@/lib/refreshContext';

// Default card order — these keys match the cards map below
const DEFAULT_ORDER = ['recovery', 'weekly', 'volume', 'program', 'achievement', 'steps'];

// Card sizes: half cards pair side-by-side, full cards take the whole row
const CARD_SIZES: Record<string, 'full' | 'half'> = {
  recovery: 'full',
  steps: 'full',
  achievement: 'full',
  weekly: 'full',
  program: 'full',
  volume: 'full',
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const fadeHeight = insets.top + 30;

  const [isDragging, setIsDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { homeCardOrder, setHomeCardOrder } = useWorkoutStore();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshKey((k) => k + 1);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  // Resolve order: migrate persisted order when cards are added/removed
  const cardOrder = useMemo(() => {
    // Filter persisted order to only include currently valid keys
    const valid = homeCardOrder.filter((k) => DEFAULT_ORDER.includes(k));
    // Add any new cards that weren't in the persisted order
    const missing = DEFAULT_ORDER.filter((k) => !valid.includes(k));
    const merged = [...valid, ...missing];
    // Use merged if it covers all cards, otherwise reset
    if (merged.length === DEFAULT_ORDER.length) {
      return merged;
    }
    return DEFAULT_ORDER;
  }, [homeCardOrder]);

  const handleReorder = useCallback((newOrder: string[]) => {
    setHomeCardOrder(newOrder);
  }, [setHomeCardOrder]);

  // Stable card components — created once, never re-instantiated
  const cardComponents = useMemo<Record<string, React.ReactNode>>(() => ({
    recovery: <RecoveryCard />,
    steps: <StepsCard />,
    achievement: <AchievementCard />,
    weekly: <CalendarCard />,
    program: <ActiveProgramCard />,
    volume: <VolumeCard />,
  }), []);

  return (
    <HomeRefreshContext.Provider value={refreshKey}>
      <View style={styles.screen}>
        {/* Ambient breathing orbs — data-driven warmth */}
        <AmbientBackground />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isDragging}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="rgba(255,255,255,0.35)"
              progressViewOffset={insets.top}
            />
          }
        >
          {/* Header is always pinned at top */}
          <HeaderGreeting />

          {/* Draggable cards — grid layout with full/half sizes */}
          <DraggableCardList
            order={cardOrder}
            sizes={CARD_SIZES}
            onReorder={handleReorder}
            cards={cardComponents}
            onDragStateChange={setIsDragging}
          />

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
    </HomeRefreshContext.Provider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0C0C0C',
    position: 'relative',
    overflow: 'hidden',
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
    // paddingBottom set dynamically via insets.bottom + 80
  },
});
