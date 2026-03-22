// Synthesized drum sounds with multiple variants per category
// Each variant has unique synthesis parameters

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function resumeAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
}

export function getAudioContext(): AudioContext {
  return getCtx();
}

// ── Sound catalog ──────────────────────────────────────────

export type SoundCategory = 'kick' | 'snare' | 'closedHat' | 'openHat' | 'clap' | 'tom' | 'perc';

export interface SoundDef {
  id: string;
  label: string;
  category: SoundCategory;
  play: (ctx: AudioContext, time: number, volume: number, decay: number) => void;
}

function makeNoise(ctx: AudioContext, duration: number): AudioBufferSourceNode {
  const size = ctx.sampleRate * duration;
  const buf = ctx.createBuffer(1, size, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

// ── Kicks ──────────────────────────────────────────────────

const kicks: SoundDef[] = [
  {
    id: 'kick-808', label: '808', category: 'kick',
    play(ctx, t, vol, dec) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(30, t + 0.12);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4 * dec);
      o.start(t); o.stop(t + 0.4 * dec);
    },
  },
  {
    id: 'kick-909', label: '909', category: 'kick',
    play(ctx, t, vol, dec) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(200, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.08);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25 * dec);
      o.start(t); o.stop(t + 0.25 * dec);
      // click
      const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
      o2.type = 'square'; o2.frequency.value = 400;
      o2.connect(g2); g2.connect(ctx.destination);
      g2.gain.setValueAtTime(vol * 0.4, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.01);
      o2.start(t); o2.stop(t + 0.01);
    },
  },
  {
    id: 'kick-boom', label: 'Boom', category: 'kick',
    play(ctx, t, vol, dec) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(100, t);
      o.frequency.exponentialRampToValueAtTime(20, t + 0.2);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6 * dec);
      o.start(t); o.stop(t + 0.6 * dec);
    },
  },
  {
    id: 'kick-tight', label: 'Tight', category: 'kick',
    play(ctx, t, vol, dec) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(50, t + 0.05);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15 * dec);
      o.start(t); o.stop(t + 0.15 * dec);
    },
  },
  {
    id: 'kick-sub', label: 'Sub', category: 'kick',
    play(ctx, t, vol, dec) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine';
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(80, t);
      o.frequency.exponentialRampToValueAtTime(25, t + 0.25);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5 * dec);
      o.start(t); o.stop(t + 0.5 * dec);
    },
  },
  {
    id: 'kick-electro', label: 'Electro', category: 'kick',
    play(ctx, t, vol, dec) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(300, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.06);
      g.gain.setValueAtTime(vol * 0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3 * dec);
      o.start(t); o.stop(t + 0.3 * dec);
      // distortion-like overtone
      const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
      o2.type = 'sawtooth';
      o2.connect(g2); g2.connect(ctx.destination);
      o2.frequency.setValueAtTime(600, t);
      o2.frequency.exponentialRampToValueAtTime(60, t + 0.04);
      g2.gain.setValueAtTime(vol * 0.3, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      o2.start(t); o2.stop(t + 0.04);
    },
  },
];

// ── Snares ─────────────────────────────────────────────────

