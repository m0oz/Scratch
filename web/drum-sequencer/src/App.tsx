import { useState, useCallback, useRef, useEffect } from 'react';
import {
  resumeAudio, getAudioContext, playSoundById,
  SOUNDS_BY_CATEGORY, CATEGORY_LABELS,
  type SoundCategory, type SoundDef, SOUND_CATALOG,
} from './audioEngine';
import { PRESETS, PRESET_GROUPS, DEFAULT_TRACKS, type Track } from './patterns';
import {
  playBassNote, createBassSteps, midiToName, midiToFreq,
  DEFAULT_BASS_SETTINGS,
  type BassStep, type BassSettings, type BassWaveform,
} from './bassSynth';

const ACCENT = '#00e5cc';
const SCHEDULE_AHEAD = 0.1;
const LOOKAHEAD = 25;
const STORAGE_KEY = 'dr808-saved-pattern';
const DRUM_PAGE_SIZE = 4;

// Note names
const NOTE_NAMES_CHROM = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function isBlackKey(midi: number): boolean { return [1, 3, 6, 8, 10].includes(midi % 12); }
function noteName(midi: number): string {
  return NOTE_NAMES_CHROM[midi % 12] + (Math.floor(midi / 12) - 1);
}

// Scales: intervals from root
interface ScaleDef { name: string; intervals: number[]; }
const SCALES: ScaleDef[] = [
  { name: 'Minor', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10] },
  { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
  { name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { name: 'Phrygian Dominant', intervals: [0, 1, 4, 5, 7, 8, 10] },
  { name: 'Whole Tone', intervals: [0, 2, 4, 6, 8, 10] },
  { name: 'Chromatic', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
];
const ROOT_NOTES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // C through B
const ROOT_LABELS = NOTE_NAMES_CHROM;

// Build bass notes for a key + scale across given octave range
function buildBassNotes(rootPc: number, scale: ScaleDef, baseOctave: number): number[] {
  // One octave: from root in baseOctave up to (but not including) root in next octave
  // Plus the upper root as the top note
  const rootMidi = (baseOctave + 1) * 12 + rootPc;
  const notes: number[] = [rootMidi + 12]; // top note = root of next octave
  for (const interval of scale.intervals) {
    notes.push(rootMidi + interval);
  }
  // Deduplicate and sort descending
  return [...new Set(notes)].sort((a, b) => b - a);
}

interface SavedState {
  tracks: Track[];
  bpm: number;
  stepCount: number;
  swing: number;
  bassSteps?: BassStep[];
  bassSettings?: BassSettings;
}

function loadSavedState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.tracks) && data.tracks.length > 0) return data;
  } catch { /* ignore */ }
  return null;
}

