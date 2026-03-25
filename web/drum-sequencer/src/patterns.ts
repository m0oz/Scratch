export interface Track {
  name: string;
  soundId: string;    // references audioEngine SoundDef.id
  color: string;
  volume: number;     // 0–1
  decay: number;      // 0.2–2.0 multiplier
  steps: boolean[];
}

export interface Pattern {
  name: string;
  bpm: number;
  steps: number;
  tracks: Track[];
}

export interface PresetGroup {
  label: string;
  patterns: Pattern[];
}

function makeSteps(stepCount: number, active: number[]): boolean[] {
  const steps = new Array(stepCount).fill(false);
  for (const i of active) if (i < stepCount) steps[i] = true;
  return steps;
}

const C = [
  '#ff3b30', '#ff9500', '#ffcc00', '#34c759',
  '#5ac8fa', '#007aff', '#5856d6', '#af52de',
];

function t(name: string, soundId: string, color: string, stepCount: number, active: number[], vol = 1, dec = 1): Track {
  return { name, soundId, color, volume: vol, decay: dec, steps: makeSteps(stepCount, active) };
}

export const DEFAULT_TRACKS = (stepCount = 16): Track[] => [
  t('KICK', 'kick-808', C[0], stepCount, []),
  t('SNARE', 'snare-808', C[1], stepCount, []),
  t('C.HAT', 'chat-808', C[2], stepCount, []),
  t('O.HAT', 'ohat-808', C[3], stepCount, []),
  t('CLAP', 'clap-808', C[4], stepCount, []),
  t('TOM', 'tom-mid', C[5], stepCount, []),
  t('RIM', 'perc-rimshot', C[6], stepCount, []),
  t('COWBELL', 'perc-cowbell', C[7], stepCount, []),
];

const S16 = 16;
const S32 = 32;

// ── DrumSpy Blog Patterns — Rock & Pop ─────────────────────

export const MONEY_BEAT_1: Pattern = {
  name: 'Money Beat (Basic)', bpm: 120, steps: S16,
  tracks: [
    t('KICK',  'kick-909',    C[0], S16, [0, 8]),
    t('SNARE', 'snare-909',   C[1], S16, [4, 12]),
    t('C.HAT', 'chat-808',    C[2], S16, [0, 2, 4, 6, 8, 10, 12, 14]),
    t('O.HAT', 'ohat-808',    C[3], S16, []),
    t('CLAP',  'clap-808',    C[4], S16, []),
    t('TOM',   'tom-mid',     C[5], S16, []),
    t('RIM',   'perc-rimshot', C[6], S16, []),
    t('COWBELL','perc-cowbell', C[7], S16, []),
  ],
};

export const MONEY_BEAT_2: Pattern = {
  name: 'Money Beat (Open Hat)', bpm: 120, steps: S16,
  tracks: [
    t('KICK',  'kick-909',    C[0], S16, [0, 8]),
    t('SNARE', 'snare-909',   C[1], S16, [4, 12]),
    t('C.HAT', 'chat-808',    C[2], S16, [0, 2, 4, 8, 10, 12]),
    t('O.HAT', 'ohat-808',    C[3], S16, [6, 14]),
    t('CLAP',  'clap-808',    C[4], S16, []),
    t('TOM',   'tom-mid',     C[5], S16, []),
    t('RIM',   'perc-rimshot', C[6], S16, []),
    t('COWBELL','perc-cowbell', C[7], S16, []),
  ],
};

export const MONEY_BEAT_3: Pattern = {
  name: 'Money Beat (Groovy)', bpm: 116, steps: S16,
  tracks: [
    t('KICK',  'kick-909',    C[0], S16, [0, 6, 8, 10]),
    t('SNARE', 'snare-909',   C[1], S16, [4, 12]),
    t('C.HAT', 'chat-808',    C[2], S16, [0, 2, 4, 8, 10, 12]),
    t('O.HAT', 'ohat-808',    C[3], S16, [6, 14]),
    t('CLAP',  'clap-808',    C[4], S16, []),
    t('TOM',   'tom-mid',     C[5], S16, []),
    t('RIM',   'perc-rimshot', C[6], S16, []),
    t('COWBELL','perc-cowbell', C[7], S16, []),
  ],
};

