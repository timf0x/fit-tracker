import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  BackHandler,
  Dimensions,
  Modal,
  Image,
  LayoutAnimation,
  TextInput,
  Animated,
  PanResponder,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack, useNavigation } from 'expo-router';
import { CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import {
  Square,
  Play,
  Pause,
  SkipForward,
  ChevronsRight,
  Zap,
  Droplet,
  Coffee,
  ChevronDown,
  CircleCheck,
  Circle,
  Trophy,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Info,
  ChevronUp,
  Flame,
  Plus,
  Minus,
  X,
  ArrowLeftRight,
} from 'lucide-react-native';
import { Colors, Fonts, Spacing, GlassStyle, Header, PageLayout, IconStroke, CTAButton } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { CircularProgress } from '@/components/CircularProgress';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { useWorkoutStore } from '@/stores/workoutStore';
import { getExerciseById } from '@/data/exercises';
import {
  initAudio,
  cleanupAudio,
  announcePhase,
  announceCountdown,
  announceSetComplete,
  handleTimerTick,
  cancelPendingSpeech,
} from '@/services/audio';
import { detectPRs } from '@/lib/progressiveOverload';
import { TARGET_TO_MUSCLE } from '@/lib/muscleMapping';
import {
  computeVolumeImpact,
  computeRecoveryForecast,
  computeTrainingLoad,
  getCelebrationSubtitle,
  getFeedbackTransparency,
  getZoneLabel,
  formatReadyAt,
} from '@/lib/postSessionEngine';
import { ExerciseSwapSheet } from '@/components/program/ExerciseSwapSheet';
import { SessionFeedbackForm } from '@/components/session/SessionFeedbackForm';
import { BadgeCelebration } from '@/components/badges/BadgeCelebration';
import { useBadgeStore } from '@/stores/badgeStore';
import { useSettingsStore, formatWeight, getWeightUnitLabel } from '@/stores/settingsStore';
import { AnimatedToggle } from '@/components/ui/AnimatedToggle';
import { getExerciseName, getExerciseDescription, getExerciseInstructions, getTargetLabel, getSecondaryMusclesLabel } from '@/lib/exerciseLocale';
import type { CompletedSet, CompletedExercise, BodyPart } from '@/types';
import { DEFAULT_SET_TIME } from '@/types';
import type { SessionFeedback } from '@/types/program';

// ─── Types ───

type Phase = 'prepare' | 'exercise' | 'rest' | 'break' | 'finished';

interface SessionExercise {
  exerciseId: string;
  exerciseName: string;
  exerciseNameEn: string;
  bodyPart: BodyPart;
  sets: number;
  reps: number;
  minReps?: number;
  maxReps?: number;
  targetRir?: number;
  weight: number;
  restTime: number;
  setTime?: number; // seconds per set execution — varies by exercise
  isUnilateral: boolean;
  overloadAction?: 'bump' | 'hold' | 'drop' | 'none';
}

// ─── Constants ───

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const RING_SIZE = Math.min(Math.round(SCREEN_WIDTH * 0.75), 330);
const SHEET_HANDLE_HEIGHT = 80;

const PREPARE_DURATION = 15;
const DEFAULT_BREAK_DURATION = 120; // fallback inter-exercise break (seconds)

/** Get the set execution time for an exercise (uses exercise-specific value or default) */
const getSetDuration = (ex: SessionExercise | undefined): number =>
  ex?.setTime || DEFAULT_SET_TIME;

/** Inter-exercise break: use the next exercise's restTime (longer pause between exercises than between sets) */
const getBreakDuration = (nextEx: SessionExercise | undefined): number =>
  nextEx ? Math.max(nextEx.restTime, DEFAULT_BREAK_DURATION) : DEFAULT_BREAK_DURATION;

const PHASE_CONFIG: Record<Phase, { color: string; label: string; icon: typeof Zap }> = {
  prepare: { color: Colors.phases.prepare, label: i18n.t('workoutSession.phases.prepare'), icon: Zap },
  exercise: { color: Colors.phases.exercise, label: i18n.t('workoutSession.phases.exercise'), icon: Flame },
  rest: { color: Colors.phases.rest, label: i18n.t('workoutSession.phases.rest'), icon: Droplet },
  break: { color: Colors.phases.break, label: i18n.t('workoutSession.phases.break'), icon: Coffee },
  finished: { color: Colors.phases.finished, label: i18n.t('workoutSession.phases.finished'), icon: Trophy },
};

const BODY_PART_LABELS: Record<string, string> = {
  back: i18n.t('bodyParts.back'),
  shoulders: i18n.t('bodyParts.shoulders'),
  chest: i18n.t('bodyParts.chest'),
  'upper arms': i18n.t('bodyParts.upperArms'),
  'lower arms': i18n.t('bodyParts.forearms'),
  'upper legs': i18n.t('bodyParts.upperLegs'),
  'lower legs': i18n.t('bodyParts.lowerLegs'),
  waist: i18n.t('bodyParts.waist'),
  cardio: i18n.t('bodyParts.cardio'),
};

const EQUIPMENT_LABELS: Record<string, string> = {
  dumbbell: i18n.t('equipment.dumbbells'),
  barbell: i18n.t('equipment.barbell'),
  cable: i18n.t('equipment.cable'),
  machine: i18n.t('equipment.machine'),
  'body weight': i18n.t('equipment.bodyweight'),
  kettlebell: i18n.t('equipment.kettlebell'),
  other: i18n.t('equipment.other'),
};

// ─── Helpers ───

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// RIR color coding (teaches users through color: green=optimal zone)
const RIR_OPTIONS = [0, 1, 2, 3, 4] as const;
const RIR_COLORS: Record<number, string> = {
  0: '#EF4444', // failure — red
  1: '#FBBF24', // very hard — amber
  2: '#4ADE80', // optimal — green (RP sweet spot)
  3: '#3B82F6', // moderate — blue
  4: '#6B7280', // easy — gray (doesn't count as effective)
};
function getRirColor(rir: number): string {
  return RIR_COLORS[Math.min(4, Math.max(0, rir))] || '#6B7280';
}

// ─── Main Screen ───

export default function WorkoutSessionScreen() {
  const keepAwake = useSettingsStore((s) => s.keepScreenAwake);
  useEffect(() => {
    if (keepAwake) {
      activateKeepAwakeAsync('session');
    }
    return () => { deactivateKeepAwake('session'); };
  }, [keepAwake]);
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const store = useWorkoutStore();
  const badgeStore = useBadgeStore();
  const allowNavRef = useRef(false);
  const { workoutId, workoutName, sessionId: sessionIdParam, exercises: exercisesParam } = useLocalSearchParams<{
    workoutId: string;
    workoutName: string;
    sessionId?: string;
    exercises: string;
  }>();

  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>(() => {
    try {
      return JSON.parse(exercisesParam || '[]');
    } catch {
      return [];
    }
  });

  // ─── Core State ───
  const [phase, setPhase] = useState<Phase>('prepare');
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(PREPARE_DURATION);
  const [totalTime, setTotalTime] = useState(PREPARE_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showExerciseInfo, setShowExerciseInfo] = useState(false);
  const [infoTab, setInfoTab] = useState<'about' | 'guide'>('about');
  const [completedSets, setCompletedSets] = useState<Record<number, CompletedSet[]>>({});
  const sfxEnabled = useSettingsStore((s) => s.soundEnabled);
  const setSfxEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const voiceEnabled = useSettingsStore((s) => s.voiceEnabled);
  const setVoiceEnabled = useSettingsStore((s) => s.setVoiceEnabled);
  const volume = useSettingsStore((s) => s.soundVolume);
  const setVolume = useSettingsStore((s) => s.setSoundVolume);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const sliderWidthRef = useRef(0);
  const volumeRef = useRef(useSettingsStore.getState().soundVolume);

  const volumeSliderPan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const ratio = Math.max(0.05, Math.min(1, e.nativeEvent.locationX / sliderWidthRef.current));
      volumeRef.current = ratio;
      setVolume(ratio);
    },
    onPanResponderMove: (e) => {
      const ratio = Math.max(0.05, Math.min(1, e.nativeEvent.locationX / sliderWidthRef.current));
      volumeRef.current = ratio;
      setVolume(ratio);
    },
    onPanResponderRelease: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  }), []);

  // ─── Exercise Swap ───
  const [showSwap, setShowSwap] = useState<{ index: number; exerciseId: string } | null>(null);

  const inferredAllowedEquipment = useMemo(() => {
    const equipSet = new Set<import('@/types').Equipment>(['body weight']);
    for (const ex of sessionExercises) {
      const full = getExerciseById(ex.exerciseId);
      if (full) equipSet.add(full.equipment);
    }
    // Also include equipment from the same tier to offer broader swap options
    const types = Array.from(equipSet);
    const hasGym = types.some((e) =>
      ['barbell', 'cable', 'machine', 'smith machine', 'trap bar'].includes(e)
    );
    if (hasGym) {
      ['barbell', 'dumbbell', 'cable', 'machine', 'kettlebell', 'resistance band', 'ez bar', 'smith machine', 'trap bar'].forEach(
        (e) => equipSet.add(e as import('@/types').Equipment)
      );
    } else {
      const hasDumbbell = types.some((e) => ['dumbbell', 'kettlebell'].includes(e));
      if (hasDumbbell) {
        ['dumbbell', 'resistance band', 'kettlebell'].forEach(
          (e) => equipSet.add(e as import('@/types').Equipment)
        );
      } else {
        equipSet.add('resistance band');
      }
    }
    return Array.from(equipSet);
  }, [sessionExercises]);

  const swapMuscleTargets = useMemo(() => {
    if (!showSwap) return [];
    const full = getExerciseById(showSwap.exerciseId);
    if (!full) return [];
    const muscle = TARGET_TO_MUSCLE[full.target] || full.bodyPart;
    return [muscle];
  }, [showSwap]);

  const handleSessionSwap = useCallback((newExerciseId: string) => {
    if (!showSwap) return;
    const newEx = getExerciseById(newExerciseId);
    if (!newEx) return;

    const swapIdx = showSwap.index;
    setSessionExercises((prev) => {
      const updated = [...prev];
      const old = updated[swapIdx];
      updated[swapIdx] = {
        ...old,
        exerciseId: newEx.id,
        exerciseName: newEx.nameFr,
        exerciseNameEn: newEx.name,
        bodyPart: newEx.bodyPart as BodyPart,
        isUnilateral: newEx.isUnilateral,
      };
      return updated;
    });

    // Clear completed sets for the swapped exercise
    setCompletedSets((prev) => {
      const updated = { ...prev };
      delete updated[swapIdx];
      return updated;
    });

    setShowSwap(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [showSwap]);

  const [expandedExercises, setExpandedExercises] = useState<Record<number, boolean>>({});
  const [currentSide, setCurrentSide] = useState<'right' | 'left' | null>(null);
  const [timerKey, setTimerKey] = useState(0);

  // ─── Post-Session Feedback ───
  const [sessionFeedback, setSessionFeedback] = useState<SessionFeedback>({
    pump: 2,
    soreness: 1,
    performance: 2,
    jointPain: false,
  });
  const [reviewExpanded, setReviewExpanded] = useState(false);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);
  const [celebrationBadgeIds, setCelebrationBadgeIds] = useState<string[]>([]);

  // ─── Sheet (exercise list bottom drawer) ───
  const sheetClosedY = SCREEN_HEIGHT - SHEET_HANDLE_HEIGHT - insets.bottom;
  const sheetOpenY = insets.top + 8;
  const sheetY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const sheetOpenRef = useRef(false);
  const sheetLastY = useRef(SCREEN_HEIGHT);

  // Session tracking
  const sessionIdRef = useRef<string>('');
  const sessionStartRef = useRef<number>(Date.now());
  const phaseStartedAtRef = useRef<number>(Date.now());
  const pauseAccumulatedRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);
  const hapticFiredRef = useRef(false);
  const handlePhaseCompleteRef = useRef<() => void>(() => {});
  const pendingNavRef = useRef(false);

  const currentExercise = sessionExercises[exerciseIndex];
  const totalExercises = sessionExercises.length;

  // Exercise info for the info button
  const infoExercise = useMemo(() => {
    if (!currentExercise) return null;
    return getExerciseById(currentExercise.exerciseId);
  }, [currentExercise]);

  // ─── Start session on mount ───
  useEffect(() => {
    initAudio().then(() => {
      // Apply persisted audio settings to cached sounds after they're loaded
      useSettingsStore.getState().applyAudioSettings();
    });
    if (workoutId && workoutName) {
      // If a sessionId was passed (e.g. from program day), reuse it instead of creating a new one
      if (sessionIdParam) {
        sessionIdRef.current = sessionIdParam;
      } else {
        sessionIdRef.current = store.startSession(workoutId, workoutName);
      }
      sessionStartRef.current = Date.now();
    }
    // Announce first prepare phase (delay lets TTS warm-up finish)
    const t = setTimeout(() => {
      const firstEx = sessionExercises[0];
      if (firstEx) {
        announcePhase('prepare', firstEx.exerciseName, undefined, {
          sets: firstEx.sets, reps: firstEx.reps, weight: firstEx.weight,
        });
      }
    }, 600);
    return () => { clearTimeout(t); cleanupAudio(); };
  }, []);

  // Audio settings are synced via settingsStore setters (no manual sync needed)

  // ─── Block ALL back navigation (gesture, hardware, swipe) ───
  // Only allow when explicitly flagged via allowNavRef
  const closeSheetRef = useRef<() => void>(() => {});
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheetOpenRef.current) {
        closeSheetRef.current();
      }
      return true; // Always block
    });
    return () => handler.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (allowNavRef.current) return; // Explicitly allowed — let it through
      e.preventDefault(); // Block gesture / programmatic back
    });
    return unsubscribe;
  }, [navigation]);

  // ─── Keep sheet position in sync with insets ───
  useEffect(() => {
    if (!sheetOpenRef.current) {
      sheetY.setValue(sheetClosedY);
      sheetLastY.current = sheetClosedY;
    }
  }, [sheetClosedY]);

  // ─── Timer Logic (wall-clock based) ───
  const lastTickRef = useRef<number>(-1);

  useEffect(() => {
    if (phase === 'finished' || isPaused) return;

    phaseStartedAtRef.current = Date.now();
    pauseAccumulatedRef.current = 0;
    hapticFiredRef.current = false;
    lastTickRef.current = -1;

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - phaseStartedAtRef.current - pauseAccumulatedRef.current) / 1000
      );
      const remaining = Math.max(0, totalTime - elapsed);
      setTimeRemaining(remaining);

      // Audio: tick/countdown (fire once per second)
      if (remaining !== lastTickRef.current && remaining > 0) {
        lastTickRef.current = remaining;
        if (remaining <= 3) {
          announceCountdown(remaining);
        } else {
          handleTimerTick(remaining, phase);
        }
      }

      if (remaining <= 3 && remaining > 0 && !hapticFiredRef.current) {
        hapticFiredRef.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      if (remaining <= 0) {
        clearInterval(interval);
        handlePhaseCompleteRef.current();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phase, totalTime, isPaused, timerKey]);

  // Track pause duration
  useEffect(() => {
    if (isPaused) {
      pauseStartRef.current = Date.now();
    } else if (pauseStartRef.current) {
      pauseAccumulatedRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
  }, [isPaused]);

  // ─── Phase Transitions ───

  const finishWorkout = useCallback(() => {
    setPhase('finished');
    announcePhase('finished');
    // Badge celebration is handled in handleFinish() — after session data is saved
  }, []);

  const handlePhaseComplete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (phase === 'prepare') {
      const ex = sessionExercises[exerciseIndex];
      const isUni = ex?.isUnilateral;
      const duration = getSetDuration(ex);
      setCurrentSide(isUni ? 'right' : null);
      setPhase('exercise');
      setTotalTime(duration);
      setTimeRemaining(duration);
      announcePhase(isUni ? 'exercise-right' : 'exercise', ex?.exerciseName);
    } else if (phase === 'exercise') {
      const ex = sessionExercises[exerciseIndex];
      if (!ex) return;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const newSet: CompletedSet = {
        reps: ex.reps,
        weight: ex.weight,
        completed: true,
        rir: ex.targetRir ?? 2,
        ...(currentSide ? { side: currentSide } : {}),
      };
      setCompletedSets((prev) => ({
        ...prev,
        [exerciseIndex]: [...(prev[exerciseIndex] || []), newSet],
      }));

      announceSetComplete();

      // Unilateral: right side done → switch to left, restart timer, no rest
      if (ex.isUnilateral && currentSide === 'right') {
        setCurrentSide('left');
        setTimerKey((k) => k + 1);
        announcePhase('exercise-left');
        return;
      }

      // Normal advance (bilateral, or unilateral left side done)
      const nextSetIdx = setIndex + 1;
      if (nextSetIdx < ex.sets) {
        setSetIndex(nextSetIdx);
        setPhase('rest');
        setTotalTime(ex.restTime);
        setTimeRemaining(ex.restTime);
        announcePhase('rest');
      } else {
        const nextExIdx = exerciseIndex + 1;
        if (nextExIdx < totalExercises) {
          const nextEx = sessionExercises[nextExIdx];
          const breakTime = getBreakDuration(nextEx);
          setPhase('break');
          setTotalTime(breakTime);
          setTimeRemaining(breakTime);
          announcePhase('break', undefined, nextEx?.exerciseName);
        } else {
          finishWorkout();
        }
      }
    } else if (phase === 'rest') {
      const ex = sessionExercises[exerciseIndex];
      const isUni = ex?.isUnilateral;
      const duration = getSetDuration(ex);
      setCurrentSide(isUni ? 'right' : null);
      setPhase('exercise');
      setTotalTime(duration);
      setTimeRemaining(duration);
      announcePhase(isUni ? 'exercise-right' : 'exercise', ex?.exerciseName);
    } else if (phase === 'break') {
      const nextIdx = exerciseIndex + 1;
      if (nextIdx < totalExercises) {
        const nextEx = sessionExercises[nextIdx];
        setExerciseIndex(nextIdx);
        setSetIndex(0);
        setPhase('prepare');
        setTotalTime(PREPARE_DURATION);
        setTimeRemaining(PREPARE_DURATION);
        announcePhase('prepare', nextEx?.exerciseName, undefined, {
          sets: nextEx?.sets, reps: nextEx?.reps, weight: nextEx?.weight,
        });
      } else {
        finishWorkout();
      }
    }
  }, [phase, exerciseIndex, setIndex, totalExercises, sessionExercises, currentSide, finishWorkout]);

  handlePhaseCompleteRef.current = handlePhaseComplete;

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handlePhaseComplete();
  }, [handlePhaseComplete]);

  // ─── Double Skip (skip entire exercise) ───
  const [doubleSkipVisible, setDoubleSkipVisible] = useState(false);
  const [doubleSkipActive, setDoubleSkipActive] = useState(false);
  const doubleSkipBtnRef = useRef<View>(null);
  const doubleSkipLayoutRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doubleSkipVisibleRef = useRef(false);
  const doubleSkipWasOverRef = useRef(false);
  const skipPressStartRef = useRef(0);
  const doubleSkipAnim = useRef(new Animated.Value(0)).current;

  const handleDoubleSkip = useCallback(() => {
    if (phase === 'finished') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    cancelPendingSpeech();

    const nextExIdx = exerciseIndex + 1;
    if (nextExIdx < totalExercises) {
      setExerciseIndex(nextExIdx);
      setSetIndex(0);
      setCurrentSide(null);
      setPhase('prepare');
      setTotalTime(PREPARE_DURATION);
      setTimeRemaining(PREPARE_DURATION);
    } else {
      finishWorkout();
    }
  }, [phase, exerciseIndex, totalExercises, finishWorkout]);

  const handleDoubleSkipRef = useRef(handleDoubleSkip);
  handleDoubleSkipRef.current = handleDoubleSkip;
  const handleSkipRef = useRef(handleSkip);
  handleSkipRef.current = handleSkip;

  const skipPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      skipPressStartRef.current = Date.now();
      longPressTimerRef.current = setTimeout(() => {
        doubleSkipVisibleRef.current = true;
        doubleSkipAnim.setValue(0);
        setDoubleSkipVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Animated.spring(doubleSkipAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 12,
          stiffness: 280,
          mass: 0.8,
        }).start(() => {
          doubleSkipBtnRef.current?.measureInWindow((x, y, w, h) => {
            doubleSkipLayoutRef.current = { x, y, w, h };
          });
        });
      }, 400);
    },
    onPanResponderMove: (_, g) => {
      if (!doubleSkipVisibleRef.current) {
        if (Math.abs(g.dx) > 15 || Math.abs(g.dy) > 15) {
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        }
        return;
      }
      const { x, y, w, h } = doubleSkipLayoutRef.current;
      const isOver = g.moveX >= x - 10 && g.moveX <= x + w + 10 && g.moveY >= y - 10 && g.moveY <= y + h + 10;
      if (isOver && !doubleSkipWasOverRef.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      doubleSkipWasOverRef.current = isOver;
      setDoubleSkipActive(isOver);
    },
    onPanResponderRelease: (_, g) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (doubleSkipVisibleRef.current) {
        const { x, y, w, h } = doubleSkipLayoutRef.current;
        const isOver = g.moveX >= x - 10 && g.moveX <= x + w + 10 && g.moveY >= y - 10 && g.moveY <= y + h + 10;
        if (isOver) {
          handleDoubleSkipRef.current();
        }
        doubleSkipVisibleRef.current = false;
        doubleSkipWasOverRef.current = false;
        setDoubleSkipVisible(false);
        setDoubleSkipActive(false);
      } else if (Date.now() - skipPressStartRef.current < 300) {
        handleSkipRef.current();
      }
    },
    onPanResponderTerminate: () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      doubleSkipVisibleRef.current = false;
      doubleSkipWasOverRef.current = false;
      setDoubleSkipVisible(false);
      setDoubleSkipActive(false);
    },
  }), []);

  const handleTogglePause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPaused((prev) => !prev);
  }, []);

  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const handleStop = useCallback(() => {
    setIsPaused(true);
    setShowStopConfirm(true);
  }, []);

  const navigateHome = useCallback(() => {
    cleanupAudio();
    allowNavRef.current = true;
    // Reset the root navigator to just (tabs) — dismisses all nested modals cleanly
    const rootNav = navigation.getParent();
    if (rootNav) {
      rootNav.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: '(tabs)' }],
        }),
      );
    } else {
      router.dismissAll();
    }
  }, [navigation, router]);

  const confirmStop = useCallback(() => {
    setShowStopConfirm(false);
    const durationSeconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
    const completedExercises: CompletedExercise[] = sessionExercises.map((ex, idx) => ({
      exerciseId: ex.exerciseId,
      sets: completedSets[idx] || [],
    }));

    if (sessionIdRef.current) {
      store.endSession(sessionIdRef.current, {
        durationSeconds,
        completedExercises,
      });
    }
    navigateHome();
  }, [completedSets, sessionExercises, store, navigateHome]);

  const discardStop = useCallback(() => {
    setShowStopConfirm(false);
    if (sessionIdRef.current) {
      store.deleteSession(sessionIdRef.current);
    }
    navigateHome();
  }, [store, navigateHome]);

  const cancelStop = useCallback(() => {
    setShowStopConfirm(false);
    setIsPaused(false);
  }, []);

  const handleFinish = useCallback(() => {
    const durationSeconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
    const completedExercises: CompletedExercise[] = sessionExercises.map((ex, idx) => ({
      exerciseId: ex.exerciseId,
      sets: completedSets[idx] || [],
    }));

    if (sessionIdRef.current) {
      store.endSession(sessionIdRef.current, {
        durationSeconds,
        completedExercises,
        feedback: sessionFeedback,
      });
    }

    // Check for badges unlocked by this session (endSession triggers checkBadges synchronously)
    const newBadges = useBadgeStore.getState().lastUnlockedBadgeIds;
    if (newBadges.length > 0) {
      setCelebrationBadgeIds(newBadges);
      setShowBadgeCelebration(true);
      pendingNavRef.current = true;
      return; // Don't navigate — celebration dismissal will
    }

    navigateHome();
  }, [completedSets, sessionExercises, store, sessionFeedback, navigateHome]);

  // ─── Per-Set Editing Handlers ───

  const handleUpdateSetReps = useCallback((exIdx: number, setIdx: number, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCompletedSets((prev) => {
      const sets = [...(prev[exIdx] || [])];
      if (!sets[setIdx]) return prev;
      sets[setIdx] = { ...sets[setIdx], reps: Math.max(0, sets[setIdx].reps + delta) };
      return { ...prev, [exIdx]: sets };
    });
  }, []);

  const handleUpdateSetWeight = useCallback((exIdx: number, setIdx: number, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCompletedSets((prev) => {
      const sets = [...(prev[exIdx] || [])];
      if (!sets[setIdx]) return prev;
      sets[setIdx] = { ...sets[setIdx], weight: Math.max(0, (sets[setIdx].weight || 0) + delta) };
      return { ...prev, [exIdx]: sets };
    });
  }, []);

  const handleToggleSetCompleted = useCallback((exIdx: number, setIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCompletedSets((prev) => {
      const sets = [...(prev[exIdx] || [])];
      if (!sets[setIdx]) return prev;
      sets[setIdx] = { ...sets[setIdx], completed: !sets[setIdx].completed };
      return { ...prev, [exIdx]: sets };
    });
  }, []);

  const handleSetRepsDirectly = useCallback((exIdx: number, setIdx: number, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    setCompletedSets((prev) => {
      const sets = [...(prev[exIdx] || [])];
      if (!sets[setIdx]) return prev;
      sets[setIdx] = { ...sets[setIdx], reps: Math.max(0, num) };
      return { ...prev, [exIdx]: sets };
    });
  }, []);

  const handleSetWeightDirectly = useCallback((exIdx: number, setIdx: number, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setCompletedSets((prev) => {
      const sets = [...(prev[exIdx] || [])];
      if (!sets[setIdx]) return prev;
      sets[setIdx] = { ...sets[setIdx], weight: Math.max(0, num) };
      return { ...prev, [exIdx]: sets };
    });
  }, []);

  const handleUpdateSetRir = useCallback((exIdx: number, setIdx: number, rir: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCompletedSets((prev) => {
      const sets = [...(prev[exIdx] || [])];
      if (!sets[setIdx]) return prev;
      sets[setIdx] = { ...sets[setIdx], rir: Math.max(0, Math.min(5, rir)) };
      return { ...prev, [exIdx]: sets };
    });
  }, []);

  const toggleExerciseExpanded = useCallback((idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedExercises((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  // ─── Sheet Open / Close ───

  const openSheet = useCallback(() => {
    sheetOpenRef.current = true;
    sheetLastY.current = sheetOpenY;
    setSheetOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(sheetY, {
      toValue: sheetOpenY,
      useNativeDriver: true,
      damping: 25,
      stiffness: 300,
    }).start();
  }, [sheetOpenY, sheetY]);

  const closeSheet = useCallback(() => {
    sheetOpenRef.current = false;
    sheetLastY.current = sheetClosedY;
    setSheetOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(sheetY, {
      toValue: sheetClosedY,
      useNativeDriver: true,
      damping: 25,
      stiffness: 300,
    }).start();
  }, [sheetClosedY, sheetY]);

  closeSheetRef.current = closeSheet;

  const sheetPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
    onPanResponderMove: (_, g) => {
      const newY = Math.max(sheetOpenY, Math.min(sheetClosedY, sheetLastY.current + g.dy));
      sheetY.setValue(newY);
    },
    onPanResponderRelease: (_, g) => {
      // Tap detection (small movement = toggle)
      if (Math.abs(g.dy) < 5) {
        if (sheetOpenRef.current) {
          closeSheet();
        } else {
          openSheet();
        }
        return;
      }
      const currentY = Math.max(sheetOpenY, Math.min(sheetClosedY, sheetLastY.current + g.dy));
      const mid = (sheetOpenY + sheetClosedY) / 2;
      if (g.vy > 0.5 || (g.vy >= -0.5 && currentY > mid)) {
        closeSheet();
      } else {
        openSheet();
      }
    },
  }), [sheetOpenY, sheetClosedY, sheetY, openSheet, closeSheet]);

  // ─── Computed Values ───

  const progress = useMemo(() => {
    if (phase === 'finished') return 1;
    if (totalTime === 0) return 0;
    return timeRemaining / totalTime;
  }, [phase, timeRemaining, totalTime]);

  const phaseColor = PHASE_CONFIG[phase].color;
  const PhaseIcon = PHASE_CONFIG[phase].icon;

  const completedExerciseCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < totalExercises; i++) {
      const sets = completedSets[i] || [];
      const doneSets = sets.filter((s) => s.completed === true).length;
      const threshold = sessionExercises[i]?.isUnilateral
        ? (sessionExercises[i]?.sets || 0) * 2
        : (sessionExercises[i]?.sets || 0);
      if (doneSets >= threshold) count++;
    }
    return count;
  }, [completedSets, sessionExercises, totalExercises]);

  const totalVolume = useMemo(() => {
    let vol = 0;
    Object.values(completedSets).forEach((sets) => {
      sets.forEach((s) => {
        if (s.completed === true) {
          vol += s.reps * (s.weight || 0);
        }
      });
    });
    return vol;
  }, [completedSets]);

  const totalCompletedSetsCount = useMemo(() => {
    let count = 0;
    Object.values(completedSets).forEach((sets) => {
      sets.forEach((s) => {
        if (s.completed === true) count++;
      });
    });
    return count;
  }, [completedSets]);

  const elapsedSeconds = useMemo(() => {
    if (phase === 'finished') {
      return Math.floor((Date.now() - sessionStartRef.current) / 1000);
    }
    return 0;
  }, [phase]);

  // PR detection — compare current session against all previous history
  const sessionPRs = useMemo(() => {
    if (phase !== 'finished') return [];
    const currentExercises: CompletedExercise[] = sessionExercises.map((ex, idx) => ({
      exerciseId: ex.exerciseId,
      sets: completedSets[idx] || [],
    }));
    // Exclude the current (still-open) session from history
    const previousHistory = store.history.filter(
      (s) => s.id !== sessionIdRef.current && s.endTime
    );
    return detectPRs({ completedExercises: currentExercises }, previousHistory);
  }, [phase, completedSets, sessionExercises, store.history]);

  // Map exerciseId → exercise names for PR display
  const prExerciseNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const pr of sessionPRs) {
      const ex = getExerciseById(pr.exerciseId);
      if (ex) map[pr.exerciseId] = ex.nameFr || ex.name;
    }
    return map;
  }, [sessionPRs]);

  // ─── Post-Session Intelligence ───
  const trainingLoad = useMemo(() => {
    if (phase !== 'finished') return 0;
    return computeTrainingLoad(elapsedSeconds, completedSets);
  }, [phase, elapsedSeconds, completedSets]);

  const volumeImpact = useMemo(() => {
    if (phase !== 'finished') return [];
    const currentExercises: CompletedExercise[] = sessionExercises.map((ex, idx) => ({
      exerciseId: ex.exerciseId,
      sets: completedSets[idx] || [],
    }));
    return computeVolumeImpact(currentExercises, store.history, sessionIdRef.current);
  }, [phase, completedSets, sessionExercises, store.history]);

  const recoveryForecast = useMemo(() => {
    if (phase !== 'finished') return [];
    const currentExercises: CompletedExercise[] = sessionExercises.map((ex, idx) => ({
      exerciseId: ex.exerciseId,
      sets: completedSets[idx] || [],
    }));
    return computeRecoveryForecast(currentExercises, sessionFeedback);
  }, [phase, completedSets, sessionExercises, sessionFeedback]);

  const celebrationSubtitle = useMemo(() => {
    if (phase !== 'finished') return '';
    const ratio = totalExercises > 0 ? completedExerciseCount / totalExercises : 0;
    return getCelebrationSubtitle(ratio, sessionPRs.length);
  }, [phase, completedExerciseCount, totalExercises, sessionPRs]);

  const feedbackTransparency = useMemo(() => {
    return getFeedbackTransparency(sessionFeedback);
  }, [sessionFeedback]);

  // ═════════════════════════════════════════
  // Exercise Info Modal
  // ═════════════════════════════════════════

  const renderExerciseInfoModal = () => (
    <Modal
      visible={showExerciseInfo}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowExerciseInfo(false)}
      onDismiss={() => setShowExerciseInfo(false)}
    >
      <View style={s.infoSheet}>
          {infoExercise && (
            <>
              {/* Handle */}
              <View style={s.infoSheetHandleRow}>
                <View style={s.infoSheetHandle} />
              </View>

              {/* Header */}
              <View style={s.infoSheetHeader}>
                <Text style={s.infoSheetName}>{getExerciseName(infoExercise)}</Text>
                <Pressable style={s.infoSheetClose} onPress={() => setShowExerciseInfo(false)}>
                  <X size={20} color="rgba(160,160,170,1)" strokeWidth={IconStroke.default} />
                </Pressable>
              </View>

              {/* Exercise visual */}
              <View style={s.infoSheetVisual}>
                {infoExercise.gifUrl ? (
                  <Image
                    source={{ uri: infoExercise.gifUrl }}
                    style={s.infoSheetGif}
                    resizeMode="contain"
                  />
                ) : (
                  <ExerciseIcon
                    exerciseName={infoExercise.name}
                    bodyPart={infoExercise.bodyPart}
                    size={48}
                    containerSize={120}
                  />
                )}
              </View>

              {/* Tabs */}
              <View style={s.infoTabRow}>
                <Pressable
                  style={[s.infoTab, infoTab === 'about' && s.infoTabActive]}
                  onPress={() => setInfoTab('about')}
                >
                  <Text style={[s.infoTabText, infoTab === 'about' && s.infoTabTextActive]}>{i18n.t('workoutSession.about')}</Text>
                </Pressable>
                <Pressable
                  style={[s.infoTab, infoTab === 'guide' && s.infoTabActive]}
                  onPress={() => setInfoTab('guide')}
                >
                  <Text style={[s.infoTabText, infoTab === 'guide' && s.infoTabTextActive]}>{i18n.t('workoutSession.guide')}</Text>
                </Pressable>
              </View>

              {/* Tab content */}
              <ScrollView
                style={s.infoTabScroll}
                contentContainerStyle={s.infoTabScrollContent}
                showsVerticalScrollIndicator={false}
                bounces
              >
                {infoTab === 'about' ? (
                  <>
                    <View style={s.infoRow}>
                      <Text style={s.infoRowLabel}>{i18n.t('workoutSession.targetMuscle')}</Text>
                      <Text style={s.infoRowValue}>{getTargetLabel(infoExercise.target)}</Text>
                    </View>
                    <View style={s.infoRowDivider} />
                    <View style={s.infoRow}>
                      <Text style={s.infoRowLabel}>{i18n.t('workoutSession.muscleGroup')}</Text>
                      <Text style={s.infoRowValue}>{BODY_PART_LABELS[infoExercise.bodyPart] || infoExercise.bodyPart}</Text>
                    </View>
                    <View style={s.infoRowDivider} />
                    <View style={s.infoRow}>
                      <Text style={s.infoRowLabel}>{i18n.t('workoutSession.equipmentLabel')}</Text>
                      <Text style={s.infoRowValue}>{EQUIPMENT_LABELS[infoExercise.equipment] || infoExercise.equipment}</Text>
                    </View>
                    <View style={s.infoRowDivider} />
                    <View style={s.infoRow}>
                      <Text style={s.infoRowLabel}>{i18n.t('workoutSession.type')}</Text>
                      <Text style={s.infoRowValue}>{infoExercise.isUnilateral ? i18n.t('workoutSession.unilateral') : i18n.t('workoutSession.bilateral')}</Text>
                    </View>
                    {infoExercise.secondaryMuscles && infoExercise.secondaryMuscles.length > 0 && (
                      <>
                        <View style={s.infoRowDivider} />
                        <View style={s.infoRow}>
                          <Text style={s.infoRowLabel}>{i18n.t('workoutSession.secondaryMuscles')}</Text>
                          <Text style={s.infoRowValue}>{getSecondaryMusclesLabel(infoExercise.secondaryMuscles)}</Text>
                        </View>
                      </>
                    )}
                    {getExerciseDescription(infoExercise) ? (
                      <View style={s.infoTipCard}>
                        <Text style={s.infoTipLabel}>{i18n.t('workoutSession.formTips')}</Text>
                        <Text style={s.infoTipText}>{getExerciseDescription(infoExercise)}</Text>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <>
                    {getExerciseInstructions(infoExercise).map((step: string, i: number) => (
                      <View key={i} style={s.guideStep}>
                        <View style={s.guideStepNumber}>
                          <Text style={s.guideStepNumberText}>{i + 1}</Text>
                        </View>
                        <Text style={s.guideStepText}>{step}</Text>
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
            </>
          )}
        </View>
    </Modal>
  );

  // ═════════════════════════════════════════
  // Finished Screen
  // ═════════════════════════════════════════

  if (phase === 'finished') {
    return (
      <View style={[s.screen, { paddingTop: insets.top + 16 }]}>
        <Stack.Screen options={{ gestureEnabled: false, presentation: 'fullScreenModal' }} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Header ─── */}
          <View style={s.finishedHeader}>
            <View style={s.finishedBadge}>
              <Trophy size={14} color={Colors.phases.finished} strokeWidth={IconStroke.emphasis} />
              <Text style={s.finishedBadgeText}>{i18n.t('workoutSession.finishedBadge')}</Text>
            </View>
            <Text style={s.finishedTitle}>{i18n.t('workoutSession.finishedTitle')}</Text>
            <Text style={s.finishedSubtitle}>{celebrationSubtitle}</Text>
          </View>

          {/* ─── Summary Card (4 metrics) ─── */}
          <View style={s.summaryCard}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>{i18n.t('workoutSession.duration')}</Text>
              <Text style={s.summaryValue}>{formatTimer(elapsedSeconds)}</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>{i18n.t('workoutSession.completedSets')}</Text>
              <Text style={s.summaryValue}>{totalCompletedSetsCount}</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>{i18n.t('workoutSession.totalVolume')}</Text>
              <Text style={s.summaryValue}>{totalVolume.toLocaleString()} {getWeightUnitLabel()}</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>{i18n.t('workoutSession.trainingLoad')}</Text>
              <Text style={s.summaryValue}>{trainingLoad} {i18n.t('workoutSession.trainingLoadUnit')}</Text>
            </View>
          </View>

          {/* ─── Personal Records ─── */}
          {sessionPRs.length > 0 && (
            <View style={s.prSection}>
              <View style={s.prHeader}>
                <View style={s.prIconCircle}>
                  <Zap size={14} color="#FBBF24" strokeWidth={IconStroke.emphasis} />
                </View>
                <Text style={s.prTitle}>{i18n.t('workoutSession.personalRecords')}</Text>
              </View>
              {sessionPRs.map((pr, idx) => {
                const exName = prExerciseNames[pr.exerciseId] || pr.exerciseId;
                const typeLabel = pr.type === 'weight'
                  ? i18n.t('workoutSession.prWeight')
                  : pr.type === 'reps'
                    ? i18n.t('workoutSession.prReps')
                    : i18n.t('workoutSession.prVolume');
                const isNew = pr.previousValue === 0;
                return (
                  <View key={`${pr.exerciseId}-${pr.type}-${idx}`} style={s.prCard}>
                    <View style={s.prCardLeft}>
                      <Text style={s.prExerciseName} numberOfLines={1}>
                        {exName}
                      </Text>
                      <Text style={s.prType}>{typeLabel}</Text>
                    </View>
                    <View style={s.prCardRight}>
                      <Text style={s.prValue}>{pr.label}</Text>
                      {!isNew && pr.previousValue > 0 && (
                        <Text style={s.prPrevious}>
                          {i18n.t('workoutSession.prBefore')}: {pr.type === 'reps' ? `${pr.previousValue} reps` : `${pr.previousValue} kg`}
                        </Text>
                      )}
                      {isNew && (
                        <View style={s.prNewBadge}>
                          <Text style={s.prNewText}>{i18n.t('workoutSession.prNew')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ─── Volume Impact ─── */}
          {volumeImpact.length > 0 && (
            <View style={s.volumeImpactSection}>
              <Text style={s.reviewSectionTitle}>{i18n.t('workoutSession.volumeImpact')}</Text>
              {volumeImpact.map((vi) => {
                const barWidth = vi.landmarks.mrv > 0
                  ? Math.min(100, (vi.setsAfter / vi.landmarks.mrv) * 100)
                  : 0;
                return (
                  <View key={vi.muscle} style={s.volumeImpactRow}>
                    <View style={s.volumeImpactHeader}>
                      <Text style={s.volumeImpactMuscle}>{vi.muscleLabel}</Text>
                      <View style={s.volumeImpactRight}>
                        <Text style={s.volumeImpactSets}>{vi.setsAfter}/{vi.landmarks.mrv}</Text>
                        <View style={[s.volumeImpactZoneDot, { backgroundColor: vi.zoneColor }]} />
                        <Text style={[s.volumeImpactZone, { color: vi.zoneColor }]}>
                          {getZoneLabel(vi.zoneAfter)}
                        </Text>
                      </View>
                    </View>
                    <View style={s.volumeImpactBarBg}>
                      <View
                        style={[
                          s.volumeImpactBarFill,
                          { width: `${barWidth}%`, backgroundColor: vi.zoneColor },
                        ]}
                      />
                    </View>
                    <Text style={s.volumeImpactAdded}>
                      {i18n.t('workoutSession.setsAdded', { count: vi.setsAdded })}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ─── Recovery Forecast ─── */}
          {recoveryForecast.length > 0 && (
            <View style={s.recoverySection}>
              <Text style={s.reviewSectionTitle}>{i18n.t('workoutSession.recoveryForecast')}</Text>
              {recoveryForecast.map((rf) => (
                <View key={rf.muscle} style={s.recoveryRow}>
                  <Text style={s.recoveryMuscle}>{rf.muscleLabel}</Text>
                  <Text style={s.recoveryHours}>
                    {i18n.t('workoutSession.recoveryHours', { hours: rf.hours })}
                  </Text>
                  <Text style={s.recoveryReadyAt}>{formatReadyAt(rf.readyAt)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ─── Post-Session Feedback ─── */}
          <View style={s.feedbackSection}>
            <SessionFeedbackForm
              value={sessionFeedback}
              onChange={setSessionFeedback}
            />
            {/* Transparency nudge */}
            <View style={s.transparencyRow}>
              <View style={[s.transparencyAccent, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
              <Text style={s.transparencyText}>{feedbackTransparency}</Text>
            </View>
          </View>

          {/* ─── Collapsible Exercise Review ─── */}
          <Pressable
            style={s.reviewToggleHeader}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setReviewExpanded(!reviewExpanded);
            }}
          >
            <Text style={s.reviewSectionTitle}>{i18n.t('workoutSession.exerciseDetailToggle')}</Text>
            <View style={[s.expandChevron, reviewExpanded && s.expandChevronOpen]}>
              <ChevronDown size={16} color="rgba(255,255,255,0.35)" strokeWidth={IconStroke.emphasis} />
            </View>
          </Pressable>

          {reviewExpanded && sessionExercises.map((ex, idx) => {
            const loggedSets = completedSets[idx] || [];
            const completedCount = loggedSets.filter((ss) => ss.completed === true).length;
            const totalSetsNeeded = ex.isUnilateral ? ex.sets * 2 : ex.sets;
            const isCompleted = completedCount >= totalSetsNeeded;
            const isExpanded = expandedExercises[idx] ?? false;
            const isBodyweight = ex.weight === 0;

            return (
              <View
                key={ex.exerciseId + idx}
                style={[s.reviewCard, isCompleted && s.reviewCardDone]}
              >
                <Pressable style={s.reviewCardTop} onPress={() => toggleExerciseExpanded(idx)}>
                  <ExerciseIcon
                    exerciseName={ex.exerciseNameEn}
                    bodyPart={ex.bodyPart}
                    size={18}
                    containerSize={42}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={s.reviewCardName} numberOfLines={1}>{ex.exerciseName}</Text>
                      {ex.isUnilateral && (
                        <View style={s.uniTag}>
                          <Text style={s.uniTagText}>{i18n.t('workoutSession.uniTag')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.reviewCardDetail}>
                      {completedCount}/{totalSetsNeeded} {i18n.t('common.sets')} · {ex.minReps && ex.minReps !== (ex.maxReps || ex.reps) ? `${ex.minReps}-${ex.maxReps}` : ex.maxReps || ex.reps} {i18n.t('common.reps')}{ex.weight > 0 ? ` · ${ex.weight} ${getWeightUnitLabel()}` : ''}
                    </Text>
                  </View>
                  <View style={[s.expandChevron, isExpanded && s.expandChevronOpen]}>
                    <ChevronDown size={16} color="rgba(255,255,255,0.35)" strokeWidth={IconStroke.emphasis} />
                  </View>
                </Pressable>

                {isExpanded && loggedSets.length > 0 && (
                  <View style={s.reviewSetRows}>
                    {loggedSets.map((loggedSet, setIdx) => {
                      const isSetDone = loggedSet.completed === true;

                      let setLabel: string;
                      if (ex.isUnilateral) {
                        const setNum = Math.floor(setIdx / 2) + 1;
                        const sideSuffix = setIdx % 2 === 0 ? i18n.t('workoutSession.rightAbbr') : i18n.t('workoutSession.leftAbbr');
                        setLabel = `${setNum}${sideSuffix}`;
                      } else {
                        setLabel = String(setIdx + 1);
                      }

                      const reviewRir = loggedSet.rir ?? 2;

                      return (
                        <View key={setIdx} style={s.reviewSetRowReadonly}>
                          <View style={[
                            s.setNumber,
                            isSetDone && { backgroundColor: 'rgba(74,222,128,0.12)' },
                          ]}>
                            <Text style={[
                              s.setNumberText,
                              isSetDone && { color: Colors.phases.finished },
                            ]}>
                              {setLabel}
                            </Text>
                          </View>

                          <Text style={s.reviewSetValue}>
                            {loggedSet.reps} {i18n.t('common.reps')}
                          </Text>

                          {!isBodyweight && (
                            <Text style={s.reviewSetValue}>
                              {loggedSet.weight ?? 0} {getWeightUnitLabel()}
                            </Text>
                          )}

                          {isSetDone && (
                            <Text style={[s.reviewSetRir, { color: getRirColor(reviewRir) }]}>
                              RIR {reviewRir === 4 ? '4+' : reviewRir}
                            </Text>
                          )}

                          {isSetDone ? (
                            <CircleCheck size={20} color={Colors.phases.finished} strokeWidth={IconStroke.default} />
                          ) : (
                            <Circle size={20} color="rgba(239,68,68,0.5)" strokeWidth={1.5} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* ─── Pinned Bottom Button ─── */}
        <View style={[s.finishedBottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <Pressable style={s.finishButton} onPress={handleFinish}>
            <Text style={s.finishButtonText}>{i18n.t('workoutSession.finish')}</Text>
          </Pressable>
        </View>

        {/* Badge Celebration Overlay */}
        <BadgeCelebration
          badgeIds={celebrationBadgeIds}
          visible={showBadgeCelebration}
          onDismiss={() => {
            setShowBadgeCelebration(false);
            badgeStore.clearLastUnlocked();
            if (pendingNavRef.current) {
              pendingNavRef.current = false;
              navigateHome();
            }
          }}
        />
      </View>
    );
  }

  // ═════════════════════════════════════════
  // Active Session Screen
  // ═════════════════════════════════════════

  return (
    <View style={[s.screen, { paddingTop: insets.top + 12 }]}>
      <Stack.Screen options={{ gestureEnabled: false, presentation: 'fullScreenModal' }} />
      {/* ─── Header Bar ─── */}
      <View style={s.header}>
        <Pressable style={s.headerIconBtn} onPress={() => setShowSoundSettings(true)}>
          {sfxEnabled || voiceEnabled ? (
            <Volume2 size={20} color="rgba(255,255,255,0.55)" strokeWidth={1.8} />
          ) : (
            <VolumeX size={20} color="rgba(255,255,255,0.3)" strokeWidth={1.8} />
          )}
        </Pressable>
        <View style={s.headerPill}>
          <Text style={s.headerTitle} numberOfLines={1}>{workoutName}</Text>
        </View>
        <Pressable style={s.headerIconBtn} onPress={() => setShowExerciseInfo(true)}>
          <Info size={18} color="rgba(255,255,255,0.55)" strokeWidth={IconStroke.default} />
        </Pressable>
      </View>

      {/* ─── Main Content (flex to fill space) ─── */}
      <View style={s.mainContent}>
        {/* ─── Circular Progress Ring ─── */}
        <View style={s.ringContainer}>
          <CircularProgress
            size={RING_SIZE}
            strokeWidth={10}
            progress={progress}
            color={isPaused ? 'rgba(255,255,255,0.2)' : phaseColor}
          />
          <View style={s.ringCenter}>
            <Text style={[s.timerText, isPaused && { color: 'rgba(255,255,255,0.3)' }]}>
              {formatTimer(timeRemaining)}
            </Text>
            {/* Phase Badge — inside ring, below time */}
            <View style={[s.phaseBadge, { backgroundColor: `${phaseColor}15`, marginTop: 8 }]}>
              <PhaseIcon size={12} color={phaseColor} strokeWidth={IconStroke.emphasis} />
              <Text style={[s.phaseBadgeText, { color: phaseColor }]}>
                {isPaused ? i18n.t('workoutSession.paused') : PHASE_CONFIG[phase].label}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Exercise Info (no card) ─── */}
        {currentExercise && (
          <View style={s.exerciseInfo}>
            <Text style={s.exerciseInfoName} numberOfLines={1}>{currentExercise.exerciseName}</Text>
            <Text style={s.exerciseInfoDetail}>
              {i18n.t('workoutSession.setOf', { current: setIndex + 1, total: currentExercise.sets })}
              {currentSide ? (currentSide === 'right'
                ? (' · ' + i18n.t('workoutSession.rightSide'))
                : (' · ' + i18n.t('workoutSession.leftSide'))) : ''}
              {' · '}{currentExercise.minReps && currentExercise.minReps !== (currentExercise.maxReps || currentExercise.reps)
                ? `${currentExercise.minReps}-${currentExercise.maxReps}`
                : currentExercise.maxReps || currentExercise.reps} {i18n.t('workoutSession.repsLabel')}
              {currentExercise.weight > 0 ? ` · ${currentExercise.weight} ${i18n.t('workoutSession.kgLabel')}` : ''}
              {currentExercise.targetRir != null ? ` · ${i18n.t('workoutSession.rirLabel')} ${currentExercise.targetRir}` : ''}
            </Text>
            {currentExercise.overloadAction === 'bump' && (
              <Text style={s.overloadTip}>{i18n.t('workoutSession.overloadBump')}</Text>
            )}
            {currentExercise.overloadAction === 'drop' && (
              <Text style={[s.overloadTip, { color: '#FBBF24' }]}>{i18n.t('workoutSession.overloadDrop')}</Text>
            )}
            {/* Dot progress — 1 dot per exercise */}
            <View style={s.dotRow}>
              {sessionExercises.map((exItem, idx) => {
                const exSets = completedSets[idx] || [];
                const threshold = exItem.isUnilateral ? exItem.sets * 2 : exItem.sets;
                const exDone = exSets.filter((ss) => ss.completed === true).length >= threshold;
                const isCurrent = idx === exerciseIndex;

                return (
                  <View
                    key={idx}
                    style={[
                      s.dot,
                      exDone
                        ? { backgroundColor: Colors.phases.finished }
                        : isCurrent
                        ? { backgroundColor: Colors.primary }
                        : { backgroundColor: 'rgba(255,255,255,0.22)' },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* ─── Bottom Section (controls only) ─── */}
      <View style={[s.bottomSection, { paddingBottom: SHEET_HANDLE_HEIGHT + insets.bottom + 12 }]}>
        <View style={s.controlBar}>
          <Pressable style={s.controlBtn} onPress={handleStop}>
            <Square size={20} color={Colors.text} fill={Colors.text} strokeWidth={0} />
          </Pressable>

          <Pressable style={s.centerBtn} onPress={handleTogglePause}>
            {isPaused ? (
              <Play size={34} color="#fff" fill="#fff" strokeWidth={0} style={{ marginLeft: 4 }} />
            ) : (
              <Pause size={34} color="#fff" fill="#fff" strokeWidth={0} />
            )}
          </Pressable>

          <View style={s.skipBtnWrapper}>
            {doubleSkipVisible && (
              <Animated.View
                ref={doubleSkipBtnRef}
                style={[s.doubleSkipBtn, doubleSkipActive && s.doubleSkipBtnActive, {
                  opacity: doubleSkipAnim,
                  transform: [{
                    scale: doubleSkipAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  }, {
                    translateY: doubleSkipAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                }]}
              >
                <ChevronsRight size={20} color={doubleSkipActive ? '#fff' : Colors.text} strokeWidth={IconStroke.default} />
              </Animated.View>
            )}
            <View {...skipPanResponder.panHandlers} style={s.controlBtn}>
              <SkipForward size={24} color={Colors.text} strokeWidth={IconStroke.default} />
            </View>
          </View>
        </View>
      </View>

      {/* ─── Exercise List Sheet (draggable from bottom) ─── */}
      <Animated.View
        style={[s.sheetContainer, { height: SCREEN_HEIGHT, transform: [{ translateY: sheetY }] }]}
        pointerEvents="box-none"
      >
        {/* Handle — drag target */}
        <View {...sheetPanResponder.panHandlers} style={[s.sheetHandle, sheetOpen ? { paddingTop: insets.top + 12 } : { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.sheetDragBar} />
          <View style={s.sheetHandleRow}>
            <Text style={s.viewExercisesText}>{i18n.t('workoutSession.viewExercises')}</Text>
            <ChevronUp size={14} color="rgba(255,255,255,0.35)" strokeWidth={IconStroke.emphasis} />
          </View>
          {sheetOpen && (
            <Text style={s.listSubtitle}>
              {i18n.t('workoutSession.completedOf', { done: completedExerciseCount, total: totalExercises })}
            </Text>
          )}
        </View>

        {/* Content — only interactive when open */}
        <View style={s.sheetContent} pointerEvents={sheetOpen ? 'auto' : 'none'}>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
          >
            {sessionExercises.map((ex, idx) => {
              const loggedSets = completedSets[idx] || [];
              const completedCount = loggedSets.filter((ss) => ss.completed === true).length;
              const totalSetsNeeded = ex.isUnilateral ? ex.sets * 2 : ex.sets;
              const isCompleted = completedCount >= totalSetsNeeded;
              const isCurrent = idx === exerciseIndex;
              const isExpanded = expandedExercises[idx] ?? (isCompleted || isCurrent);
              const isBodyweight = ex.weight === 0;

              let borderColor = 'rgba(255,255,255,0.06)';
              let bgColor = 'rgba(255,255,255,0.03)';
              if (isCompleted) {
                borderColor = Colors.phases.finished;
                bgColor = 'rgba(74,222,128,0.06)';
              } else if (isCurrent) {
                borderColor = Colors.primary;
                bgColor = 'rgba(255,107,53,0.04)';
              }

              return (
                <View
                  key={ex.exerciseId + idx}
                  style={[s.listCard, { borderColor, backgroundColor: bgColor }]}
                >
                  <Pressable style={s.listCardTop} onPress={() => toggleExerciseExpanded(idx)}>
                    <ExerciseIcon
                      exerciseName={ex.exerciseNameEn}
                      bodyPart={ex.bodyPart}
                      size={20}
                      containerSize={48}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                          style={[s.listCardName, isCompleted && { color: 'rgba(255,255,255,0.5)' }]}
                          numberOfLines={1}
                        >
                          {ex.exerciseName}
                        </Text>
                        {ex.isUnilateral && (
                          <View style={s.uniTag}>
                            <Text style={s.uniTagText}>{i18n.t('workoutSession.uniTag')}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.listCardDetail}>
                        {completedCount}/{totalSetsNeeded} {i18n.t('common.sets')} · {ex.minReps && ex.minReps !== (ex.maxReps || ex.reps) ? `${ex.minReps}-${ex.maxReps}` : ex.maxReps || ex.reps} {i18n.t('common.reps')}{ex.weight > 0 ? ` · ${ex.weight} ${getWeightUnitLabel()}` : ''}
                      </Text>
                    </View>
                    {!isCompleted && (
                      <Pressable
                        style={s.swapBtn}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setShowSwap({ index: idx, exerciseId: ex.exerciseId });
                        }}
                        hitSlop={4}
                      >
                        <ArrowLeftRight size={15} color="rgba(255,255,255,0.35)" strokeWidth={IconStroke.default} />
                      </Pressable>
                    )}
                    <View style={[s.expandChevron, isExpanded && s.expandChevronOpen]}>
                      <ChevronDown size={16} color="rgba(255,255,255,0.35)" strokeWidth={IconStroke.emphasis} />
                    </View>
                  </Pressable>

                  {isExpanded && (
                    <View style={s.setRowsContainer}>
                      {Array.from({ length: totalSetsNeeded }).map((_, rowIdx) => {
                        const loggedSet = loggedSets[rowIdx];
                        const isSetCompleted = loggedSet != null;
                        const isSetDone = loggedSet?.completed === true;
                        const isCurrentSet = isCurrent && rowIdx === loggedSets.length;

                        // For unilateral: derive set number and side label (1D, 1G, 2D, 2G...)
                        let setLabel: string;
                        if (ex.isUnilateral) {
                          const setNum = Math.floor(rowIdx / 2) + 1;
                          const sideSuffix = rowIdx % 2 === 0 ? i18n.t('workoutSession.rightAbbr') : i18n.t('workoutSession.leftAbbr');
                          setLabel = `${setNum}${sideSuffix}`;
                        } else {
                          setLabel = String(rowIdx + 1);
                        }

                        let accentColor = 'rgba(255,255,255,0.12)';
                        if (isSetDone) accentColor = Colors.phases.finished;
                        else if (isSetCompleted && !isSetDone) accentColor = 'rgba(239,68,68,0.7)';
                        else if (isCurrentSet) accentColor = Colors.primary;

                        const setRir = loggedSet?.rir ?? 2;
                        const rirColor = isSetDone ? getRirColor(setRir) : 'rgba(255,255,255,0.2)';

                        return (
                          <View key={rowIdx}>
                            <View style={s.setRow}>
                              <View style={[s.setAccentBar, { backgroundColor: accentColor }]} />
                              <View style={[
                                s.setNumber,
                                isSetDone && { backgroundColor: 'rgba(74,222,128,0.12)' },
                                isCurrentSet && { backgroundColor: 'rgba(255,107,53,0.12)' },
                              ]}>
                                <Text style={[
                                  s.setNumberText,
                                  isSetDone && { color: Colors.phases.finished },
                                  isCurrentSet && { color: Colors.primary },
                                ]}>
                                  {setLabel}
                                </Text>
                              </View>

                              <View style={s.stepperGroup}>
                                <Text style={s.stepperLabel}>{i18n.t('workoutSession.repsLabel')}</Text>
                                {isSetCompleted ? (
                                  <View style={s.stepperRow}>
                                    <Pressable style={s.stepperBtn} onPress={() => handleUpdateSetReps(idx, rowIdx, -1)}>
                                      <Minus size={15} color="rgba(255,255,255,0.6)" strokeWidth={IconStroke.emphasis} />
                                    </Pressable>
                                    <TextInput
                                      style={s.stepperInput}
                                      value={String(loggedSet.reps)}
                                      onChangeText={(v) => handleSetRepsDirectly(idx, rowIdx, v)}
                                      keyboardType="number-pad"
                                      selectTextOnFocus
                                    />
                                    <Pressable style={s.stepperBtn} onPress={() => handleUpdateSetReps(idx, rowIdx, 1)}>
                                      <Plus size={15} color="rgba(255,255,255,0.6)" strokeWidth={IconStroke.emphasis} />
                                    </Pressable>
                                  </View>
                                ) : (
                                  <Text style={s.stepperValueMuted}>{ex.minReps && ex.minReps !== (ex.maxReps || ex.reps) ? `${ex.minReps}-${ex.maxReps}` : ex.maxReps || ex.reps}</Text>
                                )}
                              </View>

                              {!isBodyweight && (
                                <View style={s.stepperGroup}>
                                  <Text style={s.stepperLabel}>{i18n.t('workoutSession.kgLabel')}</Text>
                                  {isSetCompleted ? (
                                    <View style={s.stepperRow}>
                                      <Pressable style={s.stepperBtn} onPress={() => handleUpdateSetWeight(idx, rowIdx, -0.5)}>
                                        <Minus size={15} color="rgba(255,255,255,0.6)" strokeWidth={IconStroke.emphasis} />
                                      </Pressable>
                                      <TextInput
                                        style={s.stepperInput}
                                        value={String(loggedSet.weight ?? 0)}
                                        onChangeText={(v) => handleSetWeightDirectly(idx, rowIdx, v)}
                                        keyboardType="decimal-pad"
                                        selectTextOnFocus
                                      />
                                      <Pressable style={s.stepperBtn} onPress={() => handleUpdateSetWeight(idx, rowIdx, 0.5)}>
                                        <Plus size={15} color="rgba(255,255,255,0.6)" strokeWidth={IconStroke.emphasis} />
                                      </Pressable>
                                    </View>
                                  ) : (
                                    <Text style={s.stepperValueMuted}>{ex.weight}</Text>
                                  )}
                                </View>
                              )}

                              {isSetCompleted ? (
                                <Pressable style={s.checkToggle} onPress={() => handleToggleSetCompleted(idx, rowIdx)}>
                                  {isSetDone ? (
                                    <CircleCheck size={24} color={Colors.phases.finished} strokeWidth={IconStroke.default} />
                                  ) : (
                                    <Circle size={24} color="rgba(239,68,68,0.5)" strokeWidth={1.5} />
                                  )}
                                </Pressable>
                              ) : (
                                <View style={s.checkToggle}>
                                  <Circle size={24} color="rgba(255,255,255,0.12)" strokeWidth={1.5} />
                                </View>
                              )}
                            </View>

                            {/* RIR selector — only for completed sets */}
                            {isSetDone && (
                              <View style={s.rirRow}>
                                <Text style={s.rirLabel}>{i18n.t('workoutSession.rirLabel')}</Text>
                                <View style={s.rirOptions}>
                                  {RIR_OPTIONS.map((r) => {
                                    const isActive = setRir === r;
                                    const color = getRirColor(r);
                                    return (
                                      <Pressable
                                        key={r}
                                        style={[
                                          s.rirOption,
                                          isActive && { backgroundColor: `${color}20`, borderColor: `${color}50` },
                                        ]}
                                        onPress={() => handleUpdateSetRir(idx, rowIdx, r)}
                                      >
                                        <Text style={[
                                          s.rirOptionText,
                                          isActive && { color, fontFamily: Fonts?.bold, fontWeight: '700' },
                                        ]}>
                                          {r === 4 ? '4+' : String(r)}
                                        </Text>
                                      </Pressable>
                                    );
                                  })}
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>

      {renderExerciseInfoModal()}

      {/* ─── Exercise Swap Sheet ─── */}
      {showSwap && (
        <ExerciseSwapSheet
          visible={!!showSwap}
          onClose={() => setShowSwap(null)}
          currentExerciseId={showSwap.exerciseId}
          muscleTargets={swapMuscleTargets}
          allowedEquipment={inferredAllowedEquipment}
          onSwap={handleSessionSwap}
        />
      )}

      {/* ─── Stop Confirmation Modal ─── */}
      <Modal visible={showStopConfirm} transparent animationType="fade" onRequestClose={cancelStop}>
        <View style={s.stopModalOverlay}>
          <View style={s.stopModal}>
            <View style={s.stopModalIcon}>
              <Square size={22} color="#FF4B4B" fill="#FF4B4B" strokeWidth={0} />
            </View>
            <Text style={s.stopModalTitle}>{i18n.t('workoutSession.stopTitle')}</Text>
            <Text style={s.stopModalDesc}>{i18n.t('workoutSession.stopMessage')}</Text>
            <View style={s.stopModalActions}>
              <Pressable style={s.stopModalSaveBtn} onPress={confirmStop}>
                <Text style={s.stopModalSaveText}>{i18n.t('workoutSession.stopSave')}</Text>
              </Pressable>
              <Pressable style={s.stopModalDiscardBtn} onPress={discardStop}>
                <Text style={s.stopModalDiscardText}>{i18n.t('workoutSession.stopDiscard')}</Text>
              </Pressable>
              <Pressable style={s.stopModalCancelBtn} onPress={cancelStop}>
                <Text style={s.stopModalCancelText}>{i18n.t('common.continue')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Sound Settings Modal ─── */}
      <Modal visible={showSoundSettings} transparent animationType="fade" onRequestClose={() => setShowSoundSettings(false)}>
        <Pressable style={s.soundModalOverlay} onPress={() => setShowSoundSettings(false)}>
          <Pressable style={s.soundModal} onPress={() => {}}>
            {/* Header */}
            <View style={s.soundModalHeader}>
              <Text style={s.soundModalTitle}>{i18n.t('workoutSession.soundTitle')}</Text>
              <Pressable style={s.soundModalClose} onPress={() => setShowSoundSettings(false)}>
                <X size={18} color="rgba(160,160,170,1)" strokeWidth={IconStroke.default} />
              </Pressable>
            </View>

            {/* Sound Effects Toggle */}
            <View style={s.soundModalRow}>
              <View style={s.soundModalRowLeft}>
                <View style={[s.soundModalIcon, { backgroundColor: sfxEnabled ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.06)' }]}>
                  {sfxEnabled ? (
                    <Volume2 size={16} color={Colors.primary} strokeWidth={IconStroke.default} />
                  ) : (
                    <VolumeX size={16} color="rgba(255,255,255,0.3)" strokeWidth={IconStroke.default} />
                  )}
                </View>
                <View>
                  <Text style={s.soundModalRowTitle}>{i18n.t('workoutSession.soundEffects')}</Text>
                  <Text style={s.soundModalRowDesc}>{i18n.t('workoutSession.soundEffectsDesc')}</Text>
                </View>
              </View>
              <AnimatedToggle
                value={sfxEnabled}
                onValueChange={setSfxEnabled}
                activeColor={Colors.primary}
              />
            </View>

            {/* Voice Announcements Toggle */}
            <View style={s.soundModalRow}>
              <View style={s.soundModalRowLeft}>
                <View style={[s.soundModalIcon, { backgroundColor: voiceEnabled ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.06)' }]}>
                  {voiceEnabled ? (
                    <Mic size={16} color="#4A90E2" strokeWidth={IconStroke.default} />
                  ) : (
                    <MicOff size={16} color="rgba(255,255,255,0.3)" strokeWidth={IconStroke.default} />
                  )}
                </View>
                <View>
                  <Text style={s.soundModalRowTitle}>{i18n.t('workoutSession.voiceAnnouncements')}</Text>
                  <Text style={s.soundModalRowDesc}>{i18n.t('workoutSession.voiceAnnouncementsDesc')}</Text>
                </View>
              </View>
              <AnimatedToggle
                value={voiceEnabled}
                onValueChange={setVoiceEnabled}
                activeColor="#4A90E2"
              />
            </View>

            {/* Volume Divider */}
            <View style={s.soundModalDivider} />

            {/* Volume Label */}
            <View style={s.soundModalVolumeHeader}>
              <Text style={s.soundModalVolumeLabel}>{i18n.t('workoutSession.volumeLabel')}</Text>
              <Text style={s.soundModalVolumeValue}>{Math.round(volume * 100)}%</Text>
            </View>

            {/* Volume Slider */}
            <View style={s.soundModalSliderContainer}>
              <VolumeX size={14} color="rgba(255,255,255,0.25)" strokeWidth={IconStroke.default} />
              <View
                style={s.soundModalSliderTrack}
                onLayout={(e) => { sliderWidthRef.current = e.nativeEvent.layout.width; }}
                {...volumeSliderPan.panHandlers}
              >
                <View style={s.soundModalSliderBg} />
                <View style={[s.soundModalSliderFill, { width: `${volume * 100}%` }]} />
                <View style={[s.soundModalSliderThumb, { left: `${volume * 100}%` }]} />
              </View>
              <Volume2 size={14} color="rgba(255,255,255,0.25)" strokeWidth={IconStroke.default} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ═════════════════════════════════════════
// Styles
// ═════════════════════════════════════════

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ─── Header ───
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 12,
  },
  headerIconBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPill: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: PageLayout.paddingHorizontal,
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ─── Layout ───
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  bottomSection: {
    paddingBottom: 8,
    paddingHorizontal: 24,
  },

  // ─── Phase Badge (inside ring) ───
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  phaseBadgeText: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
  },

  // ─── Ring ───
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 64,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  timerSubtitle: {
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // ─── Exercise Info (no card) ───
  exerciseInfo: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  exerciseInfoName: {
    fontSize: 22,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  exerciseInfoDetail: {
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  overloadTip: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#4ADE80',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },

  // ─── Control Bar ───
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
  },
  controlBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Skip Button ───
  skipBtnWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  doubleSkipBtn: {
    position: 'absolute',
    bottom: 80,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doubleSkipBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  // ─── View Exercises Text ───
  viewExercisesText: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.5,
  },

  // ─── Exercise List Sheet ───
  sheetContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  sheetDragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetHandleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 8,
  },
  sheetContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sheetDragBarTop: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  listHeaderTitleCentered: {
    textAlign: 'center',
    fontSize: 18,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: Colors.text,
    paddingVertical: 8,
  },
  listSubtitle: {
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    marginBottom: 16,
  },
  listCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 14,
  },
  listCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  listCardName: {
    fontSize: 16,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  listCardDetail: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  uniTag: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  uniTagText: {
    fontSize: 9,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#4A90E2',
    letterSpacing: 0.5,
  },
  swapBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandChevron: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  expandChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  setRowsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  setAccentBar: {
    width: 3,
    height: 32,
    borderRadius: 1.5,
  },
  setNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setNumberText: {
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
  },
  stepperGroup: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  stepperLabel: {
    fontSize: 8,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperInput: {
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 40,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  stepperValueMuted: {
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.2)',
    minWidth: 32,
    textAlign: 'center',
  },
  checkToggle: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Exercise Info Bottom Sheet (matches [id].tsx) ───
  infoSheet: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  infoSheetHandleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  infoSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  infoSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  infoSheetName: {
    flex: 1,
    color: Colors.text,
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  infoSheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  infoSheetVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    height: 240,
    marginBottom: 16,
    overflow: 'hidden',
  },
  infoSheetGif: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  infoTabRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  infoTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  infoTabActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  infoTabText: {
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: 'rgba(120,120,130,1)',
  },
  infoTabTextActive: {
    color: Colors.text,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  infoTabScroll: {
    flex: 1,
  },
  infoTabScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoRowLabel: {
    color: 'rgba(120,120,130,1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  infoRowValue: {
    color: 'rgba(220,220,230,1)',
    fontSize: 14,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  infoRowDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  infoTipCard: {
    ...GlassStyle.card,
    padding: 18,
    gap: 8,
    marginTop: 16,
  },
  infoTipLabel: {
    color: 'rgba(120,120,130,1)',
    fontSize: 10,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  infoTipText: {
    color: 'rgba(200,200,210,1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 22,
  },
  guideStep: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  guideStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,107,53,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  guideStepNumberText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  guideStepText: {
    flex: 1,
    color: 'rgba(200,200,210,1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 22,
  },

  // ─── Finished Screen ───
  finishedHeader: {
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 20,
  },
  finishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: `${Colors.phases.finished}15`,
    marginBottom: 16,
  },
  finishedBadgeText: {
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: Colors.phases.finished,
    letterSpacing: 1.5,
  },
  finishedTitle: {
    fontSize: 22,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  finishedSubtitle: {
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: GlassStyle.card.backgroundColor,
    borderWidth: GlassStyle.card.borderWidth,
    borderColor: GlassStyle.card.borderColor,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  // PR Section
  prSection: {
    marginBottom: 24,
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  prIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(251,191,36,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prTitle: {
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FBBF24',
    letterSpacing: 1.5,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251,191,36,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.15)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  prCardLeft: {
    flex: 1,
    gap: 2,
  },
  prExerciseName: {
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: '#fff',
  },
  prType: {
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(251,191,36,0.7)',
  },
  prCardRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  prValue: {
    fontSize: 16,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FBBF24',
  },
  prPrevious: {
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.3)',
  },
  prNewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(251,191,36,0.15)',
  },
  prNewText: {
    fontSize: 9,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#FBBF24',
    letterSpacing: 1,
  },
  reviewSectionTitle: {
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 10,
  },
  reviewCardDone: {
    borderColor: 'rgba(74,222,128,0.2)',
    backgroundColor: 'rgba(74,222,128,0.04)',
  },
  reviewCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  reviewCardName: {
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: Colors.text,
    flexShrink: 1,
  },
  reviewCardDetail: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reviewSetRows: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  reviewSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  reviewSetRowReadonly: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  reviewSetValue: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  reviewSetRir: {
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  feedbackSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  // Volume Impact
  volumeImpactSection: {
    marginBottom: 24,
  },
  volumeImpactRow: {
    marginBottom: 16,
  },
  volumeImpactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  volumeImpactMuscle: {
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: Colors.text,
  },
  volumeImpactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  volumeImpactSets: {
    fontSize: 13,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: Colors.text,
  },
  volumeImpactZoneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  volumeImpactZone: {
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  volumeImpactBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  volumeImpactBarFill: {
    height: 4,
    borderRadius: 2,
  },
  volumeImpactAdded: {
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
  },
  // Recovery Forecast
  recoverySection: {
    marginBottom: 24,
  },
  recoveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  recoveryMuscle: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: Colors.text,
  },
  recoveryHours: {
    fontSize: 13,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginRight: 12,
  },
  recoveryReadyAt: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    minWidth: 100,
    textAlign: 'right',
  },
  // Transparency nudge
  transparencyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
  },
  transparencyAccent: {
    width: 3,
    minHeight: 18,
    borderRadius: 1.5,
    marginTop: 1,
  },
  transparencyText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    lineHeight: 18,
  },
  // Exercise Review Toggle
  reviewToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 8,
  },
  rirRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 38,
    paddingRight: 12,
    paddingBottom: 6,
    gap: 8,
  },
  rirLabel: {
    fontSize: 9,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1,
    width: 24,
  },
  rirOptions: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  rirOption: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rirOptionText: {
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.3)',
  },
  finishedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'rgba(5, 5, 5, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  finishButton: {
    width: '100%',
    backgroundColor: Colors.phases.finished,
    borderRadius: CTAButton.borderRadius,
    height: CTAButton.height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: 17,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: '#000',
  },

  // ─── Stop Confirmation Modal ───
  stopModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  stopModal: {
    backgroundColor: 'rgba(28,28,32,0.98)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    maxWidth: 320,
    padding: 24,
    alignItems: 'center',
  },
  stopModalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,75,75,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stopModalTitle: {
    color: Colors.text,
    fontSize: 17,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    marginBottom: 6,
  },
  stopModalDesc: {
    color: 'rgba(140,140,150,1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginBottom: 24,
    textAlign: 'center',
  },
  stopModalActions: {
    gap: 10,
    width: '100%',
  },
  stopModalSaveBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  stopModalSaveText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  stopModalDiscardBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  stopModalDiscardText: {
    color: '#FF4B4B',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  stopModalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stopModalCancelText: {
    color: 'rgba(160,160,170,1)',
    fontSize: 15,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },

  // ─── Sound Settings Modal ───
  soundModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  soundModal: {
    backgroundColor: 'rgba(28,28,32,0.98)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    maxWidth: 340,
    padding: 20,
  },
  soundModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  soundModalTitle: {
    fontSize: 17,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: Colors.text,
  },
  soundModalClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: 56,
  },
  soundModalRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  soundModalIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundModalRowTitle: {
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  soundModalRowDesc: {
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
  },
  soundModalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 14,
  },
  soundModalVolumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  soundModalVolumeLabel: {
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.2,
  },
  soundModalVolumeValue: {
    fontSize: 13,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    color: Colors.text,
  },
  soundModalSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  soundModalSliderTrack: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    position: 'relative',
  },
  soundModalSliderBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 13,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  soundModalSliderFill: {
    position: 'absolute',
    left: 0,
    top: 13,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  soundModalSliderThumb: {
    position: 'absolute',
    top: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
