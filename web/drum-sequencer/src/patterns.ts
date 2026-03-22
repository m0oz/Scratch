import type { DrumSound } from './audioEngine';

export interface Track {
  name: string;
  sound: DrumSound;
  color: string;
  steps: boolean[];
}

export interface Pattern {
  name: string;
  bpm: number;
  steps: number; // 16 or 32
  tracks: Track[];
}

function makeSteps(stepCount: number, active: number[]): boolean[] {
  const steps = new Array(stepCount).fill(false);
  for (const i of active) if (i < stepCount) steps[i] = true;
  return steps;
}

const TRACK_COLORS = [
  '#ff3b30', '#ff9500', '#ffcc00', '#34c759',
  '#5ac8fa', '#007aff', '#5856d6', '#af52de',
];

export const DEFAULT_TRACKS: (stepCount?: number) => Track[] = (stepCount = 16) => [
  { name: 'KICK', sound: 'kick', color: TRACK_COLORS[0], steps: new Array(stepCount).fill(false) },
  { name: 'SNARE', sound: 'snare', color: TRACK_COLORS[1], steps: new Array(stepCount).fill(false) },
  { name: 'C.HAT', sound: 'closedHat', color: TRACK_COLORS[2], steps: new Array(stepCount).fill(false) },
  { name: 'O.HAT', sound: 'openHat', color: TRACK_COLORS[3], steps: new Array(stepCount).fill(false) },
  { name: 'CLAP', sound: 'clap', color: TRACK_COLORS[4], steps: new Array(stepCount).fill(false) },
  { name: 'TOM', sound: 'tom', color: TRACK_COLORS[5], steps: new Array(stepCount).fill(false) },
  { name: 'RIM', sound: 'rimshot', color: TRACK_COLORS[6], steps: new Array(stepCount).fill(false) },
  { name: 'COWBELL', sound: 'cowbell', color: TRACK_COLORS[7], steps: new Array(stepCount).fill(false) },
];

// ── Amen Break ──────────────────────────────────────────────
// 2-bar pattern at 136 BPM — the most sampled loop in music history
// The Winstons - "Amen, Brother" (1969)
const S32 = 32;
export const AMEN_BREAK: Pattern = {
  name: 'Amen Break',
  bpm: 136,
  steps: S32,
  tracks: [
    { name: 'KICK',  sound: 'kick',      color: TRACK_COLORS[0], steps: makeSteps(S32, [0, 9, 10, 16, 20, 22, 26]) },
    { name: 'SNARE', sound: 'snare',     color: TRACK_COLORS[1], steps: makeSteps(S32, [4, 10, 12, 20, 24, 28]) },
    { name: 'C.HAT', sound: 'closedHat', color: TRACK_COLORS[2], steps: makeSteps(S32, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]) },
    { name: 'O.HAT', sound: 'openHat',   color: TRACK_COLORS[3], steps: makeSteps(S32, []) },
    { name: 'RIDE',  sound: 'ride',      color: TRACK_COLORS[4], steps: makeSteps(S32, []) },
    { name: 'TOM',   sound: 'tom',       color: TRACK_COLORS[5], steps: makeSteps(S32, []) },
    { name: 'RIM',   sound: 'rimshot',   color: TRACK_COLORS[6], steps: makeSteps(S32, []) },
    { name: 'CRASH', sound: 'crash',     color: TRACK_COLORS[7], steps: makeSteps(S32, [0]) },
  ],
};

