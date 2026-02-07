import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  Info,
  X,
} from 'lucide-react-native';
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
  const [expanded, setExpanded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const { history } = useWorkoutStore();

  const muscleVolume = useMemo(() => {
    const fromHistory = getSetsPerMuscle(history, 7);
    const hasData = Object.values(fromHistory).some((v) => v > 0);
    const data = hasData ? fromHistory : mockWeeklyVolume;

    return Object.entries(RP_VOLUME_LANDMARKS)
      .map(([muscle, landmarks]) => ({
        muscle,
        label: MUSCLE_LABELS_FR[muscle] || muscle,
        sets: data[muscle] || 0,
        landmarks,
      }))
      .filter((e) => e.sets > 0)
      .sort((a, b) => b.sets - a.sets);
  }, [history]);

  if (muscleVolume.length === 0) return null;

  const visible = expanded ? muscleVolume : muscleVolume.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Volume par muscle</Text>
          <Pressable style={styles.infoBtn} onPress={() => setShowInfo(true)}>
            <Info size={14} color="#6B7280" />
          </Pressable>
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
                </View>
                <Text style={styles.value}>
                  <Text style={{ color: zoneColor }}>{item.sets}</Text>
                  <Text style={styles.target}>/{item.landmarks.mavHigh}</Text>
                </Text>
              </View>
            );
          })}
        </View>

        {muscleVolume.length > 3 && (
          <Pressable
            style={styles.expandBtn}
            onPress={() => setExpanded(!expanded)}
          >
            <Text style={styles.expandText}>
              {expanded ? 'Réduire' : `Voir tout (${muscleVolume.length})`}
            </Text>
            {expanded ? (
              <ChevronUp size={14} color="rgba(160,150,140,1)" strokeWidth={2} />
            ) : (
              <ChevronDown size={14} color="rgba(160,150,140,1)" strokeWidth={2} />
            )}
          </Pressable>
        )}
      </View>

      {/* Volume Info Modal */}
      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfo(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowInfo(false)}>
          <Pressable style={styles.infoModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>Repères de Volume</Text>
              <Pressable style={styles.modalClose} onPress={() => setShowInfo(false)}>
                <X size={18} color="#9CA3AF" />
              </Pressable>
            </View>
            <Text style={styles.infoModalText}>
              Le volume (séries par semaine) détermine vos gains musculaires.
              Ces repères vous aident à optimiser votre entraînement.
            </Text>
            <View style={styles.landmarkList}>
              {[
                { abbr: 'MV', name: 'Volume de Maintien', desc: 'Minimum pour conserver vos gains sans progresser.', color: '#6B7280' },
                { abbr: 'MEV', name: 'Volume Minimum Efficace', desc: 'Seuil à partir duquel vous commencez à progresser.', color: '#3B82F6' },
                { abbr: 'MAV', name: 'Volume Adaptatif Max', desc: 'Zone optimale pour la croissance musculaire. Visez cette plage !', color: '#4ADE80' },
                { abbr: 'MRV', name: 'Volume Max Récupérable', desc: 'Au-delà, vous risquez le surentraînement et la régression.', color: '#EF4444' },
              ].map((item) => (
                <View key={item.abbr} style={styles.landmarkItem}>
                  <View style={styles.landmarkHeader}>
                    <View style={[styles.landmarkDot, { backgroundColor: item.color }]} />
                    <Text style={styles.landmarkAbbr}>{item.abbr}</Text>
                    <Text style={styles.landmarkName}>{item.name}</Text>
                  </View>
                  <Text style={styles.landmarkDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
            <View style={styles.progressionBox}>
              <Text style={styles.progressionLabel}>PROGRESSION IDÉALE</Text>
              <View style={styles.progressionBar}>
                <View style={[styles.progressionZone, { flex: 1, backgroundColor: '#6B7280' }]} />
                <View style={[styles.progressionZone, { flex: 1, backgroundColor: '#3B82F6' }]} />
                <View style={[styles.progressionZone, { flex: 2, backgroundColor: '#4ADE80' }]} />
                <View style={[styles.progressionZone, { flex: 1, backgroundColor: '#FBBF24' }]} />
                <View style={[styles.progressionZone, { flex: 0.5, backgroundColor: '#EF4444' }]} />
              </View>
              <View style={styles.progressionLabels}>
                <Text style={styles.progressionMarker}>MV</Text>
                <Text style={styles.progressionMarker}>MEV</Text>
                <Text style={[styles.progressionMarker, { color: '#4ADE80' }]}>MAV</Text>
                <Text style={styles.progressionMarker}>MRV</Text>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  infoBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
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
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 2,
  },
  expandText: {
    color: 'rgba(160,150,140,1)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  infoModal: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
    maxHeight: '85%',
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoModalTitle: {
    fontSize: 18,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalText: {
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 20,
  },
  landmarkList: { gap: 16 },
  landmarkItem: { gap: 4 },
  landmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  landmarkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  landmarkAbbr: {
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
    width: 36,
  },
  landmarkName: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#D1D5DB',
    flex: 1,
  },
  landmarkDesc: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 54,
    lineHeight: 16,
  },
  progressionBox: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 16,
  },
  progressionLabel: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  progressionBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressionZone: {
    height: '100%',
  },
  progressionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  progressionMarker: {
    fontSize: 10,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#6B7280',
  },
});