const snares: SoundDef[] = [
  {
    id: 'snare-808', label: '808', category: 'snare',
    play(ctx, t, vol, dec) {
      const n = makeNoise(ctx, 0.15 * dec); const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 1000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.8, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15 * dec);
      n.connect(f); f.connect(g); g.connect(ctx.destination);
      n.start(t); n.stop(t + 0.15 * dec);
      const o = ctx.createOscillator(); const og = ctx.createGain();
      o.connect(og); og.connect(ctx.destination);
      o.frequency.setValueAtTime(200, t);
      o.frequency.exponentialRampToValueAtTime(100, t + 0.05);
      og.gain.setValueAtTime(vol * 0.7, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.1 * dec);
      o.start(t); o.stop(t + 0.1 * dec);
    },
  },
  {
    id: 'snare-909', label: '909', category: 'snare',
    play(ctx, t, vol, dec) {
      const n = makeNoise(ctx, 0.2 * dec); const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 3000; f.Q.value = 1.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.7, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2 * dec);
      n.connect(f); f.connect(g); g.connect(ctx.destination);
      n.start(t); n.stop(t + 0.2 * dec);
      const o = ctx.createOscillator(); const og = ctx.createGain();
      o.connect(og); og.connect(ctx.destination);
      o.frequency.setValueAtTime(250, t);
      o.frequency.exponentialRampToValueAtTime(120, t + 0.04);
      og.gain.setValueAtTime(vol * 0.8, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.08 * dec);
      o.start(t); o.stop(t + 0.08 * dec);
    },
  },
  {
    id: 'snare-crack', label: 'Crack', category: 'snare',
    play(ctx, t, vol, dec) {
      const n = makeNoise(ctx, 0.08 * dec); const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 2500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08 * dec);
      n.connect(f); f.connect(g); g.connect(ctx.destination);
      n.start(t); n.stop(t + 0.08 * dec);
      const o = ctx.createOscillator(); const og = ctx.createGain();
      o.connect(og); og.connect(ctx.destination);
      o.frequency.setValueAtTime(350, t);
      o.frequency.exponentialRampToValueAtTime(150, t + 0.02);
      og.gain.setValueAtTime(vol * 0.6, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      o.start(t); o.stop(t + 0.04);
    },
  },
  {
    id: 'snare-lofi', label: 'Lo-Fi', category: 'snare',
    play(ctx, t, vol, dec) {
      const n = makeNoise(ctx, 0.2 * dec); const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.6, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2 * dec);
      n.connect(f); f.connect(g); g.connect(ctx.destination);
      n.start(t); n.stop(t + 0.2 * dec);
      const o = ctx.createOscillator(); const og = ctx.createGain();
      o.connect(og); og.connect(ctx.destination);
      o.frequency.setValueAtTime(160, t);
      o.frequency.exponentialRampToValueAtTime(80, t + 0.08);
      og.gain.setValueAtTime(vol * 0.5, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.12 * dec);
      o.start(t); o.stop(t + 0.12 * dec);
    },
  },
  {
    id: 'snare-rim', label: 'Rim', category: 'snare',
    play(ctx, t, vol, dec) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'square'; o.frequency.value = 1700;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(vol * 0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.03 * dec);
      o.start(t); o.stop(t + 0.03 * dec);
      const n = makeNoise(ctx, 0.02 * dec); const ng = ctx.createGain();
      ng.gain.setValueAtTime(vol * 0.4, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.02 * dec);
      n.connect(ng); ng.connect(ctx.destination);
      n.start(t); n.stop(t + 0.02 * dec);
    },
  },
  {
    id: 'snare-fat', label: 'Fat', category: 'snare',
    play(ctx, t, vol, dec) {
      const n = makeNoise(ctx, 0.25 * dec); const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 5000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25 * dec);
      n.connect(f); f.connect(g); g.connect(ctx.destination);
      n.start(t); n.stop(t + 0.25 * dec);
      const o = ctx.createOscillator(); const og = ctx.createGain();
      o.connect(og); og.connect(ctx.destination);
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(70, t + 0.1);
      og.gain.setValueAtTime(vol * 0.9, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.15 * dec);
      o.start(t); o.stop(t + 0.15 * dec);
    },
  },
];

// ── Closed Hats ────────────────────────────────────────────

const closedHats: SoundDef[] = [
  {
    id: 'chat-808', label: '808', category: 'closedHat',
    play(ctx, t, vol, dec) {
      const n = makeNoise(ctx, 0.05 * dec); const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 6000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05 * dec);
      n.connect(f); f.connect(g); g.connect(ctx.destination);
      n.start(t); n.stop(t + 0.05 * dec);
    },
  },
  {
    id: 'chat-crispy', label: 'Crispy', category: 'closedHat',
    play(ctx, t, vol, dec) {
      const n = makeNoise(ctx, 0.03 * dec); const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 9000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.35, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.03 * dec);
      n.connect(f); f.connect(g); g.connect(ctx.destination);
      n.start(t); n.stop(t + 0.03 * dec);
    },
  },
  {
    id: 'chat-soft', label: 'Soft', category: 'closedHat',
    play(ctx, t, vol, dec) {
      const n = makeNoise(ctx, 0.06 * dec); const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 7000; f.Q.value = 1;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.06 * dec);
      n.connect(f); f.connect(g); g.connect(ctx.destination);
      n.start(t); n.stop(t + 0.06 * dec);
    },
  },
  {
    id: 'chat-digital', label: 'Digital', category: 'closedHat',
    play(ctx, t, vol, dec) {
      const o1 = ctx.createOscillator(); const o2 = ctx.createOscillator();
      o1.type = 'square'; o2.type = 'square';
      o1.frequency.value = 4500; o2.frequency.value = 6200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.04 * dec);
      o1.connect(g); o2.connect(g); g.connect(ctx.destination);
      o1.start(t); o2.start(t);
      o1.stop(t + 0.04 * dec); o2.stop(t + 0.04 * dec);
    },
  },
];

// ── Open Hats ──────────────────────────────────────────────