export const ROCKABILLY: Pattern = {
  name: 'Rockabilly', bpm: 155, steps: S16,
  tracks: [
    t('KICK',   'kick-tight',   C[0], S16, [0, 8]),
    t('SNARE',  'snare-808',    C[1], S16, [4, 7, 12, 15]),
    t('C.HAT',  'chat-808',     C[2], S16, [0, 2, 4, 6, 8, 10, 12, 14]),
    t('O.HAT',  'ohat-808',     C[3], S16, []),
    t('CLAP',   'clap-808',     C[4], S16, []),
    t('TOM',    'tom-mid',      C[5], S16, []),
    t('RIM',    'perc-rimshot',  C[6], S16, [2, 6, 10, 14]),
    t('COWBELL', 'perc-cowbell', C[7], S16, []),
  ],
};

export const TRAIN_BEAT: Pattern = {
  name: 'Train Beat', bpm: 130, steps: S16,
  tracks: [
    t('KICK',  'kick-808',     C[0], S16, [0, 8]),
    t('SNARE', 'snare-808',    C[1], S16, [0, 2, 4, 6, 8, 10, 12, 14]),
    t('C.HAT', 'chat-808',     C[2], S16, [0, 4, 8, 12]),
    t('O.HAT', 'ohat-808',     C[3], S16, []),
    t('CLAP',  'clap-808',     C[4], S16, []),
    t('TOM',   'tom-mid',      C[5], S16, []),
    t('RIM',   'perc-rimshot',  C[6], S16, [1, 3, 5, 7, 9, 11, 13, 15], 0.5),
    t('COWBELL','perc-cowbell',  C[7], S16, []),
  ],
};

export const GOSPEL: Pattern = {
  name: 'Gospel', bpm: 115, steps: S16,
  tracks: [
    t('KICK',  'kick-808',     C[0], S16, [0, 6, 8, 14]),
    t('SNARE', 'snare-808',    C[1], S16, [4, 12]),
    t('C.HAT', 'chat-808',     C[2], S16, [0, 2, 4, 6, 8, 10, 12, 14]),
    t('O.HAT', 'ohat-808',     C[3], S16, [14]),
    t('CLAP',  'clap-808',     C[4], S16, []),
    t('TOM',   'tom-mid',      C[5], S16, []),
    t('RIM',   'perc-rimshot',  C[6], S16, []),
    t('COWBELL','perc-tambourine', C[7], S16, [0, 2, 4, 6, 8, 10, 12, 14], 0.4),
  ],
};

export const MOTOWN: Pattern = {
  name: 'Motown', bpm: 105, steps: S16,
  tracks: [
    t('KICK',  'kick-808',      C[0], S16, [0, 8]),
    t('SNARE', 'snare-808',     C[1], S16, [4, 12]),
    t('C.HAT', 'chat-808',      C[2], S16, [0, 4, 8, 12]),
    t('O.HAT', 'ohat-808',      C[3], S16, []),
    t('CLAP',  'clap-808',      C[4], S16, []),
    t('TOM',   'tom-mid',       C[5], S16, []),
    t('TAMB',  'perc-tambourine', C[6], S16, [0, 2, 4, 6, 8, 10, 12, 14], 0.5),
    t('COWBELL','perc-cowbell',   C[7], S16, []),
  ],
};

export const WALK_THIS_WAY: Pattern = {
  name: 'Walk This Way', bpm: 108, steps: S16,
  tracks: [
    t('KICK',  'kick-tight',   C[0], S16, [0, 7, 8]),
    t('SNARE', 'snare-crack',  C[1], S16, [4, 10, 12, 14]),
    t('C.HAT', 'chat-808',    C[2], S16, [0, 2, 4, 6, 8, 10, 12, 14]),
    t('O.HAT', 'ohat-808',    C[3], S16, [2, 10]),
    t('CLAP',  'clap-808',    C[4], S16, []),
    t('TOM',   'tom-mid',     C[5], S16, []),
    t('RIM',   'perc-rimshot', C[6], S16, []),
    t('COWBELL','perc-cowbell', C[7], S16, []),
  ],
};

