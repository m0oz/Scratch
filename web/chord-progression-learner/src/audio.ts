// Web Audio synth + accompaniment patterns. Piano-ish voice, no samples.

let audioCtx: AudioContext | null = null;
let master: GainNode | null = null;
let activeOscs: OscillatorNode[] = [];

function ctx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (!master) {
    master = audioCtx.createGain();
    master.gain.value = 0.7;
    master.connect(audioCtx.destination);
  }
  return audioCtx;
}

export async function resumeAudio(): Promise<void> {
  const c = ctx();
  if (c.state === 'suspended') await c.resume();
}

function mtof(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Piano-like single note: triangle fundamental + soft sine 2x harmonic,
// lowpass with falling cutoff, exponential decay envelope.
function playNote(midi: number, when: number, duration: number, volume = 0.25): void {
  const c = ctx();
  const out = master!;
  const freq = mtof(midi);

  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;

  const osc2 = c.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = freq * 2;

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(4500, when);
  filter.frequency.exponentialRampToValueAtTime(900, when + duration);
  filter.Q.value = 0.4;

  const gain = c.createGain();
  const gain2 = c.createGain();

  osc.connect(gain);
  osc2.connect(gain2);
  gain.connect(filter);
  gain2.connect(filter);
  filter.connect(out);

  const attack = 0.005;
  const dec = Math.max(duration, 0.08);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dec);

  gain2.gain.setValueAtTime(0.0001, when);
  gain2.gain.exponentialRampToValueAtTime(volume * 0.15, when + attack);
  gain2.gain.exponentialRampToValueAtTime(0.0001, when + Math.min(dec, 0.6));

  const stopAt = when + dec + 0.05;
  osc.start(when); osc.stop(stopAt);
  osc2.start(when); osc2.stop(stopAt);

  activeOscs.push(osc, osc2);
  const cleanup = () => {
    activeOscs = activeOscs.filter(o => o !== osc && o !== osc2);
  };
  osc.onended = cleanup;
}

// Immediately stop everything scheduled.
export function stopAllAudio(): void {
  const c = ctx();
  const now = c.currentTime;
  for (const o of activeOscs) {
    try { o.stop(now); } catch { /* already stopped */ }
  }
  activeOscs = [];
}

// ── Patterns ─────────────────────────────────────────────────────────

// Each pattern takes a chord (sorted ascending MIDI notes [root, third, fifth, (7th)]),
// a start time, and one-beat duration. It schedules audio for ONE bar.
export type PatternId = 'block' | 'rhythmic' | 'arpUp' | 'arpUpDown' | 'alberti' | 'ballad';

type Pattern = {
  id: PatternId;
  label: string;
  description: string;
  schedule: (chord: number[], start: number, beat: number) => void;
};

