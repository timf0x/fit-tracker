import { useState } from 'react';
import { View, Text, StyleSheet, LayoutAnimation, Pressable } from 'react-native';
import { BarChart3, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react-native';
import { Fonts } from '@/constants/theme';
import type { SessionInsightsData, MuscleImpact } from '@/lib/sessionInsights';
import type { VolumeLandmarkZone } from '@/constants/volumeLandmarks';

const ZONE_LABEL: Record<VolumeLandmarkZone, string> = {
  below_mv: 'Sous MV',
  mv_mev: 'Maintien',
  mev_mav: 'Optimal',
  mav_mrv: 'Élevé',
  above_mrv: 'Excès',
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
        {/* MEV marker */}
        {mevPct > 0 && mevPct < 1 && (
          <View style={[styles.barMarker, { left: `${mevPct * 100}%` }]} />
        )}
        {/* MAV high marker */}
        {mavHighPct > 0 && mavHighPct < 1 && (
          <View style={[styles.barMarker, { left: `${mavHighPct * 100}%` }]} />
        )}
      </View>
    </View>
  );
}

export function SessionInsights({ data }: Props) {
  const [expanded, setExpanded] = useState(true);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  if (data.muscleImpacts.length === 0) return null;

  return (
    <View style={styles.card}>
      {/* Header */}
      <Pressable style={styles.header} onPress={toggleExpanded}>
        <BarChart3 size={14} color="rgba(160,150,140,1)" />
        <Text style={styles.headerText}>IMPACT DE LA SÉANCE</Text>
        <View style={{ flex: 1 }} />
        {expanded ? (
          <ChevronUp size={16} color="rgba(160,150,140,0.6)" />
        ) : (
          <ChevronDown size={16} color="rgba(160,150,140,0.6)" />
        )}
      </Pressable>

      {expanded && (
        <>
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1,
  },
  muscleList: {
    marginTop: 12,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flex: 1,
  },
});
