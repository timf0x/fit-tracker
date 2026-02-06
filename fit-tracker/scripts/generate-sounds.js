/**
 * Generate Tabata/HIIT workout timer sound effects.
 * Designed to cut through gym noise + background music (2-4kHz presence).
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

// Hard attack, exponential decay
function env(i, len, attack = 0.002, decay = 4) {
  const aSamples = SR * attack;
  if (i < aSamples) return i / aSamples;
  return Math.exp(-decay * (i - aSamples) / (len - aSamples));
}

// Soft clip for warmth/aggression
function softClip(x, drive = 2) {
  return Math.tanh(x * drive) / Math.tanh(drive);
}

// Band-pass noise burst (percussive attack)
function noiseBurst(len, centerFreq = 3000, bandwidth = 1500, amplitude = 0.5) {
  const samples = new Float64Array(len);
  // Simple resonant filter approximation
  const w0 = 2 * Math.PI * centerFreq / SR;
  const Q = centerFreq / bandwidth;
  const alpha = Math.sin(w0) / (2 * Q);
  const b0 = alpha, b1 = 0, b2 = -alpha;
  const a0 = 1 + alpha, a1 = -2 * Math.cos(w0), a2 = 1 - alpha;

  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < len; i++) {
    const x0 = noise();
    const y0 = (b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x0; y2 = y1; y1 = y0;
    const e = env(i, len, 0.001, 8);
    samples[i] = y0 * e * amplitude;
  }
  return samples;
}

// Frequency sweep
function sweep(startFreq, endFreq, duration, amplitude = 0.7, harmonics = 1) {
  const len = sec(duration);
  const samples = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const f = startFreq + (endFreq - startFreq) * t;
    const e = env(i, len, 0.001, 3);
    let val = 0;
    for (let h = 1; h <= harmonics; h++) {
      val += sin(f * h, i) * (1 / h);
    }
    samples[i] = val * e * amplitude;
  }
  return samples;
}

function mix(dest, src, offset = 0) {
  for (let i = 0; i < src.length && (offset + i) < dest.length; i++) {
    dest[offset + i] += src[i];
  }
}

// ─── PREPARE: Rising attention sweep + noise hit ───
// "Get ready" — builds tension, ends with a snap
function generatePrepare() {
  const len = sec(0.4);
  const samples = new Float64Array(len);

  // Rising sweep 800 → 2500Hz with 3 harmonics
  const sweepSamples = sweep(800, 2500, 0.3, 0.6, 3);
  mix(samples, sweepSamples, 0);

  // Noise burst at the peak (percussive snap)
  const burst = noiseBurst(ms(60), 3500, 2000, 0.5);
  mix(samples, burst, sec(0.25));

  // Final bright ping
  for (let i = sec(0.28); i < len; i++) {
    const t = i - sec(0.28);
    const e = env(t, len - sec(0.28), 0.001, 10);
    samples[i] += sin(2500, t) * 0.4 * e;
  }

  // Soft clip for punch
  for (let i = 0; i < len; i++) samples[i] = softClip(samples[i], 1.5) * 0.85;
  return samples;
}

// ─── WORK START: Aggressive double horn blast ───
// "GO!" — urgent, powerful, impossible to miss
function generateWorkStart() {
  const len = sec(0.35);
  const samples = new Float64Array(len);

  // Hit 1: thick horn with sub
  const hit1Len = ms(120);
  for (let i = 0; i < hit1Len; i++) {
    const e = env(i, hit1Len, 0.001, 3);
    const val = sin(900, i) * 0.4
      + sin(1800, i) * 0.25
      + sin(2700, i) * 0.15
      + sin(450, i) * 0.2  // sub
      + sin(3600, i) * 0.08;
    samples[i] = val * e;
  }

  // Noise punch on hit 1
  const punch1 = noiseBurst(ms(40), 4000, 3000, 0.4);
  mix(samples, punch1, 0);

  // Hit 2: same but higher pitch, louder (emphasis)
  const gap = ms(50);
  const hit2Start = hit1Len + gap;
  const hit2Len = ms(140);
  for (let i = 0; i < hit2Len && (hit2Start + i) < len; i++) {
    const e = env(i, hit2Len, 0.001, 2.5);
    const val = sin(1100, i) * 0.45
      + sin(2200, i) * 0.3
      + sin(3300, i) * 0.15
      + sin(550, i) * 0.2
      + sin(4400, i) * 0.08;
    samples[hit2Start + i] = val * e;
  }

  // Noise punch on hit 2
  const punch2 = noiseBurst(ms(50), 4500, 3000, 0.5);
  mix(samples, punch2, hit2Start);

  // Soft clip for aggression
  for (let i = 0; i < len; i++) samples[i] = softClip(samples[i], 2) * 0.9;
  return samples;
}

// ─── REST START: Descending relief tone ───
// "Rest now" — instant contrast from work, calming but clear
function generateRestStart() {
  const len = sec(0.35);
  const samples = new Float64Array(len);

  // Descending sweep 1200 → 400Hz
  const sweepDown = sweep(1200, 400, 0.3, 0.5, 2);
  mix(samples, sweepDown, 0);

  // Soft low pad underneath
  for (let i = 0; i < len; i++) {
    const e = env(i, len, 0.005, 3);
    samples[i] += sin(300, i) * 0.2 * e;
  }

  // Gentle clip
  for (let i = 0; i < len; i++) samples[i] = softClip(samples[i], 1.2) * 0.7;
  return samples;
}

// ─── SET COMPLETE: Tight percussive snap + bright ding ───
// "Done!" — satisfying, quick reward
function generateSetComplete() {
  const len = sec(0.3);
  const samples = new Float64Array(len);

  // Percussive noise snap
  const snap = noiseBurst(ms(25), 5000, 4000, 0.6);
  mix(samples, snap, 0);

  // Bright metallic ding with inharmonic partials (bell-like)
  for (let i = 0; i < len; i++) {
    const e = env(i, len, 0.001, 7);
    samples[i] += (
      sin(2000, i) * 0.35
      + sin(3100, i) * 0.2
      + sin(4700, i) * 0.12
      + sin(1500, i) * 0.15
    ) * e;
  }

  for (let i = 0; i < len; i++) samples[i] = softClip(samples[i], 1.3) * 0.8;
  return samples;
}

// ─── SESSION COMPLETE: Powerful rising triple blast + thick final chord ───
// "DONE!" — triumphant, energetic closure
function generateSessionComplete() {
  const len = sec(1.0);
  const samples = new Float64Array(len);

  // Three rising blasts
  const blasts = [
    { freq: 800, start: 0, dur: 0.12 },
    { freq: 1100, start: 0.16, dur: 0.12 },
    { freq: 1400, start: 0.32, dur: 0.15 },
  ];

  for (const b of blasts) {
    const bStart = sec(b.start);
    const bLen = sec(b.dur);
    for (let i = 0; i < bLen && (bStart + i) < len; i++) {
      const e = env(i, bLen, 0.001, 3);
      const val = sin(b.freq, i) * 0.4
        + sin(b.freq * 2, i) * 0.25
        + sin(b.freq * 3, i) * 0.12
        + sin(b.freq * 0.5, i) * 0.15;
      samples[bStart + i] += val * e;
    }
    // Noise hit per blast
    const hit = noiseBurst(ms(35), 4000, 3000, 0.35);
    mix(samples, hit, bStart);
  }

  // Final thick chord (major triad + octave)
  const chordStart = sec(0.5);
  const chordLen = len - chordStart;
  for (let i = 0; i < chordLen; i++) {
    const e = env(i, chordLen, 0.003, 3);
    const val = sin(1400, i) * 0.25     // root
      + sin(1760, i) * 0.2              // major third
      + sin(2100, i) * 0.2              // fifth
      + sin(2800, i) * 0.15             // octave
      + sin(700, i) * 0.12              // sub octave
      + sin(4200, i) * 0.06;            // brightness
    samples[chordStart + i] += val * e;
  }

  // Final noise wash for width
  const wash = noiseBurst(ms(80), 3000, 2000, 0.2);
  mix(samples, wash, chordStart);

  for (let i = 0; i < len; i++) samples[i] = softClip(samples[i], 1.8) * 0.9;
  return samples;
}

// ─── Write ───

const sounds = {
  'work-start': generateWorkStart(),
  'rest-start': generateRestStart(),
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
