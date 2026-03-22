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
  tracks: Track[];
}

const STEPS = 16;

function makeSteps(active: number[]): boolean[] {
  const steps = new Array(STEPS).fill(false);
  for (const i of active) steps[i] = true;
  return steps;
}

export const DEFAULT_TRACKS: () => Track[] = () => [
  { name: 'KICK', sound: 'kick', color: '#ff3b30', steps: new Array(STEPS).fill(false) },
  { name: 'SNARE', sound: 'snare', color: '#ff9500', steps: new Array(STEPS).fill(false) },
  { name: 'C.HAT', sound: 'closedHat', color: '#ffcc00', steps: new Array(STEPS).fill(false) },
  { name: 'O.HAT', sound: 'openHat', color: '#34c759', steps: new Array(STEPS).fill(false) },
  { name: 'CLAP', sound: 'clap', color: '#5ac8fa', steps: new Array(STEPS).fill(false) },
  { name: 'TOM', sound: 'tom', color: '#007aff', steps: new Array(STEPS).fill(false) },
  { name: 'RIM', sound: 'rimshot', color: '#5856d6', steps: new Array(STEPS).fill(false) },
  { name: 'COWBELL', sound: 'cowbell', color: '#af52de', steps: new Array(STEPS).fill(false) },
];

// Amen Break - the most sampled drum loop in music history
// Original tempo ~136 BPM, 16th note grid
export const AMEN_BREAK: Pattern = {
  name: 'Amen Break',
  bpm: 136,
  tracks: [
    { name: 'KICK', sound: 'kick', color: '#ff3b30', steps: makeSteps([0, 4, 6, 10]) },
    { name: 'SNARE', sound: 'snare', color: '#ff9500', steps: makeSteps([2, 5, 8, 10, 14]) },
    { name: 'C.HAT', sound: 'closedHat', color: '#ffcc00', steps: makeSteps([0, 2, 4, 6, 8, 10, 12, 14]) },
    { name: 'O.HAT', sound: 'openHat', color: '#34c759', steps: makeSteps([]) },
    { name: 'CLAP', sound: 'clap', color: '#5ac8fa', steps: new Array(STEPS).fill(false) },
    { name: 'TOM', sound: 'tom', color: '#007aff', steps: new Array(STEPS).fill(false) },
    { name: 'RIM', sound: 'rimshot', color: '#5856d6', steps: new Array(STEPS).fill(false) },
    { name: 'COWBELL', sound: 'cowbell', color: '#af52de', steps: new Array(STEPS).fill(false) },
  ],
};

// Classic 808 four-on-the-floor
export const FOUR_ON_FLOOR: Pattern = {
  name: 'Four on the Floor',
  bpm: 120,
  tracks: [
    { name: 'KICK', sound: 'kick', color: '#ff3b30', steps: makeSteps([0, 4, 8, 12]) },
    { name: 'SNARE', sound: 'snare', color: '#ff9500', steps: makeSteps([4, 12]) },
    { name: 'C.HAT', sound: 'closedHat', color: '#ffcc00', steps: makeSteps([0, 2, 4, 6, 8, 10, 12, 14]) },
    { name: 'O.HAT', sound: 'openHat', color: '#34c759', steps: makeSteps([]) },
    { name: 'CLAP', sound: 'clap', color: '#5ac8fa', steps: makeSteps([4, 12]) },
    { name: 'TOM', sound: 'tom', color: '#007aff', steps: new Array(STEPS).fill(false) },
    { name: 'RIM', sound: 'rimshot', color: '#5856d6', steps: new Array(STEPS).fill(false) },
    { name: 'COWBELL', sound: 'cowbell', color: '#af52de', steps: new Array(STEPS).fill(false) },
  ],
};

// Boom Bap hip-hop beat
export const BOOM_BAP: Pattern = {
  name: 'Boom Bap',
  bpm: 90,
  tracks: [
    { name: 'KICK', sound: 'kick', color: '#ff3b30', steps: makeSteps([0, 5, 8, 13]) },
    { name: 'SNARE', sound: 'snare', color: '#ff9500', steps: makeSteps([4, 12]) },
    { name: 'C.HAT', sound: 'closedHat', color: '#ffcc00', steps: makeSteps([0, 2, 4, 6, 8, 10, 12, 14]) },
    { name: 'O.HAT', sound: 'openHat', color: '#34c759', steps: makeSteps([6, 14]) },
    { name: 'CLAP', sound: 'clap', color: '#5ac8fa', steps: new Array(STEPS).fill(false) },
    { name: 'TOM', sound: 'tom', color: '#007aff', steps: new Array(STEPS).fill(false) },
    { name: 'RIM', sound: 'rimshot', color: '#5856d6', steps: new Array(STEPS).fill(false) },
    { name: 'COWBELL', sound: 'cowbell', color: '#af52de', steps: new Array(STEPS).fill(false) },
  ],
};

// Reggaeton dembow
export const DEMBOW: Pattern = {
  name: 'Dembow',
  bpm: 100,
  tracks: [
    { name: 'KICK', sound: 'kick', color: '#ff3b30', steps: makeSteps([0, 3, 4, 7, 8, 11, 12, 15]) },
    { name: 'SNARE', sound: 'snare', color: '#ff9500', steps: makeSteps([3, 7, 11, 15]) },
    { name: 'C.HAT', sound: 'closedHat', color: '#ffcc00', steps: makeSteps([0, 2, 4, 6, 8, 10, 12, 14]) },
    { name: 'O.HAT', sound: 'openHat', color: '#34c759', steps: makeSteps([]) },
    { name: 'CLAP', sound: 'clap', color: '#5ac8fa', steps: new Array(STEPS).fill(false) },
    { name: 'TOM', sound: 'tom', color: '#007aff', steps: new Array(STEPS).fill(false) },
    { name: 'RIM', sound: 'rimshot', color: '#5856d6', steps: makeSteps([3, 7, 11, 15]) },
    { name: 'COWBELL', sound: 'cowbell', color: '#af52de', steps: new Array(STEPS).fill(false) },
  ],
};

export const PRESETS = [AMEN_BREAK, FOUR_ON_FLOOR, BOOM_BAP, DEMBOW];
