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
  startTime: number;
  prevLowEnergy: number;
  prevMidEnergy: number;
  prevHighEnergy: number;
  cooldown: number;
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

export async function startDetection(onHit?: (hit: DetectedHit) => void): Promise<void> {
  if (state) stopDetection();

  const ctx = getAudioContext();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = ctx.createMediaStreamSource(stream);

  // Overall analyser for visualization
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  // Low band (kick detection): < 250 Hz
  const lowFilter = ctx.createBiquadFilter();
  lowFilter.type = 'lowpass';
  lowFilter.frequency.value = 250;
  const lowAnalyser = ctx.createAnalyser();
  lowAnalyser.fftSize = 1024;
  source.connect(lowFilter);
  lowFilter.connect(lowAnalyser);

  // Mid band (snare detection): 250–4000 Hz
  const midLow = ctx.createBiquadFilter();
  midLow.type = 'highpass';
  midLow.frequency.value = 250;
  const midHigh = ctx.createBiquadFilter();
  midHigh.type = 'lowpass';
  midHigh.frequency.value = 4000;
  const midAnalyser = ctx.createAnalyser();
  midAnalyser.fftSize = 1024;
  source.connect(midLow);
  midLow.connect(midHigh);
  midHigh.connect(midAnalyser);
  const midFilter = midLow; // keep reference

  // High band (hat detection): > 4000 Hz
  const highFilter = ctx.createBiquadFilter();
  highFilter.type = 'highpass';
  highFilter.frequency.value = 4000;
  const highAnalyser = ctx.createAnalyser();
  highAnalyser.fftSize = 1024;
  source.connect(highFilter);
  highFilter.connect(highAnalyser);

  const hits: DetectedHit[] = [];
  const startTime = ctx.currentTime;

  state = {
    stream, source, analyser,
    lowAnalyser, midAnalyser, highAnalyser,
    lowFilter, midFilter, highFilter,
    rafId: 0, hits, startTime,
    prevLowEnergy: 0, prevMidEnergy: 0, prevHighEnergy: 0,
    cooldown: 0,
    onHit,
  };

  detectLoop();
}

function detectLoop() {
  if (!state) return;

  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const lowEnergy = getEnergy(state.lowAnalyser);
  const midEnergy = getEnergy(state.midAnalyser);
  const highEnergy = getEnergy(state.highAnalyser);

  // Onset detection thresholds (tuned for vocal beatboxing)
  const THRESHOLD = 0.005;
  const ONSET_RATIO = 3.0;
  const COOLDOWN_MS = 60; // minimum ms between hits

  if (now > state.cooldown) {
    const lowOnset = lowEnergy > THRESHOLD && lowEnergy > state.prevLowEnergy * ONSET_RATIO;
    const midOnset = midEnergy > THRESHOLD && midEnergy > state.prevMidEnergy * ONSET_RATIO;
    const highOnset = highEnergy > THRESHOLD && highEnergy > state.prevHighEnergy * ONSET_RATIO;

    if (lowOnset || midOnset || highOnset) {
      // Classify by which band has strongest onset
      let type: DetectedHit['type'] = 'hat';
      const lowDelta = lowEnergy - state.prevLowEnergy;
      const midDelta = midEnergy - state.prevMidEnergy;
      const highDelta = highEnergy - state.prevHighEnergy;

      if (lowDelta >= midDelta && lowDelta >= highDelta) {
        type = 'kick';
      } else if (midDelta >= highDelta) {
        type = 'snare';
      }

      const hit: DetectedHit = { time: now - state.startTime, type };
      state.hits.push(hit);
      state.onHit?.(hit);
      state.cooldown = now + COOLDOWN_MS / 1000;
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
    // Wrap to pattern length
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
