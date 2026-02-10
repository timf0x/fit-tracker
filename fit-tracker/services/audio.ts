import { Audio, AVPlaybackSource } from 'expo-av';
import * as Speech from 'expo-speech';

// ─── Module-level config (set from UI) ───

let _soundEnabled = true;
let _voiceEnabled = true;
let _soundVolume = 0.8;
let _language: 'fr' | 'en' = 'fr';
let _killed = false;
const _pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

export function setSoundEnabled(enabled: boolean) { _soundEnabled = enabled; }
export function setVoiceEnabled(enabled: boolean) { _voiceEnabled = enabled; }
export function setSoundVolume(volume: number) {
  _soundVolume = volume;
  console.log('[Audio] setSoundVolume:', volume, 'cached sounds:', Object.keys(soundCache).length);
  // Pre-set volume on all cached sounds so it's already applied before playAsync
  for (const [name, sound] of Object.entries(soundCache)) {
    sound.setVolumeAsync(volume).catch((e) => console.warn('[Audio] setVolume failed for', name, e));
  }
}
export function setLanguage(lang: 'fr' | 'en') { _language = lang; }

// ─── Local sound assets ───

const SOUND_FILES: Record<string, AVPlaybackSource> = {
  workStart: require('@/assets/sounds/work-start.wav'),
  restStart: require('@/assets/sounds/rest-start.wav'),
  breakStart: require('@/assets/sounds/break-start.wav'),
  countdown: require('@/assets/sounds/countdown.wav'),
  tick: require('@/assets/sounds/tick.wav'),
  setComplete: require('@/assets/sounds/set-complete.wav'),
  sessionComplete: require('@/assets/sounds/session-complete.wav'),
  prepare: require('@/assets/sounds/prepare.wav'),
};

const soundCache: { [key: string]: Audio.Sound } = {};

// ─── Init ───

export async function initAudio() {
  _killed = false;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false, // false = .ambient category (never interrupts other apps)
      staysActiveInBackground: false,
      interruptionModeIOS: 0,  // MIX_WITH_OTHERS (0=mix, 1=doNotMix, 2=duck)
      interruptionModeAndroid: 2, // DUCK_OTHERS (no mix option on Android)
      shouldDuckAndroid: true,
    });

    // NOTE: No TTS warmup here — Speech.speak() steals the iOS audio session
    // and kills background music. The first TTS call may be slightly delayed
    // but that's acceptable to preserve Spotify/Apple Music playback.

    // Preload all local sounds (instant — no network needed)
    await Promise.allSettled(
      Object.entries(SOUND_FILES).map(async ([name, source]) => {
        try {
          const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: false });
          soundCache[name] = sound;
        } catch {}
      })
    );
  } catch (error) {
    console.error('Failed to initialize audio:', error);
  }
}

// ─── Play ───

function playSound(name: string, relativeVolume: number = 1.0) {
  if (!_soundEnabled) return;

  const sound = soundCache[name];
  if (!sound) return;

  // Fire-and-forget — volume is pre-set by setSoundVolume, just adjust for relative
  const finalVolume = Math.min(1, _soundVolume * relativeVolume);
  console.log('[Audio] playSound:', name, 'vol:', finalVolume);
  sound.setStatusAsync({ volume: finalVolume, positionMillis: 0, shouldPlay: true })
    .catch((e) => console.warn('[Audio] playSound failed:', name, e));
}

// ─── Sound Effect Functions ───

export function playWorkStartSound() { playSound('workStart', 1.0); }
export function playRestStartSound() { playSound('restStart', 0.8); }
export function playBreakStartSound() { playSound('breakStart', 0.8); }
export function playPrepareSound() { playSound('prepare', 0.9); }
export function playSetCompleteSound() { playSound('setComplete', 0.9); }
export function playSessionCompleteSound() { playSound('sessionComplete', 1.0); }

export function playCountdownBeep() {
  if (!_soundEnabled) return;
  playSound('countdown', 0.8);
}

export function playTickSound() {
  if (!_soundEnabled) return;
  playSound('tick', 0.5);
}

// ─── Text-to-Speech ───

function restoreMixMode() {
  // Re-apply ambient+mix after Speech.speak steals the iOS audio session
  Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: false,
    staysActiveInBackground: false,
    interruptionModeIOS: 0,
    interruptionModeAndroid: 2,
    shouldDuckAndroid: true,
  }).catch(() => {});
}

function speakNow(text: string, pitch?: number, rate?: number) {
  if (!_voiceEnabled || _killed) return;
  const languageCode = _language === 'fr' ? 'fr-FR' : 'en-US';
  try {
    // Re-apply mix mode before speaking so AVSpeechSynthesizer inherits it
    restoreMixMode();
    Speech.speak(text, {
      language: languageCode,
      pitch: pitch ?? 1.0,
      rate: rate ?? 1.20,
      volume: _soundVolume,
      onDone: restoreMixMode,
      onStopped: restoreMixMode,
      onError: restoreMixMode,
    });
  } catch {}
}

