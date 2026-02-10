import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';
import { RP_VOLUME_LANDMARKS, getVolumeZone, getZoneColor } from '@/constants/volumeLandmarks';
import { getMuscleLabel } from '@/lib/muscleMapping';
import i18n from '@/lib/i18n';

interface VolumeSnapshotProps {
  volumeTargets: Record<string, number>;
  maxRows?: number;
}

/**
 * Compact zone-colored volume mini-bars for top muscles.
 * Shows target sets vs MRV with zone-colored fill + dot.
 */
export function VolumeSnapshot({ volumeTargets, maxRows = 5 }: VolumeSnapshotProps) {
  const rows = useMemo(() => {
    return Object.entries(volumeTargets)
      .filter(([, sets]) => sets > 0)
      .sort(([, a], [, b]) => b - a);
  }, [volumeTargets]);

  const visible = rows.slice(0, maxRows);
  const remaining = rows.length - visible.length;

  if (visible.length === 0) return null;

  return (
    <View style={styles.container}>
      {visible.map(([muscle, sets]) => {
        const landmarks = RP_VOLUME_LANDMARKS[muscle];
        if (!landmarks) return null;

        const zone = getVolumeZone(sets, landmarks);
        const color = getZoneColor(zone);
        const fillPct = Math.min(sets / landmarks.mrv, 1);

        return (
          <View key={muscle} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {getMuscleLabel(muscle)}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${fillPct * 100}%`, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={styles.sets}>{sets}</Text>
            <View style={[styles.zoneDot, { backgroundColor: color }]} />
          </View>
        );
      })}
      {remaining > 0 && (
        <Text style={styles.moreText}>
          {i18n.t('programOverview.nMoreMuscles', { count: remaining })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 18,
    gap: 8,
  },
  label: {
    width: 76,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  sets: {
    width: 20,
    textAlign: 'right',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  zoneDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  moreText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 2,
  },
});
