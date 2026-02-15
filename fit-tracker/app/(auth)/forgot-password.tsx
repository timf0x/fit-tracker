import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { Colors, Fonts, IconStroke } from '@/constants/theme';
import { AuthInput } from '@/components/auth/AuthInput';
import { useAuthStore } from '@/stores/authStore';
import i18n from '@/lib/i18n';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError(i18n.t('auth.errorInvalidEmail'));
      return;
    }

    const { error: authError } = await resetPassword(email.trim());
    if (authError) {
      const msg = authError.message?.toLowerCase() || '';
      if (msg.includes('network') || msg.includes('fetch')) {
        setError(i18n.t('auth.errorNetworkError'));
      } else {
        setError(i18n.t('auth.errorGeneric'));
      }
    } else {
      setSent(true);
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

            {sent ? (
              /* ── Success state ── */
              <View style={styles.successBlock}>
                <View style={styles.successIcon}>
                  <CheckCircle2 size={48} color={Colors.success} strokeWidth={1.5} />
                </View>
                <Text style={styles.successTitle}>
                  {i18n.t('auth.resetSentTitle')}
                </Text>
                <Text style={styles.successMsg}>
                  {i18n.t('auth.resetSentMessage')}
                </Text>
                <Pressable
                  style={styles.ctaBtn}
                  onPress={() => router.replace('/(auth)/login')}
                >
                  <Text style={styles.ctaBtnText}>
                    {i18n.t('auth.backToSignIn')}
                  </Text>
                </Pressable>
              </View>
            ) : (
              /* ── Form state ── */
              <>
                <Text style={styles.title}>{i18n.t('auth.forgotTitle')}</Text>
                <Text style={styles.subtitle}>{i18n.t('auth.forgotSubtitle')}</Text>

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
                    returnKeyType="go"
                    onSubmitEditing={handleReset}
                  />

                  {error ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <Pressable
                    style={[styles.ctaBtn, isLoading && styles.ctaBtnDisabled]}
                    onPress={handleReset}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.ctaBtnText}>
                        {i18n.t('auth.sendResetLink')}
                      </Text>
                    )}
                  </Pressable>
                </View>

                {/* Back to login */}
                <Pressable
                  style={styles.backLink}
                  onPress={() => router.back()}
                  hitSlop={8}
                >
                  <Text style={styles.backLinkText}>
                    {i18n.t('auth.backToSignIn')}
                  </Text>
                </Pressable>
              </>
            )}
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
    lineHeight: 22,
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
  backLink: {
    alignSelf: 'center',
    marginTop: 24,
    minHeight: 48,
    justifyContent: 'center',
  },
  backLinkText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  // Success
  successBlock: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  successIcon: {
    marginBottom: 8,
  },
  successTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  successMsg: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
});
