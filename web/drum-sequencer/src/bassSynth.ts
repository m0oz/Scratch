// Simple monophonic bass synthesizer for breakbeat basslines
// Each step has a note (or rest) with configurable waveform, filter, and envelope

import { getAudioContext } from './audioEngine';

export type BassWaveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface BassStep {
  note: number;    // MIDI note number, 0 = rest
  accent: boolean; // louder hit
  slide: boolean;  // glide from previous note
}

export interface BassSettings {
  waveform: BassWaveform;
  volume: number;      // 0–1
  cutoff: number;      // filter cutoff Hz (80–8000)
  resonance: number;   // filter Q (0.5–20)
  decay: number;       // amp envelope decay (0.05–1.0 seconds)
  filterEnv: number;   // filter envelope amount (0–1)
  distortion: number;  // 0–1
}

export const DEFAULT_BASS_SETTINGS: BassSettings = {
  waveform: 'sawtooth',
  volume: 0.7,
  cutoff: 800,
  resonance: 4,
  decay: 0.3,
  filterEnv: 0.5,
  distortion: 0,
};

export function emptyBassStep(): BassStep {
  return { note: 0, accent: false, slide: false };
}

export function createBassSteps(count: number): BassStep[] {
  return Array.from({ length: count }, () => emptyBassStep());
}

// Note names for display
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToName(midi: number): string {
  if (midi === 0) return '--';
  const octave = Math.floor(midi / 12) - 1;
  return NOTE_NAMES[midi % 12] + octave;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Available bass notes (C1 to B2 — two octaves)
export const BASS_NOTES = [
  0, // rest
  36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, // C2–B2
  24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, // C1–B1
  48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, // C3–B3
];

// Quick-pick notes: just the ones in key of C minor (most common for breaks)
export const QUICK_NOTES = [0, 36, 38, 39, 41, 43, 44, 46, 48];
export const QUICK_NOTE_LABELS = ['--', 'C2', 'D2', 'Eb2', 'F2', 'G2', 'Ab2', 'Bb2', 'C3'];

let distortionNode: WaveShaperNode | null = null;

function getDistortion(ctx: AudioContext, amount: number): WaveShaperNode {
  if (!distortionNode) distortionNode = ctx.createWaveShaper();
  const k = amount * 200;
  const samples = 256;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
  }
  distortionNode.curve = curve;
  return distortionNode;
}

// Play a single bass note at the given time
export function playBassNote(
  note: number,
  time: number,
  stepDuration: number,
  settings: BassSettings,
  accent: boolean,
  slide: boolean,
  prevFreq: number | null,
): void {
  if (note === 0) return;

  const ctx = getAudioContext();
  const freq = midiToFreq(note);
  const vol = settings.volume * (accent ? 1.2 : 1.0);

  const osc = ctx.createOscillator();
  osc.type = settings.waveform;

  if (slide && prevFreq) {
    osc.frequency.setValueAtTime(prevFreq, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + Math.min(0.08, stepDuration * 0.5));
  } else {
    osc.frequency.setValueAtTime(freq, time);
  }

  // Filter with envelope
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = settings.resonance;
  const envAmount = settings.filterEnv * (settings.cutoff * 3);
  filter.frequency.setValueAtTime(settings.cutoff + envAmount, time);
  filter.frequency.exponentialRampToValueAtTime(
    Math.max(settings.cutoff, 20),
    time + settings.decay * 0.8
  );

  // Amp envelope
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, time);
  gain.gain.setValueAtTime(vol, time + stepDuration * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 0.7 + settings.decay);

  // Chain
  let output: AudioNode = osc;
  output.connect(filter);
  output = filter;

  if (settings.distortion > 0.05) {
    const dist = ctx.createWaveShaper();
    const k = settings.distortion * 200;
    const samples = 256;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    dist.curve = curve;
    output.connect(dist);
    output = dist;
  }

  output.connect(gain);
  gain.connect(ctx.destination);

  const stopTime = time + stepDuration * 0.7 + settings.decay + 0.01;
  osc.start(time);
  osc.stop(stopTime);
}
