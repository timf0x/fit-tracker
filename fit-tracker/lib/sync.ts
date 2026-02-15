import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useProgramStore } from '@/stores/programStore';
import { useBadgeStore } from '@/stores/badgeStore';
import { useSettingsStore } from '@/stores/settingsStore';

const SYNC_TIMESTAMPS_KEY = 'onset-sync-timestamps';
const DEBOUNCE_MS = 2500;

type StoreName = 'workout' | 'program' | 'badge' | 'settings';

// ─── Debounce timers ───
const timers: Record<string, ReturnType<typeof setTimeout>> = {};
let unsubscribers: (() => void)[] = [];

// ─── Timestamp helpers ───

async function getSyncTimestamps(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_TIMESTAMPS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function setSyncTimestamp(store: StoreName): Promise<void> {
  const timestamps = await getSyncTimestamps();
  timestamps[store] = new Date().toISOString();
  await AsyncStorage.setItem(SYNC_TIMESTAMPS_KEY, JSON.stringify(timestamps));
}

// ─── Push: local → remote ───

async function pushWorkout(userId: string): Promise<void> {
  const state = useWorkoutStore.getState();
  const data = {
    user_id: userId,
    custom_workouts: state.customWorkouts,
    history: state.history.slice(0, 500),
    stats: state.stats,
    muscle_order: state.muscleOrder,
    home_card_order: state.homeCardOrder,
  };
  const { error } = await supabase
    .from('workout_data')
    .upsert(data, { onConflict: 'user_id' });
  if (error) throw error;
  await setSyncTimestamp('workout');
}

async function pushProgram(userId: string): Promise<void> {
  const state = useProgramStore.getState();
  // Profile goes to profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      user_profile: state.userProfile ?? {},
    }, { onConflict: 'id' });
  if (profileError) throw profileError;

  // Program + active state go to program_data
  const { error } = await supabase
    .from('program_data')
    .upsert({
      user_id: userId,
      program: state.program,
      active_state: state.activeState,
    }, { onConflict: 'user_id' });
  if (error) throw error;
  await setSyncTimestamp('program');
}

async function pushBadge(userId: string): Promise<void> {
  const state = useBadgeStore.getState();
  const { error } = await supabase
    .from('badge_data')
    .upsert({
      user_id: userId,
      unlocked_badges: state.unlockedBadges,
      previous_points: state.previousPoints,
    }, { onConflict: 'user_id' });
  if (error) throw error;
  await setSyncTimestamp('badge');
}

async function pushSettings(userId: string): Promise<void> {
  const state = useSettingsStore.getState();
  const { error } = await supabase
    .from('settings')
    .upsert({
      user_id: userId,
      sound_enabled: state.soundEnabled,
      voice_enabled: state.voiceEnabled,
      sound_volume: state.soundVolume,
      weight_unit: state.weightUnit,
      language: state.language,
      keep_screen_awake: state.keepScreenAwake,
    }, { onConflict: 'user_id' });
  if (error) throw error;
  await setSyncTimestamp('settings');
}

// ─── Pull: remote → local ───

async function pullWorkout(userId: string): Promise<{ data: any; updatedAt: string | null }> {
  const { data, error } = await supabase
    .from('workout_data')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return { data, updatedAt: data?.updated_at ?? null };
}

async function pullProgram(userId: string): Promise<{ data: any; profileData: any; updatedAt: string | null }> {
  const [programRes, profileRes] = await Promise.all([
    supabase.from('program_data').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
  ]);
  if (programRes.error) throw programRes.error;
  if (profileRes.error) throw profileRes.error;
  return {
    data: programRes.data,
    profileData: profileRes.data,
    updatedAt: programRes.data?.updated_at ?? null,
  };
}

async function pullBadge(userId: string): Promise<{ data: any; updatedAt: string | null }> {
  const { data, error } = await supabase
    .from('badge_data')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return { data, updatedAt: data?.updated_at ?? null };
}

async function pullSettings(userId: string): Promise<{ data: any; updatedAt: string | null }> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return { data, updatedAt: data?.updated_at ?? null };
}

// ─── Merge strategies ───

