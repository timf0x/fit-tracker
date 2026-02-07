import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { mockUser } from '@/lib/mock-data';
import i18n from '@/lib/i18n';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return i18n.t('home.greeting.morning');
  if (hour < 18) return i18n.t('home.greeting.afternoon');
  return i18n.t('home.greeting.evening');
}

export function HeaderGreeting() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.content}>
        <View style={styles.textSection}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.name}>{mockUser.name}</Text>
        </View>

        {/* Avatar positioned inside the gradient area */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {mockUser.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.onlineDot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
    paddingBottom: 8,
    position: 'relative',
    overflow: 'visible',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textSection: {
    gap: 4,
  },
  greeting: {
    color: 'rgba(160, 150, 140, 1)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  name: {
    color: Colors.text,
    fontSize: 28,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3a2a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(139, 69, 19, 0.3)',
  },
  avatarText: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2.5,
    borderColor: '#0C0C0C',
  },
});
