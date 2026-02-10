import { useMemo, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  PanResponder,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  ChevronRight,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Scale,
  Globe,
  Smartphone,
  Info,
  MessageCircle,
} from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { useProgramStore } from '@/stores/programStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { AnimatedToggle } from '@/components/ui/AnimatedToggle';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

type LucideIcon = React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;

// ─── Sub-components ───

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

interface SettingsRowProps {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  label: string;
  description?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}

function SettingsRow({ icon: Icon, iconColor, iconBg, label, description, right, onPress }: SettingsRowProps) {
  const content = (
    <View style={s.row}>
      <View style={[s.rowIconBox, { backgroundColor: iconBg }]}>
        <Icon size={18} color={iconColor} strokeWidth={2.2} />
      </View>
      <View style={s.rowTextBlock}>
        <Text style={s.rowLabel}>{label}</Text>
        {description ? <Text style={s.rowDesc}>{description}</Text> : null}
      </View>
      {right}
    </View>
  );
  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

// ─── Volume Slider ───

function VolumeSlider({ value, onValueChange, onDragStart, onDragEnd }: {
  value: number;
  onValueChange: (v: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const sliderWidthRef = useRef(0);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          onDragStart?.();
          const x = e.nativeEvent.locationX;
          const pct = Math.max(0, Math.min(1, x / (sliderWidthRef.current || 1)));
          onValueChange(pct);
        },
        onPanResponderMove: (e) => {
          const x = e.nativeEvent.locationX;
          const pct = Math.max(0, Math.min(1, x / (sliderWidthRef.current || 1)));
          onValueChange(pct);
        },
        onPanResponderRelease: () => {
          onDragEnd?.();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        onPanResponderTerminate: () => {
          onDragEnd?.();
        },
      }),
    [onValueChange, onDragStart, onDragEnd],
  );

  return (
    <View style={s.sliderRow}>
      <VolumeX size={14} color="rgba(255,255,255,0.25)" strokeWidth={2} />
      <View
        style={s.sliderTrack}
        onLayout={(e) => { sliderWidthRef.current = e.nativeEvent.layout.width; }}
        {...pan.panHandlers}
      >
        <View style={s.sliderBg} />
        <View style={[s.sliderFill, { width: `${value * 100}%` }]} />
        <View style={[s.sliderThumb, { left: `${value * 100}%` }]} />
      </View>
      <Volume2 size={14} color="rgba(255,255,255,0.25)" strokeWidth={2} />
    </View>
  );
}

// ─── Inline Selector (text tabs, no pills) ───

