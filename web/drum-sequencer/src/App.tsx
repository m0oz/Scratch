import { useState, useCallback, useRef, useEffect } from 'react';
import {
  resumeAudio, getAudioContext, playSoundById,
  SOUNDS_BY_CATEGORY, CATEGORY_LABELS,
  type SoundCategory, type SoundDef, SOUND_CATALOG,
} from './audioEngine';
import { PRESETS, DEFAULT_TRACKS, type Track } from './patterns';
import { startDetection, beginRecording, stopDetection, quantizeHits, isDetecting, isRecording, getAnalyser, type DetectedHit } from './beatDetector';

const SCHEDULE_AHEAD = 0.1;
const LOOKAHEAD = 25;

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(() =>
    PRESETS[0].tracks.map(t => ({ ...t, steps: [...t.steps] }))
  );
  const [stepCount, setStepCount] = useState(PRESETS[0].steps);
  const [bpm, setBpm] = useState(PRESETS[0].bpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [swing, setSwing] = useState(0);
  const [expandedTrack, setExpandedTrack] = useState<number | null>(null);

  // Vocalize mode
  const [vocalizeActive, setVocalizeActive] = useState(false);
  const [vocalizeCountdown, setVocalizeCountdown] = useState(-1);
  const [vocalizeHits, setVocalizeHits] = useState<DetectedHit[]>([]);
  const [micLevel, setMicLevel] = useState(0);
  const micAnimRef = useRef<number>(0);

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

      setCurrentStep(step);

      const secondsPerStep = 60.0 / bpmRef.current / 4;
      const isOddStep = step % 2 === 1;
      const swingAmount = isOddStep ? swingRef.current * secondsPerStep * 0.5 : 0;
      nextStepTimeRef.current = time + secondsPerStep + swingAmount;
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
    setExpandedTrack(null);
  }, []);

  const clearAll = useCallback(() => {
    setTracks(DEFAULT_TRACKS(stepCount));
    setExpandedTrack(null);
  }, [stepCount]);

  // ── Vocalize mode ──────────────────────────────────────

  const startVocalize = useCallback(async () => {
    resumeAudio();

    // Stop playback if running
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setCurrentStep(-1);
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    setVocalizeHits([]);

    // Request mic access and start analysers early (during countdown)
    // so the running average has time to calibrate to ambient noise
    const hits: DetectedHit[] = [];
    await startDetection((hit) => {
      hits.push(hit);
      setVocalizeHits([...hits]);
    });

    // Mic level animation (runs through count-in and recording)
    const animateMic = () => {
      const analyser = getAnalyser();
      if (analyser) {
        const data = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        setMicLevel(Math.sqrt(sum / data.length));
      }
      if (isDetecting()) micAnimRef.current = requestAnimationFrame(animateMic);
    };
    micAnimRef.current = requestAnimationFrame(animateMic);

    const secondsPerBeat = 60.0 / bpmRef.current;
    const ctx = getAudioContext();

    // ── Phase 1: Count-in (4 beats with metronome) ────────
    // Detector is running but NOT recording, so it calibrates its
    // noise floor from ambient + metronome bleed.
    const countInBeats = 4;
    const countInStart = ctx.currentTime + 0.1; // tiny buffer
    for (let i = 0; i < countInBeats; i++) {
      const t = countInStart + i * secondsPerBeat;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = i === 0 ? 1400 : 900;
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      o.start(t); o.stop(t + 0.06);
    }

    // Tick down the countdown display synced to the scheduled audio clicks.
    // Wait for the initial buffer, then update the display on each beat.
    const countInEnd = countInStart + countInBeats * secondsPerBeat;
    setVocalizeCountdown(countInBeats);
    await new Promise(r => setTimeout(r, (countInStart - ctx.currentTime) * 1000));
    for (let i = countInBeats - 1; i >= 1; i--) {
      await new Promise(r => setTimeout(r, secondsPerBeat * 1000));
      setVocalizeCountdown(i);
    }
    // Wait for the final beat to finish before moving to recording
    const remaining = (countInEnd - ctx.currentTime) * 1000;
    if (remaining > 0) await new Promise(r => setTimeout(r, remaining));
    setVocalizeCountdown(0);

    // ── Phase 2: Recording (2 bars with metronome) ────────
    setVocalizeActive(true);

    // Always record exactly 2 bars
    const recordBeats = (stepCountRef.current / 4) * 2;
    const recordDuration = recordBeats * secondsPerBeat;

    // Start capturing hits NOW
    beginRecording();

    // Schedule metronome clicks for the recording period
    const recStart = ctx.currentTime;
    for (let i = 0; i < recordBeats; i++) {
      const t = recStart + i * secondsPerBeat;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = i % 4 === 0 ? 1400 : 900;
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      o.start(t); o.stop(t + 0.05);
    }

    // Auto-stop after recording duration + generous buffer
    setTimeout(() => {
      if (isDetecting()) finishVocalize();
    }, (recordDuration + 1.0) * 1000);
  }, []);

  const finishVocalize = useCallback(() => {
    cancelAnimationFrame(micAnimRef.current);
    const hits = stopDetection();
    setVocalizeActive(false);
    setVocalizeCountdown(-1);
    setMicLevel(0);

    if (hits.length === 0) return;

    // Quantize hits to grid
    const pattern = quantizeHits(hits, bpmRef.current, stepCountRef.current);

    // Apply to first 3 tracks (kick, snare, hat)
    setTracks(prev => prev.map((tr, i) => {
      if (i === 0) return { ...tr, steps: pattern.kick };
      if (i === 1) return { ...tr, steps: pattern.snare };
      if (i === 2) return { ...tr, steps: pattern.hat };
      return tr;
    }));
  }, []);

  // ── Helpers ────────────────────────────────────────────

  function getSoundCategory(soundId: string): SoundCategory {
    const def = SOUND_CATALOG.find(s => s.id === soundId);
    return def?.category ?? 'perc';
  }

  function groupedSounds(): [SoundCategory, SoundDef[]][] {
    return Object.entries(SOUNDS_BY_CATEGORY) as [SoundCategory, SoundDef[]][];
  }

  // ── Render ─────────────────────────────────────────────

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.brandSection}>
          <div style={styles.brandName}>DR-808</div>
          <div style={styles.brandSub}>RHYTHM COMPOSER</div>
        </div>
        <div style={styles.displaySection}>
          <div style={styles.display}>
            <div style={styles.displayLabel}>TEMPO</div>
            <div style={styles.displayValue}>{bpm}</div>
          </div>
          <div style={styles.display}>
            <div style={styles.displayLabel}>STEP</div>
            <div style={styles.displayValue}>{currentStep >= 0 ? currentStep + 1 : '--'}</div>
          </div>
          <div style={styles.display}>
            <div style={styles.displayLabel}>BARS</div>
            <div style={styles.displayValue}>{stepCount / 16}</div>
          </div>
          <div style={styles.display}>
            <div style={styles.displayLabel}>SWING</div>
            <div style={styles.displayValue}>{Math.round(swing * 100)}%</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.controlGroup}>
          <label style={styles.knobLabel}>TEMPO</label>
          <input type="range" min="60" max="200" value={bpm}
            onChange={e => setBpm(Number(e.target.value))} style={styles.slider} />
        </div>
        <div style={styles.controlGroup}>
          <label style={styles.knobLabel}>SWING</label>
          <input type="range" min="0" max="100" value={swing * 100}
            onChange={e => setSwing(Number(e.target.value) / 100)} style={styles.slider} />
        </div>
        <button onClick={handlePlay}
          style={{
            ...styles.playButton,
            background: isPlaying
              ? 'linear-gradient(180deg, #ff3b30, #cc2200)'
              : 'linear-gradient(180deg, #34c759, #248a3d)',
          }}>
          {isPlaying ? '■ STOP' : '▶ PLAY'}
        </button>
        <button onClick={clearAll} style={styles.clearButton}>CLEAR</button>
        <button
          onClick={vocalizeActive ? finishVocalize : startVocalize}
          disabled={vocalizeCountdown >= 1}
          style={{
            ...styles.vocalizeButton,
            background: vocalizeActive
              ? 'linear-gradient(180deg, #ff3b30, #cc2200)'
              : 'linear-gradient(180deg, #5856d6, #3634a3)',
            opacity: vocalizeCountdown >= 1 ? 0.5 : 1,
          }}>
          {vocalizeCountdown >= 1
            ? `${vocalizeCountdown}...`
            : vocalizeActive
              ? '■ DONE'
              : '🎤 VOCALIZE'}
        </button>
      </div>

      {/* Vocalize feedback */}
      {(vocalizeActive || vocalizeCountdown >= 0) && (
        <div style={styles.vocalizeBar}>
          <div style={{
            ...styles.micMeter,
            width: `${Math.min(100, micLevel * 600)}%`,
          }} />
          {vocalizeCountdown >= 1 ? (
            <span style={styles.vocalizeText}>
              Count-in... {vocalizeCountdown}
            </span>
          ) : vocalizeActive ? (
            <span style={styles.vocalizeText}>
              Recording — beatbox your pattern! ({vocalizeHits.length} hits)
            </span>
          ) : null}
        </div>
      )}

      {/* Presets */}
      <div style={styles.presets}>
        <span style={styles.presetLabel}>PATTERNS</span>
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => loadPreset(i)} style={styles.presetButton}>{p.name}</button>
        ))}
      </div>

      {/* Step LEDs */}
      <div style={styles.stepIndicators}>
        <div style={{ width: 200, flexShrink: 0 }} />
        {Array.from({ length: stepCount }, (_, i) => (
          <div key={i} style={{
            ...styles.stepLed,
            ...(i % 16 === 0 && i > 0 ? { marginLeft: 6 } : {}),
            background: i === currentStep ? '#ff3b30' : i % 4 === 0 ? '#555' : '#2a2a2a',
            boxShadow: i === currentStep ? '0 0 8px #ff3b30' : 'none',
          }} />
        ))}
      </div>

      {/* Beat numbers */}
      <div style={styles.stepIndicators}>
        <div style={{ width: 200, flexShrink: 0 }} />
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

      {/* Sequencer grid */}
      <div style={styles.grid}>
        {tracks.map((track, trackIdx) => {
          const isExpanded = expandedTrack === trackIdx;
          const currentCategory = getSoundCategory(track.soundId);

          return (
            <div key={trackIdx}>
              <div style={styles.trackRow}>
                <div style={styles.trackControls}>
                  <button
                    style={{ ...styles.trackLabel, borderLeftColor: track.color }}
                    onClick={() => handlePreview(track.soundId, track.volume, track.decay)}
                  >
                    {track.name}
                  </button>
                  <button
                    style={{
                      ...styles.expandBtn,
                      color: isExpanded ? '#ff3b30' : '#666',
                    }}
                    onClick={() => setExpandedTrack(isExpanded ? null : trackIdx)}
                  >
                    {isExpanded ? '▾' : '▸'}
                  </button>
                  {/* Mini vol/decay */}
                  <input type="range" min="0" max="100" value={track.volume * 100}
                    onChange={e => changeVolume(trackIdx, Number(e.target.value) / 100)}
                    style={styles.miniSlider} title={`Vol ${Math.round(track.volume * 100)}%`} />
                  <input type="range" min="20" max="200" value={track.decay * 100}
                    onChange={e => changeDecay(trackIdx, Number(e.target.value) / 100)}
                    style={styles.miniSlider} title={`Decay ${Math.round(track.decay * 100)}%`} />
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

              {/* Expanded sound picker */}
              {isExpanded && (
                <div style={styles.soundPicker}>
                  {groupedSounds().map(([cat, sounds]) => (
                    <div key={cat} style={styles.soundGroup}>
                      <div style={{
                        ...styles.soundGroupLabel,
                        color: currentCategory === cat ? '#ff3b30' : '#555',
                      }}>
                        {CATEGORY_LABELS[cat]}
                      </div>
                      <div style={styles.soundChips}>
                        {sounds.map(s => (
                          <button
                            key={s.id}
                            onClick={() => {
                              changeSound(trackIdx, s.id);
                              handlePreview(s.id, track.volume, track.decay);
                            }}
                            style={{
                              ...styles.soundChip,
                              background: track.soundId === s.id ? track.color : '#2a2a2a',
                              color: track.soundId === s.id ? '#fff' : '#aaa',
                              borderColor: track.soundId === s.id ? track.color : '#3a3a3a',
                            }}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div style={styles.channelControls}>
                    <div style={styles.channelControl}>
                      <label style={styles.channelLabel}>VOLUME</label>
                      <input type="range" min="0" max="100" value={track.volume * 100}
                        onChange={e => changeVolume(trackIdx, Number(e.target.value) / 100)}
                        style={styles.channelSlider} />
                      <span style={styles.channelValue}>{Math.round(track.volume * 100)}%</span>
                    </div>
                    <div style={styles.channelControl}>
                      <label style={styles.channelLabel}>DECAY</label>
                      <input type="range" min="20" max="200" value={track.decay * 100}
                        onChange={e => changeDecay(trackIdx, Number(e.target.value) / 100)}
                        style={styles.channelSlider} />
                      <span style={styles.channelValue}>{Math.round(track.decay * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.bottomBar} />
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
    padding: '20px',
    color: '#e0e0e0',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: 'linear-gradient(180deg, #2a2a2a, #1e1e1e)',
    borderRadius: '12px 12px 0 0',
    border: '1px solid #333',
    borderBottom: 'none',
  },
  brandSection: { display: 'flex', flexDirection: 'column', gap: 2 },
  brandName: {
    fontSize: 28, fontWeight: 900, color: '#ff3b30', letterSpacing: 4,
    textShadow: '0 0 20px rgba(255, 59, 48, 0.5)', fontFamily: FONT,
  },
  brandSub: { fontSize: 9, letterSpacing: 6, color: '#666', fontWeight: 500 },
  displaySection: { display: 'flex', gap: 12 },
  display: {
    background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 6,
    padding: '8px 14px', textAlign: 'center' as const, minWidth: 60,
  },
  displayLabel: { fontSize: 8, color: '#555', letterSpacing: 2, marginBottom: 4, fontWeight: 600 },
  displayValue: {
    fontSize: 18, color: '#ff3b30', fontFamily: MONO, fontWeight: 600,
    textShadow: '0 0 10px rgba(255, 59, 48, 0.4)',
  },
  controls: {
    display: 'flex', gap: 12, alignItems: 'flex-end', padding: '14px 24px',
    background: '#1e1e1e', borderLeft: '1px solid #333', borderRight: '1px solid #333',
    flexWrap: 'wrap' as const,
  },
  controlGroup: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 100 },
  knobLabel: { fontSize: 9, letterSpacing: 2, color: '#666', fontWeight: 600 },
  slider: { width: '100%', accentColor: '#ff3b30', cursor: 'pointer' },
  playButton: {
    fontFamily: FONT, fontSize: 13, fontWeight: 700, color: '#fff',
    border: 'none', borderRadius: 8, padding: '12px 20px', cursor: 'pointer',
    letterSpacing: 2, textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
    minWidth: 100,
  },
  clearButton: {
    fontFamily: FONT, fontSize: 11, fontWeight: 600, color: '#999',
    background: 'linear-gradient(180deg, #333, #272727)',
    border: '1px solid #444', borderRadius: 8, padding: '12px 14px',
    cursor: 'pointer', letterSpacing: 2,
  },
  vocalizeButton: {
    fontFamily: FONT, fontSize: 12, fontWeight: 700, color: '#fff',
    border: 'none', borderRadius: 8, padding: '12px 16px', cursor: 'pointer',
    letterSpacing: 1, textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
    whiteSpace: 'nowrap' as const,
  },
  vocalizeBar: {
    position: 'relative' as const,
    padding: '10px 24px',
    background: '#1a0a20',
    borderLeft: '1px solid #333',
    borderRight: '1px solid #333',
    overflow: 'hidden',
    minHeight: 36,
    display: 'flex',
    alignItems: 'center',
  },
  micMeter: {
    position: 'absolute' as const, left: 0, top: 0, bottom: 0,
    background: 'linear-gradient(90deg, rgba(88, 86, 214, 0.3), rgba(88, 86, 214, 0.1))',
    transition: 'width 0.05s',
  },
  vocalizeText: {
    position: 'relative' as const, zIndex: 1,
    fontSize: 12, color: '#b8b5ff', fontWeight: 600, letterSpacing: 1,
  },
  presets: {
    display: 'flex', gap: 6, alignItems: 'center', padding: '12px 24px',
    background: '#191919', borderLeft: '1px solid #333', borderRight: '1px solid #333',
    flexWrap: 'wrap' as const,
  },
  presetLabel: { fontSize: 9, letterSpacing: 2, color: '#555', marginRight: 8, fontWeight: 600 },
  presetButton: {
    fontFamily: FONT, fontSize: 11, color: '#bbb',
    background: 'linear-gradient(180deg, #2a2a2a, #222)',
    border: '1px solid #3a3a3a', borderRadius: 6, padding: '5px 10px',
    cursor: 'pointer', letterSpacing: 0.5, fontWeight: 500,
  },
  stepIndicators: {
    display: 'flex', gap: 3, padding: '6px 24px',
    background: '#191919', borderLeft: '1px solid #333', borderRight: '1px solid #333',
    alignItems: 'center',
  },
  stepLed: {
    flex: 1, height: 4, borderRadius: 2,
    transition: 'background 0.05s, box-shadow 0.05s',
  },
  stepNumber: { flex: 1, textAlign: 'center' as const, fontSize: 9, fontFamily: MONO },
  grid: {
    display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 24px',
    background: '#191919', borderLeft: '1px solid #333', borderRight: '1px solid #333',
  },
  trackRow: { display: 'flex', gap: 6, alignItems: 'center' },
  trackControls: {
    width: 200, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3,
  },
  trackLabel: {
    fontSize: 10, fontWeight: 700, color: '#ccc', letterSpacing: 0.5,
    fontFamily: FONT, background: 'none', border: 'none', borderLeft: '3px solid',
    cursor: 'pointer', textAlign: 'left' as const, padding: '3px 3px 3px 6px',
    whiteSpace: 'nowrap' as const, minWidth: 50,
  },
  expandBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
    fontSize: 10, fontFamily: FONT, fontWeight: 700,
  },
  miniSlider: {
    width: 40, accentColor: '#666', cursor: 'pointer', height: 12,
  },
  stepsRow: { display: 'flex', gap: 3, flex: 1 },
  stepButton: {
    flex: 1, aspectRatio: '1', border: '1px solid', borderRadius: 3,
    cursor: 'pointer', transition: 'background 0.05s, border-color 0.05s',
    padding: 0, maxHeight: 26, minWidth: 0,
  },
  // Expanded sound picker
  soundPicker: {
    padding: '10px 10px 10px 210px',
    background: '#151515',
    borderTop: '1px solid #2a2a2a',
    marginBottom: 4,
  },
  soundGroup: { marginBottom: 8 },
  soundGroupLabel: {
    fontSize: 9, fontWeight: 600, letterSpacing: 2, marginBottom: 4,
  },
  soundChips: { display: 'flex', gap: 4, flexWrap: 'wrap' as const },
  soundChip: {
    fontFamily: FONT, fontSize: 10, fontWeight: 600,
    border: '1px solid', borderRadius: 4, padding: '3px 8px',
    cursor: 'pointer', transition: 'all 0.1s',
  },
  channelControls: {
    display: 'flex', gap: 20, marginTop: 10, paddingTop: 10,
    borderTop: '1px solid #2a2a2a',
  },
  channelControl: { display: 'flex', alignItems: 'center', gap: 8 },
  channelLabel: { fontSize: 9, fontWeight: 600, letterSpacing: 2, color: '#666', minWidth: 50 },
  channelSlider: { width: 120, accentColor: '#ff3b30', cursor: 'pointer' },
  channelValue: { fontSize: 11, color: '#888', fontFamily: MONO, minWidth: 36 },
  bottomBar: {
    height: 8,
    background: 'linear-gradient(180deg, #1e1e1e, #2a2a2a)',
    borderRadius: '0 0 12px 12px',
    border: '1px solid #333',
    borderTop: 'none',
  },
};
