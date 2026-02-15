import { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { getLocales } from 'expo-localization';
import { parsePhoneNumber } from 'libphonenumber-js/min';
import {
  ArrowLeft,
  User,
  Camera,
  Sparkles,
  TrendingUp,
  Zap,
  Plus,
  Minus,
  Moon,
  Check,
  Flame,
  ChevronRight,
  ChevronDown,
  Dumbbell,
  Building2,
  Home,
  PersonStanding,
  Target,
  Swords,
  RotateCcw,
} from 'lucide-react-native';
import { Colors, Fonts, Header, PageLayout, IconStroke, CTAButton } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { OnboardingStep } from '@/components/program/OnboardingStep';
import { AuthInput } from '@/components/auth/AuthInput';
import { CountryPickerModal } from '@/components/ui/CountryPickerModal';
import { useAuthStore } from '@/stores/authStore';
import { useProgramStore } from '@/stores/programStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getCountryByCode } from '@/data/countryCodes';
import type { ExperienceLevel, EquipmentSetup, TrainingGoal, UserProfile } from '@/types/program';

// ─── Constants ───

const TOTAL_STEPS = 5;

// ─── Helpers ───

/** Compute age from ISO birth date string */
function getAgeFromBirthDate(birthDate: string): number {
  const [y, m, d] = birthDate.split('-').map(Number);
  if (!y || !m || !d) return 0;
  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
    age--;
  }
  return age;
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const jsDay = d.getDay(); // 0=Sun, 1=Mon
  const diff = jsDay === 0 ? -6 : 1 - jsDay;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(): { date: Date; dayIndex: number; iso: string; isPast: boolean; isToday: boolean }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = getMondayOfWeek(today);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return {
      date,
      dayIndex: i,
      iso,
      isPast: date < today,
      isToday: date.getTime() === today.getTime(),
    };
  });
}

function getDayLabel(dayIndex: number): string {
  const labels = i18n.t('scheduling.dayLabels') as unknown as string[];
  return labels?.[dayIndex] ?? ['L', 'M', 'M', 'J', 'V', 'S', 'D'][dayIndex];
}

// ─── Main Screen ───

