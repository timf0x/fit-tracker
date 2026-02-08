import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { Dumbbell, ChevronRight } from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { mockBrowse } from '@/lib/mock-data';
import i18n from '@/lib/i18n';

export function BrowseButton() {
  return (
    <View style={styles.container}>
      <PressableScale style={styles.cardWrapper}>
        <LinearGradient
          colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
            <Dumbbell size={20} color="#f97316" strokeWidth={2} />
          </View>

          <View style={styles.textSection}>
            <Text style={styles.title}>{i18n.t('home.browse.title')}</Text>
            <Text style={styles.subtitle}>
              {mockBrowse.totalWorkouts} {i18n.t('home.browse.subtitle')}
            </Text>
          </View>

          <ChevronRight size={18} color="rgba(113,113,122,1)" strokeWidth={2} />
        </LinearGradient>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 24,
  },
  cardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  card: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textSection: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  subtitle: {
    color: 'rgba(113,113,122,1)',
    fontSize: 12,
    fontFamily: Fonts?.sans,
  },
});
