import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Fonts, Spacing } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';
import { getSetsPerMuscle, MUSCLE_LABELS_FR } from '@/lib/muscleMapping';
import {
  RP_VOLUME_LANDMARKS,
  getVolumeZone,
  getZoneColor,
} from '@/constants/volumeLandmarks';
import { mockWeeklyVolume } from '@/lib/mock-data';

export function VolumeCard() {
  const router = useRouter();
  const { history, muscleOrder } = useWorkoutStore();

  const muscleVolume = useMemo(() => {
    const fromHistory = getSetsPerMuscle(history, 7);
    const hasData = Object.values(fromHistory).some((v) => v > 0);
    const data = hasData ? fromHistory : mockWeeklyVolume;

    const all = Object.entries(RP_VOLUME_LANDMARKS)
      .map(([muscle, landmarks]) => ({
        muscle,
        label: MUSCLE_LABELS_FR[muscle] || muscle,
        sets: data[muscle] || 0,
        landmarks,
      }))
      .filter((e) => e.sets > 0);

    // Match the volume page order: use muscleOrder if set, else sets desc
    if (muscleOrder.length > 0) {
      const orderMap = new Map(muscleOrder.map((m, i) => [m, i]));
      return all.sort((a, b) => {
        const aIdx = orderMap.get(a.muscle);
        const bIdx = orderMap.get(b.muscle);
        if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx;
        if (aIdx !== undefined) return -1;
        if (bIdx !== undefined) return 1;
        return b.sets - a.sets;
      });
    }

    return all.sort((a, b) => b.sets - a.sets);
  }, [history, muscleOrder]);

  if (muscleVolume.length === 0) return null;

  const visible = muscleVolume.slice(0, 3);

  return (
    <View style={styles.container}>
      <Pressable style={styles.card} onPress={() => router.push('/volume')}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>VOLUME HEBDO</Text>
          <ChevronRight size={16} color="rgba(120,120,130,1)" strokeWidth={2} />
        </View>

        <View style={styles.list}>
          {visible.map((item) => {
            const zone = getVolumeZone(item.sets, item.landmarks);
            const zoneColor = getZoneColor(zone);
            const fillPct = Math.min(item.sets / item.landmarks.mrv, 1);
            const mvPct = item.landmarks.mv / item.landmarks.mrv;
            const mevPct = item.landmarks.mev / item.landmarks.mrv;
            const mavPct = item.landmarks.mavHigh / item.landmarks.mrv;

            return (
              <View key={item.muscle} style={styles.row}>
                <Text style={styles.label}>{item.label}</Text>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${fillPct * 100}%`, backgroundColor: zoneColor },
                    ]}
                  />
                  <View style={[styles.marker, { left: `${mvPct * 100}%` }]} />
                  <View
                    style={[
                      styles.marker,
                      styles.markerGreen,
                      { left: `${mevPct * 100}%` },
                    ]}
                  />
                  <View
                    style={[
                      styles.marker,
                      styles.markerYellow,
                      { left: `${mavPct * 100}%` },
                    ]}
                  />
                  <View
                    style={[
                      styles.marker,
                      styles.markerRed,
                      { left: '100%' },
                    ]}
                  />
                </View>
                <Text style={styles.value}>
                  <Text style={{ color: zoneColor }}>{item.sets}</Text>
                  <Text style={styles.target}>/{item.landmarks.mavHigh}</Text>
                </Text>
              </View>
            );
          })}
        </View>

      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    paddingBottom: 20,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: 'rgba(200,200,210,1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    width: 76,
    color: 'rgba(180,180,190,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: 4,
  },
  marker: {
    position: 'absolute',
    top: -3,
    width: 2,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1,
  },
  markerGreen: {
    backgroundColor: 'rgba(74, 222, 128, 0.85)',
  },
  markerYellow: {
    backgroundColor: 'rgba(251, 191, 36, 0.85)',
  },
  markerRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
  },
  value: {
    width: 44,
    textAlign: 'right',
    fontSize: 12,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  target: {
    color: 'rgba(100,100,110,1)',
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
