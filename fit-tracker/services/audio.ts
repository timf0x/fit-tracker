import { Audio, AVPlaybackSource } from 'expo-av';
import * as Speech from 'expo-speech';

// ─── Module-level config (set from UI) ───

let _soundEnabled = true;
let _voiceEnabled = true;
let _soundVolume = 0.8;
let _language: 'fr' | 'en' = 'fr';

export function setSoundEnabled(enabled: boolean) { _soundEnabled = enabled; }
export function setVoiceEnabled(enabled: boolean) { _voiceEnabled = enabled; }
export function setSoundVolume(volume: number) { _soundVolume = volume; }
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
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: 2,  // DUCK_OTHERS — lower Spotify/music volume during sounds
      interruptionModeAndroid: 2, // DUCK_OTHERS
      shouldDuckAndroid: true,
    });

    // Warm up iOS TTS engine (first call is often silent)
    Speech.speak(' ', { language: 'fr-FR', rate: 10, pitch: 0.1 });
    await new Promise(resolve => setTimeout(resolve, 200));
    Speech.stop();

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

  // Fire-and-forget — no await chain to prevent drift
  const finalVolume = _soundVolume * relativeVolume;
  sound.setVolumeAsync(finalVolume)
    .then(() => sound.setPositionAsync(0))
    .then(() => sound.playAsync())
    .catch(() => {});
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

function speakNow(text: string, pitch?: number, rate?: number) {
  if (!_voiceEnabled) return;
  const languageCode = _language === 'fr' ? 'fr-FR' : 'en-US';
  try {
    Speech.speak(text, {
      language: languageCode,
      pitch: pitch ?? 1.0,
      rate: rate ?? 1.20,
    });
  } catch {}
}

// ─── Phase Announcements ───

export function announcePhase(
  phase: string,
  exerciseName?: string,
  nextExerciseName?: string,
  details?: { sets?: number; reps?: number; weight?: number },
) {
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
        setTimeout(() => speakNow(prepareText), 400);

        if (exerciseName) {
          setTimeout(() => speakNow(exerciseName), 1800);
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
            setTimeout(() => speakNow(infoParts.join(', ')), 3200);
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
      setTimeout(() => speakNow(text), 400);
    }
  }
}

// ─── Countdown (3, 2, 1) ───

export function announceCountdown(seconds: number) {
  playCountdownBeep();

  if (_voiceEnabled && seconds <= 3 && seconds > 0) {
    const pitch = 0.9 + (4 - seconds) * 0.1;
    Speech.stop();
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
    Speech.stop();
    for (const sound of Object.values(soundCache)) {
      await sound.unloadAsync();
    }
    Object.keys(soundCache).forEach(key => delete soundCache[key]);
  } catch (error) {
    console.error('Failed to cleanup audio:', error);
  }
}
