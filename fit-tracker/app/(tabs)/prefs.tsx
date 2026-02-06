import { View, Text, StyleSheet } from 'react-native';
import { Settings } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';

export default function PrefsScreen() {
  return (
    <View style={styles.container}>
      <Settings size={48} color={Colors.textMuted} strokeWidth={1.5} />
      <Text style={styles.title}>Préférences</Text>
      <Text style={styles.subtitle}>Bientôt disponible</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    fontFamily: Fonts?.sans,
  },
});
