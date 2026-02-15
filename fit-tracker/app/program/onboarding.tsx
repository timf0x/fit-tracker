import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Dumbbell,
  Zap,
  TrendingUp,
  Repeat,
  Home,
  User,
  Sparkles,
  ChevronRight,
  Check,
  Target,
  Mountain,
  Diamond,
  Watch,
  Plus,
  Minus,
  Calendar,
} from 'lucide-react-native';
import { Colors, Fonts, Spacing, Header, PageLayout, IconStroke, CTAButton } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { OnboardingStep } from '@/components/program/OnboardingStep';
import { AnimatedStartButton } from '@/components/ui/AnimatedStartButton';
import { getSplitForDays, SPLIT_TEMPLATES, PRIORITY_GROUPS, EQUIPMENT_BY_SETUP } from '@/constants/programTemplates';
import { getDefaultPreferredDays, formatScheduledDate, getTodayISO } from '@/lib/scheduleEngine';
import type { WeekDay } from '@/types/program';

const FOCUS_COLORS: Record<string, { bg: string; text: string }> = {
  push: { bg: 'rgba(255,107,53,0.12)', text: '#FF6B35' },
  pull: { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6' },
  legs: { bg: 'rgba(74,222,128,0.12)', text: '#4ADE80' },
  upper: { bg: 'rgba(255,107,53,0.12)', text: '#FF6B35' },
  lower: { bg: 'rgba(74,222,128,0.12)', text: '#4ADE80' },
  full_body: { bg: 'rgba(168,85,247,0.12)', text: '#A855F7' },
};
import { useProgramStore } from '@/stores/programStore';
import type {
  TrainingGoal,
  ExperienceLevel,
  EquipmentSetup,
  UserProfile,
  JointKey,
} from '@/types/program';

const JOINT_ITEMS: { key: JointKey; Icon: any; labelKey: string }[] = [
  { key: 'shoulder', Icon: Target, labelKey: 'shoulder' },
  { key: 'knee', Icon: Zap, labelKey: 'knee' },
  { key: 'lower_back', Icon: Mountain, labelKey: 'lowerBack' },
  { key: 'hip', Icon: Diamond, labelKey: 'hip' },
  { key: 'elbow', Icon: Dumbbell, labelKey: 'elbow' },
  { key: 'wrist', Icon: Watch, labelKey: 'wrist' },
];

const TOTAL_STEPS = 10;

export default function OnboardingScreen() {
  const router = useRouter();
  const { setUserProfile, generateAndSetProgram, startProgram, startProgramWithSchedule } = useProgramStore();

  // Form state
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<TrainingGoal | null>(null);
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4 | 5 | 6 | null>(null);
  const [equipment, setEquipment] = useState<EquipmentSetup | null>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | null>(null);
  const [priorityMuscles, setPriorityMuscles] = useState<string[]>([]);
  const [trainingYears, setTrainingYears] = useState<number | null>(null);
  const [limitations, setLimitations] = useState<JointKey[]>([]);
  const [preferredDays, setPreferredDays] = useState<WeekDay[]>([]);
  const [startDateOption, setStartDateOption] = useState<'today' | 'nextMonday' | 'pick'>('today');
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);

  // Compute the actual start date ISO string
  const computedStartDate = useMemo(() => {
    if (startDateOption === 'today') return getTodayISO();
    if (startDateOption === 'nextMonday') {
      const now = new Date();
      const jsDay = now.getDay(); // 0=Sun
      const daysUntilMonday = jsDay === 0 ? 1 : jsDay === 1 ? 7 : 8 - jsDay;
      const monday = new Date(now);
      monday.setDate(monday.getDate() + daysUntilMonday);
      const y = monday.getFullYear();
      const m = String(monday.getMonth() + 1).padStart(2, '0');
      const d = String(monday.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return customStartDate || getTodayISO();
  }, [startDateOption, customStartDate]);

  // Pre-compute next Monday label for start date step (must be top-level hook)
  const nextMondayLabel = useMemo(() => {
    const now = new Date();
    const jsDay = now.getDay();
    const daysUntilMonday = jsDay === 0 ? 1 : jsDay === 1 ? 7 : 8 - jsDay;
    const monday = new Date(now);
    monday.setDate(monday.getDate() + daysUntilMonday);
    return formatScheduledDate(
      `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`,
      i18n.locale,
    );
  }, []);

  const canAdvance = useCallback(() => {
    switch (step) {
      case 0: return !!goal;
      case 1: return !!experience;
      case 2: return !!daysPerWeek;
      case 3: return !!daysPerWeek && preferredDays.length === daysPerWeek; // preferred days
      case 4: return true; // start date (always valid)
      case 5: return !!equipment;
      case 6: return true; // limitations (optional)
      case 7: return !!sex && !!weight && parseFloat(weight) > 0;
      case 8: return true; // priority muscles (optional)
      case 9: return true; // confirmation
      default: return false;
    }
  }, [step, goal, experience, daysPerWeek, preferredDays, equipment, sex, weight]);

  const next = () => {
    if (step < TOTAL_STEPS - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step + 1);
    }
  };

  const back = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  const handleGenerate = () => {
    if (!goal || !experience || !daysPerWeek || !equipment || !sex || !weight) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const now = new Date().toISOString();
    const profile: UserProfile = {
      goal,
      experience,
      daysPerWeek,
      sex,
      weight: parseFloat(weight),
      equipment,
      ownedEquipment: EQUIPMENT_BY_SETUP[equipment],
      height: height ? parseFloat(height) : undefined,
      age: age ? parseInt(age, 10) : undefined,
      trainingYears: trainingYears ?? undefined,
      limitations: limitations.length > 0 ? limitations : undefined,
      preferredDays: preferredDays.length > 0 ? preferredDays : undefined,
      priorityMuscles,
      createdAt: now,
      updatedAt: now,
    };

    setUserProfile(profile);
    generateAndSetProgram();

    // Use schedule-aware start if preferred days are set
    if (preferredDays.length > 0) {
      startProgramWithSchedule(preferredDays, computedStartDate);
    } else {
      startProgram();
    }
    router.replace('/program');
  };

  const toggleMuscle = (muscle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPriorityMuscles((prev) => {
      if (prev.includes(muscle)) return prev.filter((m) => m !== muscle);
      if (prev.length >= 2) return prev;
      return [...prev, muscle];
    });
  };

  const toggleLimitation = (key: JointKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLimitations((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectExperience = (level: ExperienceLevel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExperience(level);
    const defaults: Record<ExperienceLevel, number> = { beginner: 0, intermediate: 2, advanced: 5 };
    if (trainingYears === null) setTrainingYears(defaults[level]);
  };

  // ─── Render Steps ───

  const renderStep = () => {
    switch (step) {
      case 0: return renderGoal();
      case 1: return renderExperience();
      case 2: return renderFrequency();
      case 3: return renderPreferredDays();
      case 4: return renderStartDate();
      case 5: return renderEquipment();
      case 6: return renderLimitations();
      case 7: return renderMeasurements();
      case 8: return renderPriorityMuscles();
      case 9: return renderConfirmation();
      default: return null;
    }
  };

  const renderGoal = () => (
    <OnboardingStep
      title={i18n.t('programOnboarding.goal.title')}
      subtitle={i18n.t('programOnboarding.goal.subtitle')}
    >
      <View style={styles.cardsCol}>
        <SelectionCard
          icon={<TrendingUp size={22} color={goal === 'hypertrophy' ? '#0C0C0C' : '#FF6B35'} />}
          title={i18n.t('programOnboarding.goal.hypertrophy')}
          subtitle={i18n.t('programOnboarding.goal.hypertrophyDesc')}
          selected={goal === 'hypertrophy'}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGoal('hypertrophy'); }}
        />
        <SelectionCard
          icon={<Zap size={22} color={goal === 'strength' ? '#0C0C0C' : '#FF6B35'} />}
          title={i18n.t('programOnboarding.goal.strength')}
          subtitle={i18n.t('programOnboarding.goal.strengthDesc')}
          selected={goal === 'strength'}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGoal('strength'); }}
        />
        <SelectionCard
          icon={<Repeat size={22} color={goal === 'recomposition' ? '#0C0C0C' : '#FF6B35'} />}
          title={i18n.t('programOnboarding.goal.recomposition')}
          subtitle={i18n.t('programOnboarding.goal.recompositionDesc')}
          selected={goal === 'recomposition'}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGoal('recomposition'); }}
        />
      </View>
    </OnboardingStep>
  );

  const renderExperience = () => (
    <OnboardingStep
      title={i18n.t('programOnboarding.experience.title')}
      subtitle={i18n.t('programOnboarding.experience.subtitle')}
    >
      <View style={styles.cardsCol}>
        <SelectionCard
          title={i18n.t('programOnboarding.experience.beginner')}
          subtitle={i18n.t('programOnboarding.experience.beginnerDesc')}
          selected={experience === 'beginner'}
          onPress={() => selectExperience('beginner')}
        />
        <SelectionCard
          title={i18n.t('programOnboarding.experience.intermediate')}
          subtitle={i18n.t('programOnboarding.experience.intermediateDesc')}
          selected={experience === 'intermediate'}
          onPress={() => selectExperience('intermediate')}
        />
        <SelectionCard
          title={i18n.t('programOnboarding.experience.advanced')}
          subtitle={i18n.t('programOnboarding.experience.advancedDesc')}
          selected={experience === 'advanced'}
          onPress={() => selectExperience('advanced')}
        />
      </View>

      {/* Training years refinement */}
      <View style={styles.yearsDivider} />
      <View style={styles.yearsRow}>
        <Text style={styles.yearsLabel}>
          {i18n.t('programOnboarding.experience.trainingYearsLabel')}
        </Text>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepperBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTrainingYears(Math.max(0, (trainingYears ?? 1) - 1));
            }}
          >
            <Minus size={16} color="#fff" strokeWidth={IconStroke.emphasis} />
          </Pressable>
          <Text style={styles.stepperValue}>
            {trainingYears != null ? String(trainingYears) : '—'}
          </Text>
          <Pressable
            style={styles.stepperBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTrainingYears(Math.min(30, (trainingYears ?? 0) + 1));
            }}
          >
            <Plus size={16} color="#fff" strokeWidth={IconStroke.emphasis} />
          </Pressable>
        </View>
      </View>
    </OnboardingStep>
  );

  const renderFrequency = () => {
    // Get split template for visual preview
    const splitDays = daysPerWeek ? getSplitDayPreview(daysPerWeek) : [];

    return (
      <OnboardingStep
        title={i18n.t('programOnboarding.frequency.title')}
        subtitle={i18n.t('programOnboarding.frequency.subtitle')}
      >
        <View style={styles.pillRow}>
          {([3, 4, 5, 6] as const).map((d) => (
            <Pressable
              key={d}
              style={[styles.pill, daysPerWeek === d && styles.pillSelected]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDaysPerWeek(d); setPreferredDays(getDefaultPreferredDays(d)); }}
            >
              <Text style={[styles.pillText, daysPerWeek === d && styles.pillTextSelected]}>
                {i18n.t('programOnboarding.frequency.days', { count: d })}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Visual split preview */}
        {daysPerWeek && splitDays.length > 0 && (
          <View style={styles.splitVisualWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.splitVisualRow}
            >
              {splitDays.map((day, i) => {
                const focusColors = FOCUS_COLORS[day.focus] || FOCUS_COLORS.full_body;
                return (
                  <View key={i} style={[styles.splitSlot, { backgroundColor: focusColors.bg }]}>
                    <Text style={[styles.splitSlotText, { color: focusColors.text }]}>
                      {i18n.t(`programLabels.${day.labelKey}`)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </OnboardingStep>
    );
  };

  // ─── Step 3: Preferred Training Days ───
  const togglePreferredDay = (day: WeekDay) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreferredDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day);
      if (daysPerWeek && prev.length >= daysPerWeek) return prev;
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const renderPreferredDays = () => {
    const dayLabels = i18n.t('scheduling.dayLabels') as unknown as string[];
    const dayLabelsFull = i18n.t('scheduling.dayLabelsFull') as unknown as string[];

    return (
      <OnboardingStep
        title={i18n.t('scheduling.preferredDaysTitle')}
        subtitle={i18n.t('scheduling.preferredDaysSubtitle', { count: daysPerWeek || 3 })}
      >
        <View style={styles.daysGrid}>
          {([0, 1, 2, 3, 4, 5, 6] as WeekDay[]).map((day) => {
            const selected = preferredDays.includes(day);
            return (
              <Pressable
                key={day}
                style={styles.dayColumn}
                onPress={() => togglePreferredDay(day)}
              >
                <View
                  style={[
                    styles.dayCircle,
                    selected && styles.dayCircleSelected,
                  ]}
                >
                  {selected && (
                    <Check size={14} color="#0C0C0C" strokeWidth={3} />
                  )}
                </View>
                <Text
                  style={[
                    styles.dayCircleLabel,
                    selected && styles.dayCircleLabelSelected,
                  ]}
                >
                  {dayLabels[day]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Preview of selected days */}
        {preferredDays.length > 0 && (
          <Text style={styles.daysPreview}>
            {preferredDays.map((d) => dayLabelsFull[d]).join(' · ')}
          </Text>
        )}
      </OnboardingStep>
    );
  };

  // ─── Step 4: Start Date ───
  const renderStartDate = () => {
    // Show partial week nudge when starting today on Thu(4)/Fri(5)/Sat(6)/Sun(0)
    const todayJsDay = new Date().getDay(); // 0=Sun, 4=Thu, 5=Fri, 6=Sat
    const isLateInWeek = todayJsDay === 0 || todayJsDay >= 4;
    const showPartialNudge = startDateOption === 'today' && isLateInWeek;

    return (
      <OnboardingStep
        title={i18n.t('scheduling.startDateTitle')}
        subtitle={i18n.t('scheduling.startDateSubtitle')}
      >
        <View style={styles.cardsCol}>
          <SelectionCard
            icon={<Calendar size={22} color={startDateOption === 'today' ? '#0C0C0C' : '#FF6B35'} />}
            title={i18n.t('scheduling.today')}
            subtitle={i18n.t('scheduling.todayDesc')}
            selected={startDateOption === 'today'}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStartDateOption('today'); }}
          />
          <SelectionCard
            icon={<Calendar size={22} color={startDateOption === 'nextMonday' ? '#0C0C0C' : '#FF6B35'} />}
            title={`${i18n.t('scheduling.nextMonday')} — ${nextMondayLabel}`}
            subtitle={i18n.t('scheduling.nextMondayDesc')}
            selected={startDateOption === 'nextMonday'}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStartDateOption('nextMonday'); }}
          />
        </View>

        {showPartialNudge && (
          <View style={styles.partialWeekNudge}>
            <View style={styles.partialWeekAccent} />
            <Text style={styles.partialWeekText}>
              {i18n.t('scheduling.partialWeekNudge')}
            </Text>
          </View>
        )}
      </OnboardingStep>
    );
  };

  const renderEquipment = () => (
    <OnboardingStep
      title={i18n.t('programOnboarding.equipment.title')}
      subtitle={i18n.t('programOnboarding.equipment.subtitle')}
    >
      <View style={styles.cardsCol}>
        <SelectionCard
          icon={<Dumbbell size={22} color={equipment === 'full_gym' ? '#0C0C0C' : '#FF6B35'} />}
          title={i18n.t('programOnboarding.equipment.fullGym')}
          subtitle={i18n.t('programOnboarding.equipment.fullGymDesc')}
          selected={equipment === 'full_gym'}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEquipment('full_gym'); }}
        />
        <SelectionCard
          icon={<Home size={22} color={equipment === 'home_dumbbell' ? '#0C0C0C' : '#FF6B35'} />}
          title={i18n.t('programOnboarding.equipment.homeDumbbell')}
          subtitle={i18n.t('programOnboarding.equipment.homeDumbbellDesc')}
          selected={equipment === 'home_dumbbell'}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEquipment('home_dumbbell'); }}
        />
        <SelectionCard
          icon={<User size={22} color={equipment === 'bodyweight' ? '#0C0C0C' : '#FF6B35'} />}
          title={i18n.t('programOnboarding.equipment.bodyweight')}
          subtitle={i18n.t('programOnboarding.equipment.bodyweightDesc')}
          selected={equipment === 'bodyweight'}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEquipment('bodyweight'); }}
        />
      </View>
    </OnboardingStep>
  );

  const renderLimitations = () => (
    <OnboardingStep
      title={i18n.t('programOnboarding.limitations.title')}
      subtitle={i18n.t('programOnboarding.limitations.subtitle')}
      isOptional
      onSkip={next}
    >
      <View style={styles.jointGrid}>
        {[JOINT_ITEMS.slice(0, 2), JOINT_ITEMS.slice(2, 4), JOINT_ITEMS.slice(4, 6)].map((row, ri) => (
          <View key={ri} style={styles.jointRow}>
            {row.map(({ key, Icon, labelKey }) => {
              const selected = limitations.includes(key);
              return (
                <Pressable
                  key={key}
                  style={[styles.jointCard, selected && styles.jointCardSelected]}
                  onPress={() => toggleLimitation(key)}
                >
                  <Icon
                    size={24}
                    color={selected ? '#0C0C0C' : 'rgba(255,255,255,0.5)'}
                    strokeWidth={IconStroke.default}
                  />
                  <Text style={[styles.jointLabel, selected && styles.jointLabelSelected]}>
                    {i18n.t(`programOnboarding.limitations.${labelKey}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </OnboardingStep>
  );

  const renderMeasurements = () => (
    <OnboardingStep
      title={i18n.t('programOnboarding.measurements.title')}
      subtitle={i18n.t('programOnboarding.measurements.subtitle')}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.inputsGrid}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>{i18n.t('programOnboarding.measurements.sex')}</Text>
            <View style={styles.sexToggle}>
              <Pressable
                style={[styles.sexPill, sex === 'male' && styles.sexPillSelected]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSex('male'); }}
              >
                <Text style={[styles.sexPillText, sex === 'male' && styles.sexPillTextSelected]}>
                  {i18n.t('programOnboarding.measurements.male')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.sexPill, sex === 'female' && styles.sexPillSelected]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSex('female'); }}
              >
                <Text style={[styles.sexPillText, sex === 'female' && styles.sexPillTextSelected]}>
                  {i18n.t('programOnboarding.measurements.female')}
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>{i18n.t('programOnboarding.measurements.weight')}</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="75"
              placeholderTextColor="rgba(255,255,255,0.2)"
            />
            <Text style={styles.inputHint}>{i18n.t('programOnboarding.measurements.weightHint')}</Text>
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>{i18n.t('programOnboarding.measurements.height')}</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              placeholder="178"
              placeholderTextColor="rgba(255,255,255,0.2)"
            />
            <Text style={styles.inputHint}>{i18n.t('programOnboarding.measurements.heightHint')}</Text>
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>{i18n.t('programOnboarding.measurements.age')}</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="25"
              placeholderTextColor="rgba(255,255,255,0.2)"
            />
            <Text style={styles.inputHint}>{i18n.t('programOnboarding.measurements.ageHint')}</Text>
          </View>
        </View>
        <Text style={styles.requiredNote}>{i18n.t('programOnboarding.measurements.required')}</Text>
      </KeyboardAvoidingView>
    </OnboardingStep>
  );

  const renderPriorityMuscles = () => (
    <OnboardingStep
      title={i18n.t('programOnboarding.priority.title')}
      subtitle={i18n.t('programOnboarding.priority.subtitle')}
      isOptional
      onSkip={next}
    >
      <View style={styles.muscleGrid}>
        {PRIORITY_GROUPS.map((group) => {
          const selected = priorityMuscles.includes(group.key);
          return (
            <Pressable
              key={group.key}
              style={[styles.musclePill, selected && styles.musclePillSelected]}
              onPress={() => toggleMuscle(group.key)}
            >
              <Text style={[styles.musclePillText, selected && styles.musclePillTextSelected]}>
                {i18n.t(group.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingStep>
  );

  const goalLabels: Record<TrainingGoal, string> = {
    hypertrophy: i18n.t('programOnboarding.goal.hypertrophy'),
    strength: i18n.t('programOnboarding.goal.strength'),
    recomposition: i18n.t('programOnboarding.goal.recomposition'),
  };
  const expLabels: Record<ExperienceLevel, string> = {
    beginner: i18n.t('programOnboarding.experience.beginner'),
    intermediate: i18n.t('programOnboarding.experience.intermediate'),
    advanced: i18n.t('programOnboarding.experience.advanced'),
  };
  const equipLabels: Record<EquipmentSetup, string> = {
    full_gym: i18n.t('programOnboarding.equipment.fullGym'),
    home_dumbbell: i18n.t('programOnboarding.equipment.homeDumbbell'),
    bodyweight: i18n.t('programOnboarding.equipment.bodyweight'),
  };

  const limitationLabels: Record<JointKey, string> = {
    shoulder: i18n.t('programOnboarding.limitations.shoulder'),
    knee: i18n.t('programOnboarding.limitations.knee'),
    lower_back: i18n.t('programOnboarding.limitations.lowerBack'),
    hip: i18n.t('programOnboarding.limitations.hip'),
    elbow: i18n.t('programOnboarding.limitations.elbow'),
    wrist: i18n.t('programOnboarding.limitations.wrist'),
  };

  const dayLabelsFull = i18n.t('scheduling.dayLabelsFull') as unknown as string[];

  const confirmItems = [
    { label: i18n.t('programOnboarding.confirmation.objective'), value: goal ? goalLabels[goal] : '—' },
    { label: i18n.t('programOnboarding.confirmation.experience'), value: experience ? expLabels[experience] : '—' },
    ...(trainingYears != null
      ? [{ label: i18n.t('programOnboarding.confirmation.trainingYears'), value: i18n.t('programOnboarding.confirmation.yearsCount', { count: trainingYears }) }]
      : []),
    { label: i18n.t('programOnboarding.confirmation.frequency'), value: daysPerWeek ? i18n.t('programOnboarding.confirmation.daysPerWeek', { count: daysPerWeek }) : '—' },
    ...(preferredDays.length > 0
      ? [{ label: i18n.t('scheduling.confirmDays'), value: preferredDays.map((d) => dayLabelsFull[d]).join(', ') }]
      : []),
    { label: i18n.t('scheduling.confirmStart'), value: formatScheduledDate(computedStartDate, i18n.locale) },
    { label: i18n.t('programOnboarding.confirmation.equipment'), value: equipment ? equipLabels[equipment] : '—' },
    { label: i18n.t('programOnboarding.confirmation.limitations'), value: limitations.length > 0 ? limitations.map((k) => limitationLabels[k]).join(', ') : i18n.t('programOnboarding.confirmation.noLimitation') },
    { label: i18n.t('programOnboarding.confirmation.sex'), value: sex === 'male' ? i18n.t('programOnboarding.measurements.male') : sex === 'female' ? i18n.t('programOnboarding.measurements.female') : '—' },
    { label: i18n.t('programOnboarding.confirmation.weight'), value: weight ? `${weight} kg` : '—' },
    ...(priorityMuscles.length > 0
      ? [{ label: i18n.t('programOnboarding.confirmation.priorities'), value: priorityMuscles.map((pk) => {
          const group = PRIORITY_GROUPS.find((g) => g.key === pk);
          return group ? i18n.t(group.labelKey) : pk;
        }).join(', ') }]
      : []),
  ];

  const renderConfirmation = () => (
    <OnboardingStep
      title={i18n.t('programOnboarding.confirmation.title')}
      subtitle={i18n.t('programOnboarding.confirmation.subtitle')}
    >
      {/* Vertical timeline */}
      <View style={styles.timelineWrap}>
        {confirmItems.map((item, i) => (
          <View key={item.label} style={styles.timelineRow}>
            {/* Node + connector */}
            <View style={styles.timelineNodeCol}>
              <View style={styles.timelineNode}>
                <Check size={10} color={Colors.primary} strokeWidth={3} />
              </View>
              {i < confirmItems.length - 1 && <View style={styles.timelineConnector} />}
            </View>
            {/* Content */}
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>{item.label}</Text>
              <Text style={styles.timelineValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <AnimatedStartButton
        onPress={handleGenerate}
        label={i18n.t('programOnboarding.confirmation.generate')}
        loadingLabel={i18n.t('workoutGenerate.generating')}
        icon={Sparkles}
        fillDuration={2200}
      />
    </OnboardingStep>
  );

  return (
    <View style={styles.screen}>
      {/* Ambient orbs */}
      <View style={styles.orbOrange} pointerEvents="none" />
      <View style={styles.orbBlue} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={back} style={styles.backButton} hitSlop={12}>
            <ArrowLeft size={22} color="#fff" strokeWidth={IconStroke.default} />
          </Pressable>
          {/* Progress dots */}
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]}
              />
            ))}
          </View>
          <View style={{ width: 40 }} />
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

        {/* Next button (not on confirmation step) */}
        {step < TOTAL_STEPS - 1 && (
          <View style={styles.footer}>
            <Pressable
              style={[styles.nextButton, !canAdvance() && styles.nextButtonDisabled]}
              onPress={next}
              disabled={!canAdvance()}
            >
              <Text style={[styles.nextText, !canAdvance() && styles.nextTextDisabled]}>
                {i18n.t('common.next')}
              </Text>
              <ChevronRight size={18} color={canAdvance() ? '#0C0C0C' : 'rgba(255,255,255,0.3)'} />
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── Helpers ───

function getSplitDayPreview(days: 3 | 4 | 5 | 6) {
  const splitType = getSplitForDays(days);
  const templates = SPLIT_TEMPLATES[splitType];
  if (!templates || templates.length === 0) return [];
  // Pick the template matching the day count
  for (const t of templates) {
    if (t.length === days) return t;
  }
  return templates[0];
}

// ─── Sub-components ───

function SelectionCard({
  icon,
  title,
  subtitle,
  selected,
  onPress,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.selCard, selected && styles.selCardSelected]}
      onPress={onPress}
    >
      {icon && <View style={styles.selCardIcon}>{icon}</View>}
      <View style={styles.selCardText}>
        <Text style={[styles.selCardTitle, selected && styles.selCardTitleSelected]}>
          {title}
        </Text>
        <Text style={[styles.selCardSubtitle, selected && styles.selCardSubtitleSelected]}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
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
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
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

  // Cards — compact
  cardsCol: {
    gap: PageLayout.cardGap,
  },
  selCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    marginBottom: 2,
  },
  selCardTitleSelected: {
    color: '#0C0C0C',
  },
  selCardSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  selCardSubtitleSelected: {
    color: 'rgba(12,12,12,0.6)',
  },

  // Pills
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  pillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: '#0C0C0C',
  },

  // Visual split preview
  splitVisualWrap: {
    marginTop: 20,
  },
  splitVisualRow: {
    gap: 8,
    paddingVertical: 4,
  },
  splitSlot: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 80,
    alignItems: 'center',
  },
  splitSlotText: {
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Inputs
  inputsGrid: {
    gap: 18,
  },
  inputRow: {
    gap: 8,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  sexToggle: {
    flexDirection: 'row',
    gap: 10,
  },
  sexPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  sexPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sexPillText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  sexPillTextSelected: {
    color: '#0C0C0C',
  },
  requiredNote: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 16,
  },

  // Input hint (micro-pedagogy)
  inputHint: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Training years stepper
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'center',
  },

  // Joint limitation grid
  jointGrid: {
    gap: 12,
  },
  jointRow: {
    flexDirection: 'row',
    gap: 12,
  },
  jointCard: {
    flex: 1,
    paddingVertical: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  jointCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  jointLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  jointLabelSelected: {
    color: '#0C0C0C',
  },

  // Muscle grid
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  musclePill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  musclePillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  musclePillText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  musclePillTextSelected: {
    color: '#0C0C0C',
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Vertical timeline confirmation
  timelineWrap: {
    marginBottom: 24,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 48,
  },
  timelineNodeCol: {
    width: 32,
    alignItems: 'center',
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,53,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(255,107,53,0.15)',
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
    gap: 2,
  },
  timelineLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  timelineValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Preferred days grid
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 10,
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
  dayCircleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayCircleLabel: {
    color: 'rgba(120,120,130,1)',
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  dayCircleLabelSelected: {
    color: Colors.primary,
  },
  daysPreview: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 20,
  },

  // Partial week nudge (start date step)
  partialWeekNudge: {
    flexDirection: 'row',
    marginTop: 16,
    paddingVertical: 10,
    gap: 10,
  },
  partialWeekAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
  },
  partialWeekText: {
    flex: 1,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 18,
  },

  generateButton: {
    backgroundColor: Colors.primary,
    borderRadius: CTAButton.borderRadius,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  generateText: {
    color: '#0C0C0C',
    fontSize: 17,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
});