function saveState(state: SavedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

const _saved = loadSavedState();

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(() => {
    const s = _saved;
    if (s) return s.tracks.map(t => ({ ...t, steps: [...t.steps] }));
    return PRESETS[0].tracks.map(t => ({ ...t, steps: [...t.steps] }));
  });
  const [stepCount, setStepCount] = useState(_saved?.stepCount ?? PRESETS[0].steps);
  const [bpm, setBpm] = useState(_saved?.bpm ?? PRESETS[0].bpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [swing, setSwing] = useState(_saved?.swing ?? 0);

  // UI state
  const [trackPopup, setTrackPopup] = useState<number | null>(null);
  const [showTempoSlider, setShowTempoSlider] = useState(false);
  const [showSwingSlider, setShowSwingSlider] = useState(false);
  const [activeTab, setActiveTab] = useState<'drums' | 'bass'>('drums');

  // Bass state
  const [bassSteps, setBassSteps] = useState<BassStep[]>(() =>
    _saved?.bassSteps ?? createBassSteps(PRESETS[0].steps)
  );
  const [bassSettings, setBassSettings] = useState<BassSettings>(() =>
    _saved?.bassSettings ?? { ...DEFAULT_BASS_SETTINGS }
  );

  // Tap-record state
  const [tapRecTrack, setTapRecTrack] = useState<number | null>(null);

  // Paging state
  const [drumPage, setDrumPage] = useState(0);
  const drumPageCount = Math.ceil(tracks.length / DRUM_PAGE_SIZE);
  const visibleTracks = tracks.slice(drumPage * DRUM_PAGE_SIZE, (drumPage + 1) * DRUM_PAGE_SIZE);
  const visibleTrackOffset = drumPage * DRUM_PAGE_SIZE;

  // Bass key/scale state
  const [bassRoot, setBassRoot] = useState(0); // C
  const [bassScaleIdx, setBassScaleIdx] = useState(0); // Minor
  const [bassOctave, setBassOctave] = useState(2); // base octave
  const bassNotes = buildBassNotes(bassRoot, SCALES[bassScaleIdx], bassOctave);
  const bassOctaveMin = 1;
  const bassOctaveMax = 4;

  // Transpose bass notes when changing key
  const changeBassRoot = useCallback((newRoot: number) => {
    const oldRoot = bassRoot;
    const semitoneShift = newRoot - oldRoot;
    if (semitoneShift === 0) return;
    setBassRoot(newRoot);
    setBassSteps(prev => prev.map(bs => {
      if (bs.note === 0) return bs;
      return { ...bs, note: bs.note + semitoneShift };
    }));
  }, [bassRoot]);

  // Transpose bass notes when changing scale
  const changeBassScale = useCallback((newScaleIdx: number) => {
    const oldScale = SCALES[bassScaleIdx];
    const newScale = SCALES[newScaleIdx];
    setBassScaleIdx(newScaleIdx);
    setBassSteps(prev => prev.map(bs => {
      if (bs.note === 0) return bs;
      // Find closest note in new scale
      const pc = ((bs.note - bassRoot) % 12 + 12) % 12;
      const octShift = Math.floor((bs.note - bassRoot) / 12);
      // Find nearest interval in new scale
      let bestInterval = newScale.intervals[0];
      let bestDist = 12;
      for (const iv of newScale.intervals) {
        const dist = Math.abs(iv - pc);
        if (dist < bestDist) { bestDist = dist; bestInterval = iv; }
      }
      return { ...bs, note: bassRoot + octShift * 12 + bestInterval };
    }));
  }, [bassScaleIdx, bassRoot]);

  // Refs
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  const swingRef = useRef(swing);
  swingRef.current = swing;
  const stepCountRef = useRef(stepCount);
  stepCountRef.current = stepCount;
  const isPlayingRef = useRef(false);
  const nextStepRef = useRef(0);
  const nextStepTimeRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const bassStepsRef = useRef(bassSteps);
  bassStepsRef.current = bassSteps;
  const bassSettingsRef = useRef(bassSettings);
  bassSettingsRef.current = bassSettings;
  const prevBassFreqRef = useRef<number | null>(null);
  const prevStepRef = useRef(-1);

  // ── Sequencer scheduler ────────────────────────────────

  const scheduler = useCallback(() => {
    const ctx = getAudioContext();
    while (nextStepTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD) {
      const step = nextStepRef.current;
      const time = nextStepTimeRef.current;

      for (const track of tracksRef.current) {
        if (track.steps[step]) {
          playSoundById(track.soundId, time, track.volume, track.decay);
        }
      }

      // Bass synth
      const bs = bassStepsRef.current[step];
      if (bs && bs.note !== 0) {
        const spst = 60.0 / bpmRef.current / 4;
        playBassNote(bs.note, time, spst, bassSettingsRef.current, bs.accent, bs.slide, prevBassFreqRef.current);
        prevBassFreqRef.current = midiToFreq(bs.note);
      } else {
        prevBassFreqRef.current = null;
      }

      setCurrentStep(step);

      const secondsPerStep = 60.0 / bpmRef.current / 4;
      const swingOffset = swingRef.current * secondsPerStep * 0.5;
      // Even step → push next (odd) step later; odd step → shorten to compensate
      // This keeps each step-pair at exactly 2 * secondsPerStep
      const isEvenStep = step % 2 === 0;
      nextStepTimeRef.current = time + secondsPerStep + (isEvenStep ? swingOffset : -swingOffset);
      nextStepRef.current = (step + 1) % stepCountRef.current;
    }
    timerRef.current = window.setTimeout(scheduler, LOOKAHEAD);
  }, []);

  const handlePlay = useCallback(async () => {
    await resumeAudio();
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setCurrentStep(-1);
      setTapRecTrack(null);
      prevStepRef.current = -1;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
      nextStepRef.current = 0;
      nextStepTimeRef.current = getAudioContext().currentTime;
      scheduler();
    }
  }, [scheduler]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  // ── Auto-save to localStorage ────────────────────────────
  useEffect(() => {
    saveState({ tracks, bpm, stepCount, swing, bassSteps, bassSettings });
  }, [tracks, bpm, stepCount, swing, bassSteps, bassSettings]);

  // ── Track editing ──────────────────────────────────────

  const toggleStep = useCallback((trackIndex: number, stepIndex: number) => {
    setTracks(prev =>
      prev.map((tr, i) =>
        i === trackIndex
          ? { ...tr, steps: tr.steps.map((s, j) => (j === stepIndex ? !s : s)) }
          : tr
      )
    );
  }, []);

  const handlePreview = useCallback((soundId: string, vol = 1, dec = 1) => {
    resumeAudio();
    playSoundById(soundId, undefined, vol, dec);
  }, []);

  const changeSound = useCallback((trackIndex: number, soundId: string) => {
    setTracks(prev =>
      prev.map((tr, i) => i === trackIndex ? { ...tr, soundId } : tr)
    );
  }, []);

  const changeVolume = useCallback((trackIndex: number, volume: number) => {
    setTracks(prev =>
      prev.map((tr, i) => i === trackIndex ? { ...tr, volume } : tr)
    );
  }, []);

  const changeDecay = useCallback((trackIndex: number, decay: number) => {
    setTracks(prev =>
      prev.map((tr, i) => i === trackIndex ? { ...tr, decay } : tr)
    );
  }, []);

  const loadPreset = useCallback((index: number) => {
    const preset = PRESETS[index];
    setTracks(preset.tracks.map(tr => ({ ...tr, steps: [...tr.steps] })));
    setBpm(preset.bpm);
    setStepCount(preset.steps);
    setBassSteps(createBassSteps(preset.steps));
    setCurrentStep(-1);
    setTrackPopup(null);
  }, []);

  const clearAll = useCallback(() => {
    if (activeTab === 'bass') {
      setBassSteps(createBassSteps(stepCount));
    } else {
      setTracks(DEFAULT_TRACKS(stepCount));
      setTrackPopup(null);
    }
  }, [stepCount, activeTab]);

  // ── Bars toggle ──────────────────────────────────────────

  const toggleBars = useCallback(() => {
    const newSteps = stepCount === 16 ? 32 : 16;
    setStepCount(newSteps);
    setTracks(prev => prev.map(tr => {
      if (newSteps > tr.steps.length) {
        const extended = [...tr.steps];
        while (extended.length < newSteps) extended.push(tr.steps[extended.length - tr.steps.length] ?? false);
        return { ...tr, steps: extended };
      } else {
        return { ...tr, steps: tr.steps.slice(0, newSteps) };
      }
    }));
    setBassSteps(prev => {
      if (newSteps > prev.length) {
        const ext = [...prev];
        while (ext.length < newSteps) ext.push({ note: 0, accent: false, slide: false });
        return ext;
      }
      return prev.slice(0, newSteps);
    });
  }, [stepCount]);

  // ── Tap-record mode ───────────────────────────────────

  const handleTapRec = useCallback(async (trackIndex: number) => {
    await resumeAudio();
    if (tapRecTrack === trackIndex) {
      // Already recording this track — register a HIT at current step
      if (currentStep >= 0) {
        setTracks(prev => prev.map((tr, i) =>
          i === trackIndex ? { ...tr, steps: tr.steps.map((s, j) => j === currentStep ? true : s) } : tr
        ));
        playSoundById(tracksRef.current[trackIndex].soundId, undefined,
          tracksRef.current[trackIndex].volume, tracksRef.current[trackIndex].decay);
      }
    } else {
      // Arm this track — clear steps and start recording
      setTapRecTrack(trackIndex);
      prevStepRef.current = -1;
      setTracks(prev => prev.map((tr, i) =>
        i === trackIndex ? { ...tr, steps: tr.steps.map(() => false) } : tr
      ));
      // Auto-start playback if not already playing
      if (!isPlayingRef.current) {
        isPlayingRef.current = true;
        setIsPlaying(true);
        nextStepRef.current = 0;
        nextStepTimeRef.current = getAudioContext().currentTime;
        scheduler();
      }
      // Record first hit immediately at current step
      if (currentStep >= 0) {
        setTracks(prev => prev.map((tr, i) =>
          i === trackIndex ? { ...tr, steps: tr.steps.map((s, j) => j === currentStep ? true : s) } : tr
        ));
        playSoundById(tracksRef.current[trackIndex].soundId, undefined,
          tracksRef.current[trackIndex].volume, tracksRef.current[trackIndex].decay);
      }
    }
  }, [tapRecTrack, currentStep, scheduler]);

  // Detect loop wrap → stop recording, keep the hits
  useEffect(() => {
    if (tapRecTrack === null || currentStep < 0) {
      prevStepRef.current = currentStep;
      return;
    }
    const prev = prevStepRef.current;
    prevStepRef.current = currentStep;
    if (prev >= 0 && currentStep < prev) {
      // Loop wrapped — finalize recording, keep steps as-is
      setTapRecTrack(null);
    }
  }, [currentStep, tapRecTrack]);

  // ── Bass editing ─────────────────────────────────────────

  const toggleBassNote = useCallback((stepIdx: number, note: number) => {
    setBassSteps(prev => {
      // Ensure array covers the step index
      const arr = prev.length > stepIdx ? [...prev] : [
        ...prev,
        ...Array.from({ length: stepIdx + 1 - prev.length }, () => ({ note: 0, accent: false, slide: false })),
      ];
      arr[stepIdx] = { ...arr[stepIdx], note: arr[stepIdx].note === note ? 0 : note };
      return arr;
    });
  }, []);

  // ── Helpers ────────────────────────────────────────────

  function getSoundCategory(soundId: string): SoundCategory {
    const def = SOUND_CATALOG.find(s => s.id === soundId);
    return def?.category ?? 'perc';
  }

  function getSoundLabel(soundId: string): string {
    const def = SOUND_CATALOG.find(s => s.id === soundId);
    return def?.label ?? soundId;
  }

  function groupedSounds(): [SoundCategory, SoundDef[]][] {
    return Object.entries(SOUNDS_BY_CATEGORY) as [SoundCategory, SoundDef[]][];
  }

  // ── Render ─────────────────────────────────────────────

  const popupTrack = trackPopup !== null ? tracks[trackPopup] : null;

  const trackControlWidth = activeTab === 'drums' ? 110 : 44;

  return (
    <div style={styles.container}>
      {/* Header — brand left, controls right-aligned */}
      <div style={styles.header}>
        <div style={styles.brandName}>8MO8</div>
        <div style={{ flex: 1 }} />
        <div
          style={{ ...styles.displayBox, cursor: 'pointer', position: 'relative' as const }}
          onClick={() => { setShowTempoSlider(!showTempoSlider); setShowSwingSlider(false); }}
        >
          <div style={styles.displayLabel}>BPM</div>
          <div style={styles.displayValue}>{bpm}</div>
          {showTempoSlider && (
            <div style={styles.dropdownSlider} onClick={e => e.stopPropagation()}>
              <input type="range" min="60" max="200" value={bpm}
                onChange={e => setBpm(Number(e.target.value))} style={styles.popupSlider} />
            </div>
          )}
        </div>
        <div
          style={{ ...styles.displayBox, cursor: 'pointer' }}
          onClick={toggleBars}
        >
          <div style={styles.displayLabel}>BARS</div>
          <div style={styles.displayValue}>{stepCount / 16}</div>
        </div>
        <div
          style={{ ...styles.displayBox, cursor: 'pointer', position: 'relative' as const }}
          onClick={() => { setShowSwingSlider(!showSwingSlider); setShowTempoSlider(false); }}
        >
          <div style={styles.displayLabel}>SWG</div>
          <div style={styles.displayValue}>{Math.round(swing * 100)}</div>
          {showSwingSlider && (
            <div style={styles.dropdownSlider} onClick={e => e.stopPropagation()}>
              <input type="range" min="0" max="100" value={swing * 100}
                onChange={e => setSwing(Number(e.target.value) / 100)} style={styles.popupSlider} />
            </div>
          )}
        </div>
        <div style={styles.displayBox}>
          <div style={styles.displayLabel}>STEP</div>
          <div style={styles.displayValue}>{currentStep >= 0 ? currentStep + 1 : '--'}</div>
        </div>
        <button onClick={clearAll} style={styles.headerBtn}>✕</button>
        <button onClick={handlePlay} style={{
          ...styles.headerBtn,
          borderColor: isPlaying ? '#ff3b30' : '#34c759',
          color: isPlaying ? '#ff3b30' : '#34c759',
          boxShadow: isPlaying
            ? '0 0 8px rgba(255,59,48,0.3), inset 0 0 4px rgba(255,59,48,0.1)'
            : '0 0 8px rgba(52,199,89,0.3), inset 0 0 4px rgba(52,199,89,0.1)',
        }}>
          {isPlaying ? '■' : '▶'}
        </button>
      </div>

      {/* Tab bar */}
      <div style={styles.tabBar}>
        {(['drums', 'bass'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            ...styles.tabBtn,
            color: activeTab === tab ? ACCENT : '#666',
            borderBottomColor: activeTab === tab ? ACCENT : 'transparent',
            textShadow: activeTab === tab ? `0 0 8px ${ACCENT}60` : 'none',
          }}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Drum controls row: pattern selector + page buttons */}
      {activeTab === 'drums' && (
        <div style={styles.controlRow}>
          <select
            style={styles.patternSelect}
            value=""
            onChange={e => {
              const idx = Number(e.target.value);
              if (!isNaN(idx)) loadPreset(idx);
            }}
          >
            <option value="" disabled>Pattern…</option>
            {PRESET_GROUPS.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.patterns.map(p => {
                  const idx = PRESETS.indexOf(p);
                  return <option key={idx} value={idx}>{p.name}</option>;
                })}
              </optgroup>
            ))}
          </select>
          <div style={{ flex: 1 }} />
          {drumPageCount > 1 && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button style={styles.pageBtn}
                onClick={() => setDrumPage(p => Math.max(0, p - 1))}
                disabled={drumPage === 0}>▲</button>
              <span style={{ fontSize: 9, color: '#555', fontFamily: MONO }}>{drumPage + 1}/{drumPageCount}</span>
              <button style={styles.pageBtn}
                onClick={() => setDrumPage(p => Math.min(drumPageCount - 1, p + 1))}
                disabled={drumPage >= drumPageCount - 1}>▼</button>
            </div>
          )}
        </div>
      )}

      {/* Bass controls row: key/scale selector + synth controls + page buttons */}
      {activeTab === 'bass' && (
        <div style={styles.controlRow}>
          <select style={styles.patternSelect} value={bassRoot}
            onChange={e => changeBassRoot(Number(e.target.value))}>
            {ROOT_NOTES.map(n => (
              <option key={n} value={n}>{ROOT_LABELS[n]}</option>
            ))}
          </select>
          <select style={styles.patternSelect} value={bassScaleIdx}
            onChange={e => changeBassScale(Number(e.target.value))}>
            {SCALES.map((s, i) => (
              <option key={i} value={i}>{s.name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: '#555', letterSpacing: 1, fontWeight: 600 }}>WAVE</span>
            {(['sine', 'square', 'sawtooth', 'triangle'] as BassWaveform[]).map(w => (
              <button key={w} onClick={() => setBassSettings(s => ({ ...s, waveform: w }))}
                style={{
                  ...styles.waveBtn,
                  borderColor: bassSettings.waveform === w ? ACCENT : '#3a3a3a',
                  color: bassSettings.waveform === w ? ACCENT : '#888',
                  boxShadow: bassSettings.waveform === w ? `0 0 6px ${ACCENT}40` : 'none',
                }}>
                {w === 'sine' ? 'SIN' : w === 'square' ? 'SQR' : w === 'sawtooth' ? 'SAW' : 'TRI'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1 }}>
            <span style={{ fontSize: 8, color: '#555', letterSpacing: 1, fontWeight: 600 }}>CUT</span>
            <input type="range" min="80" max="8000" value={bassSettings.cutoff}
              onChange={e => setBassSettings(s => ({ ...s, cutoff: Number(e.target.value) }))}
              style={{ flex: 1, accentColor: ACCENT, cursor: 'pointer' }} />
            <span style={{ fontSize: 8, color: '#555', letterSpacing: 1, fontWeight: 600 }}>RES</span>
            <input type="range" min="50" max="2000" value={bassSettings.resonance * 100}
              onChange={e => setBassSettings(s => ({ ...s, resonance: Number(e.target.value) / 100 }))}
              style={{ flex: 1, accentColor: ACCENT, cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button style={styles.pageBtn}
              onClick={() => setBassOctave(o => Math.max(bassOctaveMin, o - 1))}
              disabled={bassOctave <= bassOctaveMin}>▼</button>
            <span style={{ fontSize: 9, color: '#555', fontFamily: MONO }}>O{bassOctave}</span>
            <button style={styles.pageBtn}
              onClick={() => setBassOctave(o => Math.min(bassOctaveMax, o + 1))}
              disabled={bassOctave >= bassOctaveMax}>▲</button>
          </div>
        </div>
      )}

      {/* Step LEDs */}
      <div style={styles.stepIndicators}>
        <div style={{ width: trackControlWidth, flexShrink: 0 }} />
        {Array.from({ length: stepCount }, (_, i) => (
          <div key={i} style={{
            ...styles.stepLed,
            ...(i > 0 ? (i % 16 === 0 ? { marginLeft: 6 } : i % 4 === 0 ? { marginLeft: 3 } : {}) : {}),
            background: i === currentStep ? ACCENT : '#2a2a2a',
            boxShadow: i === currentStep ? `0 0 8px ${ACCENT}` : 'none',
          }} />
        ))}
      </div>

      {/* Drum grid */}
      {activeTab === 'drums' && (
        <div style={styles.grid}>
          {visibleTracks.map((track, visIdx) => {
            const trackIdx = visibleTrackOffset + visIdx;
            return (
              <div key={trackIdx} style={styles.trackRow}>
                <div style={styles.trackControls}>
                  <button
                    className={tapRecTrack === trackIdx ? 'tap-rec-armed' : ''}
                    onClick={() => handleTapRec(trackIdx)}
                    style={{
                      ...styles.tapRecBtn,
                      borderColor: tapRecTrack === trackIdx ? '#ff3b30' : '#444',
                      color: tapRecTrack === trackIdx ? '#ff3b30' : '#555',
                      boxShadow: tapRecTrack === trackIdx ? '0 0 8px rgba(255,59,48,0.5)' : 'none',
                    }}
                  >●</button>
                  <button
                    style={{ ...styles.trackLabel, borderLeftColor: track.color }}
                    onClick={() => {
                      handlePreview(track.soundId, track.volume, track.decay);
                      setTrackPopup(trackPopup === trackIdx ? null : trackIdx);
                      setShowTempoSlider(false);
                      setShowSwingSlider(false);
                    }}
                  >
                    {track.name}
                    <span style={{ color: '#666', fontSize: 8, marginLeft: 4 }}>
                      {getSoundLabel(track.soundId)}
                    </span>
                  </button>
                </div>
                <div style={styles.stepsRow}>
                  {track.steps.map((active, stepIdx) => (
                    <button
                      key={stepIdx}
                      onClick={() => toggleStep(trackIdx, stepIdx)}
                      style={{
                        ...styles.stepButton,
                        ...(stepIdx > 0 ? (stepIdx % 16 === 0 ? { marginLeft: 6 } : stepIdx % 4 === 0 ? { marginLeft: 3 } : {}) : {}),
                        background: active
                          ? track.color
                          : stepIdx % 4 < 2 ? '#2a2a2a' : '#222',
                        borderColor: stepIdx === currentStep ? '#fff' : active ? track.color : '#3a3a3a',
                        boxShadow: active
                          ? `0 0 6px ${track.color}40`
                          : stepIdx === currentStep ? '0 0 4px rgba(255,255,255,0.3)' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bass piano roll */}
      {activeTab === 'bass' && (
        <div style={styles.grid}>
          {bassNotes.map(note => (
            <div key={note} style={styles.trackRow}>
              <div style={{
                ...styles.bassNoteLabel,
                background: note % 12 === bassRoot ? '#1a2a28' : isBlackKey(note) ? '#1a1a1a' : '#252525',
                color: note % 12 === bassRoot ? ACCENT : isBlackKey(note) ? '#888' : '#ccc',
                fontWeight: note % 12 === bassRoot ? 900 : 700,
              }}>
                {noteName(note)}
              </div>
              <div style={styles.stepsRow}>
                {Array.from({ length: stepCount }, (_, stepIdx) => {
                  const isActive = bassSteps[stepIdx]?.note === note;
                  return (
                    <button
                      key={stepIdx}
                      onClick={() => toggleBassNote(stepIdx, note)}
                      style={{
                        ...styles.stepButton,
                        ...(stepIdx > 0 ? (stepIdx % 16 === 0 ? { marginLeft: 6 } : stepIdx % 4 === 0 ? { marginLeft: 3 } : {}) : {}),
                        background: isActive
                          ? ACCENT
                          : stepIdx % 4 < 2 ? '#2a2a2a' : '#222',
                        borderColor: stepIdx === currentStep ? '#fff' : isActive ? ACCENT : '#3a3a3a',
                        boxShadow: isActive
                          ? `0 0 6px ${ACCENT}40`
                          : stepIdx === currentStep ? '0 0 4px rgba(255,255,255,0.3)' : 'none',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.bottomBar} />

      {/* Footer */}
      <div style={styles.footer}>
        <a href="https://github.com/m0oz" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>
          m0oz
        </a>
        {' · '}GPL
      </div>

      {/* Portrait orientation overlay */}
      <style>{`
        .portrait-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.92);
          z-index: 9999;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          text-align: center;
          padding: 40px;
        }
        @media (orientation: portrait) and (max-width: 900px) {
          .portrait-overlay { display: flex; }
        }
        @keyframes tapRecPulse {
          0%, 100% { box-shadow: 0 0 4px rgba(255,59,48,0.4); }
          50% { box-shadow: 0 0 12px rgba(255,59,48,0.8); }
        }
        .tap-rec-armed { animation: tapRecPulse 0.8s ease-in-out infinite; }
      `}</style>
      <div className="portrait-overlay">
        <div style={{ fontSize: 48 }}>↻</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: 2 }}>
          ROTATE YOUR DEVICE
        </div>
        <div style={{ fontSize: 13, color: '#888', maxWidth: 260, lineHeight: 1.5 }}>
          8 MO 8 works best in landscape. Rotate your device to continue.
        </div>
      </div>

      {/* Track Sound Popup (overlay) */}
      {trackPopup !== null && popupTrack && (
        <div style={styles.overlay} onClick={() => setTrackPopup(null)}>
          <div style={styles.popup} onClick={e => e.stopPropagation()}>
            <div style={styles.popupHeader}>
              <div style={styles.popupTitle}>
                <span style={{ color: popupTrack.color, marginRight: 8 }}>●</span>
                {popupTrack.name}
              </div>
              <button style={styles.popupClose} onClick={() => setTrackPopup(null)}>✕</button>
            </div>

            {/* Sound picker */}
            <div style={styles.popupSection}>
              {groupedSounds().map(([cat, sounds]) => (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{
                    ...styles.soundGroupLabel,
                    color: getSoundCategory(popupTrack.soundId) === cat ? ACCENT : '#555',
                  }}>
                    {CATEGORY_LABELS[cat]}
                  </div>
                  <div style={styles.soundChips}>
                    {sounds.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          changeSound(trackPopup, s.id);
                          handlePreview(s.id, popupTrack.volume, popupTrack.decay);
                        }}
                        style={{
                          ...styles.soundChip,
                          background: popupTrack.soundId === s.id ? popupTrack.color : '#2a2a2a',
                          color: popupTrack.soundId === s.id ? '#fff' : '#aaa',
                          borderColor: popupTrack.soundId === s.id ? popupTrack.color : '#3a3a3a',
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div style={styles.popupControls}>
              <div style={styles.popupControl}>
                <label style={styles.popupControlLabel}>VOLUME</label>
                <input type="range" min="0" max="100" value={popupTrack.volume * 100}
                  onChange={e => changeVolume(trackPopup, Number(e.target.value) / 100)}
                  style={styles.popupControlSlider} />
                <span style={styles.popupControlValue}>{Math.round(popupTrack.volume * 100)}%</span>
              </div>
              <div style={styles.popupControl}>
                <label style={styles.popupControlLabel}>DECAY</label>
                <input type="range" min="20" max="200" value={popupTrack.decay * 100}
                  onChange={e => changeDecay(trackPopup, Number(e.target.value) / 100)}
                  style={styles.popupControlSlider} />
                <span style={styles.popupControlValue}>{Math.round(popupTrack.decay * 100)}%</span>
              </div>
              <div style={styles.popupControl}>
                <label style={styles.popupControlLabel}>PREVIEW</label>
                <button
                  style={styles.previewButton}
                  onClick={() => handlePreview(popupTrack.soundId, popupTrack.volume, popupTrack.decay)}
                >
                  ▶ Play
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────

const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace";

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: FONT,
    margin: '0 auto',
    padding: '4px 6px',
    color: '#e0e0e0',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
  },
  header: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    padding: '8px 12px',
    background: 'linear-gradient(180deg, #2a2a2a, #1e1e1e)',
    borderRadius: '10px 10px 0 0',
    border: '1px solid #333',
    borderBottom: 'none',
  },
  brandName: {
    fontSize: 18, fontWeight: 900, color: ACCENT, letterSpacing: 3,
    textShadow: `0 0 16px ${ACCENT}80`, fontFamily: FONT,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 6, fontSize: 16,
    background: '#1a1a1a', border: '1.5px solid #444', color: '#666',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: FONT, fontWeight: 700, padding: 0, flexShrink: 0,
    boxShadow: '0 0 6px rgba(100,100,100,0.2)',
    transition: 'all 0.15s',
  },
  displayBox: {
    background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 5,
    padding: '2px 0', textAlign: 'center' as const, width: 40, height: 40,
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    userSelect: 'none' as const, flexShrink: 0, boxSizing: 'border-box' as const,
  },
  displayLabel: { fontSize: 7, color: '#555', letterSpacing: 1.5, fontWeight: 600, lineHeight: 1 },
  displayValue: {
    fontSize: 14, color: ACCENT, fontFamily: MONO, fontWeight: 600,
    textShadow: `0 0 10px ${ACCENT}66`, lineHeight: 1.2,
  },
  dropdownSlider: {
    position: 'absolute' as const,
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: 8,
    padding: '10px 14px',
    zIndex: 100,
    marginTop: 4,
    minWidth: 140,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  popupSlider: {
    width: '100%', accentColor: ACCENT, cursor: 'pointer',
  },
  controlRow: {
    display: 'flex', gap: 8, alignItems: 'center', padding: '4px 8px',
    background: '#1c1c1c', borderLeft: '1px solid #333', borderRight: '1px solid #333',
    flexWrap: 'wrap' as const,
  },
  patternSelect: {
    fontFamily: FONT, fontSize: 11, color: '#e0e0e0',
    background: '#1a1a1a',
    border: '1px solid #3a3a3a', borderRadius: 4, padding: '3px 8px',
    cursor: 'pointer', fontWeight: 500, maxWidth: 200,
    outline: 'none',
  },
  pageBtn: {
    width: 24, height: 20, borderRadius: 3, fontSize: 10,
    background: '#1a1a1a', border: '1px solid #3a3a3a', color: '#888',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, fontFamily: FONT, transition: 'all 0.15s',
  },
  stepIndicators: {
    display: 'flex', gap: 1, padding: '3px 8px',
    background: '#191919', borderLeft: '1px solid #333', borderRight: '1px solid #333',
    alignItems: 'center',
  },
  stepLed: {
    flex: 1, height: 3, borderRadius: 1.5,
    transition: 'background 0.05s, box-shadow 0.05s',
  },
  grid: {
    display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 8px',
    background: '#191919', borderLeft: '1px solid #333', borderRight: '1px solid #333',
  },
  trackRow: { display: 'flex', gap: 4, alignItems: 'stretch' },
  trackControls: {
    width: 110, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3,
  },
  trackLabel: {
    fontSize: 9, fontWeight: 700, color: '#ccc', letterSpacing: 0.5,
    fontFamily: FONT, background: 'none', border: 'none', borderLeft: '2px solid',
    cursor: 'pointer', textAlign: 'left' as const, padding: '2px 2px 2px 4px',
    whiteSpace: 'nowrap' as const, overflow: 'hidden',
    display: 'flex', alignItems: 'center', width: '100%',
  },
  stepsRow: { display: 'flex', gap: 1, flex: 1 },
  stepButton: {
    flex: 1, aspectRatio: '1', border: '1px solid', borderRadius: 2,
    cursor: 'pointer', transition: 'background 0.05s, border-color 0.05s',
    padding: 0, maxHeight: 32, minWidth: 0,
  },
  // Popup overlay
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  popup: {
    background: '#1e1e1e',
    border: '1px solid #444',
    borderRadius: 12,
    padding: '20px',
    width: '90%',
    maxWidth: 520,
    maxHeight: '80vh',
    overflowY: 'auto' as const,
    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
  },
  popupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #333',
  },
  popupTitle: {
    fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: 1,
  },
  popupClose: {
    background: 'none', border: 'none', color: '#666', fontSize: 18,
    cursor: 'pointer', padding: '4px 8px',
  },
  popupSection: {
    marginBottom: 16,
  },
  soundGroupLabel: {
    fontSize: 9, fontWeight: 600, letterSpacing: 2, marginBottom: 4,
  },
  soundChips: { display: 'flex', gap: 4, flexWrap: 'wrap' as const },
  soundChip: {
    fontFamily: FONT, fontSize: 10, fontWeight: 600,
    border: '1px solid', borderRadius: 4, padding: '3px 8px',
    cursor: 'pointer', transition: 'all 0.1s',
  },
  popupControls: {
    display: 'flex', flexDirection: 'column', gap: 12,
    paddingTop: 14, borderTop: '1px solid #333',
  },
  popupControl: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  popupControlLabel: {
    fontSize: 9, fontWeight: 600, letterSpacing: 2, color: '#666', minWidth: 56,
  },
  popupControlSlider: {
    flex: 1, accentColor: ACCENT, cursor: 'pointer',
  },
  popupControlValue: {
    fontSize: 11, color: '#888', fontFamily: MONO, minWidth: 40, textAlign: 'right' as const,
  },
  previewButton: {
    fontFamily: FONT, fontSize: 11, fontWeight: 600, color: '#ccc',
    background: 'linear-gradient(180deg, #333, #272727)',
    border: '1px solid #444', borderRadius: 6, padding: '6px 14px',
    cursor: 'pointer', letterSpacing: 1,
  },
  bottomBar: {
    height: 4,
    background: 'linear-gradient(180deg, #1e1e1e, #2a2a2a)',
    borderRadius: '0 0 10px 10px',
    border: '1px solid #333',
    borderTop: 'none',
  },
  // Tab bar
  tabBar: {
    display: 'flex', gap: 0, padding: '0 8px',
    background: '#191919', borderLeft: '1px solid #333', borderRight: '1px solid #333',
  },
  tabBtn: {
    fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: 3,
    background: 'none', border: 'none', borderBottom: '2px solid transparent',
    padding: '6px 16px', cursor: 'pointer', transition: 'all 0.15s',
  },
  // Tap record button
  tapRecBtn: {
    width: 34, height: 34, borderRadius: 17, fontSize: 18,
    background: '#1a1a1a', border: '1.5px solid #444', color: '#555',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, flexShrink: 0, transition: 'all 0.15s', lineHeight: 1,
  },
  // Bass piano roll
  bassNoteLabel: {
    width: 44, flexShrink: 0, fontSize: 9, fontWeight: 700,
    fontFamily: MONO, padding: '2px 4px', borderRadius: 2,
    textAlign: 'center' as const, letterSpacing: 1,
  },
  waveBtn: {
    fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: 1,
    background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: 4,
    padding: '3px 6px', cursor: 'pointer', transition: 'all 0.15s',
  },
  // Footer
  footer: {
    textAlign: 'center' as const, padding: '4px 0 2px', fontSize: 8,
    color: '#333', letterSpacing: 0.5,
  },
  footerLink: {
    color: '#555', textDecoration: 'none',
  },
};
