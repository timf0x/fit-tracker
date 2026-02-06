/**
 * Generate Tabata/HIIT workout timer sound effects.
 * Uses square/saw waveforms for harsh buzzer character (not sine = video game).
 * Run: node scripts/generate-sounds.js
 */

const fs = require('fs');
const path = require('path');

const SR = 44100;
const outDir = path.join(__dirname, '..', 'assets', 'sounds');

function generateWav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  }
  return buf;
}

// ─── DSP Helpers ───

const sin = (f, i) => Math.sin(2 * Math.PI * f * i / SR);
const noise = () => Math.random() * 2 - 1;
const ms = (t) => Math.floor(SR * t / 1000);
const sec = (t) => Math.floor(SR * t);

// Square wave (odd harmonics) — harsh buzzer tone
function square(f, i, harmonics = 8) {
  let val = 0;
  for (let h = 1; h <= harmonics * 2; h += 2) {
    val += sin(f * h, i) / h;
  }
  return val * (4 / Math.PI);
}

// Sawtooth wave — brassy/horn tone
function saw(f, i, harmonics = 10) {
  let val = 0;
  for (let h = 1; h <= harmonics; h++) {
    val += sin(f * h, i) / h * (h % 2 === 0 ? -1 : 1);
  }
  return val * (2 / Math.PI);
}

// Envelope
function env(i, len, attack = 0.002, decay = 4) {
  const aSamples = SR * attack;
  if (i < aSamples) return i / aSamples;
  return Math.exp(-decay * (i - aSamples) / (len - aSamples));
}

// Hard clip — real buzzer distortion
function hardClip(x, threshold = 0.8) {
  return Math.max(-threshold, Math.min(threshold, x));
}

function mix(dest, src, offset = 0) {
  for (let i = 0; i < src.length && (offset + i) < dest.length; i++) {
    dest[offset + i] += src[i];
  }
}

// ─── PREPARE: Short harsh buzzer beep ───
// Like a CrossFit timer "attention" signal
function generatePrepare() {
  const len = sec(0.2);
  const samples = new Float64Array(len);

  for (let i = 0; i < len; i++) {
    const e = env(i, len, 0.001, 6);
    // Square wave at 880Hz — harsh, industrial
    const val = square(880, i, 6) * 0.5;
    samples[i] = hardClip(val * e, 0.7) * 0.85;
  }

  return samples;
}

// ─── WORK START: Aggressive double blast ───
// "GO!" — like a basketball game buzzer
function generateWorkStart() {
  const len = sec(0.35);
  const samples = new Float64Array(len);

  // Blast 1: harsh low buzzer
  const b1Len = ms(100);
  for (let i = 0; i < b1Len; i++) {
    const e = env(i, b1Len, 0.001, 3);
    const val = square(600, i, 8) * 0.35 + saw(600, i, 6) * 0.2;
    samples[i] = hardClip(val * e, 0.7);
  }

  // Blast 2: slightly higher, longer — emphasis
  const b2Start = ms(140);
  const b2Len = ms(150);
  for (let i = 0; i < b2Len && (b2Start + i) < len; i++) {
    const e = env(i, b2Len, 0.001, 2.5);
    const val = square(750, i, 8) * 0.4 + saw(750, i, 6) * 0.2;
    samples[b2Start + i] = hardClip(val * e, 0.75);
  }

  for (let i = 0; i < len; i++) samples[i] *= 0.9;
  return samples;
}

// ─── REST START: Lower softer buzz ───
// "Rest" — clearly different from work, calmer but still a buzzer
function generateRestStart() {
  const len = sec(0.25);
  const samples = new Float64Array(len);

  for (let i = 0; i < len; i++) {
    const e = env(i, len, 0.005, 4);
    // Lower square wave, fewer harmonics = softer but still buzzer-like
    const val = square(500, i, 4) * 0.35 + sin(500, i) * 0.15;
    samples[i] = hardClip(val * e, 0.6) * 0.7;
  }

  return samples;
}

// ─── SET COMPLETE: Quick harsh chirp ───
// Short and sharp — acknowledgment, not a reward jingle
function generateSetComplete() {
  const len = sec(0.15);
  const samples = new Float64Array(len);

  for (let i = 0; i < len; i++) {
    const e = env(i, len, 0.001, 10);
    const val = square(1200, i, 5) * 0.4;
    samples[i] = hardClip(val * e, 0.7) * 0.8;
  }

  return samples;
}

// ─── BREAK: Double low tone — longer pause signal ───
// Distinct from rest — two descending tones, signals "take your time"
function generateBreak() {
  const len = sec(0.4);
  const samples = new Float64Array(len);

  // Tone 1: mid-low
  const t1Len = ms(120);
  for (let i = 0; i < t1Len; i++) {
    const e = env(i, t1Len, 0.003, 4);
    const val = square(400, i, 4) * 0.3 + sin(400, i) * 0.15;
    samples[i] = hardClip(val * e, 0.6) * 0.7;
  }

  // Tone 2: lower — descending feel
  const t2Start = ms(160);
  const t2Len = ms(150);
  for (let i = 0; i < t2Len && (t2Start + i) < len; i++) {
    const e = env(i, t2Len, 0.003, 3.5);
    const val = square(300, i, 4) * 0.3 + sin(300, i) * 0.15;
    samples[t2Start + i] = hardClip(val * e, 0.55) * 0.65;
  }

  return samples;
}

// ─── SESSION COMPLETE: Long arena horn ───
// End of match — sustained harsh buzzer
function generateSessionComplete() {
  const len = sec(1.0);
  const samples = new Float64Array(len);

  // Single long sustained buzzer that fades out — like end of a basketball quarter
  for (let i = 0; i < len; i++) {
    const e = env(i, len, 0.005, 1.8);
    const val = square(440, i, 10) * 0.35
      + saw(440, i, 8) * 0.15
      + square(880, i, 4) * 0.08;  // slight octave presence
    samples[i] = hardClip(val * e, 0.65) * 0.85;
  }

  return samples;
}

// ─── Write ───

const sounds = {
  'work-start': generateWorkStart(),
  'rest-start': generateRestStart(),
  'break-start': generateBreak(),
  prepare: generatePrepare(),
  'set-complete': generateSetComplete(),
  'session-complete': generateSessionComplete(),
};

for (const [name, samples] of Object.entries(sounds)) {
  const wav = generateWav(samples);
  fs.writeFileSync(path.join(outDir, `${name}.wav`), wav);
  console.log(`  ${name}.wav (${(wav.length / 1024).toFixed(1)} KB)`);
}

console.log('\nTabata sounds generated. Countdown + tick untouched.');