/** Schedule a delayed speak — trackable so cleanup can cancel it */
function speakDelayed(text: string, delayMs: number, pitch?: number, rate?: number) {
  const id = setTimeout(() => speakNow(text, pitch, rate), delayMs);
  _pendingTimeouts.push(id);
}

// ─── Cancel Pending Speech ───

/** Cancel all pending delayed speech and stop current TTS. Call before new announcements. */
export function cancelPendingSpeech() {
  for (const id of _pendingTimeouts) clearTimeout(id);
  _pendingTimeouts.length = 0;
  Speech.stop();
  restoreMixMode();
}

// ─── Phase Announcements ───

export function announcePhase(
  phase: string,
  exerciseName?: string,
  nextExerciseName?: string,
  details?: { sets?: number; reps?: number; weight?: number },
) {
  // Cancel any pending speech from the previous phase
  cancelPendingSpeech();

  // Play sound
  if (_soundEnabled) {
    switch (phase) {
      case 'prepare': playPrepareSound(); break;
      case 'exercise': playWorkStartSound(); break;
      case 'exercise-right': playWorkStartSound(); break;
      case 'exercise-left': playWorkStartSound(); break;
      case 'rest': playRestStartSound(); break;
      case 'break': playBreakStartSound(); break;
      case 'finished': playSessionCompleteSound(); break;
    }
  }

  // Voice announcement (delayed so sound plays first)
  if (_voiceEnabled) {
    let text = '';

    switch (phase) {
      case 'prepare': {
        // Speak in sequence with pauses between each part
        const prepareText = _language === 'fr' ? 'Préparer' : 'Prepare';
        speakDelayed(prepareText, 400);

        if (exerciseName) {
          speakDelayed(exerciseName, 1800);
        }

        if (details) {
          const infoParts: string[] = [];
          if (details.sets) {
            infoParts.push(_language === 'fr' ? `${details.sets} séries` : `${details.sets} sets`);
          }
          if (details.reps) {
            infoParts.push(_language === 'fr' ? `${details.reps} répétitions` : `${details.reps} reps`);
          }
          if (details.weight && details.weight > 0) {
            infoParts.push(`${details.weight} kilos`);
          }
          if (infoParts.length > 0) {
            speakDelayed(infoParts.join(', '), 3200);
          }
        }
        break;
      }
      case 'exercise':
        text = _language === 'fr' ? 'Exercice' : 'Exercise';
        break;
      case 'exercise-left':
        text = _language === 'fr' ? 'Côté gauche' : 'Left side';
        break;
      case 'exercise-right':
        text = _language === 'fr' ? 'Côté droit' : 'Right side';
        break;
      case 'rest':
        text = _language === 'fr' ? 'Repos' : 'Rest';
        break;
      case 'break':
        text = nextExerciseName
          ? (_language === 'fr' ? `Pause. Prochain: ${nextExerciseName}` : `Take a break. Next: ${nextExerciseName}`)
          : (_language === 'fr' ? 'Pause' : 'Take a break');
        break;
      case 'finished':
        text = _language === 'fr' ? 'Session terminée' : 'Session complete';
        break;
    }

    if (text && phase !== 'prepare') {
      speakDelayed(text, 400);
    }
  }
}

// ─── Countdown (3, 2, 1) ───

export function announceCountdown(seconds: number) {
  playCountdownBeep();

  if (_voiceEnabled && seconds <= 3 && seconds > 0) {
    const pitch = 0.9 + (4 - seconds) * 0.1;
    Speech.stop();
    restoreMixMode();
    setTimeout(() => speakNow(seconds.toString(), pitch, 1.56), 150);
  }
}

// ─── Set Announcements ───

export function announceSetComplete() {
  playSetCompleteSound();
}

// ─── Timer Tick Handler ───

export function handleTimerTick(secondsRemaining: number, phase: string) {
  if (!_soundEnabled) return;
  if (phase === 'finished' || phase === 'idle') return;

  if (secondsRemaining <= 3 && secondsRemaining > 0) {
    return; // Handled by announceCountdown (beep + voice)
  } else if (secondsRemaining <= 10 && secondsRemaining > 3) {
    playCountdownBeep();
  }
}

// ─── Cleanup ───

export async function cleanupAudio() {
  try {
    // Kill flag prevents any queued speakNow from firing
    _killed = true;

    // Cancel all pending delayed speech
    for (const id of _pendingTimeouts) clearTimeout(id);
    _pendingTimeouts.length = 0;

    // Stop current speech immediately
    Speech.stop();
    restoreMixMode();

    for (const sound of Object.values(soundCache)) {
      await sound.unloadAsync();
    }
    Object.keys(soundCache).forEach(key => delete soundCache[key]);
  } catch (error) {
    console.error('Failed to cleanup audio:', error);
  }
}