export default function ProfileSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; username?: string }>();
  const { setNeedsProfileSetup } = useAuthStore();
  const { setUserProfile } = useProgramStore();
  const history = useWorkoutStore((s) => s.history);
  const weightUnit = useSettingsStore((s) => s.weightUnit);

  // Step tracker
  const [step, setStep] = useState(0);

  // Step 1: Identity
  const [name, setName] = useState('');
  const [profileImageUri, setProfileImageUri] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState(
    getLocales()[0]?.regionCode || 'FR',
  );
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Step 2: Body
  const [sex, setSex] = useState<'male' | 'female' | null>(null);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(175);
  const [birthDayStr, setBirthDayStr] = useState('');
  const [birthMonthStr, setBirthMonthStr] = useState('');
  const [birthYearStr, setBirthYearStr] = useState('');
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  // Step 2: Experience
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [trainingYears, setTrainingYears] = useState(0);

  // Step 3: Goal + Equipment + Days
  const [goal, setGoal] = useState<TrainingGoal>('hypertrophy');
  const [equipment, setEquipment] = useState<EquipmentSetup>('full_gym');
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4 | 5 | 6>(4);

  // Step 4: Week catch-up (rest days only — workouts go via calendar/log)
  const [restDays, setRestDays] = useState<Set<number>>(new Set());

  const weekDays = useMemo(() => getWeekDays(), []);

  // Detect which days have logged sessions from workout history
  const loggedDayIsos = useMemo(() => {
    const isos = new Set<string>();
    for (const session of history) {
      const sessionDate = session.startTime
        ? new Date(session.startTime).toISOString().split('T')[0]
        : null;
      if (sessionDate) isos.add(sessionDate);
    }
    return isos;
  }, [history]);

  const canAdvance = useCallback(() => {
    switch (step) {
      case 0: return name.trim().length > 0; // name is mandatory
      case 1: return !!sex && weight > 30;
      case 2: return !!experience;
      case 3: return true; // goal/equipment/days always valid (defaults set)
      case 4: return true; // week catch-up is optional
      default: return false;
    }
  }, [step, name, sex, weight, experience]);

  const next = () => {
    if (step < TOTAL_STEPS - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step + 1);
    }
  };

  const back = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 0) setStep(step - 1);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    finishOnboarding();
  };

  const selectExperience = (level: ExperienceLevel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExperience(level);
    const defaults: Record<ExperienceLevel, number> = { beginner: 0, intermediate: 2, advanced: 5 };
    setTrainingYears(defaults[level]);
  };

  // ─── Image Picker ───

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImageUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // ─── Birth Date helpers ───

  const parsedBirthDay = parseInt(birthDayStr, 10) || 0;
  const parsedBirthMonth = parseInt(birthMonthStr, 10) || 0;
  const parsedBirthYear = parseInt(birthYearStr, 10) || 0;

  const birthDateISO = useMemo(() => {
    if (parsedBirthYear >= 1944 && parsedBirthMonth >= 1 && parsedBirthMonth <= 12 && parsedBirthDay >= 1 && parsedBirthDay <= 31) {
      return `${parsedBirthYear}-${String(parsedBirthMonth).padStart(2, '0')}-${String(parsedBirthDay).padStart(2, '0')}`;
    }
    return '';
  }, [parsedBirthYear, parsedBirthMonth, parsedBirthDay]);

  const birthAge = birthDateISO ? getAgeFromBirthDate(birthDateISO) : 0;

  const clampBirthDay = () => {
    const v = parseInt(birthDayStr, 10);
    if (isNaN(v) || v < 1) setBirthDayStr('');
    else if (v > 31) setBirthDayStr('31');
  };
  const clampBirthMonth = () => {
    const v = parseInt(birthMonthStr, 10);
    if (isNaN(v) || v < 1) setBirthMonthStr('');
    else if (v > 12) setBirthMonthStr('12');
  };
  const clampBirthYear = () => {
    const v = parseInt(birthYearStr, 10);
    if (isNaN(v) || v < 1944) setBirthYearStr('');
    else if (v > 2012) setBirthYearStr('2012');
  };

  // ─── Phone helper ───

  const resolvedPhone = useMemo(() => {
    if (!phone.trim()) return undefined;
    try {
      const country = getCountryByCode(phoneCountry);
      const fullNumber = `${country?.dialCode || '+33'}${phone.replace(/\s/g, '')}`;
      const parsed = parsePhoneNumber(fullNumber);
      if (parsed?.isValid()) return parsed.format('E.164');
    } catch { /* invalid phone silently skipped */ }
    return undefined;
  }, [phone, phoneCountry]);

  // ─── Finish ───

  const finishOnboarding = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const now = new Date().toISOString();
    const authState = useAuthStore.getState();

    const profile: UserProfile = {
      name: name.trim() || undefined,
      username: params.username || authState.pendingUsername || undefined,
      email: params.email || authState.user?.email || undefined,
      profileImageUri: profileImageUri || undefined,
      phone: resolvedPhone,
      phoneCountry: resolvedPhone ? phoneCountry : undefined,
      goal,
      experience: experience || 'beginner',
      daysPerWeek,
      sex: sex || 'male',
      weight: weightUnit === 'lbs' ? Math.round(weight * 0.4536) : weight,
      height: height || undefined,
      age: birthAge > 0 ? birthAge : undefined,
      birthDate: birthDateISO || undefined,
      trainingYears: trainingYears || undefined,
      equipment,
      priorityMuscles: [],
      createdAt: now,
      updatedAt: now,
    };

    setUserProfile(profile);

    // Clear pending signup data
    authState.setPendingUsername(null);

    // Past workouts already logged via calendar/log — no need to process here
    setNeedsProfileSetup(false);
    router.replace('/(tabs)');
  };

  // ─── Render Steps ───

  const renderStep = () => {
    switch (step) {
      case 0: return renderIdentity();
      case 1: return renderBody();
      case 2: return renderExperience();
      case 3: return renderTrainingSetup();
      case 4: return renderWeekCatchUp();
      default: return null;
    }
  };

  // ─── Step 1: Identity ───
  const renderIdentity = () => {
    const country = getCountryByCode(phoneCountry);

    return (
      <OnboardingStep
        title={i18n.t('profileSetup.identityTitle')}
        subtitle={i18n.t('profileSetup.identitySubtitle')}
      >
        <View style={styles.identityContent}>
          {/* Avatar — tappable */}
          <Pressable style={styles.avatarWrap} onPress={pickImage}>
            <View style={styles.avatarCircle}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
              ) : (
                <User size={32} color="rgba(255,255,255,0.4)" strokeWidth={IconStroke.default} />
              )}
            </View>
            {/* Camera badge */}
            <View style={styles.cameraBadge}>
              <Camera size={14} color="#fff" strokeWidth={IconStroke.emphasis} />
            </View>
          </Pressable>
          <Text style={styles.addPhotoHint}>{i18n.t('profileSetup.addPhoto')}</Text>

          {/* Email confirmation */}
          {params.email ? (
            <Text style={styles.emailConfirm}>
              {i18n.t('profileSetup.emailConfirm', { email: params.email })}
            </Text>
          ) : null}

          {/* Name input */}
          <View style={styles.nameInputWrap}>
            <AuthInput
              label={i18n.t('profileSetup.nameLabel')}
              placeholder={i18n.t('profileSetup.namePlaceholder')}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              textContentType="givenName"
              autoComplete="given-name"
              returnKeyType="done"
            />
          </View>

          {/* Live greeting preview */}
          {name.trim().length > 0 && (
            <Text style={styles.greetingPreview}>
              {i18n.t('profileSetup.heyPreview', { name: name.trim() })}
            </Text>
          )}

          {/* Phone input */}
          <View style={styles.phoneWrap}>
            <Text style={styles.phoneLabel}>{i18n.t('profileSetup.phoneLabel')}</Text>
            <View style={styles.phoneRow}>
              {/* Country selector */}
              <Pressable
                style={styles.countryBtn}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={styles.countryFlag}>{country?.flag || '🌍'}</Text>
                <Text style={styles.countryDial}>{country?.dialCode || '+33'}</Text>
                <ChevronDown size={14} color="rgba(255,255,255,0.4)" strokeWidth={IconStroke.default} />
              </Pressable>
              {/* Phone TextInput */}
              <TextInput
                style={styles.phoneInput}
                placeholder={i18n.t('profileSetup.phonePlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
              />
            </View>
            <Text style={styles.phoneHint}>{i18n.t('profileSetup.phoneHint')}</Text>
          </View>

          {/* Hint */}
          <Text style={styles.nameHint}>
            {i18n.t('profileSetup.nameHint')}
          </Text>
        </View>

        <CountryPickerModal
          visible={showCountryPicker}
          selected={phoneCountry}
          onSelect={setPhoneCountry}
          onClose={() => setShowCountryPicker(false)}
        />
      </OnboardingStep>
    );
  };

  // ─── Step 2: Body ───
  const renderBody = () => {
    const displayWeight = weightUnit === 'lbs' ? Math.round(weight * 2.205) : weight;

    return (
      <OnboardingStep
        title={i18n.t('profileSetup.bodyTitle')}
        subtitle={i18n.t('profileSetup.bodySubtitle')}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Sex selection */}
          <Text style={styles.fieldLabel}>{i18n.t('profileSetup.sexLabel')}</Text>
          <View style={styles.sexRow}>
            <Pressable
              style={[styles.selCard, sex === 'male' && styles.selCardSelected]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSex('male'); }}
            >
              <Text style={[styles.selCardTitle, sex === 'male' && styles.selCardTitleSelected]}>
                {i18n.t('profileSetup.male')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.selCard, sex === 'female' && styles.selCardSelected]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSex('female'); }}
            >
              <Text style={[styles.selCardTitle, sex === 'female' && styles.selCardTitleSelected]}>
                {i18n.t('profileSetup.female')}
              </Text>
            </Pressable>
          </View>

          {/* Weight */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>{i18n.t('profileSetup.weightLabel')}</Text>
              <Text style={styles.requiredTag}>{i18n.t('profileSetup.weightRequired')}</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWeight(Math.max(30, weight - 1)); }}
              >
                <Minus size={16} color="#fff" strokeWidth={IconStroke.emphasis} />
              </Pressable>
              <Text style={styles.stepperValue}>
                {displayWeight} {weightUnit}
              </Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWeight(Math.min(200, weight + 1)); }}
              >
                <Plus size={16} color="#fff" strokeWidth={IconStroke.emphasis} />
              </Pressable>
            </View>
          </View>

          {/* Height */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>{i18n.t('profileSetup.heightLabel')}</Text>
              <Text style={styles.optionalTag}>{i18n.t('profileSetup.optionalHint')}</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setHeight(Math.max(100, height - 1)); }}
              >
                <Minus size={16} color="#fff" strokeWidth={IconStroke.emphasis} />
              </Pressable>
              <Text style={styles.stepperValue}>{height} {i18n.t('common.cmUnit')}</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setHeight(Math.min(230, height + 1)); }}
              >
                <Plus size={16} color="#fff" strokeWidth={IconStroke.emphasis} />
              </Pressable>
            </View>
          </View>

          {/* Birth date — 3 TextInput fields */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>{i18n.t('profileSetup.birthDateLabel')}</Text>
              <Text style={styles.optionalTag}>{i18n.t('profileSetup.optionalHint')}</Text>
            </View>
          </View>
          <View style={styles.birthDateRow}>
            {/* Day */}
            <View style={styles.birthInputCol}>
              <Text style={styles.birthDateColLabel}>{i18n.t('profileSetup.birthDay')}</Text>
              <TextInput
                style={styles.birthDateInput}
                placeholder={i18n.t('profileSetup.birthDayPlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={birthDayStr}
                onChangeText={(t) => {
                  const cleaned = t.replace(/[^0-9]/g, '');
                  setBirthDayStr(cleaned);
                  if (cleaned.length >= 2) monthRef.current?.focus();
                }}
                onBlur={clampBirthDay}
                keyboardType="number-pad"
                maxLength={2}
                textAlign="center"
              />
            </View>
            <Text style={styles.birthDateSeparator}>/</Text>
            {/* Month */}
            <View style={styles.birthInputCol}>
              <Text style={styles.birthDateColLabel}>{i18n.t('profileSetup.birthMonth')}</Text>
              <TextInput
                ref={monthRef}
                style={styles.birthDateInput}
                placeholder={i18n.t('profileSetup.birthMonthPlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={birthMonthStr}
                onChangeText={(t) => {
                  const cleaned = t.replace(/[^0-9]/g, '');
                  setBirthMonthStr(cleaned);
                  if (cleaned.length >= 2) yearRef.current?.focus();
                }}
                onBlur={clampBirthMonth}
                keyboardType="number-pad"
                maxLength={2}
                textAlign="center"
              />
            </View>
            <Text style={styles.birthDateSeparator}>/</Text>
            {/* Year */}
            <View style={[styles.birthInputCol, { flex: 1.5 }]}>
              <Text style={styles.birthDateColLabel}>{i18n.t('profileSetup.birthYearLabel')}</Text>
              <TextInput
                ref={yearRef}
                style={styles.birthDateInput}
                placeholder={i18n.t('profileSetup.birthYearPlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={birthYearStr}
                onChangeText={(t) => setBirthYearStr(t.replace(/[^0-9]/g, ''))}
                onBlur={clampBirthYear}
                keyboardType="number-pad"
                maxLength={4}
                textAlign="center"
              />
            </View>
          </View>
          {/* Age preview */}
          {birthAge > 0 && birthAge < 100 && (
            <Text style={styles.agePreview}>
              {i18n.t('profileSetup.agePreview', { age: birthAge })}
            </Text>
          )}
        </KeyboardAvoidingView>
      </OnboardingStep>
    );
  };

  // ─── Step 3: Experience ───
  const renderExperience = () => (
    <OnboardingStep
      title={i18n.t('profileSetup.experienceTitle')}
      subtitle={i18n.t('profileSetup.experienceSubtitle')}
    >
      <View style={styles.cardsCol}>
        <Pressable
          style={[styles.selCard, experience === 'beginner' && styles.selCardSelected]}
          onPress={() => selectExperience('beginner')}
        >
          <View style={styles.selCardIcon}>
            <Sparkles size={22} color={experience === 'beginner' ? '#0C0C0C' : '#FF6B35'} strokeWidth={IconStroke.default} />
          </View>
          <View style={styles.selCardText}>
            <Text style={[styles.selCardTitle, experience === 'beginner' && styles.selCardTitleSelected]}>
              {i18n.t('profileSetup.beginner')}
            </Text>
            <Text style={[styles.selCardSubtitle, experience === 'beginner' && styles.selCardSubtitleSelected]}>
              {i18n.t('profileSetup.beginnerDesc')}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.selCard, experience === 'intermediate' && styles.selCardSelected]}
          onPress={() => selectExperience('intermediate')}
        >
          <View style={styles.selCardIcon}>
            <TrendingUp size={22} color={experience === 'intermediate' ? '#0C0C0C' : '#FF6B35'} strokeWidth={IconStroke.default} />
          </View>
          <View style={styles.selCardText}>
            <Text style={[styles.selCardTitle, experience === 'intermediate' && styles.selCardTitleSelected]}>
              {i18n.t('profileSetup.intermediate')}
            </Text>
            <Text style={[styles.selCardSubtitle, experience === 'intermediate' && styles.selCardSubtitleSelected]}>
              {i18n.t('profileSetup.intermediateDesc')}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.selCard, experience === 'advanced' && styles.selCardSelected]}
          onPress={() => selectExperience('advanced')}
        >
          <View style={styles.selCardIcon}>
            <Zap size={22} color={experience === 'advanced' ? '#0C0C0C' : '#FF6B35'} strokeWidth={IconStroke.default} />
          </View>
          <View style={styles.selCardText}>
            <Text style={[styles.selCardTitle, experience === 'advanced' && styles.selCardTitleSelected]}>
              {i18n.t('profileSetup.advanced')}
            </Text>
            <Text style={[styles.selCardSubtitle, experience === 'advanced' && styles.selCardSubtitleSelected]}>
              {i18n.t('profileSetup.advancedDesc')}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Training years refinement */}
      <View style={styles.yearsDivider} />
      <View style={styles.yearsRow}>
        <Text style={styles.yearsLabel}>
          {i18n.t('profileSetup.trainingYearsLabel')}
        </Text>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepperBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTrainingYears(Math.max(0, trainingYears - 1));
            }}
          >
            <Minus size={16} color="#fff" strokeWidth={IconStroke.emphasis} />
          </Pressable>
          <Text style={styles.stepperValue}>{trainingYears}</Text>
          <Pressable
            style={styles.stepperBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTrainingYears(Math.min(30, trainingYears + 1));
            }}
          >
            <Plus size={16} color="#fff" strokeWidth={IconStroke.emphasis} />
          </Pressable>
        </View>
      </View>
    </OnboardingStep>
  );

  // ─── Step 3: Training Setup (Goal + Equipment + Days) ───
  const renderTrainingSetup = () => (
    <OnboardingStep
      title={i18n.t('profileSetup.goalTitle')}
      subtitle={i18n.t('profileSetup.goalSubtitle')}
    >
      {/* Goal */}
      <View style={styles.cardsCol}>
        <Pressable
          style={[styles.selCard, goal === 'hypertrophy' && styles.selCardSelected]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGoal('hypertrophy'); }}
        >
          <View style={styles.selCardIcon}>
            <Target size={22} color={goal === 'hypertrophy' ? '#0C0C0C' : '#FF6B35'} strokeWidth={IconStroke.default} />
          </View>
          <View style={styles.selCardText}>
            <Text style={[styles.selCardTitle, goal === 'hypertrophy' && styles.selCardTitleSelected]}>
              {i18n.t('profileSetup.goalHypertrophy')}
            </Text>
            <Text style={[styles.selCardSubtitle, goal === 'hypertrophy' && styles.selCardSubtitleSelected]}>
              {i18n.t('profileSetup.goalHypertrophyDesc')}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.selCard, goal === 'strength' && styles.selCardSelected]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGoal('strength'); }}
        >
          <View style={styles.selCardIcon}>
            <Swords size={22} color={goal === 'strength' ? '#0C0C0C' : '#FF6B35'} strokeWidth={IconStroke.default} />
          </View>
          <View style={styles.selCardText}>
            <Text style={[styles.selCardTitle, goal === 'strength' && styles.selCardTitleSelected]}>
              {i18n.t('profileSetup.goalStrength')}
            </Text>
            <Text style={[styles.selCardSubtitle, goal === 'strength' && styles.selCardSubtitleSelected]}>
              {i18n.t('profileSetup.goalStrengthDesc')}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.selCard, goal === 'recomposition' && styles.selCardSelected]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGoal('recomposition'); }}
        >
          <View style={styles.selCardIcon}>
            <RotateCcw size={22} color={goal === 'recomposition' ? '#0C0C0C' : '#FF6B35'} strokeWidth={IconStroke.default} />
          </View>
          <View style={styles.selCardText}>
            <Text style={[styles.selCardTitle, goal === 'recomposition' && styles.selCardTitleSelected]}>
              {i18n.t('profileSetup.goalRecomp')}
            </Text>
            <Text style={[styles.selCardSubtitle, goal === 'recomposition' && styles.selCardSubtitleSelected]}>
              {i18n.t('profileSetup.goalRecompDesc')}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Equipment */}
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{i18n.t('profileSetup.equipmentTitle')}</Text>
      </View>
      <View style={styles.cardsCol}>
        <Pressable
          style={[styles.selCard, equipment === 'full_gym' && styles.selCardSelected]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEquipment('full_gym'); }}
        >
          <View style={styles.selCardIcon}>
            <Building2 size={22} color={equipment === 'full_gym' ? '#0C0C0C' : '#FF6B35'} strokeWidth={IconStroke.default} />
          </View>
          <View style={styles.selCardText}>
            <Text style={[styles.selCardTitle, equipment === 'full_gym' && styles.selCardTitleSelected]}>
              {i18n.t('profileSetup.equipmentFullGym')}
            </Text>
            <Text style={[styles.selCardSubtitle, equipment === 'full_gym' && styles.selCardSubtitleSelected]}>
              {i18n.t('profileSetup.equipmentFullGymDesc')}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.selCard, equipment === 'home_dumbbell' && styles.selCardSelected]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEquipment('home_dumbbell'); }}
        >
          <View style={styles.selCardIcon}>
            <Home size={22} color={equipment === 'home_dumbbell' ? '#0C0C0C' : '#FF6B35'} strokeWidth={IconStroke.default} />
          </View>
          <View style={styles.selCardText}>
            <Text style={[styles.selCardTitle, equipment === 'home_dumbbell' && styles.selCardTitleSelected]}>
              {i18n.t('profileSetup.equipmentHomeDumbbell')}
            </Text>
            <Text style={[styles.selCardSubtitle, equipment === 'home_dumbbell' && styles.selCardSubtitleSelected]}>
              {i18n.t('profileSetup.equipmentHomeDumbbellDesc')}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.selCard, equipment === 'bodyweight' && styles.selCardSelected]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEquipment('bodyweight'); }}
        >
          <View style={styles.selCardIcon}>
            <PersonStanding size={22} color={equipment === 'bodyweight' ? '#0C0C0C' : '#FF6B35'} strokeWidth={IconStroke.default} />
          </View>
          <View style={styles.selCardText}>
            <Text style={[styles.selCardTitle, equipment === 'bodyweight' && styles.selCardTitleSelected]}>
              {i18n.t('profileSetup.equipmentBodyweight')}
            </Text>
            <Text style={[styles.selCardSubtitle, equipment === 'bodyweight' && styles.selCardSubtitleSelected]}>
              {i18n.t('profileSetup.equipmentBodyweightDesc')}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Days per week */}
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{i18n.t('profileSetup.daysPerWeekTitle')}</Text>
      </View>
      <View style={styles.daysRow}>
        {([3, 4, 5, 6] as const).map((d) => (
          <Pressable
            key={d}
            style={[styles.dayOption, daysPerWeek === d && styles.dayOptionSelected]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDaysPerWeek(d); }}
          >
            <Text style={[styles.dayOptionText, daysPerWeek === d && styles.dayOptionTextSelected]}>
              {d}
            </Text>
          </Pressable>
        ))}
      </View>
    </OnboardingStep>
  );

  // ─── Step 4: Week Catch-Up ───
  const renderWeekCatchUp = () => {
    // Count logged sessions for this week
    const loggedCount = weekDays.filter((d) => loggedDayIsos.has(d.iso)).length;

    return (
      <OnboardingStep
        title={i18n.t('profileSetup.weekTitle')}
        subtitle={i18n.t('profileSetup.weekSubtitle')}
      >
        {/* Week day row */}
        <View style={styles.weekRow}>
          {weekDays.map((day) => {
            const isLogged = loggedDayIsos.has(day.iso);
            const isRest = restDays.has(day.dayIndex);
            const isTappable = day.isPast || day.isToday;
            const isFuture = !isTappable;

            return (
              <View key={day.dayIndex} style={styles.dayCol}>
                <Pressable
                  style={[
                    styles.dayCircle,
                    isLogged && styles.dayCircleLogged,
                    isRest && styles.dayCircleRest,
                    isFuture && styles.dayCircleFuture,
                  ]}
                  onPress={() => {
                    if (!isTappable) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Navigate to calendar/log for this day
                    router.push(`/calendar/log?date=${day.iso}`);
                  }}
                  onLongPress={() => {
                    if (!isTappable) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    // Toggle rest day
                    setRestDays((prev) => {
                      const next = new Set(prev);
                      if (next.has(day.dayIndex)) {
                        next.delete(day.dayIndex);
                      } else {
                        next.add(day.dayIndex);
                      }
                      return next;
                    });
                  }}
                  disabled={isFuture}
                >
                  {isLogged ? (
                    <Check size={14} color="#0C0C0C" strokeWidth={3} />
                  ) : isRest ? (
                    <Moon size={14} color="rgba(255,255,255,0.4)" strokeWidth={IconStroke.default} />
                  ) : (
                    <Text style={[styles.dayCircleText, isFuture && styles.dayCircleTextFuture]}>
                      {getDayLabel(day.dayIndex)}
                    </Text>
                  )}
                </Pressable>
                <Text style={[styles.dayLabel, isFuture && styles.dayLabelFuture]}>
                  {getDayLabel(day.dayIndex)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Hint text */}
        <Text style={styles.tapToLogHint}>
          {i18n.t('profileSetup.tapToLog')}
        </Text>

        {/* Summary of logged sessions */}
        {loggedCount > 0 && (
          <View style={styles.logSummary}>
            <View style={styles.logSummaryRow}>
              <Dumbbell size={16} color="#4ADE80" strokeWidth={IconStroke.default} />
              <Text style={styles.logSummaryText}>
                {i18n.t('profileSetup.loggedSessions', { count: loggedCount })}
              </Text>
            </View>
            {/* List session names for logged days */}
            {weekDays.filter((d) => loggedDayIsos.has(d.iso)).map((day) => {
              const session = history.find((s) => {
                const sDate = s.startTime ? new Date(s.startTime).toISOString().split('T')[0] : null;
                return sDate === day.iso;
              });
              return (
                <Pressable
                  key={day.dayIndex}
                  style={styles.loggedDayRow}
                  onPress={() => router.push(`/calendar/log?date=${day.iso}`)}
                >
                  <Check size={14} color="#4ADE80" strokeWidth={3} />
                  <Text style={styles.loggedDayLabel}>{getDayLabel(day.dayIndex)}</Text>
                  <Text style={styles.loggedDayName} numberOfLines={1}>
                    {session?.workoutName || i18n.t('profileSetup.logged')}
                  </Text>
                  <ChevronRight size={14} color="rgba(255,255,255,0.2)" strokeWidth={IconStroke.default} />
                </Pressable>
              );
            })}
          </View>
        )}
      </OnboardingStep>
    );
  };

  // ─── Render ───

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <View style={styles.screen}>
      {/* Ambient orbs */}
      <View style={styles.orbOrange} pointerEvents="none" />
      <View style={styles.orbBlue} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          {step > 0 ? (
            <Pressable onPress={back} style={styles.backButton} hitSlop={12}>
              <ArrowLeft size={22} color="#fff" strokeWidth={IconStroke.default} />
            </Pressable>
          ) : (
            <View style={{ width: 44 }} />
          )}

          {/* Progress dots */}
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]}
              />
            ))}
          </View>

          {/* Skip — hidden on step 0 (name is mandatory) */}
          {step > 0 ? (
            <Pressable onPress={handleSkip} hitSlop={8} style={styles.skipBtn}>
              <Text style={styles.skipText}>{i18n.t('profileSetup.skip')}</Text>
            </Pressable>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        {/* Step content */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        {/* Footer button */}
        <View style={styles.footer}>
          {isLastStep ? (
            <Pressable
              style={styles.finishButton}
              onPress={finishOnboarding}
            >
              <Flame size={20} color="#0C0C0C" strokeWidth={IconStroke.emphasis} />
              <Text style={styles.finishText}>{i18n.t('profileSetup.finish')}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.nextButton, !canAdvance() && styles.nextButtonDisabled]}
              onPress={next}
              disabled={!canAdvance()}
            >
              <Text style={[styles.nextText, !canAdvance() && styles.nextTextDisabled]}>
                {i18n.t('profileSetup.next')}
              </Text>
              <ChevronRight size={18} color={canAdvance() ? '#0C0C0C' : 'rgba(255,255,255,0.3)'} />
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PageLayout.paddingHorizontal,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    ...Header.backButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  dotDone: {
    backgroundColor: 'rgba(255,107,53,0.4)',
  },
  skipBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  skipText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  footer: {
    paddingHorizontal: PageLayout.paddingHorizontal,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: 'rgba(12,12,12,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: CTAButton.borderRadius,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  nextText: {
    color: '#0C0C0C',
    fontSize: CTAButton.fontSize,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  nextTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  finishButton: {
    backgroundColor: Colors.primary,
    borderRadius: CTAButton.borderRadius,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  finishText: {
    color: '#0C0C0C',
    fontSize: 17,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // ─── Step 1: Identity ───
  identityContent: {
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    marginBottom: 4,
    position: 'relative',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 2,
    borderColor: 'rgba(255,107,53,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  addPhotoHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: -8,
  },
  emailConfirm: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
  },
  nameInputWrap: {
    width: '100%',
  },
  greetingPreview: {
    color: Colors.primary,
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    textAlign: 'center',
  },
  nameHint: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Phone input
  phoneWrap: {
    width: '100%',
    gap: 8,
  },
  phoneLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  countryFlag: {
    fontSize: 20,
  },
  countryDial: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  phoneHint: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    fontStyle: 'italic',
  },

  // ─── Step 2: Body + shared field styles ───
  fieldLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  requiredTag: {
    color: Colors.primary,
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  optionalTag: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  fieldRow: {
    marginTop: 24,
  },
  sexRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    minWidth: 72,
    textAlign: 'center',
  },

  // Birth date — TextInput fields
  birthDateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  birthInputCol: {
    flex: 1,
    gap: 6,
  },
  birthDateColLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  birthDateInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    height: 56,
    color: '#fff',
    fontSize: 20,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  birthDateSeparator: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 24,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    paddingBottom: 12,
  },
  agePreview: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },

  // ─── Selection cards (shared) ───
  cardsCol: {
    gap: PageLayout.cardGap,
  },
  selCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
  },
  selCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selCardText: {
    flex: 1,
  },
  selCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  selCardTitleSelected: {
    color: '#0C0C0C',
  },
  selCardSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 2,
  },
  selCardSubtitleSelected: {
    color: 'rgba(12,12,12,0.6)',
  },

  // Training years
  yearsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: 20,
    marginBottom: 16,
  },
  yearsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yearsLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flex: 1,
  },

  // ─── Step 4: Week Catch-Up ───
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  dayCol: {
    alignItems: 'center',
    gap: 8,
  },
  dayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleLogged: {
    backgroundColor: '#4ADE80',
    borderColor: '#4ADE80',
  },
  dayCircleRest: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dayCircleFuture: {
    opacity: 0.3,
  },
  dayCircleText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  dayCircleTextFuture: {
    color: 'rgba(255,255,255,0.25)',
  },
  dayLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  dayLabelFuture: {
    color: 'rgba(255,255,255,0.15)',
  },
  tapToLogHint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },

  // Log summary
  logSummary: {
    gap: 6,
  },
  logSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  logSummaryText: {
    color: '#4ADE80',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  loggedDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 10,
    minHeight: 48,
  },
  loggedDayLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    width: 24,
  },
  loggedDayName: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flex: 1,
  },

  // ─── Step 3: Training Setup ───
  daysRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dayOption: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayOptionText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  dayOptionTextSelected: {
    color: '#0C0C0C',
  },
});