const openHats: SoundDef[] = [
  {
    id: 'ohat-808', label: '808', category: 'openHat',
    play(ctx, t, vol, dec) {
      const n = makeNoise(ctx, 0.3 * dec); const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 6000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3 * dec);
      n.connect(f); f.connect(g); g.connect(ctx.destination);
      n.start(t); n.stop(t + 0.3 * dec);
    },
  },
  {
    id: 'ohat-sizzle', label: 'Sizzle', category: 'openHat',
    play(ctx, t, vol, dec) {
      const n = makeNoise(ctx, 0.4 * dec); const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 8000; f.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.35, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4 * dec);
      n.connect(f); f.connect(g); g.connect(ctx.destination);
      n.start(t); n.stop(t + 0.4 * dec);
    },
  },
  {
    id: 'ohat-loose', label: 'Loose', category: 'openHat',
    play(ctx, t, vol, dec) {
      const n = makeNoise(ctx, 0.5 * dec); const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 4000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.35, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5 * dec);
      n.connect(f); f.connect(g); g.connect(ctx.destination);
      n.start(t); n.stop(t + 0.5 * dec);
    },
  },
  {
    id: 'ohat-trashy', label: 'Trashy', category: 'openHat',
    play(ctx, t, vol, dec) {
      const n = makeNoise(ctx, 0.35 * dec); const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 5000; f.Q.value = 3;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.45, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35 * dec);
      n.connect(f); f.connect(g); g.connect(ctx.destination);
      n.start(t); n.stop(t + 0.35 * dec);
    },
  },
];

// ── Claps ──────────────────────────────────────────────────

function playClap(ctx: AudioContext, t: number, vol: number, dec: number, freq: number, burstCount: number, tailDur: number) {
  for (let i = 0; i < burstCount; i++) {
    const off = i * 0.01;
    const n = makeNoise(ctx, 0.02); const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.6, t + off);
    g.gain.exponentialRampToValueAtTime(0.001, t + off + 0.02);
    n.connect(f); f.connect(g); g.connect(ctx.destination);
    n.start(t + off); n.stop(t + off + 0.02);
  }
  const dur = tailDur * dec;
  const n = makeNoise(ctx, dur); const f = ctx.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol * 0.5, t + burstCount * 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + burstCount * 0.01 + dur);
  n.connect(f); f.connect(g); g.connect(ctx.destination);
  n.start(t + burstCount * 0.01); n.stop(t + burstCount * 0.01 + dur);
}

const claps: SoundDef[] = [
  {
    id: 'clap-808', label: '808', category: 'clap',
    play(ctx, t, vol, dec) { playClap(ctx, t, vol, dec, 2500, 3, 0.15); },
  },
  {
    id: 'clap-tight', label: 'Tight', category: 'clap',
    play(ctx, t, vol, dec) { playClap(ctx, t, vol, dec, 3500, 2, 0.06); },
  },
  {
    id: 'clap-big', label: 'Big', category: 'clap',
    play(ctx, t, vol, dec) { playClap(ctx, t, vol, dec, 2000, 5, 0.25); },
  },
  {
    id: 'clap-room', label: 'Room', category: 'clap',
    play(ctx, t, vol, dec) { playClap(ctx, t, vol, dec, 1800, 4, 0.35); },
  },
];

// ── Toms ───────────────────────────────────────────────────

const toms: SoundDef[] = [
  {
    id: 'tom-high', label: 'High', category: 'tom',
    play(ctx, t, vol, dec) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(200, t);
      o.frequency.exponentialRampToValueAtTime(100, t + 0.15 * dec);
      g.gain.setValueAtTime(vol * 0.8, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2 * dec);
      o.start(t); o.stop(t + 0.2 * dec);
    },
  },
  {
    id: 'tom-mid', label: 'Mid', category: 'tom',
    play(ctx, t, vol, dec) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(70, t + 0.2 * dec);
      g.gain.setValueAtTime(vol * 0.8, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25 * dec);
      o.start(t); o.stop(t + 0.25 * dec);
    },
  },
  {
    id: 'tom-low', label: 'Low', category: 'tom',
    play(ctx, t, vol, dec) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(120, t);
      o.frequency.exponentialRampToValueAtTime(50, t + 0.2 * dec);
      g.gain.setValueAtTime(vol * 0.8, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3 * dec);
      o.start(t); o.stop(t + 0.3 * dec);
    },
  },
  {
    id: 'tom-floor', label: 'Floor', category: 'tom',
    play(ctx, t, vol, dec) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(90, t);
      o.frequency.exponentialRampToValueAtTime(35, t + 0.25 * dec);
      g.gain.setValueAtTime(vol * 0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4 * dec);
      o.start(t); o.stop(t + 0.4 * dec);
    },
  },
];

// ── Percussion ─────────────────────────────────────────────

