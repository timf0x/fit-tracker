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
import { ArrowLeft, AtSign, Check, X } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Fonts, IconStroke } from '@/constants/theme';
import { AuthInput } from '@/components/auth/AuthInput';
import { useAuthStore } from '@/stores/authStore';
import i18n from '@/lib/i18n';

const USERNAME_REGEX = /^[a-z0-9_]+$/;

function mapAuthError(error: any): string {
  const msg = error?.message?.toLowerCase() || '';
  if (msg.includes('email') && msg.includes('invalid')) return i18n.t('auth.errorInvalidEmail');
  if (msg.includes('weak') || msg.includes('password') && msg.includes('least')) return i18n.t('auth.errorWeakPassword');
  if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) return i18n.t('auth.errorEmailInUse');
  if (msg.includes('network') || msg.includes('fetch')) return i18n.t('auth.errorNetworkError');
  return i18n.t('auth.errorGeneric');
}

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, signInWithApple, isLoading, setNeedsProfileSetup, setPendingUsername } = useAuthStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [appleAvailable, setAppleAvailable] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const usernameClean = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const usernameValid = usernameClean.length >= 3 && USERNAME_REGEX.test(usernameClean);
  const usernameError = usernameClean.length > 0 && usernameClean.length < 3
    ? i18n.t('auth.usernameTooShort')
    : usernameClean.length > 0 && !USERNAME_REGEX.test(usernameClean)
      ? i18n.t('auth.usernameInvalid')
      : '';

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
    }
  }, []);

  const handleSignUp = async () => {
    setError('');
    if (!usernameClean || usernameClean.length < 3) {
      setError(i18n.t('auth.usernameRequired'));
      return;
    }
    if (!USERNAME_REGEX.test(usernameClean)) {
      setError(i18n.t('auth.usernameInvalid'));
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError(i18n.t('auth.errorInvalidEmail'));
      return;
    }
    if (password.length < 6) {
      setError(i18n.t('auth.errorWeakPassword'));
      return;
    }

    const { error: authError } = await signUp(email.trim(), password);
    if (authError) {
      setError(mapAuthError(authError));
    } else {
      setPendingUsername(usernameClean);
      setNeedsProfileSetup(true);
      router.replace({ pathname: '/(auth)/profile-setup', params: { email: email.trim(), username: usernameClean } });
    }
  };

  const handleApple = async () => {
    setError('');
    const { error: authError } = await signInWithApple();
    if (authError) {
      setError(mapAuthError(authError));
    } else {
      setNeedsProfileSetup(true);
      router.replace({ pathname: '/(auth)/profile-setup', params: { username: usernameClean || undefined } });
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
            <Text style={styles.title}>{i18n.t('auth.signUpTitle')}</Text>
            <Text style={styles.subtitle}>{i18n.t('auth.signUpSubtitle')}</Text>

            {/* Form */}
            <View style={styles.form}>
              {/* Username */}
              <View style={styles.usernameWrap}>
                <Text style={styles.inputLabel}>{i18n.t('auth.usernameLabel')}</Text>
                <View style={styles.usernameRow}>
                  <View style={styles.usernameAtBox}>
                    <AtSign size={16} color="rgba(255,255,255,0.35)" strokeWidth={IconStroke.emphasis} />
                  </View>
                  <TextInput
                    style={styles.usernameInput}
                    placeholder={i18n.t('auth.usernamePlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={username}
                    onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                    textContentType="username"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    maxLength={20}
                  />
                  {usernameClean.length > 0 && (
                    <View style={styles.usernameStatus}>
                      {usernameValid ? (
                        <Check size={16} color="#4ADE80" strokeWidth={3} />
                      ) : (
                        <X size={16} color="#EF4444" strokeWidth={3} />
                      )}
                    </View>
                  )}
                </View>
                {usernameError ? (
                  <Text style={styles.usernameErrorText}>{usernameError}</Text>
                ) : usernameClean.length > 0 ? (
                  <Text style={styles.usernameHint}>{i18n.t('auth.usernameHint')}</Text>
                ) : null}
              </View>

              <AuthInput
                ref={emailRef}
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
                textContentType="newPassword"
                autoComplete="new-password"
                returnKeyType="go"
                onSubmitEditing={handleSignUp}
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* CTA */}
              <Pressable
                style={[styles.ctaBtn, isLoading && styles.ctaBtnDisabled]}
                onPress={handleSignUp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaBtnText}>
                    {i18n.t('auth.createMyAccount')}
                  </Text>
                )}
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
                {i18n.t('auth.alreadyHaveAccount')}{' '}
              </Text>
              <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={8}>
                <Text style={styles.crossLinkAction}>
                  {i18n.t('auth.signInLink')}
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
  inputLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    marginBottom: 8,
  },
  usernameWrap: {
    gap: 4,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    height: 56,
    overflow: 'hidden',
  },
  usernameAtBox: {
    width: 44,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  usernameInput: {
    flex: 1,
    height: 56,
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    paddingHorizontal: 14,
  },
  usernameStatus: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usernameHint: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 4,
  },
  usernameErrorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 4,
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