// ── Four on the Floor ───────────────────────────────────────
const S16 = 16;
export const FOUR_ON_FLOOR: Pattern = {
  name: 'Four on the Floor',
  bpm: 120,
  steps: S16,
  tracks: [
    { name: 'KICK',  sound: 'kick',      color: TRACK_COLORS[0], steps: makeSteps(S16, [0, 4, 8, 12]) },
    { name: 'SNARE', sound: 'snare',     color: TRACK_COLORS[1], steps: makeSteps(S16, [4, 12]) },
    { name: 'C.HAT', sound: 'closedHat', color: TRACK_COLORS[2], steps: makeSteps(S16, [0, 2, 4, 6, 8, 10, 12, 14]) },
    { name: 'O.HAT', sound: 'openHat',   color: TRACK_COLORS[3], steps: makeSteps(S16, []) },
    { name: 'CLAP',  sound: 'clap',      color: TRACK_COLORS[4], steps: makeSteps(S16, [4, 12]) },
    { name: 'TOM',   sound: 'tom',       color: TRACK_COLORS[5], steps: makeSteps(S16, []) },
    { name: 'RIM',   sound: 'rimshot',   color: TRACK_COLORS[6], steps: makeSteps(S16, []) },
    { name: 'COWBELL', sound: 'cowbell',  color: TRACK_COLORS[7], steps: makeSteps(S16, []) },
  ],
};

// ── Boom Bap ────────────────────────────────────────────────
// Classic 90s hip-hop feel
export const BOOM_BAP: Pattern = {
  name: 'Boom Bap',
  bpm: 90,
  steps: S16,
  tracks: [
    { name: 'KICK',  sound: 'kick',      color: TRACK_COLORS[0], steps: makeSteps(S16, [0, 5, 8, 13]) },
    { name: 'SNARE', sound: 'snare',     color: TRACK_COLORS[1], steps: makeSteps(S16, [4, 12]) },
    { name: 'C.HAT', sound: 'closedHat', color: TRACK_COLORS[2], steps: makeSteps(S16, [0, 2, 4, 6, 8, 10, 12, 14]) },
    { name: 'O.HAT', sound: 'openHat',   color: TRACK_COLORS[3], steps: makeSteps(S16, [6, 14]) },
    { name: 'CLAP',  sound: 'clap',      color: TRACK_COLORS[4], steps: makeSteps(S16, []) },
    { name: 'TOM',   sound: 'tom',       color: TRACK_COLORS[5], steps: makeSteps(S16, []) },
    { name: 'RIM',   sound: 'rimshot',   color: TRACK_COLORS[6], steps: makeSteps(S16, []) },
    { name: 'SHAKER', sound: 'shaker',   color: TRACK_COLORS[7], steps: makeSteps(S16, []) },
  ],
};

// ── Dembow ──────────────────────────────────────────────────
export const DEMBOW: Pattern = {
  name: 'Dembow',
  bpm: 100,
  steps: S16,
  tracks: [
    { name: 'KICK',  sound: 'kick',      color: TRACK_COLORS[0], steps: makeSteps(S16, [0, 3, 4, 7, 8, 11, 12, 15]) },
    { name: 'SNARE', sound: 'snare',     color: TRACK_COLORS[1], steps: makeSteps(S16, [3, 7, 11, 15]) },
    { name: 'C.HAT', sound: 'closedHat', color: TRACK_COLORS[2], steps: makeSteps(S16, [0, 2, 4, 6, 8, 10, 12, 14]) },
    { name: 'O.HAT', sound: 'openHat',   color: TRACK_COLORS[3], steps: makeSteps(S16, []) },
    { name: 'CLAP',  sound: 'clap',      color: TRACK_COLORS[4], steps: makeSteps(S16, []) },
    { name: 'TOM',   sound: 'tom',       color: TRACK_COLORS[5], steps: makeSteps(S16, []) },
    { name: 'RIM',   sound: 'rimshot',   color: TRACK_COLORS[6], steps: makeSteps(S16, [3, 7, 11, 15]) },
    { name: 'COWBELL', sound: 'cowbell',  color: TRACK_COLORS[7], steps: makeSteps(S16, []) },
  ],
};