function mergeWorkoutData(local: any, remote: any): any {
  if (!remote) return null; // No remote data, keep local
  if (!local?.history?.length && !local?.customWorkouts?.length) {
    // Local is empty → take remote wholesale
    return remote;
  }

  // UNION history by session ID, prefer version with endTime
  const localHistory: any[] = local.history || [];
  const remoteHistory: any[] = remote.history || [];
  const historyMap = new Map<string, any>();

  for (const s of localHistory) {
    historyMap.set(s.id, s);
  }
  for (const s of remoteHistory) {
    const existing = historyMap.get(s.id);
    if (!existing || (!existing.endTime && s.endTime)) {
      historyMap.set(s.id, s);
    }
  }
  const mergedHistory = Array.from(historyMap.values())
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 500);

  // UNION custom workouts by ID, prefer latest updatedAt
  const localWorkouts: any[] = local.customWorkouts || [];
  const remoteWorkouts: any[] = remote.custom_workouts || [];
  const workoutMap = new Map<string, any>();

  for (const w of localWorkouts) {
    workoutMap.set(w.id, w);
  }
  for (const w of remoteWorkouts) {
    const existing = workoutMap.get(w.id);
    if (!existing || new Date(w.updatedAt) > new Date(existing.updatedAt)) {
      workoutMap.set(w.id, w);
    }
  }

  return {
    history: mergedHistory,
    customWorkouts: Array.from(workoutMap.values()),
    stats: local.stats, // Will be recomputed
    muscleOrder: local.muscleOrder?.length ? local.muscleOrder : (remote.muscle_order || []),
    homeCardOrder: local.homeCardOrder?.length ? local.homeCardOrder : (remote.home_card_order || []),
  };
}

function mergeBadgeData(local: any, remote: any): any {
  if (!remote) return null;
  if (!Object.keys(local.unlockedBadges || {}).length) {
    return {
      unlockedBadges: remote.unlocked_badges || {},
      previousPoints: remote.previous_points || 0,
    };
  }

  // UNION badges, keep earliest unlockedAt
  const merged: Record<string, { unlockedAt: string }> = { ...(local.unlockedBadges || {}) };
  const remoteBadges = remote.unlocked_badges || {};

  for (const [id, badge] of Object.entries(remoteBadges) as [string, { unlockedAt: string }][]) {
    if (!merged[id] || new Date(badge.unlockedAt) < new Date(merged[id].unlockedAt)) {
      merged[id] = badge;
    }
  }

  return {
    unlockedBadges: merged,
    previousPoints: Math.max(local.previousPoints || 0, remote.previous_points || 0),
  };
}

// ─── Full sync on login ───