// ── DrumSpy Blog Patterns — Reggae ─────────────────────────

export const REGGAE_1: Pattern = {
  name: 'Reggae (One Drop)', bpm: 75, steps: S16,
  tracks: [
    t('KICK',  'kick-808',     C[0], S16, [8]),
    t('SNARE', 'snare-808',    C[1], S16, []),
    t('C.HAT', 'chat-808',     C[2], S16, [0, 2, 4, 6, 10, 12, 14]),
    t('O.HAT', 'ohat-loose',   C[3], S16, [10]),
    t('CLAP',  'clap-808',     C[4], S16, []),
    t('TOM',   'tom-mid',      C[5], S16, []),
    t('RIM',   'perc-rimshot',  C[6], S16, [8]),
    t('COWBELL','perc-cowbell',  C[7], S16, []),
  ],
};

export const REGGAE_2: Pattern = {
  name: 'Reggae (Expanded)', bpm: 78, steps: S16,
  tracks: [
    t('KICK',   'kick-808',     C[0], S16, [8]),
    t('SNARE',  'snare-808',    C[1], S16, []),
    t('C.HAT',  'chat-808',     C[2], S16, [0, 2, 4, 8, 12, 14]),
    t('O.HAT',  'ohat-loose',   C[3], S16, [6, 10]),
    t('RIM',    'perc-rimshot',  C[4], S16, [8, 10, 12]),
    t('LO TOM', 'tom-low',      C[5], S16, [10, 12]),
    t('HI TOM', 'tom-high',     C[6], S16, [14, 15]),
    t('COWBELL', 'perc-cowbell', C[7], S16, []),
  ],
};

export const REGGAE_3: Pattern = {
  name: 'Reggae (Full Kit)', bpm: 80, steps: S16,
  tracks: [
    t('KICK',   'kick-808',     C[0], S16, [0, 8]),
    t('SNARE',  'snare-808',    C[1], S16, [4, 12]),
    t('C.HAT',  'chat-808',     C[2], S16, [0, 2, 4, 6, 8, 10, 12]),
    t('O.HAT',  'ohat-loose',   C[3], S16, [2]),
    t('LO TOM', 'tom-low',      C[5], S16, [6]),
    t('HI TOM', 'tom-high',     C[6], S16, [5, 6]),
    t('CLAP',   'clap-808',     C[4], S16, [14]),
    t('RIM',    'perc-rimshot',  C[7], S16, []),
  ],
};

// ── Existing Breakbeat Patterns ────────────────────────────

export const AMEN_BREAK: Pattern = {
  name: 'Amen Break', bpm: 136, steps: S32,
  tracks: [
    t('KICK',  'kick-808',   C[0], S32, [0, 9, 10, 16, 20, 22, 26]),
    t('SNARE', 'snare-808',  C[1], S32, [4, 10, 12, 20, 24, 28]),
    t('C.HAT', 'chat-808',   C[2], S32, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]),
    t('O.HAT', 'ohat-808',   C[3], S32, []),
    t('RIDE',  'perc-ride',   C[4], S32, []),
    t('TOM',   'tom-mid',    C[5], S32, []),
    t('RIM',   'perc-rimshot',C[6], S32, []),
    t('CRASH', 'perc-crash',  C[7], S32, [0]),
  ],
};

export const FUNKY_DRUMMER: Pattern = {
  name: 'Funky Drummer', bpm: 102, steps: S32,
  tracks: [
    t('KICK',  'kick-808',   C[0], S32, [0, 7, 8, 10, 16, 23, 24, 26]),
    t('SNARE', 'snare-808',  C[1], S32, [4, 10, 12, 14, 20, 26, 28, 30]),
    t('C.HAT', 'chat-808',   C[2], S32, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]),
    t('O.HAT', 'ohat-808',   C[3], S32, []),
    t('CLAP',  'clap-808',   C[4], S32, []),
    t('TOM',   'tom-mid',    C[5], S32, []),
    t('RIM',   'perc-rimshot',C[6], S32, []),
    t('COWBELL','perc-cowbell',C[7], S32, []),
  ],
};