// ── Think Break ─────────────────────────────────────────────
// Lyn Collins - "Think (About It)" — classic funk breakbeat
export const THINK_BREAK: Pattern = {
  name: 'Think Break',
  bpm: 116,
  steps: S32,
  tracks: [
    { name: 'KICK',  sound: 'kick',      color: TRACK_COLORS[0], steps: makeSteps(S32, [0, 6, 8, 14, 16, 22, 24, 30]) },
    { name: 'SNARE', sound: 'snare',     color: TRACK_COLORS[1], steps: makeSteps(S32, [4, 12, 20, 28]) },
    { name: 'C.HAT', sound: 'closedHat', color: TRACK_COLORS[2], steps: makeSteps(S32, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]) },
    { name: 'O.HAT', sound: 'openHat',   color: TRACK_COLORS[3], steps: makeSteps(S32, [14, 30]) },
    { name: 'CLAP',  sound: 'clap',      color: TRACK_COLORS[4], steps: makeSteps(S32, [4, 12, 20, 28]) },
    { name: 'TOM',   sound: 'tom',       color: TRACK_COLORS[5], steps: makeSteps(S32, []) },
    { name: 'RIM',   sound: 'rimshot',   color: TRACK_COLORS[6], steps: makeSteps(S32, []) },
    { name: 'CONGA', sound: 'conga',     color: TRACK_COLORS[7], steps: makeSteps(S32, []) },
  ],
};

// ── Funky Drummer ───────────────────────────────────────────
// James Brown / Clyde Stubblefield — the second most sampled break
export const FUNKY_DRUMMER: Pattern = {
  name: 'Funky Drummer',
  bpm: 102,
  steps: S32,
  tracks: [
    { name: 'KICK',  sound: 'kick',      color: TRACK_COLORS[0], steps: makeSteps(S32, [0, 7, 8, 10, 16, 23, 24, 26]) },
    { name: 'SNARE', sound: 'snare',     color: TRACK_COLORS[1], steps: makeSteps(S32, [4, 10, 12, 14, 20, 26, 28, 30]) },
    { name: 'C.HAT', sound: 'closedHat', color: TRACK_COLORS[2], steps: makeSteps(S32, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]) },
    { name: 'O.HAT', sound: 'openHat',   color: TRACK_COLORS[3], steps: makeSteps(S32, []) },
    { name: 'CLAP',  sound: 'clap',      color: TRACK_COLORS[4], steps: makeSteps(S32, []) },
    { name: 'TOM',   sound: 'tom',       color: TRACK_COLORS[5], steps: makeSteps(S32, []) },
    { name: 'RIM',   sound: 'rimshot',   color: TRACK_COLORS[6], steps: makeSteps(S32, []) },
    { name: 'COWBELL', sound: 'cowbell',  color: TRACK_COLORS[7], steps: makeSteps(S32, []) },
  ],
};

// ── Lo-Fi Chill ─────────────────────────────────────────────
// Dusty, laid-back lo-fi hip-hop beat
export const LOFI_CHILL: Pattern = {
  name: 'Lo-Fi Chill',
  bpm: 78,
  steps: S16,
  tracks: [
    { name: 'KICK',   sound: 'kick',      color: TRACK_COLORS[0], steps: makeSteps(S16, [0, 5, 8, 10]) },
    { name: 'SNARE',  sound: 'snare',     color: TRACK_COLORS[1], steps: makeSteps(S16, [4, 12]) },
    { name: 'C.HAT',  sound: 'closedHat', color: TRACK_COLORS[2], steps: makeSteps(S16, [0, 2, 4, 6, 8, 10, 12, 14]) },
    { name: 'O.HAT',  sound: 'openHat',   color: TRACK_COLORS[3], steps: makeSteps(S16, [3, 11]) },
    { name: 'SHAKER', sound: 'shaker',    color: TRACK_COLORS[4], steps: makeSteps(S16, [1, 3, 5, 7, 9, 11, 13, 15]) },
    { name: 'RIM',    sound: 'rimshot',   color: TRACK_COLORS[5], steps: makeSteps(S16, []) },
    { name: 'CONGA',  sound: 'conga',     color: TRACK_COLORS[6], steps: makeSteps(S16, []) },
    { name: 'RIDE',   sound: 'ride',      color: TRACK_COLORS[7], steps: makeSteps(S16, []) },
  ],
};