function InlineSelector<T extends string>({
  options,
  value,
  onSelect,
}: {
  options: { key: T; label: string }[];
  value: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={s.inlineSelector}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => {
              if (!active) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(opt.key);
              }
            }}
            style={[s.inlineOption, active && s.inlineOptionActive]}
          >
            <Text style={[s.inlineOptionText, active && s.inlineOptionTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main Screen ───

export default function SettingsScreen() {
  const router = useRouter();
  const userProfile = useProgramStore((s) => s.userProfile);

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const voiceEnabled = useSettingsStore((s) => s.voiceEnabled);
  const soundVolume = useSettingsStore((s) => s.soundVolume);
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const language = useSettingsStore((s) => s.language);
  const keepScreenAwake = useSettingsStore((s) => s.keepScreenAwake);

  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const setVoiceEnabled = useSettingsStore((s) => s.setVoiceEnabled);
  const setSoundVolume = useSettingsStore((s) => s.setSoundVolume);
  const setWeightUnit = useSettingsStore((s) => s.setWeightUnit);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setKeepScreenAwake = useSettingsStore((s) => s.setKeepScreenAwake);

  const handleLanguageChange = useCallback((lang: 'fr' | 'en') => {
    setLanguage(lang);
  }, [setLanguage]);

  const [scrollEnabled, setScrollEnabled] = useState(true);
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  // Profile display data
  const profileSub = useMemo(() => {
    if (!userProfile?.email) return '';
    return userProfile.email;
  }, [userProfile]);

  return (
    <View style={s.screen}>
      {/* Subtle top gradient (no ambient orbs — this is the workshop) */}
      <View style={s.topGradient} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent} scrollEnabled={scrollEnabled}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerLabel}>{i18n.t('settings.header')}</Text>
            <Text style={s.headerTitle}>{i18n.t('settings.title')}</Text>
          </View>

          {/* ── Profile Hero Card ── */}
          <Pressable
            style={s.profileCard}
            onPress={() => router.push('/settings/profile')}
          >
            {userProfile ? (
              <View style={s.profileRow}>
                <View style={s.avatarRing}>
                  {userProfile.profileImageUri ? (
                    <Image source={{ uri: userProfile.profileImageUri }} style={s.avatarImage} />
                  ) : (
                    <View style={s.avatarCircle}>
                      <Text style={s.avatarLetter}>
                        {(userProfile.name || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={s.profileInfo}>
                  <Text style={s.profileName}>{userProfile.name || i18n.t('settings.profileName')}</Text>
                  {userProfile.username ? (
                    <Text style={s.profileHandle}>@{userProfile.username}</Text>
                  ) : null}
                  {profileSub ? <Text style={s.profileSub}>{profileSub}</Text> : null}
                </View>
                <View style={s.profileEditBtn}>
                  <Text style={s.profileEditText}>{i18n.t('settings.editProfile')}</Text>
                  <ChevronRight size={14} color={Colors.primary} strokeWidth={2.5} />
                </View>
              </View>
            ) : (
              <View style={s.profileRow}>
                <View style={[s.avatarCircle, s.avatarEmpty]}>
                  <User size={22} color="rgba(255,255,255,0.4)" strokeWidth={2} />
                </View>
                <View style={s.profileInfo}>
                  <Text style={s.profileCtaText}>{i18n.t('settings.configureProfile')}</Text>
                </View>
                <ChevronRight size={18} color="rgba(120,120,130,1)" strokeWidth={2} />
              </View>
            )}
          </Pressable>

          {/* ── Sound & Voice ── */}
          <SectionHeader title={i18n.t('settings.soundSection')} />
          <View style={s.sectionCard}>
            <SettingsRow
              icon={soundEnabled ? Volume2 : VolumeX}
              iconColor={soundEnabled ? Colors.primary : 'rgba(255,255,255,0.3)'}
              iconBg={soundEnabled ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.06)'}
              label={i18n.t('settings.soundEffects')}
              description={i18n.t('settings.soundEffectsDesc')}
              right={
                <AnimatedToggle
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                  activeColor={Colors.primary}
                />
              }
            />
            <View style={s.rowDivider} />
            <SettingsRow
              icon={voiceEnabled ? Mic : MicOff}
              iconColor={voiceEnabled ? '#4A90E2' : 'rgba(255,255,255,0.3)'}
              iconBg={voiceEnabled ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.06)'}
              label={i18n.t('settings.voiceAnnouncements')}
              description={i18n.t('settings.voiceAnnouncementsDesc')}
              right={
                <AnimatedToggle
                  value={voiceEnabled}
                  onValueChange={setVoiceEnabled}
                  activeColor="#4A90E2"
                />
              }
            />
            <View style={s.rowDivider} />
            {/* Volume */}
            <View style={s.volumeBlock}>
              <View style={s.volumeHeader}>
                <Text style={s.volumeLabelText}>{i18n.t('settings.volumeLabel')}</Text>
                <Text style={s.volumeValueText}>{Math.round(soundVolume * 100)}%</Text>
              </View>
              <VolumeSlider
                value={soundVolume}
                onValueChange={setSoundVolume}
                onDragStart={() => setScrollEnabled(false)}
                onDragEnd={() => setScrollEnabled(true)}
              />
            </View>
          </View>

          {/* ── Preferences ── */}
          <SectionHeader title={i18n.t('settings.prefsSection')} />
          <View style={s.sectionCard}>
            {/* Units */}
            <SettingsRow
              icon={Scale}
              iconColor="#4ADE80"
              iconBg="rgba(74,222,128,0.12)"
              label={i18n.t('settings.units')}
              right={
                <InlineSelector
                  options={[
                    { key: 'kg' as const, label: i18n.t('settings.unitsKg') },
                    { key: 'lbs' as const, label: i18n.t('settings.unitsLbs') },
                  ]}
                  value={weightUnit}
                  onSelect={setWeightUnit}
                />
              }
            />
            <View style={s.rowDivider} />
            {/* Language */}
            <SettingsRow
              icon={Globe}
              iconColor="#A855F7"
              iconBg="rgba(168,85,247,0.12)"
              label={i18n.t('settings.language')}
              right={
                <InlineSelector
                  options={[
                    { key: 'fr' as const, label: i18n.t('settings.languageFr') },
                    { key: 'en' as const, label: i18n.t('settings.languageEn') },
                  ]}
                  value={language}
                  onSelect={handleLanguageChange}
                />
              }
            />
            <View style={s.rowDivider} />
            {/* Keep screen awake */}
            <SettingsRow
              icon={Smartphone}
              iconColor="#FBBF24"
              iconBg="rgba(251,191,36,0.12)"
              label={i18n.t('settings.keepAwake')}
              description={i18n.t('settings.keepAwakeDesc')}
              right={
                <AnimatedToggle
                  value={keepScreenAwake}
                  onValueChange={setKeepScreenAwake}
                  activeColor="#FBBF24"
                />
              }
            />
          </View>

          {/* ── About ── */}
          <SectionHeader title={i18n.t('settings.aboutSection')} />
          <View style={s.sectionCard}>
            <SettingsRow
              icon={Info}
              iconColor="rgba(160,160,170,1)"
              iconBg="rgba(160,160,170,0.10)"
              label={i18n.t('settings.version')}
              right={<Text style={s.versionValue}>{appVersion}</Text>}
            />
            <View style={s.rowDivider} />
            <SettingsRow
              icon={MessageCircle}
              iconColor="#22D3EE"
              iconBg="rgba(34,211,238,0.12)"
              label={i18n.t('settings.contact')}
              right={<ChevronRight size={18} color="rgba(120,120,130,1)" strokeWidth={2} />}
              onPress={() => Linking.openURL('mailto:contact@onset.fitness')}
            />
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0C0C0C',
    position: 'relative',
    overflow: 'hidden',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(255,107,53,0.03)',
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

  // Profile hero card
  profileCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.08)',
    padding: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,107,53,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,107,53,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmpty: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  avatarLetter: {
    color: Colors.primary,
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#fff',
    fontSize: 17,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    marginBottom: 1,
  },
  profileHandle: {
    color: 'rgba(255,107,53,0.7)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginBottom: 2,
  },
  profileSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 18,
  },
  profileEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  profileEditText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  profileCtaText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
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
  rowTextBlock: {
    flex: 1,
  },
  rowLabel: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  rowDesc: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 66,
  },

  // Volume block
  volumeBlock: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  volumeLabelText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1,
  },
  volumeValueText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Volume slider
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sliderTrack: {
    flex: 1,
    height: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  sliderThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    marginLeft: -9,
    top: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  // Inline selector
  inlineSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: 2,
  },
  inlineOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inlineOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  inlineOptionText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  inlineOptionTextActive: {
    color: '#fff',
  },

  // Version value
  versionValue: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
