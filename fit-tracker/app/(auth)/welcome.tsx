import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Flame } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Colors, Fonts } from '@/constants/theme';
import { AmbientBackground } from '@/components/home/AmbientBackground';
import { useAuthStore } from '@/stores/authStore';
import { useProgramStore } from '@/stores/programStore';
import i18n from '@/lib/i18n';

export default function WelcomeScreen() {
  const router = useRouter();
  const { signInWithApple, isLoading, setNeedsProfileSetup } = useAuthStore();
  const userProfile = useProgramStore((s) => s.userProfile);
  const [appleAvailable, setAppleAvailable] = useState(false);

  // Check Apple Sign-In availability at mount
  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
    }
  }, []);

  // Flame glow animation
  const glowAnim = useSharedValue(0);
  useEffect(() => {
    glowAnim.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowAnim.value, [0, 1], [0.3, 0.7]),
    shadowRadius: interpolate(glowAnim.value, [0, 1], [12, 24]),
  }));

  const handleApple = async () => {
    const { error } = await signInWithApple();
    if (!error) {
      // Check if user has a profile — if not, they're new and need setup
      const profile = useProgramStore.getState().userProfile;
      if (!profile?.name) {
        setNeedsProfileSetup(true);
        router.replace('/(auth)/profile-setup');
      } else {
        router.replace('/(tabs)');
      }
    }
  };

  return (
    <View style={styles.screen}>
      <AmbientBackground />
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {/* Top spacer */}
          <View style={{ flex: 1.2 }} />

          {/* Branding */}
          <View style={styles.brand}>
            <Animated.View style={[styles.flameShadow, glowStyle]}>
              <Flame size={48} color={Colors.primary} strokeWidth={2} />
            </Animated.View>
            <Text style={styles.title}>ONSET</Text>
            <Text style={styles.subtitle}>FITNESS</Text>
            <Text style={styles.tagline}>{i18n.t('auth.tagline')}</Text>
          </View>

          {/* Bottom spacer */}
          <View style={{ flex: 1 }} />

          {/* CTAs */}
          <View style={styles.ctas}>
            {/* Primary — Create Account */}
            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={styles.primaryBtnText}>
                {i18n.t('auth.createAccount')}
              </Text>
            </Pressable>

            {/* Secondary — Sign In */}
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.secondaryBtnText}>
                {i18n.t('auth.signIn')}
              </Text>
            </Pressable>

            {/* Apple Sign-In — only if available on this device */}
            {appleAvailable && (
              <Pressable
                style={styles.appleBtn}
                onPress={handleApple}
                disabled={isLoading}
              >
                <Ionicons name="logo-apple" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.appleBtnText}>
                  {i18n.t('auth.continueWithApple')}
                </Text>
              </Pressable>
            )}

          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  brand: {
    alignItems: 'center',
    gap: 4,
  },
  flameShadow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 36,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 8,
    marginTop: -2,
  },
  tagline: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 12,
  },
  ctas: {
    gap: 12,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  secondaryBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  appleBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
});
