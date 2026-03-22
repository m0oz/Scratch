// Mic-based beat vocalization detector
// Analyzes microphone input to detect percussive onsets and classify them
// as kick (low), snare (mid+noise), or hat (high), then quantizes to grid

import { getAudioContext } from './audioEngine';

export type DetectedHit = {
  time: number;            // seconds from recording start
  type: 'kick' | 'snare' | 'hat';
};

export type QuantizedPattern = {
  kick: boolean[];
  snare: boolean[];
  hat: boolean[];
};

interface DetectorState {
  stream: MediaStream;
  source: MediaStreamAudioSourceNode;
  analyser: AnalyserNode;
  lowAnalyser: AnalyserNode;
  midAnalyser: AnalyserNode;
  highAnalyser: AnalyserNode;
  lowFilter: BiquadFilterNode;
  midFilter: BiquadFilterNode;
  highFilter: BiquadFilterNode;
  rafId: number;
  hits: DetectedHit[];
  startTime: number;      // when recording actually begins (after count-in)
  prevLowEnergy: number;
  prevMidEnergy: number;
  prevHighEnergy: number;
  lowSmooth: number;
  midSmooth: number;
  highSmooth: number;
  cooldown: number;
  recording: boolean;     // only capture hits when true
  onHit?: (hit: DetectedHit) => void;
}

let state: DetectorState | null = null;

function getEnergy(analyser: AnalyserNode): number {
  const data = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  return sum / data.length;
}

// Request mic access and set up analysers, but don't record yet
export async function startDetection(onHit?: (hit: DetectedHit) => void): Promise<void> {
  if (state) stopDetection();

  const ctx = getAudioContext();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const source = ctx.createMediaStreamSource(stream);

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  // Low band (kick): < 300 Hz
  const lowFilter = ctx.createBiquadFilter();
  lowFilter.type = 'lowpass';
  lowFilter.frequency.value = 300;
  const lowAnalyser = ctx.createAnalyser();
  lowAnalyser.fftSize = 1024;
  source.connect(lowFilter);
  lowFilter.connect(lowAnalyser);

  // Mid band (snare): 300–5000 Hz
  const midLow = ctx.createBiquadFilter();
  midLow.type = 'highpass';
  midLow.frequency.value = 300;
  const midHigh = ctx.createBiquadFilter();
  midHigh.type = 'lowpass';
  midHigh.frequency.value = 5000;
  const midAnalyser = ctx.createAnalyser();
  midAnalyser.fftSize = 1024;
  source.connect(midLow);
  midLow.connect(midHigh);
  midHigh.connect(midAnalyser);
  const midFilter = midLow;

  // High band (hat): > 5000 Hz
  const highFilter = ctx.createBiquadFilter();
  highFilter.type = 'highpass';
  highFilter.frequency.value = 5000;
  const highAnalyser = ctx.createAnalyser();
  highAnalyser.fftSize = 1024;
  source.connect(highFilter);
  highFilter.connect(highAnalyser);

  state = {
    stream, source, analyser,
    lowAnalyser, midAnalyser, highAnalyser,
    lowFilter, midFilter, highFilter,
    rafId: 0,
    hits: [],
    startTime: 0,
    prevLowEnergy: 0, prevMidEnergy: 0, prevHighEnergy: 0,
    lowSmooth: 0, midSmooth: 0, highSmooth: 0,
    cooldown: 0,
    recording: false,
    onHit,
  };

  detectLoop();
}

// Begin capturing hits — call after count-in finishes
export function beginRecording() {
  if (!state) return;
  state.recording = true;
  state.startTime = getAudioContext().currentTime;
  state.hits = [];
}

function detectLoop() {
  if (!state) return;

  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const lowEnergy = getEnergy(state.lowAnalyser);
  const midEnergy = getEnergy(state.midAnalyser);
  const highEnergy = getEnergy(state.highAnalyser);

  // Running average for adaptive threshold
  const SMOOTH = 0.92;
  state.lowSmooth = state.lowSmooth * SMOOTH + lowEnergy * (1 - SMOOTH);
  state.midSmooth = state.midSmooth * SMOOTH + midEnergy * (1 - SMOOTH);
  state.highSmooth = state.highSmooth * SMOOTH + highEnergy * (1 - SMOOTH);

  // Only detect when recording
  if (state.recording && now > state.cooldown) {
    const THRESHOLD = 0.003;
    const ONSET_RATIO = 2.5; // how much above the running average

    const lowOnset = lowEnergy > THRESHOLD && lowEnergy > state.lowSmooth * ONSET_RATIO;
    const midOnset = midEnergy > THRESHOLD && midEnergy > state.midSmooth * ONSET_RATIO;
    const highOnset = highEnergy > THRESHOLD * 0.5 && highEnergy > state.highSmooth * ONSET_RATIO;

    if (lowOnset || midOnset || highOnset) {
      let type: DetectedHit['type'] = 'hat';
      const lowDelta = lowEnergy / Math.max(state.lowSmooth, 0.0001);
      const midDelta = midEnergy / Math.max(state.midSmooth, 0.0001);
      const highDelta = highEnergy / Math.max(state.highSmooth, 0.0001);

      if (lowDelta >= midDelta && lowDelta >= highDelta) {
        type = 'kick';
      } else if (midDelta >= highDelta) {
        type = 'snare';
      }

      const hit: DetectedHit = { time: now - state.startTime, type };
      state.hits.push(hit);
      state.onHit?.(hit);
      state.cooldown = now + 0.08; // 80ms cooldown between hits
    }
  }

  state.prevLowEnergy = lowEnergy;
  state.prevMidEnergy = midEnergy;
  state.prevHighEnergy = highEnergy;

  state.rafId = requestAnimationFrame(detectLoop);
}

export function stopDetection(): DetectedHit[] {
  if (!state) return [];
  cancelAnimationFrame(state.rafId);
  state.stream.getTracks().forEach(t => t.stop());
  state.source.disconnect();
  const hits = [...state.hits];
  state = null;
  return hits;
}

export function isDetecting(): boolean {
  return state !== null;
}

export function isRecording(): boolean {
  return state?.recording ?? false;
}

export function getAnalyser(): AnalyserNode | null {
  return state?.analyser ?? null;
}

// Quantize detected hits to a step grid
export function quantizeHits(
  hits: DetectedHit[],
  bpm: number,
  stepCount: number,
): QuantizedPattern {
  const secondsPerStep = 60.0 / bpm / 4;
  const totalDuration = stepCount * secondsPerStep;

  const kick = new Array(stepCount).fill(false);
  const snare = new Array(stepCount).fill(false);
  const hat = new Array(stepCount).fill(false);

  for (const hit of hits) {
    const wrapped = hit.time % totalDuration;
    const step = Math.round(wrapped / secondsPerStep) % stepCount;

    switch (hit.type) {
      case 'kick': kick[step] = true; break;
      case 'snare': snare[step] = true; break;
      case 'hat': hat[step] = true; break;
    }
  }

  return { kick, snare, hat };
}