const PATTERN_LIST: Pattern[] = [
  {
    id: 'block',
    label: 'Sustained Chord',
    description: 'Hold the whole chord for the full bar.',
    schedule(chord, start, beat) {
      const bass = chord[0] - 12;
      const dur = beat * 4;
      playNote(bass, start, dur, 0.22);
      for (const n of chord) playNote(n, start, dur, 0.18);
    },
  },
  {
    id: 'rhythmic',
    label: 'Rhythmic Chords',
    description: 'Strum the chord on each beat — like a strummed guitar.',
    schedule(chord, start, beat) {
      const bass = chord[0] - 12;
      for (let i = 0; i < 4; i++) {
        const t = start + i * beat;
        playNote(bass, t, beat * 0.95, 0.22);
        for (const n of chord) playNote(n, t, beat * 0.85, 0.16);
      }
    },
  },
  {
    id: 'arpUp',
    label: 'Arpeggio Up',
    description: 'Eighth-note arpeggio climbing up the chord.',
    schedule(chord, start, beat) {
      const bass = chord[0] - 12;
      playNote(bass, start, beat * 4, 0.18);
      const notes = [...chord, chord[0] + 12];
      const eighth = beat / 2;
      for (let i = 0; i < 8; i++) {
        const t = start + i * eighth;
        playNote(notes[i % notes.length], t, eighth * 1.1, 0.22);
      }
    },
  },
  {
    id: 'arpUpDown',
    label: 'Arpeggio Up/Down',
    description: 'Classic rolling arpeggio: up and back down.',
    schedule(chord, start, beat) {
      const bass = chord[0] - 12;
      playNote(bass, start, beat * 4, 0.18);
      const up = [...chord, chord[0] + 12];
      const seq = [...up, ...up.slice(1, -1).reverse()]; // up then down (no repeats at ends)
      const stepDur = (beat * 4) / seq.length;
      for (let i = 0; i < seq.length; i++) {
        const t = start + i * stepDur;
        playNote(seq[i], t, stepDur * 1.1, 0.22);
      }
    },
  },
  {
    id: 'alberti',
    label: 'Alberti Bass',
    description: 'Classical bass pattern: low-high-mid-high.',
    schedule(chord, start, beat) {
      const lowRoot = chord[0] - 12;
      const seq = [lowRoot, chord[2], chord[1], chord[2]]; // root-5-3-5 (down low)
      const eighth = beat / 2;
      for (let i = 0; i < 8; i++) {
        const t = start + i * eighth;
        playNote(seq[i % 4], t, eighth * 1.1, 0.24);
      }
      // Soft top voice
      for (const n of chord) playNote(n, start, beat * 4, 0.06);
    },
  },
  {
    id: 'ballad',
    label: 'Ballad',
    description: 'Bass on the downbeats, chord swells in between.',
    schedule(chord, start, beat) {
      const bass = chord[0] - 12;
      playNote(bass, start, beat * 2, 0.28);
      playNote(bass, start + beat * 2, beat * 2, 0.28);
      // Light chord pulses on 2 and 4
      const pulse = (t: number) => {
        for (const n of chord) playNote(n, t, beat * 0.9, 0.14);
      };
      pulse(start + beat);
      pulse(start + beat * 3);
      // Top-note sustained pad
      playNote(chord[chord.length - 1], start, beat * 4, 0.08);
    },
  },
];

export const PATTERNS: Record<PatternId, Pattern> = Object.fromEntries(
  PATTERN_LIST.map(p => [p.id, p]),
) as Record<PatternId, Pattern>;

export const PATTERN_IDS: PatternId[] = PATTERN_LIST.map(p => p.id);

// ── High-level playback ──────────────────────────────────────────────

export type PlaybackHandle = {
  stop: () => void;
};

// Schedule a progression. Returns a handle that can stop playback and clears UI timers.
export function playProgression(
  chords: number[][],
  patternId: PatternId,
  tempo: number,
  options: {
    loop?: boolean;
    onBarStart?: (index: number) => void;
    onComplete?: () => void;
  } = {},
): PlaybackHandle {
  const c = ctx();
  const beat = 60 / tempo;
  const bar = beat * 4;
  const pat = PATTERNS[patternId];
  const start = c.currentTime + 0.08;
  const startMs = performance.now() + 80;

  const loop = options.loop ?? false;
  // For "loop" we just front-schedule many passes — simple and good enough for a sandbox.
  const passes = loop ? 16 : 1;
  for (let p = 0; p < passes; p++) {
    chords.forEach((chord, i) => {
      pat.schedule(chord, start + (p * chords.length + i) * bar, beat);
    });
  }

  // UI timers
  const timers: number[] = [];
  const totalBars = passes * chords.length;
  for (let b = 0; b < totalBars; b++) {
    const idx = b % chords.length;
    const t = setTimeout(() => options.onBarStart?.(idx), Math.max(0, startMs + b * bar * 1000 - performance.now()));
    timers.push(t as unknown as number);
  }
  if (!loop) {
    const doneT = setTimeout(() => options.onComplete?.(), Math.max(0, startMs + totalBars * bar * 1000 - performance.now()));
    timers.push(doneT as unknown as number);
  }

  return {
    stop: () => {
      for (const t of timers) clearTimeout(t);
      stopAllAudio();
    },
  };
}

// One-shot chord (for chord-pad previews).
export function playChordOnce(chord: number[], duration = 1.0, volume = 0.22): void {
  const c = ctx();
  const t = c.currentTime + 0.01;
  const bass = chord[0] - 12;
  playNote(bass, t, duration, volume);
  for (const n of chord) playNote(n, t, duration, volume * 0.8);
}