const percs: SoundDef[] = [
  {
    id: 'perc-rimshot', label: 'Rimshot', category: 'perc',
    play(ctx, t, vol, dec) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'square'; o.frequency.value = 1700;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(vol * 0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.03 * dec);
      o.start(t); o.stop(t + 0.03 * dec);
      const n = makeNoise(ctx, 0.02 * dec); const ng = ctx.createGain();
      ng.gain.setValueAtTime(vol * 0.4, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.02 * dec);
      n.connect(ng); ng.connect(ctx.destination);
      n.start(t); n.stop(t + 0.02 * dec);
    },
  },
  {
    id: 'perc-cowbell', label: 'Cowbell', category: 'perc',
    play(ctx, t, vol, dec) {
      const o1 = ctx.createOscillator(); const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o1.type = 'square'; o2.type = 'square';
      o1.frequency.value = 587; o2.frequency.value = 845;
      g.gain.setValueAtTime(vol * 0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15 * dec);
      o1.connect(g); o2.connect(g); g.connect(ctx.destination);
      o1.start(t); o2.start(t);
      o1.stop(t + 0.15 * dec); o2.stop(t + 0.15 * dec);
    },
  },
  {
    id: 'perc-crash', label: 'Crash', category: 'perc',
    play(ctx, t, vol, dec) {
      const n = makeNoise(ctx, 0.8 * dec); const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 4000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.8 * dec);
      n.connect(f); f.connect(g); g.connect(ctx.destination);
      n.start(t); n.stop(t + 0.8 * dec);
    },
  },
  {
    id: 'perc-ride', label: 'Ride', category: 'perc',
    play(ctx, t, vol, dec) {
      const n = makeNoise(ctx, 0.4 * dec); const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 8000; f.Q.value = 2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4 * dec);
      n.connect(f); f.connect(g); g.connect(ctx.destination);
      n.start(t); n.stop(t + 0.4 * dec);
    },
  },
  {
    id: 'perc-conga', label: 'Conga', category: 'perc',
    play(ctx, t, vol, dec) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(340, t);
      o.frequency.exponentialRampToValueAtTime(160, t + 0.08 * dec);
      g.gain.setValueAtTime(vol * 0.7, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18 * dec);
      o.start(t); o.stop(t + 0.18 * dec);
    },
  },
  {
    id: 'perc-shaker', label: 'Shaker', category: 'perc',
    play(ctx, t, vol, dec) {
      const n = makeNoise(ctx, 0.06 * dec); const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 9000; f.Q.value = 1.5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.25, t);
      g.gain.linearRampToValueAtTime(vol * 0.15, t + 0.02 * dec);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.06 * dec);
      n.connect(f); f.connect(g); g.connect(ctx.destination);
      n.start(t); n.stop(t + 0.06 * dec);
    },
  },
  {
    id: 'perc-tambourine', label: 'Tamb', category: 'perc',
    play(ctx, t, vol, dec) {
      const n = makeNoise(ctx, 0.1 * dec); const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 7000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1 * dec);
      n.connect(f); f.connect(g); g.connect(ctx.destination);
      n.start(t); n.stop(t + 0.1 * dec);
      // metallic ring
      const o = ctx.createOscillator(); const og = ctx.createGain();
      o.type = 'square'; o.frequency.value = 5200;
      o.connect(og); og.connect(ctx.destination);
      og.gain.setValueAtTime(vol * 0.1, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.08 * dec);
      o.start(t); o.stop(t + 0.08 * dec);
    },
  },
  {
    id: 'perc-click', label: 'Click', category: 'perc',
    play(ctx, t, vol, dec) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 1500;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(vol * 0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.015 * dec);
      o.start(t); o.stop(t + 0.015 * dec);
    },
  },
];

// ── Full catalog ───────────────────────────────────────────

export const SOUND_CATALOG: SoundDef[] = [
  ...kicks, ...snares, ...closedHats, ...openHats, ...claps, ...toms, ...percs,
];

export const SOUNDS_BY_CATEGORY: Record<SoundCategory, SoundDef[]> = {
  kick: kicks,
  snare: snares,
  closedHat: closedHats,
  openHat: openHats,
  clap: claps,
  tom: toms,
  perc: percs,
};

export const CATEGORY_LABELS: Record<SoundCategory, string> = {
  kick: 'Kicks',
  snare: 'Snares',
  closedHat: 'Closed Hats',
  openHat: 'Open Hats',
  clap: 'Claps',
  tom: 'Toms',
  perc: 'Percussion',
};

export function getSoundById(id: string): SoundDef | undefined {
  return SOUND_CATALOG.find(s => s.id === id);
}

export function playSoundById(id: string, time?: number, volume = 1, decay = 1) {
  const ctx = getCtx();
  const t = time ?? ctx.currentTime;
  const def = getSoundById(id);
  if (def) def.play(ctx, t, volume, decay);
}