export const THINK_BREAK: Pattern = {
  name: 'Think Break', bpm: 116, steps: S32,
  tracks: [
    t('KICK',  'kick-808',   C[0], S32, [0, 6, 8, 14, 16, 22, 24, 30]),
    t('SNARE', 'snare-808',  C[1], S32, [4, 12, 20, 28]),
    t('C.HAT', 'chat-808',   C[2], S32, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]),
    t('O.HAT', 'ohat-808',   C[3], S32, [14, 30]),
    t('CLAP',  'clap-808',   C[4], S32, [4, 12, 20, 28]),
    t('TOM',   'tom-mid',    C[5], S32, []),
    t('RIM',   'perc-rimshot',C[6], S32, []),
    t('CONGA', 'perc-conga',  C[7], S32, []),
  ],
};

export const IMPEACH: Pattern = {
  name: 'Impeach the President', bpm: 104, steps: S32,
  tracks: [
    t('KICK',  'kick-808',   C[0], S32, [0, 6, 8, 16, 22, 24]),
    t('SNARE', 'snare-808',  C[1], S32, [4, 12, 20, 28]),
    t('C.HAT', 'chat-808',   C[2], S32, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]),
    t('O.HAT', 'ohat-808',   C[3], S32, [14, 30]),
    t('CLAP',  'clap-808',   C[4], S32, []),
    t('TOM',   'tom-mid',    C[5], S32, []),
    t('RIM',   'perc-rimshot',C[6], S32, []),
    t('RIDE',  'perc-ride',   C[7], S32, []),
  ],
};

export const APACHE: Pattern = {
  name: 'Apache', bpm: 110, steps: S32,
  tracks: [
    t('KICK',  'kick-boom',   C[0], S32, [0, 6, 8, 14, 16, 22, 24, 28]),
    t('SNARE', 'snare-fat',   C[1], S32, [4, 12, 20, 28]),
    t('C.HAT', 'chat-808',    C[2], S32, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]),
    t('O.HAT', 'ohat-loose',  C[3], S32, [6, 22]),
    t('CLAP',  'clap-room',   C[4], S32, [4, 20]),
    t('TOM',   'tom-mid',     C[5], S32, []),
    t('RIM',   'perc-rimshot', C[6], S32, []),
    t('CRASH', 'perc-crash',  C[7], S32, [0]),
  ],
};

export const SKULL_SNAP: Pattern = {
  name: 'Skull Snap', bpm: 100, steps: S32,
  tracks: [
    t('KICK',  'kick-808',    C[0], S32, [0, 10, 16, 26]),
    t('SNARE', 'snare-808',   C[1], S32, [4, 12, 14, 20, 28, 30]),
    t('C.HAT', 'chat-808',    C[2], S32, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]),
    t('O.HAT', 'ohat-808',    C[3], S32, []),
    t('CLAP',  'clap-808',    C[4], S32, []),
    t('TOM',   'tom-mid',     C[5], S32, []),
    t('RIM',   'perc-rimshot', C[6], S32, []),
    t('RIDE',  'perc-ride',   C[7], S32, []),
  ],
};

export const HOT_PANTS: Pattern = {
  name: 'Hot Pants', bpm: 112, steps: S32,
  tracks: [
    t('KICK',  'kick-tight',  C[0], S32, [0, 6, 10, 16, 22, 26]),
    t('SNARE', 'snare-808',   C[1], S32, [4, 7, 12, 20, 23, 28]),
    t('C.HAT', 'chat-808',    C[2], S32, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]),
    t('O.HAT', 'ohat-808',    C[3], S32, []),
    t('CLAP',  'clap-808',    C[4], S32, [4, 20]),
    t('TOM',   'tom-high',    C[5], S32, []),
    t('CONGA', 'perc-conga',  C[6], S32, [2, 6, 10, 14, 18, 22, 26, 30]),
    t('SHAKER','perc-shaker',  C[7], S32, [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31], 0.4),
  ],
};

