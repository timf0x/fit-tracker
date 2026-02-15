import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Minus,
  Plus,
  Check,
  AlertTriangle,
  Camera,
  User,
  X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, GlassStyle, Header, PageLayout, IconStroke, SectionLabel as SectionLabelTokens, CTAButton } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { useProgramStore } from '@/stores/programStore';
import { PRIORITY_GROUPS, EQUIPMENT_BY_SETUP, EQUIPMENT_ITEMS, getPresetForEquipment } from '@/constants/programTemplates';
import { getMuscleLabel } from '@/lib/muscleMapping';
import type { Equipment } from '@/types';
import * as Haptics from 'expo-haptics';
import type {
  TrainingGoal,
  ExperienceLevel,
  EquipmentSetup,
  JointKey,
  UserProfile,
} from '@/types/program';

// ─── Text tabs ───

function TextTabs<T extends string>({
  options,
  value,
  onSelect,
}: {
  options: { key: T; label: string }[];
  value: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={s.textTabs}>
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
          >
            <Text style={[s.textTabLabel, active && s.textTabLabelActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Stepper ───

function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  return (
    <View style={s.stepper}>
      <Pressable
        style={[s.stepBtn, value <= min && s.stepBtnDim]}
        onPress={() => {
          if (value > min) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(Math.max(min, value - step));
          }
        }}
        hitSlop={6}
      >
        <Minus size={14} color={value <= min ? 'rgba(255,255,255,0.15)' : '#fff'} strokeWidth={IconStroke.emphasis} />
      </Pressable>
      <Text style={s.stepValue}>
        {value}{unit ? ` ${unit}` : ''}
      </Text>
      <Pressable
        style={[s.stepBtn, value >= max && s.stepBtnDim]}
        onPress={() => {
          if (value < max) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(Math.min(max, value + step));
          }
        }}
        hitSlop={6}
      >
        <Plus size={14} color={value >= max ? 'rgba(255,255,255,0.15)' : '#fff'} strokeWidth={IconStroke.emphasis} />
      </Pressable>
    </View>
  );
}

// ─── Row components ───

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function TappableRow({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <Pressable style={s.tappableRow} onPress={onToggle}>
      <Text style={[s.tappableLabel, selected && s.tappableLabelActive]}>{label}</Text>
      {selected && <Check size={16} color={Colors.primary} strokeWidth={IconStroke.emphasis} />}
    </Pressable>
  );
}

function SectionLabel({ title }: { title: string }) {
  return <Text style={s.sectionLabel}>{title}</Text>;
}

// ─── Constants ───

const JOINT_KEYS: JointKey[] = ['shoulder', 'knee', 'lower_back', 'hip', 'elbow', 'wrist'];

// ─── Main Screen ───

export default function ProfileEditScreen() {
  const router = useRouter();
  const existingProfile = useProgramStore((st) => st.userProfile);
  const setUserProfile = useProgramStore((st) => st.setUserProfile);
  // Local form state
  const [name, setName] = useState(existingProfile?.name ?? '');
  const [username, setUsername] = useState(existingProfile?.username ?? '');
  const [email, setEmail] = useState(existingProfile?.email ?? '');
  const [profileImageUri, setProfileImageUri] = useState(existingProfile?.profileImageUri ?? '');
  const [sex, setSex] = useState<'male' | 'female'>(existingProfile?.sex ?? 'male');
  const [weight, setWeight] = useState(existingProfile?.weight ?? 75);
  const [height, setHeight] = useState(existingProfile?.height ?? 175);
  const [age, setAge] = useState(existingProfile?.age ?? 25);
  const [experience, setExperience] = useState<ExperienceLevel>(existingProfile?.experience ?? 'intermediate');
  const [goal, setGoal] = useState<TrainingGoal>(existingProfile?.goal ?? 'hypertrophy');
  const [equipment, setEquipment] = useState<EquipmentSetup>(existingProfile?.equipment ?? 'full_gym');
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4 | 5 | 6>(existingProfile?.daysPerWeek ?? 4);
  const [limitations, setLimitations] = useState<JointKey[]>(existingProfile?.limitations ?? []);
  const [priorityMuscles, setPriorityMuscles] = useState<string[]>(existingProfile?.priorityMuscles ?? []);
  const [ownedEquipment, setOwnedEquipment] = useState<Equipment[]>(
    existingProfile?.ownedEquipment ?? EQUIPMENT_BY_SETUP[existingProfile?.equipment ?? 'full_gym'],
  );
  const [emailError, setEmailError] = useState(false);

  // Re-sync local state when screen gains focus (handles cached mount)
  useFocusEffect(
    useCallback(() => {
      const p = useProgramStore.getState().userProfile;
      if (!p) return;
      setName(p.name ?? '');
      setUsername(p.username ?? '');
      setEmail(p.email ?? '');
      setProfileImageUri(p.profileImageUri ?? '');
      setSex(p.sex ?? 'male');
      setWeight(p.weight ?? 75);
      setHeight(p.height ?? 175);
      setAge(p.age ?? 25);
      setExperience(p.experience ?? 'intermediate');
      setGoal(p.goal ?? 'hypertrophy');
      setEquipment(p.equipment ?? 'full_gym');
      setDaysPerWeek(p.daysPerWeek ?? 4);
      setLimitations(p.limitations ?? []);
      setPriorityMuscles(p.priorityMuscles ?? []);
      setOwnedEquipment(p.ownedEquipment ?? EQUIPMENT_BY_SETUP[p.equipment ?? 'full_gym']);
    }, []),
  );

  const programFieldsChanged = useMemo(() => {
    if (!existingProfile) return false;
    const oldOwned = existingProfile.ownedEquipment ?? EQUIPMENT_BY_SETUP[existingProfile.equipment];
    const equipChanged = ownedEquipment.length !== oldOwned.length ||
      ownedEquipment.some((e) => !oldOwned.includes(e));
    return (
      goal !== existingProfile.goal ||
      daysPerWeek !== existingProfile.daysPerWeek ||
      equipment !== existingProfile.equipment ||
      experience !== existingProfile.experience ||
      equipChanged
    );
  }, [goal, daysPerWeek, equipment, experience, ownedEquipment, existingProfile]);

  // ─── Photo picker ───

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

  const toggleLimitation = (key: JointKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLimitations((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const togglePriority = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPriorityMuscles((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 2) return prev;
      return [...prev, key];
    });
  };

  // Equipment toggle handler
  const toggleEquipmentItem = (eq: Equipment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOwnedEquipment((prev) => {
      const next = prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq];
      // Always keep body weight
      if (!next.includes('body weight')) next.push('body weight');
      // Sync preset tabs: if toggles now match a preset, update the tier
      const matched = getPresetForEquipment(next);
      if (matched) setEquipment(matched);
      return next;
    });
  };

  // Preset quick-select: sets ownedEquipment to the tier's defaults
  const handleEquipmentPreset = (tier: EquipmentSetup) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEquipment(tier);
    setOwnedEquipment([...EQUIPMENT_BY_SETUP[tier]]);
  };

  // Derive active preset from ownedEquipment
  const activePreset = useMemo(() => getPresetForEquipment(ownedEquipment), [ownedEquipment]);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSave = () => {
    if (!weight || weight < 30) {
      Alert.alert('', i18n.t('programOnboarding.measurements.required'));
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      setEmailError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setEmailError(false);

    const now = new Date().toISOString();
    const profile: UserProfile = {
      name: name.trim() || undefined,
      username: username.trim().replace(/^@/, '') || undefined,
      email: trimmedEmail || undefined,
      profileImageUri: profileImageUri || undefined,
      goal,
      experience,
      daysPerWeek,
      sex,
      weight,
      height: height > 0 ? height : undefined,
      age: age > 0 ? age : undefined,
      trainingYears: existingProfile?.trainingYears,
      equipment,
      ownedEquipment,
      limitations: limitations.length > 0 ? limitations : undefined,
      preferredDays: existingProfile?.preferredDays,
      priorityMuscles,
      createdAt: existingProfile?.createdAt ?? now,
      updatedAt: now,
    };

    setUserProfile(profile);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={s.screen}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={22} color="#fff" strokeWidth={IconStroke.default} />
          </Pressable>
          <Text style={s.headerTitle}>{i18n.t('settings.profileTitle')}</Text>
          <View style={{ width: 36 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* ════════════════════════════════════════
                 HERO: Avatar + Name + Stats
               ════════════════════════════════════════ */}
            <View style={s.heroSection}>
              {/* Photo */}
              <Pressable style={s.avatarOuter} onPress={pickImage}>
                <View style={s.avatarRing}>
                  {profileImageUri ? (
                    <Image source={{ uri: profileImageUri }} style={s.avatarImg} />
                  ) : (
                    <View style={s.avatarFallback}>
                      <User size={32} color="rgba(255,255,255,0.25)" strokeWidth={IconStroke.light} />
                    </View>
                  )}
                </View>
                <View style={s.cameraBtn}>
                  <Camera size={12} color="#fff" strokeWidth={IconStroke.emphasis} />
                </View>
              </Pressable>

              <Text style={s.heroChangeText}>{i18n.t('settings.profileChangePhoto')}</Text>
            </View>

            {/* ════════════════════════════════════════
                 IDENTITY: Name, Username, Email
               ════════════════════════════════════════ */}
            <SectionLabel title={i18n.t('settings.profileIdentity')} />

            <View style={s.inputRow}>
              <Text style={s.inputLabel}>{i18n.t('settings.profileName')}</Text>
              <View style={s.inputWithClear}>
                <TextInput
                  style={[s.inputField, { flex: 1 }]}
                  value={name}
                  onChangeText={setName}
                  placeholder={i18n.t('settings.profileNamePlaceholder')}
                  placeholderTextColor="rgba(255,255,255,0.15)"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                {name.length > 0 && (
                  <Pressable onPress={() => setName('')} hitSlop={8} style={s.clearBtn}>
                    <X size={14} color="rgba(255,255,255,0.3)" strokeWidth={IconStroke.emphasis} />
                  </Pressable>
                )}
              </View>
            </View>
            <View style={s.inputRow}>
              <Text style={s.inputLabel}>{i18n.t('settings.profileUsername')}</Text>
              <View style={s.inputWithClear}>
                <TextInput
                  style={[s.inputField, { flex: 1 }]}
                  value={username}
                  onChangeText={(t) => setUsername(t.replace(/\s/g, '').toLowerCase())}
                  placeholder={i18n.t('settings.profileUsernamePlaceholder')}
                  placeholderTextColor="rgba(255,255,255,0.15)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                {username.length > 0 && (
                  <Pressable onPress={() => setUsername('')} hitSlop={8} style={s.clearBtn}>
                    <X size={14} color="rgba(255,255,255,0.3)" strokeWidth={IconStroke.emphasis} />
                  </Pressable>
                )}
              </View>
            </View>
            <View style={[s.inputRow, emailError && s.inputRowError]}>
              <Text style={[s.inputLabel, emailError && s.inputLabelError]}>
                {i18n.t('settings.profileEmail')}
              </Text>
              <View style={s.inputWithClear}>
                <TextInput
                  style={[s.inputField, { flex: 1 }]}
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(false); }}
                  placeholder={i18n.t('settings.profileEmailPlaceholder')}
                  placeholderTextColor="rgba(255,255,255,0.15)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="done"
                />
                {email.length > 0 && (
                  <Pressable onPress={() => { setEmail(''); if (emailError) setEmailError(false); }} hitSlop={8} style={s.clearBtn}>
                    <X size={14} color="rgba(255,255,255,0.3)" strokeWidth={IconStroke.emphasis} />
                  </Pressable>
                )}
              </View>
              {emailError && (
                <Text style={s.errorText}>{i18n.t('settings.profileEmailInvalid')}</Text>
              )}
            </View>

            {/* ════════════════════════════════════════
                 BODY: Sex, Weight, Height, Age
               ════════════════════════════════════════ */}
            <SectionLabel title={i18n.t('settings.profileBody')} />

            <FieldRow label={i18n.t('settings.profileSex')}>
              <TextTabs
                options={[
                  { key: 'male' as const, label: i18n.t('settings.male') },
                  { key: 'female' as const, label: i18n.t('settings.female') },
                ]}
                value={sex}
                onSelect={setSex}
              />
            </FieldRow>
            <FieldRow label={i18n.t('settings.profileWeight')}>
              <Stepper value={weight} onChange={setWeight} min={30} max={200} unit={i18n.t('settings.unitsKg')} />
            </FieldRow>
            <FieldRow label={i18n.t('settings.profileHeight')}>
              <Stepper value={height} onChange={setHeight} min={100} max={230} unit={i18n.t('settings.cm')} />
            </FieldRow>
            <FieldRow label={i18n.t('settings.profileAge')}>
              <Stepper value={age} onChange={setAge} min={14} max={80} unit={i18n.t('settings.years')} />
            </FieldRow>

            {/* ════════════════════════════════════════
                 TRAINING: Experience, Goal, Equipment, Frequency
               ════════════════════════════════════════ */}
            <SectionLabel title={i18n.t('settings.profileTraining')} />

            <FieldRow label={i18n.t('settings.profileExperience')}>
              <TextTabs
                options={[
                  { key: 'beginner' as const, label: i18n.t('programOnboarding.experience.beginner') },
                  { key: 'intermediate' as const, label: i18n.t('programOnboarding.experience.intermediate') },
                  { key: 'advanced' as const, label: i18n.t('programOnboarding.experience.advanced') },
                ]}
                value={experience}
                onSelect={setExperience}
              />
            </FieldRow>
            <FieldRow label={i18n.t('settings.profileGoal')}>
              <TextTabs
                options={[
                  { key: 'hypertrophy' as const, label: i18n.t('programOnboarding.goal.hypertrophy') },
                  { key: 'strength' as const, label: i18n.t('programOnboarding.goal.strength') },
                  { key: 'recomposition' as const, label: i18n.t('programOnboarding.goal.recomposition') },
                ]}
                value={goal}
                onSelect={setGoal}
              />
            </FieldRow>
            <FieldRow label={i18n.t('settings.profileEquipment')}>
              <TextTabs
                options={[
                  { key: 'full_gym' as const, label: i18n.t('programOnboarding.equipment.fullGym') },
                  { key: 'home_dumbbell' as const, label: i18n.t('programOnboarding.equipment.homeDumbbell') },
                  { key: 'bodyweight' as const, label: i18n.t('programOnboarding.equipment.bodyweight') },
                ]}
                value={activePreset ?? equipment}
                onSelect={handleEquipmentPreset}
              />
            </FieldRow>

            {/* ── Equipment toggle grid ── */}
            <Text style={s.equipmentSubtitle}>{i18n.t('settings.profileEquipmentDetail')}</Text>
            <View style={s.equipGrid}>
              {/* Body weight — always on */}
              <View style={[s.equipRow, s.equipRowFirst]}>
                <Text style={s.equipLabelAlwaysOn}>{i18n.t('equipment.bodyWeight')}</Text>
                <Text style={s.equipAlwaysOnHint}>{i18n.t('settings.profileEquipmentAlwaysOn')}</Text>
              </View>

              {EQUIPMENT_ITEMS.map((item, idx) => {
                const active = ownedEquipment.includes(item.equipment);
                return (
                  <Pressable
                    key={item.equipment}
                    style={[
                      s.equipRow,
                      idx === EQUIPMENT_ITEMS.length - 1 && s.equipRowLast,
                    ]}
                    onPress={() => toggleEquipmentItem(item.equipment)}
                  >
                    <Text style={[s.equipLabel, active && s.equipLabelActive]}>
                      {i18n.t(item.labelKey)}
                    </Text>
                    {active && <Check size={16} color={Colors.primary} strokeWidth={IconStroke.emphasis} />}
                  </Pressable>
                );
              })}
            </View>
            <FieldRow label={i18n.t('settings.profileDays')}>
              <Stepper
                value={daysPerWeek}
                onChange={(v) => setDaysPerWeek(v as 3 | 4 | 5 | 6)}
                min={3}
                max={6}
              />
            </FieldRow>

            {/* ── Limitations ── */}
            <SectionLabel title={i18n.t('settings.profileLimitations')} />
            {JOINT_KEYS.map((key) => (
              <TappableRow
                key={key}
                label={i18n.t(`programOnboarding.limitations.${key === 'lower_back' ? 'lowerBack' : key}`)}
                selected={limitations.includes(key)}
                onToggle={() => toggleLimitation(key)}
              />
            ))}

            {/* ── Priority muscles ── */}
            <SectionLabel title={i18n.t('settings.profilePriority')} />
            {PRIORITY_GROUPS.map((group) => (
              <TappableRow
                key={group.key}
                label={getMuscleLabel(group.muscles[0])}
                selected={priorityMuscles.includes(group.key)}
                onToggle={() => togglePriority(group.key)}
              />
            ))}

            {/* Warning */}
            {programFieldsChanged && (
              <View style={s.warningBanner}>
                <AlertTriangle size={16} color="#FBBF24" strokeWidth={IconStroke.default} />
                <Text style={s.warningText}>{i18n.t('settings.profileWarning')}</Text>
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Fixed bottom save button */}
        <View style={s.bottomBar}>
          <LinearGradient
            colors={['transparent', Colors.background]}
            style={s.bottomFade}
            pointerEvents="none"
          />
          <Pressable style={s.saveBtn} onPress={handleSave}>
            <Text style={s.saveBtnText}>{i18n.t('settings.profileSave')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PageLayout.paddingHorizontal,
    paddingVertical: 12,
  },
  backBtn: {
    ...Header.backButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 40,
  },

  // ── Hero section ──
  heroSection: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  avatarOuter: {
    position: 'relative',
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: 'rgba(255,107,53,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    // subtle glow
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  avatarImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  heroChangeText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 8,
  },

  // Section labels
  sectionLabel: {
    ...SectionLabelTokens,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 28,
    marginBottom: 12,
  },

  // Input rows (name, username, email)
  inputRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 4,
  },
  inputRowError: {
    borderBottomColor: 'rgba(239,68,68,0.3)',
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  inputWithClear: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  inputLabelError: {
    color: '#EF4444',
  },
  inputField: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    paddingVertical: 6,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginBottom: 4,
  },

  // Field row
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flexShrink: 1,
    marginRight: 12,
  },

  // Text tabs
  textTabs: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    paddingVertical: 2,
  },
  textTabLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  textTabLabelActive: {
    color: Colors.primary,
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnDim: {
    opacity: 0.35,
  },
  stepValue: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },

  // Tappable row
  tappableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  tappableLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  tappableLabelActive: {
    color: '#fff',
  },

  // Equipment grid
  equipmentSubtitle: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 8,
  },
  equipGrid: {
    ...GlassStyle.card,
    overflow: 'hidden',
  },
  equipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  equipRowFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  equipRowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  equipLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  equipLabelActive: {
    color: '#FFFFFF',
  },
  equipLabelAlwaysOn: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  equipAlwaysOnHint: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },

  // Warning
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    paddingVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FBBF24',
    paddingLeft: 12,
  },
  warningText: {
    flex: 1,
    color: '#FBBF24',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Fixed bottom save
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 16,
    backgroundColor: Colors.background,
  },
  bottomFade: {
    position: 'absolute',
    top: -32,
    left: 0,
    right: 0,
    height: 32,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: CTAButton.borderRadius,
    height: CTAButton.height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: CTAButton.fontSize,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
});
