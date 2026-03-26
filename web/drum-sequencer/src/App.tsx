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

// Piano roll rows: chromatic, C4 (top) down to C1 (bottom)
const NOTE_NAMES_CHROM = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BASS_ROLL_NOTES: number[] = [];
const BASS_ROLL_LABELS: string[] = [];
// C4(60) down to C1(24) — 3 octaves chromatic = 37 notes
for (let midi = 60; midi >= 24; midi--) {
  BASS_ROLL_NOTES.push(midi);
  const octave = Math.floor(midi / 12) - 1;
  BASS_ROLL_LABELS.push(NOTE_NAMES_CHROM[midi % 12] + octave);
}
const BLACK_KEYS = new Set([1, 3, 6, 8, 10]); // semitone offsets for black keys
function isBlackKey(midi: number): boolean { return BLACK_KEYS.has(midi % 12); }

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

  const handlePlay = useCallback(() => {
    resumeAudio();
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

  const handleTapRec = useCallback((trackIndex: number) => {
    resumeAudio();
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
      // Auto-start playback
      if (!isPlayingRef.current) {
        isPlayingRef.current = true;
        setIsPlaying(true);
        nextStepRef.current = 0;
        nextStepTimeRef.current = getAudioContext().currentTime;
        scheduler();
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
    setBassSteps(prev => prev.map((bs, i) => {
      if (i !== stepIdx) return bs;
      // Toggle: if same note, clear it; otherwise set it
      return { ...bs, note: bs.note === note ? 0 : note };
    }));
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

  return (
    <div style={styles.container}>
      {/* Header — single compact row */}
      <div style={styles.header}>
        <div style={styles.brandName}>8MO8</div>
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
        <button onClick={clearAll} style={styles.headerBtn}>✕</button>
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

      {/* Step LEDs */}
      <div style={styles.stepIndicators}>
        <div style={{ width: activeTab === 'drums' ? 120 : 44, flexShrink: 0 }} />
        {Array.from({ length: stepCount }, (_, i) => (
          <div key={i} style={{
            ...styles.stepLed,
            ...(i % 16 === 0 && i > 0 ? { marginLeft: 6 } : {}),
            background: i === currentStep ? ACCENT : i % 4 === 0 ? '#555' : '#2a2a2a',
            boxShadow: i === currentStep ? `0 0 8px ${ACCENT}` : 'none',
          }} />
        ))}
      </div>

      {/* Beat numbers */}
      <div style={styles.stepIndicators}>
        <div style={{ width: activeTab === 'drums' ? 120 : 44, flexShrink: 0 }} />
        {Array.from({ length: stepCount }, (_, i) => (
          <div key={i} style={{
            ...styles.stepNumber,
            ...(i % 16 === 0 && i > 0 ? { marginLeft: 6 } : {}),
            color: i % 16 === 0 ? '#888' : i % 4 === 0 ? '#555' : '#333',
            fontWeight: i % 16 === 0 ? 700 : 400,
          }}>
            {i % 4 === 0 ? i / 4 + 1 : '·'}
          </div>
        ))}
      </div>

      {/* Drum grid */}
      {activeTab === 'drums' && (
        <div style={styles.grid}>
          {/* Pattern selector — compact */}
          <div style={styles.presetRow}>
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
          </div>
          {tracks.map((track, trackIdx) => (
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
                      ...(stepIdx % 16 === 0 && stepIdx > 0 ? { marginLeft: 6 } : {}),
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
          ))}
        </div>
      )}

      {/* Bass piano roll */}
      {activeTab === 'bass' && (
        <div style={styles.grid}>
          <div style={{
            maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' as const,
            display: 'flex', flexDirection: 'column' as const, gap: 1,
          }}>
            {BASS_ROLL_NOTES.map((note, rowIdx) => (
              <div key={note} style={styles.trackRow}>
                <div style={{
                  ...styles.bassNoteLabel,
                  background: isBlackKey(note) ? '#1a1a1a' : '#2a2a2a',
                  color: isBlackKey(note) ? ACCENT : '#ccc',
                  borderLeft: note % 12 === 0 ? `2px solid ${ACCENT}44` : 'none',
                }}>
                  {BASS_ROLL_LABELS[rowIdx]}
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
                          ...(stepIdx % 16 === 0 && stepIdx > 0 ? { marginLeft: 6 } : {}),
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
          {/* Bass controls */}
          <div style={styles.bassControls}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 8, color: '#555', letterSpacing: 2, fontWeight: 600, marginRight: 2 }}>WAVE</span>
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
              <span style={{ fontSize: 8, color: '#555', letterSpacing: 2, fontWeight: 600 }}>CUT</span>
              <input type="range" min="80" max="8000" value={bassSettings.cutoff}
                onChange={e => setBassSettings(s => ({ ...s, cutoff: Number(e.target.value) }))}
                style={{ flex: 1, accentColor: ACCENT, cursor: 'pointer' }} />
              <span style={{ fontSize: 8, color: '#555', letterSpacing: 2, fontWeight: 600 }}>RES</span>
              <input type="range" min="50" max="2000" value={bassSettings.resonance * 100}
                onChange={e => setBassSettings(s => ({ ...s, resonance: Number(e.target.value) / 100 }))}
                style={{ flex: 1, accentColor: ACCENT, cursor: 'pointer' }} />
            </div>
          </div>
        </div>
      )}

      <div style={styles.bottomBar} />

      {/* Footer */}
      <div style={styles.footer}>
        <a href="https://github.com/m0oz" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>
          m0oz
        </a>
        {' \u00B7 '}MIT License
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
    maxWidth: 1200,
    margin: '0 auto',
    padding: '6px 8px',
    color: '#e0e0e0',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
  },
  header: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    padding: '6px 10px',
    background: 'linear-gradient(180deg, #2a2a2a, #1e1e1e)',
    borderRadius: '10px 10px 0 0',
    border: '1px solid #333',
    borderBottom: 'none',
  },
  brandName: {
    fontSize: 18, fontWeight: 900, color: ACCENT, letterSpacing: 3,
    textShadow: `0 0 16px ${ACCENT}80`, fontFamily: FONT, marginRight: 4,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 6, fontSize: 14,
    background: '#1a1a1a', border: '1.5px solid #444', color: '#666',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: FONT, fontWeight: 700, padding: 0, flexShrink: 0,
    boxShadow: '0 0 6px rgba(100,100,100,0.2)',
    transition: 'all 0.15s',
  },
  displayBox: {
    background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 5,
    padding: '2px 0', textAlign: 'center' as const, width: 36, height: 36,
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
  presetRow: {
    display: 'flex', alignItems: 'center', marginBottom: 2,
  },
  patternSelect: {
    fontFamily: FONT, fontSize: 11, color: '#e0e0e0',
    background: '#1a1a1a',
    border: '1px solid #3a3a3a', borderRadius: 4, padding: '3px 8px',
    cursor: 'pointer', fontWeight: 500, maxWidth: 240,
    outline: 'none',
  },
  stepIndicators: {
    display: 'flex', gap: 3, padding: '3px 10px',
    background: '#191919', borderLeft: '1px solid #333', borderRight: '1px solid #333',
    alignItems: 'center',
  },
  stepLed: {
    flex: 1, height: 3, borderRadius: 1.5,
    transition: 'background 0.05s, box-shadow 0.05s',
  },
  stepNumber: { flex: 1, textAlign: 'center' as const, fontSize: 8, fontFamily: MONO },
  grid: {
    display: 'flex', flexDirection: 'column', gap: 1, padding: '4px 10px',
    background: '#191919', borderLeft: '1px solid #333', borderRight: '1px solid #333',
  },
  trackRow: { display: 'flex', gap: 4, alignItems: 'center' },
  trackControls: {
    width: 120, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3,
  },
  trackLabel: {
    fontSize: 9, fontWeight: 700, color: '#ccc', letterSpacing: 0.5,
    fontFamily: FONT, background: 'none', border: 'none', borderLeft: '2px solid',
    cursor: 'pointer', textAlign: 'left' as const, padding: '2px 2px 2px 4px',
    whiteSpace: 'nowrap' as const, overflow: 'hidden',
    display: 'flex', alignItems: 'center', width: '100%',
  },
  stepsRow: { display: 'flex', gap: 2, flex: 1 },
  stepButton: {
    flex: 1, aspectRatio: '1', border: '1px solid', borderRadius: 2,
    cursor: 'pointer', transition: 'background 0.05s, border-color 0.05s',
    padding: 0, maxHeight: 22, minWidth: 0,
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
    display: 'flex', gap: 0, padding: '0 10px',
    background: '#191919', borderLeft: '1px solid #333', borderRight: '1px solid #333',
  },
  tabBtn: {
    fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: 3,
    background: 'none', border: 'none', borderBottom: '2px solid transparent',
    padding: '6px 16px', cursor: 'pointer', transition: 'all 0.15s',
  },
  // Tap record button
  tapRecBtn: {
    width: 22, height: 22, borderRadius: 11, fontSize: 12,
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
  bassControls: {
    display: 'flex', gap: 12, alignItems: 'center', paddingTop: 6,
    flexWrap: 'wrap' as const,
  },
  waveBtn: {
    fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: 1,
    background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: 4,
    padding: '3px 6px', cursor: 'pointer', transition: 'all 0.15s',
  },
  // Footer
  footer: {
    textAlign: 'center' as const, padding: '8px 0 4px', fontSize: 10,
    color: '#444', letterSpacing: 1,
  },
  footerLink: {
    color: '#666', textDecoration: 'none',
  },
};