export const WORM: Pattern = {
  name: 'Worm', bpm: 98, steps: S32,
  tracks: [
    t('KICK',  'kick-boom',   C[0], S32, [0, 5, 8, 16, 21, 24]),
    t('SNARE', 'snare-lofi',  C[1], S32, [4, 12, 20, 28]),
    t('C.HAT', 'chat-soft',   C[2], S32, [0, 4, 6, 8, 12, 14, 16, 20, 22, 24, 28, 30]),
    t('O.HAT', 'ohat-trashy', C[3], S32, [2, 10, 18, 26]),
    t('CLAP',  'clap-big',    C[4], S32, []),
    t('TOM',   'tom-floor',   C[5], S32, []),
    t('RIM',   'perc-rimshot', C[6], S32, []),
    t('RIDE',  'perc-ride',   C[7], S32, [0, 4, 8, 12, 16, 20, 24, 28], 0.5),
  ],
};

export const SYNTHETIC_SUB: Pattern = {
  name: 'Synthetic Sub', bpm: 108, steps: S32,
  tracks: [
    t('KICK',  'kick-sub',    C[0], S32, [0, 3, 8, 11, 16, 19, 24, 27]),
    t('SNARE', 'snare-crack', C[1], S32, [4, 12, 20, 28]),
    t('C.HAT', 'chat-crispy', C[2], S32, [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]),
    t('O.HAT', 'ohat-sizzle', C[3], S32, [14, 30]),
    t('CLAP',  'clap-tight',  C[4], S32, [4, 20]),
    t('TOM',   'tom-low',     C[5], S32, []),
    t('RIM',   'perc-rimshot', C[6], S32, [2, 10, 18, 26]),
    t('COWBELL','perc-cowbell', C[7], S32, []),
  ],
};

// ── Hip-Hop & Lo-Fi ────────────────────────────────────────

export const BOOM_BAP: Pattern = {
  name: 'Boom Bap', bpm: 90, steps: S16,
  tracks: [
    t('KICK',  'kick-boom',  C[0], S16, [0, 5, 8, 13]),
    t('SNARE', 'snare-fat',  C[1], S16, [4, 12]),
    t('C.HAT', 'chat-808',   C[2], S16, [0, 2, 4, 6, 8, 10, 12, 14]),
    t('O.HAT', 'ohat-808',   C[3], S16, [6, 14]),
    t('CLAP',  'clap-808',   C[4], S16, []),
    t('TOM',   'tom-mid',    C[5], S16, []),
    t('RIM',   'perc-rimshot',C[6], S16, []),
    t('SHAKER','perc-shaker', C[7], S16, []),
  ],
};

export const LOFI_CHILL: Pattern = {
  name: 'Lo-Fi Chill', bpm: 78, steps: S16,
  tracks: [
    t('KICK',   'kick-sub',    C[0], S16, [0, 5, 8, 10]),
    t('SNARE',  'snare-lofi',  C[1], S16, [4, 12]),
    t('C.HAT',  'chat-soft',   C[2], S16, [0, 2, 4, 6, 8, 10, 12, 14]),
    t('O.HAT',  'ohat-loose',  C[3], S16, [3, 11]),
    t('SHAKER', 'perc-shaker', C[4], S16, [1, 3, 5, 7, 9, 11, 13, 15], 0.6),
    t('RIM',    'perc-rimshot', C[5], S16, []),
    t('CONGA',  'perc-conga',  C[6], S16, []),
    t('RIDE',   'perc-ride',   C[7], S16, []),
  ],
};

export const LOFI_DUSTY: Pattern = {
  name: 'Lo-Fi Dusty', bpm: 84, steps: S16,
  tracks: [
    t('KICK',   'kick-boom',   C[0], S16, [0, 3, 7, 8, 11]),
    t('SNARE',  'snare-lofi',  C[1], S16, [4, 13]),
    t('C.HAT',  'chat-soft',   C[2], S16, [0, 2, 4, 6, 8, 10, 12, 14]),
    t('O.HAT',  'ohat-loose',  C[3], S16, [6, 14]),
    t('SHAKER', 'perc-shaker', C[4], S16, [1, 5, 9, 13], 0.5),
    t('RIM',    'perc-rimshot', C[5], S16, [2, 10]),
    t('CONGA',  'perc-conga',  C[6], S16, []),
    t('RIDE',   'perc-ride',   C[7], S16, []),
  ],
};

