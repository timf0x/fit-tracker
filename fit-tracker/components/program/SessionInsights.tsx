import { useState } from 'react';
import { View, Text, StyleSheet, LayoutAnimation, Pressable } from 'react-native';
import { BarChart3, ChevronDown, TrendingUp } from 'lucide-react-native';
import { Fonts, GlassStyle, IconStroke } from '@/constants/theme';
import type { SessionInsightsData, MuscleImpact } from '@/lib/sessionInsights';
import type { VolumeLandmarkZone } from '@/constants/volumeLandmarks';
import i18n from '@/lib/i18n';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const ZONE_LABEL: Record<VolumeLandmarkZone, string> = {
  below_mv: i18n.t('zones.belowMv'),
  mv_mev: i18n.t('zones.maintenance'),
  mev_mav: i18n.t('zones.optimal'),
  mav_mrv: i18n.t('zones.high'),
  above_mrv: i18n.t('zones.excess'),
};

interface Props {
  data: SessionInsightsData;
}

function MuscleRow({ impact }: { impact: MuscleImpact }) {
  const mevPct = impact.landmarks.mrv > 0
    ? impact.landmarks.mev / impact.landmarks.mrv
    : 0;
  const mavHighPct = impact.landmarks.mrv > 0
    ? impact.landmarks.mavHigh / impact.landmarks.mrv
    : 0;

  return (
    <View style={styles.muscleRow}>
      <View style={styles.muscleRowTop}>
        <Text style={styles.muscleLabel}>{impact.labelFr}</Text>
        <Text style={styles.setsText}>
          <Text style={styles.setsCurrentText}>{impact.currentSets}</Text>
          <Text style={styles.setsArrowText}> → </Text>
          <Text style={[styles.setsProjectedText, { color: impact.zoneColor }]}>
            {impact.projectedSets}
          </Text>
        </Text>
        <View style={[styles.zoneBadge, { backgroundColor: impact.zoneColor + '1A' }]}>
          <Text style={[styles.zoneBadgeText, { color: impact.zoneColor }]}>
            {ZONE_LABEL[impact.projectedZone]}
          </Text>
        </View>
      </View>

      {/* Mini zone bar */}
      <View style={styles.barContainer}>
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              {
                backgroundColor: impact.zoneColor,
                width: `${impact.fillPct * 100}%`,
              },
            ]}
          />
        </View>
        {mevPct > 0 && mevPct < 1 && (
          <View style={[styles.barMarker, { left: `${mevPct * 100}%` }]} />
        )}
        {mavHighPct > 0 && mavHighPct < 1 && (
          <View style={[styles.barMarker, { left: `${mavHighPct * 100}%` }]} />
        )}
      </View>
    </View>
  );
}

export function SessionInsights({ data }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Animated chevron rotation
  const chevronRotation = useSharedValue(0);

  useEffect(() => {
    chevronRotation.value = withTiming(expanded ? 1 : 0, { duration: 200 });
  }, [expanded]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(chevronRotation.value, [0, 1], [0, 180])}deg` }],
  }));

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  if (data.muscleImpacts.length === 0) return null;

  // Summary for collapsed state: count of muscles + dominant zone
  const muscleCount = data.muscleImpacts.length;

  return (
    <View style={styles.container}>
      {/* Tappable header row — flat, no card */}
      <Pressable style={styles.header} onPress={toggleExpanded}>
        <BarChart3 size={13} color="rgba(160,150,140,0.7)" />
        <Text style={styles.headerText}>{i18n.t('sessionInsights.weeklyVolume')}</Text>
        <Text style={styles.headerCount}>
          {muscleCount} {i18n.t('common.musclesUnit')}
        </Text>
        <View style={{ flex: 1 }} />
        <Animated.View style={chevronStyle}>
          <ChevronDown size={14} color="rgba(255,255,255,0.15)" strokeWidth={IconStroke.default} />
        </Animated.View>
      </Pressable>

      {/* Expanded content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Muscle rows */}
          <View style={styles.muscleList}>
            {data.muscleImpacts.map((impact) => (
              <MuscleRow key={impact.muscle} impact={impact} />
            ))}
          </View>

          {/* Overload tips */}
          {data.overloadTips.length > 0 && (
            <View style={styles.tipsSection}>
              {data.overloadTips.map((tip) => (
                <View key={tip.exerciseId} style={styles.tipRow}>
                  <TrendingUp size={12} color="#FF6B35" />
                  <Text style={styles.tipText} numberOfLines={2}>
                    {tip.exerciseName} : {tip.tip}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Bottom separator */}
      <View style={styles.separator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    minHeight: 48,
  },
  headerText: {
    color: 'rgba(160,150,140,0.7)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1,
  },
  headerCount: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  expandedContent: {
    paddingBottom: 6,
  },
  muscleList: {
    gap: 8,
  },
  muscleRow: {
    gap: 4,
  },
  muscleRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muscleLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flex: 1,
  },
  setsText: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  setsCurrentText: {
    color: 'rgba(255,255,255,0.4)',
  },
  setsArrowText: {
    color: 'rgba(255,255,255,0.2)',
  },
  setsProjectedText: {
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  zoneBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  zoneBadgeText: {
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  barContainer: {
    height: 4,
    position: 'relative',
    marginTop: 2,
  },
  barBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: GlassStyle.card.borderColor,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  barMarker: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 8,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginLeft: -1,
  },
  tipsSection: {
    marginTop: 10,
    gap: 6,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,107,53,0.06)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tipText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: GlassStyle.card.backgroundColor,
  },
});
