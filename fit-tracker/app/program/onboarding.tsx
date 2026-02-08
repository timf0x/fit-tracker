import { useState, useCallback } from 'react';
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
} from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { OnboardingStep } from '@/components/program/OnboardingStep';
import { MUSCLE_LABELS_FR } from '@/lib/muscleMapping';
import { useProgramStore } from '@/stores/programStore';
import type {
  TrainingGoal,
  ExperienceLevel,
  EquipmentSetup,
  UserProfile,
} from '@/types/program';

const TOTAL_STEPS = 7;

export default function OnboardingScreen() {
  const router = useRouter();
  const { setUserProfile, generateAndSetProgram, startProgram } = useProgramStore();

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

  const canAdvance = useCallback(() => {
    switch (step) {
      case 0: return !!goal;
      case 1: return !!experience;
      case 2: return !!daysPerWeek;
      case 3: return !!equipment;
      case 4: return !!sex && !!weight && parseFloat(weight) > 0; // sex + weight required
      case 5: return true; // optional
      case 6: return true; // confirmation
      default: return false;
    }
  }, [step, goal, experience, daysPerWeek, equipment, sex, weight]);

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
      height: height ? parseFloat(height) : undefined,
      age: age ? parseInt(age, 10) : undefined,
      priorityMuscles,
      createdAt: now,
      updatedAt: now,
    };

    setUserProfile(profile);
    generateAndSetProgram();
    startProgram();
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

  // ─── Render Steps ───

  const renderStep = () => {
    switch (step) {
      case 0: return renderGoal();
      case 1: return renderExperience();
      case 2: return renderFrequency();
      case 3: return renderEquipment();
      case 4: return renderMeasurements();
      case 5: return renderPriorityMuscles();
      case 6: return renderConfirmation();
      default: return null;
    }
  };

  const renderGoal = () => (
    <OnboardingStep
      title="Ton objectif"
      subtitle="Choisis ce qui te motive le plus"
    >
      <View style={styles.cardsCol}>
        <SelectionCard
          icon={<TrendingUp size={28} color={goal === 'hypertrophy' ? '#0C0C0C' : '#FF6B35'} />}
          title="Hypertrophie"
          subtitle="Prendre du muscle, augmenter le volume"
          selected={goal === 'hypertrophy'}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGoal('hypertrophy'); }}
        />
        <SelectionCard
          icon={<Zap size={28} color={goal === 'strength' ? '#0C0C0C' : '#FF6B35'} />}
          title="Force"
          subtitle="Devenir plus fort, soulever plus lourd"
          selected={goal === 'strength'}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGoal('strength'); }}
        />
        <SelectionCard
          icon={<Repeat size={28} color={goal === 'recomposition' ? '#0C0C0C' : '#FF6B35'} />}
          title="Recomposition"
          subtitle="Perdre du gras, maintenir le muscle"
          selected={goal === 'recomposition'}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGoal('recomposition'); }}
        />
      </View>
    </OnboardingStep>
  );

  const renderExperience = () => (
    <OnboardingStep
      title="Ton experience"
      subtitle="Cela influence le volume et la complexite du programme"
    >
      <View style={styles.cardsCol}>
        <SelectionCard
          title="Debutant"
          subtitle="Moins de 1 an d'entrainement regulier"
          selected={experience === 'beginner'}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setExperience('beginner'); }}
        />
        <SelectionCard
          title="Intermediaire"
          subtitle="1 a 3 ans d'entrainement structure"
          selected={experience === 'intermediate'}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setExperience('intermediate'); }}
        />
        <SelectionCard
          title="Avance"
          subtitle="Plus de 3 ans, maitrise des mouvements"
          selected={experience === 'advanced'}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setExperience('advanced'); }}
        />
      </View>
    </OnboardingStep>
  );

  const renderFrequency = () => (
    <OnboardingStep
      title="Frequence"
      subtitle="Combien de jours par semaine peux-tu t'entrainer ?"
    >
      <View style={styles.pillRow}>
        {([3, 4, 5, 6] as const).map((d) => (
          <Pressable
            key={d}
            style={[styles.pill, daysPerWeek === d && styles.pillSelected]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDaysPerWeek(d); }}
          >
            <Text style={[styles.pillText, daysPerWeek === d && styles.pillTextSelected]}>
              {d} jours
            </Text>
          </Pressable>
        ))}
      </View>
      {daysPerWeek && (
        <View style={styles.splitPreview}>
          <Text style={styles.splitLabel}>
            {daysPerWeek === 3 && 'Full Body — 3 seances completes'}
            {daysPerWeek === 4 && 'Upper/Lower — 2 haut + 2 bas'}
            {daysPerWeek === 5 && 'Upper/Lower+ — 4 seances + 1 pump'}
            {daysPerWeek === 6 && 'Push/Pull/Legs — 6 seances specialisees'}
          </Text>
        </View>
      )}
    </OnboardingStep>
  );

  const renderEquipment = () => (
    <OnboardingStep
      title="Ton equipement"
      subtitle="On adapte les exercices a ton setup"
    >
      <View style={styles.cardsCol}>
        <SelectionCard
          icon={<Dumbbell size={28} color={equipment === 'full_gym' ? '#0C0C0C' : '#FF6B35'} />}
          title="Salle complete"
          subtitle="Barres, halteres, cables, machines"
          selected={equipment === 'full_gym'}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEquipment('full_gym'); }}
        />
        <SelectionCard
          icon={<Home size={28} color={equipment === 'home_dumbbell' ? '#0C0C0C' : '#FF6B35'} />}
          title="Home gym"
          subtitle="Halteres, elastiques, kettlebell"
          selected={equipment === 'home_dumbbell'}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEquipment('home_dumbbell'); }}
        />
        <SelectionCard
          icon={<User size={28} color={equipment === 'bodyweight' ? '#0C0C0C' : '#FF6B35'} />}
          title="Poids du corps"
          subtitle="Aucun materiel, exercices au poids du corps"
          selected={equipment === 'bodyweight'}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEquipment('bodyweight'); }}
        />
      </View>
    </OnboardingStep>
  );

  const renderMeasurements = () => (
    <OnboardingStep
      title="Ton profil"
      subtitle="Indispensable pour estimer tes charges de depart"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.inputsGrid}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Sexe *</Text>
            <View style={styles.sexToggle}>
              <Pressable
                style={[styles.sexPill, sex === 'male' && styles.sexPillSelected]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSex('male'); }}
              >
                <Text style={[styles.sexPillText, sex === 'male' && styles.sexPillTextSelected]}>
                  Homme
                </Text>
              </Pressable>
              <Pressable
                style={[styles.sexPill, sex === 'female' && styles.sexPillSelected]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSex('female'); }}
              >
                <Text style={[styles.sexPillText, sex === 'female' && styles.sexPillTextSelected]}>
                  Femme
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Poids (kg) *</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="75"
              placeholderTextColor="rgba(255,255,255,0.2)"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Taille (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              placeholder="178"
              placeholderTextColor="rgba(255,255,255,0.2)"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="25"
              placeholderTextColor="rgba(255,255,255,0.2)"
            />
          </View>
        </View>
        <Text style={styles.requiredNote}>* Champs obligatoires</Text>
      </KeyboardAvoidingView>
    </OnboardingStep>
  );

  const muscleKeys = Object.keys(MUSCLE_LABELS_FR);

  const renderPriorityMuscles = () => (
    <OnboardingStep
      title="Muscles prioritaires"
      subtitle="Choisis 0 a 2 muscles a developper en priorite"
      isOptional
      onSkip={next}
    >
      <View style={styles.muscleGrid}>
        {muscleKeys.map((key) => {
          const selected = priorityMuscles.includes(key);
          return (
            <Pressable
              key={key}
              style={[styles.musclePill, selected && styles.musclePillSelected]}
              onPress={() => toggleMuscle(key)}
            >
              <Text style={[styles.musclePillText, selected && styles.musclePillTextSelected]}>
                {MUSCLE_LABELS_FR[key]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingStep>
  );

  const goalLabels: Record<TrainingGoal, string> = {
    hypertrophy: 'Hypertrophie',
    strength: 'Force',
    recomposition: 'Recomposition',
  };
  const expLabels: Record<ExperienceLevel, string> = {
    beginner: 'Debutant',
    intermediate: 'Intermediaire',
    advanced: 'Avance',
  };
  const equipLabels: Record<EquipmentSetup, string> = {
    full_gym: 'Salle complete',
    home_dumbbell: 'Home gym',
    bodyweight: 'Poids du corps',
  };

  const renderConfirmation = () => (
    <OnboardingStep
      title="Ton programme"
      subtitle="Verifie tes parametres avant de generer"
    >
      <View style={styles.summaryCard}>
        <SummaryRow label="Objectif" value={goal ? goalLabels[goal] : '—'} />
        <SummaryRow label="Experience" value={experience ? expLabels[experience] : '—'} />
        <SummaryRow label="Frequence" value={daysPerWeek ? `${daysPerWeek} jours/sem` : '—'} />
        <SummaryRow label="Equipement" value={equipment ? equipLabels[equipment] : '—'} />
        <SummaryRow label="Sexe" value={sex === 'male' ? 'Homme' : sex === 'female' ? 'Femme' : '—'} />
        <SummaryRow label="Poids" value={weight ? `${weight} kg` : '—'} />
        {priorityMuscles.length > 0 && (
          <SummaryRow
            label="Priorites"
            value={priorityMuscles.map((m) => MUSCLE_LABELS_FR[m]).join(', ')}
          />
        )}
      </View>
      <Pressable style={styles.generateButton} onPress={handleGenerate}>
        <Sparkles size={20} color="#0C0C0C" />
        <Text style={styles.generateText}>Generer mon programme</Text>
      </Pressable>
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
            <ArrowLeft size={22} color="#fff" strokeWidth={2} />
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
                Continuer
              </Text>
              <ChevronRight size={18} color={canAdvance() ? '#0C0C0C' : 'rgba(255,255,255,0.3)'} />
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0C0C0C',
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: 'rgba(12,12,12,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
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
    fontSize: 16,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  nextTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },

  // Cards
  cardsCol: {
    gap: 12,
  },
  selCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  selCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selCardText: {
    flex: 1,
  },
  selCardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    marginBottom: 3,
  },
  selCardTitleSelected: {
    color: '#0C0C0C',
  },
  selCardSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
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
  splitPreview: {
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
  },
  splitLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
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

  // Summary
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
    gap: 14,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
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