// ── Electronic ─────────────────────────────────────────────

export const FOUR_ON_FLOOR: Pattern = {
  name: 'Four on the Floor', bpm: 120, steps: S16,
  tracks: [
    t('KICK',  'kick-909',   C[0], S16, [0, 4, 8, 12]),
    t('SNARE', 'snare-909',  C[1], S16, [4, 12]),
    t('C.HAT', 'chat-808',   C[2], S16, [0, 2, 4, 6, 8, 10, 12, 14]),
    t('O.HAT', 'ohat-808',   C[3], S16, []),
    t('CLAP',  'clap-808',   C[4], S16, [4, 12]),
    t('TOM',   'tom-mid',    C[5], S16, []),
    t('RIM',   'perc-rimshot',C[6], S16, []),
    t('COWBELL','perc-cowbell',C[7], S16, []),
  ],
};

export const TRAP: Pattern = {
  name: 'Trap', bpm: 140, steps: S32,
  tracks: [
    t('KICK',  'kick-sub',    C[0], S32, [0, 3, 14, 16, 19, 30]),
    t('SNARE', 'snare-crack', C[1], S32, [8, 24]),
    t('C.HAT', 'chat-crispy', C[2], S32, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]),
    t('O.HAT', 'ohat-808',   C[3], S32, []),
    t('CLAP',  'clap-tight',  C[4], S32, [8, 24]),
    t('TOM',   'tom-mid',    C[5], S32, []),
    t('RIM',   'perc-rimshot',C[6], S32, []),
    t('COWBELL','perc-cowbell',C[7], S32, []),
  ],
};

export const DEMBOW: Pattern = {
  name: 'Dembow', bpm: 100, steps: S16,
  tracks: [
    t('KICK',  'kick-808',   C[0], S16, [0, 3, 4, 7, 8, 11, 12, 15]),
    t('SNARE', 'snare-808',  C[1], S16, [3, 7, 11, 15]),
    t('C.HAT', 'chat-808',   C[2], S16, [0, 2, 4, 6, 8, 10, 12, 14]),
    t('O.HAT', 'ohat-808',   C[3], S16, []),
    t('CLAP',  'clap-808',   C[4], S16, []),
    t('TOM',   'tom-mid',    C[5], S16, []),
    t('RIM',   'perc-rimshot',C[6], S16, [3, 7, 11, 15]),
    t('COWBELL','perc-cowbell',C[7], S16, []),
  ],
};

// ── Grouped presets for dropdown ───────────────────────────

export const PRESET_GROUPS: PresetGroup[] = [
  {
    label: 'Rock & Pop',
    patterns: [MONEY_BEAT_1, MONEY_BEAT_2, MONEY_BEAT_3, ROCKABILLY, TRAIN_BEAT, WALK_THIS_WAY],
  },
  {
    label: 'Soul & Gospel',
    patterns: [GOSPEL, MOTOWN],
  },
  {
    label: 'Reggae',
    patterns: [REGGAE_1, REGGAE_2, REGGAE_3],
  },
  {
    label: 'Breakbeats',
    patterns: [AMEN_BREAK, FUNKY_DRUMMER, THINK_BREAK, IMPEACH, APACHE, SKULL_SNAP, HOT_PANTS, WORM, SYNTHETIC_SUB],
  },
  {
    label: 'Hip-Hop & Lo-Fi',
    patterns: [BOOM_BAP, LOFI_CHILL, LOFI_DUSTY],
  },
  {
    label: 'Electronic',
    patterns: [TRAP, FOUR_ON_FLOOR, DEMBOW],
  },
];

// Flat list of all presets (for backward compat)
export const PRESETS: Pattern[] = PRESET_GROUPS.flatMap(g => g.patterns);
