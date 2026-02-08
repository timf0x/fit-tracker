import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Fonts, Spacing } from '@/constants/theme';

interface OnboardingStepProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isOptional?: boolean;
  onSkip?: () => void;
}

export function OnboardingStep({
  title,
  subtitle,
  children,
  isOptional,
  onSkip,
}: OnboardingStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.content}>{children}</View>
      {isOptional && onSkip && (
        <Pressable style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipText}>Passer</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: Spacing.md,
  },
  skipText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