// ── Lo-Fi Dusty ─────────────────────────────────────────────
// J Dilla-inspired off-grid feel
export const LOFI_DUSTY: Pattern = {
  name: 'Lo-Fi Dusty',
  bpm: 84,
  steps: S16,
  tracks: [
    { name: 'KICK',   sound: 'kick',      color: TRACK_COLORS[0], steps: makeSteps(S16, [0, 3, 7, 8, 11]) },
    { name: 'SNARE',  sound: 'snare',     color: TRACK_COLORS[1], steps: makeSteps(S16, [4, 13]) },
    { name: 'C.HAT',  sound: 'closedHat', color: TRACK_COLORS[2], steps: makeSteps(S16, [0, 2, 4, 6, 8, 10, 12, 14]) },
    { name: 'O.HAT',  sound: 'openHat',   color: TRACK_COLORS[3], steps: makeSteps(S16, [6, 14]) },
    { name: 'SHAKER', sound: 'shaker',    color: TRACK_COLORS[4], steps: makeSteps(S16, [1, 5, 9, 13]) },
    { name: 'RIM',    sound: 'rimshot',   color: TRACK_COLORS[5], steps: makeSteps(S16, [2, 10]) },
    { name: 'CONGA',  sound: 'conga',     color: TRACK_COLORS[6], steps: makeSteps(S16, []) },
    { name: 'RIDE',   sound: 'ride',      color: TRACK_COLORS[7], steps: makeSteps(S16, []) },
  ],
};

// ── Impeach the President ───────────────────────────────────
// The Honeydrippers — classic breakbeat
export const IMPEACH: Pattern = {
  name: 'Impeach Break',
  bpm: 104,
  steps: S32,
  tracks: [
    { name: 'KICK',  sound: 'kick',      color: TRACK_COLORS[0], steps: makeSteps(S32, [0, 6, 8, 16, 22, 24]) },
    { name: 'SNARE', sound: 'snare',     color: TRACK_COLORS[1], steps: makeSteps(S32, [4, 12, 20, 28]) },
    { name: 'C.HAT', sound: 'closedHat', color: TRACK_COLORS[2], steps: makeSteps(S32, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]) },
    { name: 'O.HAT', sound: 'openHat',   color: TRACK_COLORS[3], steps: makeSteps(S32, [14, 30]) },
    { name: 'CLAP',  sound: 'clap',      color: TRACK_COLORS[4], steps: makeSteps(S32, []) },
    { name: 'TOM',   sound: 'tom',       color: TRACK_COLORS[5], steps: makeSteps(S32, []) },
    { name: 'RIM',   sound: 'rimshot',   color: TRACK_COLORS[6], steps: makeSteps(S32, []) },
    { name: 'RIDE',  sound: 'ride',      color: TRACK_COLORS[7], steps: makeSteps(S32, []) },
  ],
};

// ── Trap ────────────────────────────────────────────────────
// Modern trap hi-hat rolls
export const TRAP: Pattern = {
  name: 'Trap',
  bpm: 140,
  steps: S32,
  tracks: [
    { name: 'KICK',  sound: 'kick',      color: TRACK_COLORS[0], steps: makeSteps(S32, [0, 3, 14, 16, 19, 30]) },
    { name: 'SNARE', sound: 'snare',     color: TRACK_COLORS[1], steps: makeSteps(S32, [8, 24]) },
    { name: 'C.HAT', sound: 'closedHat', color: TRACK_COLORS[2], steps: makeSteps(S32, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]) },
    { name: 'O.HAT', sound: 'openHat',   color: TRACK_COLORS[3], steps: makeSteps(S32, []) },
    { name: 'CLAP',  sound: 'clap',      color: TRACK_COLORS[4], steps: makeSteps(S32, [8, 24]) },
    { name: 'TOM',   sound: 'tom',       color: TRACK_COLORS[5], steps: makeSteps(S32, []) },
    { name: 'RIM',   sound: 'rimshot',   color: TRACK_COLORS[6], steps: makeSteps(S32, []) },
    { name: 'COWBELL', sound: 'cowbell',  color: TRACK_COLORS[7], steps: makeSteps(S32, []) },
  ],
};

export const PRESETS: Pattern[] = [
  AMEN_BREAK,
  FUNKY_DRUMMER,
  THINK_BREAK,
  IMPEACH,
  BOOM_BAP,
  LOFI_CHILL,
  LOFI_DUSTY,
  TRAP,
  FOUR_ON_FLOOR,
  DEMBOW,
];
