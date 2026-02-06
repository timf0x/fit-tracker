import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, Footprints } from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { mockStats } from '@/lib/mock-data';
import i18n from '@/lib/i18n';

export function StatsRow() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Recovery Card */}
      <Pressable style={styles.card} onPress={() => router.push('/recovery')}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
            <Activity size={16} color="#f97316" strokeWidth={2.5} />
          </View>
          <Text style={styles.label}>RÉCUP</Text>
        </View>
        <View style={styles.valueRow}>
          <Text style={styles.valueOrange}>{mockStats.recovery}</Text>
          <Text style={styles.unit}> /{mockStats.recoveryMax}</Text>
        </View>
      </Pressable>

      {/* Steps Card */}
      <Pressable style={styles.card} onPress={() => router.push('/steps')}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
            <Footprints size={16} color="#3b82f6" strokeWidth={2.5} />
          </View>
          <Text style={styles.label}>STEPS</Text>
        </View>
        <View style={styles.valueRow}>
          <Text style={styles.valueWhite}>{mockStats.steps}</Text>
          <Text style={styles.unit}> /10k</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 14,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: 'rgba(156, 163, 175, 1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueOrange: {
    color: '#f97316',
    fontSize: 32,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  valueWhite: {
    color: Colors.text,
    fontSize: 32,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  unit: {
    color: 'rgba(120, 120, 130, 1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