export async function syncOnLogin(userId: string): Promise<void> {
  try {
    // Pull all remote data in parallel
    const [workoutRemote, programRemote, badgeRemote, settingsRemote] = await Promise.all([
      pullWorkout(userId).catch(() => ({ data: null, updatedAt: null })),
      pullProgram(userId).catch(() => ({ data: null, profileData: null, updatedAt: null })),
      pullBadge(userId).catch(() => ({ data: null, updatedAt: null })),
      pullSettings(userId).catch(() => ({ data: null, updatedAt: null })),
    ]);

    const timestamps = await getSyncTimestamps();

    // ── Workout merge ──
    const localWorkout = {
      history: useWorkoutStore.getState().history,
      customWorkouts: useWorkoutStore.getState().customWorkouts,
      stats: useWorkoutStore.getState().stats,
      muscleOrder: useWorkoutStore.getState().muscleOrder,
      homeCardOrder: useWorkoutStore.getState().homeCardOrder,
    };
    const hasLocalWorkout = localWorkout.history.length > 0 || localWorkout.customWorkouts.length > 0;

    if (workoutRemote.data && hasLocalWorkout) {
      // Both exist → merge
      const merged = mergeWorkoutData(localWorkout, workoutRemote.data);
      if (merged) {
        useWorkoutStore.setState({
          history: merged.history,
          customWorkouts: merged.customWorkouts,
          muscleOrder: merged.muscleOrder,
          homeCardOrder: merged.homeCardOrder,
        });
        useWorkoutStore.getState().updateStats();
      }
    } else if (workoutRemote.data && !hasLocalWorkout) {
      // Remote only → pull to local
      useWorkoutStore.setState({
        history: workoutRemote.data.history || [],
        customWorkouts: workoutRemote.data.custom_workouts || [],
        muscleOrder: workoutRemote.data.muscle_order || [],
        homeCardOrder: workoutRemote.data.home_card_order || [],
      });
      useWorkoutStore.getState().updateStats();
    }
    // In all cases, push merged/local state to remote
    await pushWorkout(userId).catch(console.warn);

    // ── Program merge (last-write-wins) ──
    const localProgram = useProgramStore.getState();
    if (programRemote.data && !localProgram.program && !localProgram.userProfile) {
      // Remote only → pull
      if (programRemote.profileData?.user_profile) {
        useProgramStore.setState({ userProfile: programRemote.profileData.user_profile });
      }
      useProgramStore.setState({
        program: programRemote.data.program,
        activeState: programRemote.data.active_state,
      });
    } else if (programRemote.data && localProgram.program) {
      // Both exist → last-write-wins by updated_at
      const localTs = timestamps.program ? new Date(timestamps.program).getTime() : 0;
      const remoteTs = programRemote.updatedAt ? new Date(programRemote.updatedAt).getTime() : 0;
      if (remoteTs > localTs) {
        useProgramStore.setState({
          program: programRemote.data.program,
          activeState: programRemote.data.active_state,
        });
        if (programRemote.profileData?.user_profile) {
          useProgramStore.setState({ userProfile: programRemote.profileData.user_profile });
        }
      }
    }
    await pushProgram(userId).catch(console.warn);

    // ── Badge merge (union) ──
    const localBadge = useBadgeStore.getState();
    if (badgeRemote.data) {
      const merged = mergeBadgeData(localBadge, badgeRemote.data);
      if (merged) {
        useBadgeStore.setState({
          unlockedBadges: merged.unlockedBadges,
          previousPoints: merged.previousPoints,
        });
      }
    }
    await pushBadge(userId).catch(console.warn);

    // ── Settings (last-write-wins) ──
    const localSettings = useSettingsStore.getState();
    if (settingsRemote.data) {
      const localTs = timestamps.settings ? new Date(timestamps.settings).getTime() : 0;
      const remoteTs = settingsRemote.updatedAt ? new Date(settingsRemote.updatedAt).getTime() : 0;
      if (remoteTs > localTs) {
        useSettingsStore.setState({
          soundEnabled: settingsRemote.data.sound_enabled,
          voiceEnabled: settingsRemote.data.voice_enabled,
          soundVolume: settingsRemote.data.sound_volume,
          weightUnit: settingsRemote.data.weight_unit,
          language: settingsRemote.data.language,
          keepScreenAwake: settingsRemote.data.keep_screen_awake,
        });
        localSettings.applyAudioSettings();
      }
    }
    await pushSettings(userId).catch(console.warn);

    console.log('[Sync] syncOnLogin complete');
  } catch (e) {
    console.warn('[Sync] syncOnLogin error:', e);
  }
}

// ─── Auto-sync: subscribe to store changes, debounced push ───

export function setupAutoSync(userId: string): void {
  // Clean up any existing subscriptions
  stopAutoSync();

  // Workout store
  const unsubWorkout = useWorkoutStore.subscribe(() => {
    debouncedPush('workout', () => pushWorkout(userId));
  });

  // Program store
  const unsubProgram = useProgramStore.subscribe(() => {
    debouncedPush('program', () => pushProgram(userId));
  });

  // Badge store
  const unsubBadge = useBadgeStore.subscribe(() => {
    debouncedPush('badge', () => pushBadge(userId));
  });

  // Settings store
  const unsubSettings = useSettingsStore.subscribe(() => {
    debouncedPush('settings', () => pushSettings(userId));
  });

  unsubscribers = [unsubWorkout, unsubProgram, unsubBadge, unsubSettings];
}

export function stopAutoSync(): void {
  for (const unsub of unsubscribers) {
    unsub();
  }
  unsubscribers = [];
  for (const key of Object.keys(timers)) {
    clearTimeout(timers[key]);
    delete timers[key];
  }
}

function debouncedPush(key: string, pushFn: () => Promise<void>): void {
  if (timers[key]) clearTimeout(timers[key]);
  timers[key] = setTimeout(() => {
    pushFn().catch(console.warn);
    delete timers[key];
  }, DEBOUNCE_MS);
}
