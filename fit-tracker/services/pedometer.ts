import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'onset-steps-cache';

export interface DailySteps {
  date: string; // YYYY-MM-DD
  steps: number;
}

// ─── Helpers ───

function getDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getStartOfDay(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`);
}

function getEndOfDay(dateKey: string): Date {
  return new Date(`${dateKey}T23:59:59.999`);
}

// ─── Cache ───

async function loadCache(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveCache(cache: Record<string, number>): Promise<void> {
  // Keep max 400 days of data to prevent unbounded growth
  const keys = Object.keys(cache).sort();
  if (keys.length > 400) {
    const toRemove = keys.slice(0, keys.length - 400);
    for (const k of toRemove) delete cache[k];
  }
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

// ─── Public API ───

/**
 * Check if the device has a pedometer sensor.
 */
export async function isPedometerAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Get today's step count (live from sensor).
 */
export async function getTodaySteps(): Promise<number> {
  try {
    const available = await isPedometerAvailable();
    if (!available) return 0;

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const result = await Pedometer.getStepCountAsync(start, now);
    return result.steps;
  } catch {
    return 0;
  }
}

/**
 * Subscribe to live step count updates for today.
 * Returns an unsubscribe function.
 */
export function watchTodaySteps(
  callback: (steps: number) => void,
): () => void {
  if (Platform.OS !== 'ios') return () => {};

  const sub = Pedometer.watchStepCount((result) => {
    callback(result.steps);
  });

  return () => sub.remove();
}

/**
 * Fetch the last N days of step data from the pedometer (max 7 on iOS)
 * and merge with the cache. Returns full history from cache.
 */
export async function getStepsHistory(
  days: number,
): Promise<DailySteps[]> {
  const cache = await loadCache();
  const available = await isPedometerAvailable();

  if (available) {
    // Fetch last 7 days from pedometer (iOS limit)
    const fetchDays = Math.min(days, 7);
    const today = new Date();

    for (let i = 0; i < fetchDays; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = getDateKey(d);

      try {
        const start = getStartOfDay(dateKey);
        const end = i === 0 ? today : getEndOfDay(dateKey);
        const result = await Pedometer.getStepCountAsync(start, end);

        // Only update cache if we got a valid number
        if (result.steps >= 0) {
          cache[dateKey] = result.steps;
        }
      } catch {
        // Skip days that fail (might be outside 7-day window)
      }
    }

    await saveCache(cache);
  }

  // Build result from cache for requested days
  const result: DailySteps[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = getDateKey(d);
    result.push({
      date: dateKey,
      steps: cache[dateKey] || 0,
    });
  }

  return result;
}

/**
 * Refresh the cache by fetching the most recent 7 days from the pedometer.
 * Call this on app launch or when the steps screen opens.
 */
export async function refreshStepsCache(): Promise<void> {
  await getStepsHistory(7);
}
