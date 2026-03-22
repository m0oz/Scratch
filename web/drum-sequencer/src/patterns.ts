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

export const IMPEACH: Pattern = {
  name: 'Impeach Break', bpm: 104, steps: S32,
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
