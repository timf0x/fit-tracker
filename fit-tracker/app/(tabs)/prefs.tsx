import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Trophy,
  Globe,
  Bell,
  Ruler,
  Info,
  MessageCircle,
  ChevronRight,
} from 'lucide-react-native';
import { Fonts } from '@/constants/theme';

type LucideIcon = React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;

interface PrefsRowProps {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  label: string;
  onPress: () => void;
}

function PrefsRow({ icon: Icon, iconColor, iconBg, label, onPress }: PrefsRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.rowIconBox, { backgroundColor: iconBg }]}>
        <Icon size={18} color={iconColor} strokeWidth={2.2} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <ChevronRight size={18} color="rgba(120,120,130,1)" strokeWidth={2} />
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function PrefsScreen() {
  const router = useRouter();

  const comingSoon = () => Alert.alert('Bientôt', 'Cette fonctionnalité arrive bientôt.');

  return (
    <View style={styles.screen}>
      <View style={styles.orbOrange} pointerEvents="none" />
      <View style={styles.orbBlue} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerLabel}>RÉGLAGES</Text>
            <Text style={styles.headerTitle}>Préférences</Text>
          </View>

          {/* Section: Mon profil */}
          <SectionHeader title="Mon profil" />
          <View style={styles.sectionCard}>
            <PrefsRow
              icon={Trophy}
              iconColor="#eab308"
              iconBg="rgba(234,179,8,0.15)"
              label="Mes Trophées"
              onPress={() => router.push('/trophies')}
            />
          </View>

          {/* Section: Préférences */}
          <SectionHeader title="Préférences" />
          <View style={styles.sectionCard}>
            <PrefsRow
              icon={Globe}
              iconColor="#A855F7"
              iconBg="rgba(168,85,247,0.15)"
              label="Langue"
              onPress={comingSoon}
            />
            <View style={styles.rowDivider} />
            <PrefsRow
              icon={Bell}
              iconColor="#f97316"
              iconBg="rgba(249,115,22,0.15)"
              label="Notifications"
              onPress={comingSoon}
            />
            <View style={styles.rowDivider} />
            <PrefsRow
              icon={Ruler}
              iconColor="#4ADE80"
              iconBg="rgba(74,222,128,0.15)"
              label="Unités (kg/lbs)"
              onPress={comingSoon}
            />
          </View>

          {/* Section: À propos */}
          <SectionHeader title="À propos" />
          <View style={styles.sectionCard}>
            <PrefsRow
              icon={Info}
              iconColor="rgba(160,160,170,1)"
              iconBg="rgba(160,160,170,0.12)"
              label="À propos"
              onPress={comingSoon}
            />
            <View style={styles.rowDivider} />
            <PrefsRow
              icon={MessageCircle}
              iconColor="#22D3EE"
              iconBg="rgba(34,211,238,0.15)"
              label="Nous contacter"
              onPress={comingSoon}
            />
          </View>

          {/* Footer */}
          <Text style={styles.versionText}>Version 1.0.0</Text>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
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
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 120,
  },
  scrollContent: { paddingBottom: 40 },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // Sections
  sectionHeader: {
    color: 'rgba(160,150,140,1)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 24,
    marginTop: 28,
    marginBottom: 10,
  },
  sectionCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rowIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 66,
  },

  // Footer
  versionText: {
    color: 'rgba(100,100,110,1)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 40,
  },
});
