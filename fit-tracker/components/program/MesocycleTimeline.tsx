import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';

interface MesocycleTimelineProps {
  totalWeeks: number;
  currentWeek: number;
  selectedWeek: number;
  onSelect: (week: number) => void;
  deloadWeek?: number;
  completedWeeks?: number[]; // weeks where all days completed
}

export function MesocycleTimeline({
  totalWeeks,
  currentWeek,
  selectedWeek,
  onSelect,
  deloadWeek,
  completedWeeks = [],
}: MesocycleTimelineProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const offset = (selectedWeek - 1) * 72;
    scrollRef.current?.scrollTo({ x: Math.max(0, offset - 120), animated: true });
  }, [selectedWeek]);

  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      {weeks.map((week, i) => {
        const isSelected = week === selectedWeek;
        const isCurrent = week === currentWeek;
        const isDeload = week === deloadWeek;
        const isCompleted = completedWeeks.includes(week);
        const isPast = week < currentWeek;
        const isFuture = week > currentWeek;

        return (
          <View key={week} style={styles.nodeContainer}>
            {/* Connector line (before this node) */}
            {i > 0 && (
              <View
                style={[
                  styles.connectorLine,
                  (isPast || isCurrent) && styles.connectorLinePast,
                  isDeload && week <= currentWeek && styles.connectorLineDeload,
                ]}
              />
            )}

            {/* Node */}
            <Pressable
              onPress={() => onSelect(week)}
              style={styles.nodeWrap}
            >
              {/* Outer ring for selected */}
              {isSelected && (
                <View style={[
                  styles.outerRing,
                  isDeload && styles.outerRingDeload,
                ]} />
              )}

              <View
                style={[
                  styles.node,
                  // Completed: filled orange
                  isCompleted && !isDeload && styles.nodeCompleted,
                  // Current: orange ring
                  isCurrent && !isCompleted && !isDeload && styles.nodeCurrent,
                  // Deload completed
                  isDeload && isCompleted && styles.nodeDeloadCompleted,
                  // Deload current/future
                  isDeload && !isCompleted && styles.nodeDeload,
                  // Future (not deload)
                  isFuture && !isDeload && styles.nodeFuture,
                ]}
              >
                {isCompleted && !isDeload && (
                  <View style={styles.nodeInnerFill} />
                )}
                {isCurrent && !isCompleted && !isDeload && (
                  <View style={styles.nodePulse} />
                )}
              </View>
            </Pressable>

            {/* Label */}
            <Text
              style={[
                styles.label,
                isSelected && styles.labelSelected,
                isDeload && styles.labelDeload,
                (isCurrent && !isSelected) && styles.labelCurrent,
              ]}
            >
              {isDeload ? i18n.t('common.deload') : `${i18n.t('common.weekAbbr')}${week}`}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const NODE_SIZE = 28;
const OUTER_SIZE = 36;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 0,
  },
  nodeContainer: {
    alignItems: 'center',
    width: 72,
    position: 'relative',
  },
  nodeWrap: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Connector line
  connectorLine: {
    position: 'absolute',
    top: 12 + NODE_SIZE / 2 - 1,
    left: -20,
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    zIndex: -1,
  },
  connectorLinePast: {
    backgroundColor: Colors.primary,
  },
  connectorLineDeload: {
    backgroundColor: 'rgba(59,130,246,0.5)',
  },

  // Outer ring (selected)
  outerRing: {
    position: 'absolute',
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    borderRadius: OUTER_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.primary,
    opacity: 0.5,
  },
  outerRingDeload: {
    borderColor: '#3B82F6',
  },

  // Node states
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  nodeCurrent: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderColor: Colors.primary,
    borderWidth: 2.5,
  },
  nodeDeload: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  nodeDeloadCompleted: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  nodeFuture: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  nodeInnerFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  nodePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },

  // Labels
  label: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    marginTop: 6,
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  labelDeload: {
    color: 'rgba(59,130,246,0.7)',
  },
  labelCurrent: {
    color: Colors.primary,
  },
});
