import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Fonts, IconStroke } from '@/constants/theme';
import { AuthInput } from '@/components/auth/AuthInput';
import { useAuthStore } from '@/stores/authStore';
import i18n from '@/lib/i18n';

function mapAuthError(error: any): string {
  const msg = error?.message?.toLowerCase() || '';
  if (msg.includes('invalid') && (msg.includes('credential') || msg.includes('login'))) return i18n.t('auth.errorInvalidCredentials');
  if (msg.includes('email') && msg.includes('invalid')) return i18n.t('auth.errorInvalidEmail');
  if (msg.includes('network') || msg.includes('fetch')) return i18n.t('auth.errorNetworkError');
  return i18n.t('auth.errorGeneric');
}

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithApple, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [appleAvailable, setAppleAvailable] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
    }
  }, []);

  const handleSignIn = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError(i18n.t('auth.errorInvalidEmail'));
      return;
    }

    const { error: authError } = await signIn(email.trim(), password);
    if (authError) {
      setError(mapAuthError(authError));
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleApple = async () => {
    setError('');
    const { error: authError } = await signInWithApple();
    if (authError) {
      setError(mapAuthError(authError));
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back button */}
            <Pressable
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={12}
            >
              <ArrowLeft size={20} color="#fff" strokeWidth={IconStroke.default} />
            </Pressable>

            {/* Title */}
            <Text style={styles.title}>{i18n.t('auth.signInTitle')}</Text>
            <Text style={styles.subtitle}>{i18n.t('auth.signInSubtitle')}</Text>

            {/* Form */}
            <View style={styles.form}>
              <AuthInput
                label={i18n.t('auth.emailLabel')}
                placeholder={i18n.t('auth.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <AuthInput
                ref={passwordRef}
                label={i18n.t('auth.passwordLabel')}
                placeholder={i18n.t('auth.passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                isPassword
                textContentType="password"
                autoComplete="current-password"
                returnKeyType="go"
                onSubmitEditing={handleSignIn}
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* CTA */}
              <Pressable
                style={[styles.ctaBtn, isLoading && styles.ctaBtnDisabled]}
                onPress={handleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaBtnText}>
                    {i18n.t('auth.signInButton')}
                  </Text>
                )}
              </Pressable>

              {/* Forgot password */}
              <Pressable
                style={styles.forgotLink}
                onPress={() => router.push('/(auth)/forgot-password')}
                hitSlop={8}
              >
                <Text style={styles.forgotText}>
                  {i18n.t('auth.forgotPassword')}
                </Text>
              </Pressable>
            </View>

            {/* Divider + Apple Sign-In */}
            {appleAvailable && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{i18n.t('auth.orDivider')}</Text>
                  <View style={styles.dividerLine} />
                </View>

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
              </>
            )}

            {/* Cross-link */}
            <View style={styles.crossLink}>
              <Text style={styles.crossLinkText}>
                {i18n.t('auth.noAccount')}{' '}
              </Text>
              <Pressable onPress={() => router.replace('/(auth)/signup')} hitSlop={8}>
                <Text style={styles.crossLinkAction}>
                  {i18n.t('auth.createAccountLink')}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginBottom: 32,
  },
  form: {
    gap: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  ctaBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  ctaBtnDisabled: {
    opacity: 0.7,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  forgotLink: {
    alignSelf: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
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
  crossLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    minHeight: 48,
  },
  crossLinkText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  crossLinkAction: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
});
