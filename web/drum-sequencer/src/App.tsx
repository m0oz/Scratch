import { useState, useCallback, useRef, useEffect } from 'react';
import { playSound, resumeAudio, getAudioContext, ALL_SOUNDS, type DrumSound } from './audioEngine';
import { PRESETS, DEFAULT_TRACKS, type Track } from './patterns';

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

  const scheduler = useCallback(() => {
    const ctx = getAudioContext();
    while (nextStepTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD) {
      const step = nextStepRef.current;
      const time = nextStepTimeRef.current;

      for (const track of tracksRef.current) {
        if (track.steps[step]) {
          playSound(track.sound, time);
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

  const toggleStep = useCallback((trackIndex: number, stepIndex: number) => {
    setTracks(prev =>
      prev.map((t, i) =>
        i === trackIndex
          ? { ...t, steps: t.steps.map((s, j) => (j === stepIndex ? !s : s)) }
          : t
      )
    );
  }, []);

  const handlePreview = useCallback((sound: DrumSound) => {
    resumeAudio();
    playSound(sound);
  }, []);

  const changeSound = useCallback((trackIndex: number, sound: DrumSound) => {
    setTracks(prev =>
      prev.map((t, i) =>
        i === trackIndex ? { ...t, sound } : t
      )
    );
  }, []);

  const loadPreset = useCallback((index: number) => {
    const preset = PRESETS[index];
    setTracks(preset.tracks.map(t => ({ ...t, steps: [...t.steps] })));
    setBpm(preset.bpm);
    setStepCount(preset.steps);
    setCurrentStep(-1);
  }, []);

  const clearAll = useCallback(() => {
    setTracks(DEFAULT_TRACKS(stepCount));
  }, [stepCount]);

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
          <input
            type="range"
            min="60"
            max="200"
            value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            style={styles.slider}
          />
        </div>
        <div style={styles.controlGroup}>
          <label style={styles.knobLabel}>SWING</label>
          <input
            type="range"
            min="0"
            max="100"
            value={swing * 100}
            onChange={e => setSwing(Number(e.target.value) / 100)}
            style={styles.slider}
          />
        </div>
        <button
          onClick={handlePlay}
          style={{
            ...styles.playButton,
            background: isPlaying
              ? 'linear-gradient(180deg, #ff3b30, #cc2200)'
              : 'linear-gradient(180deg, #34c759, #248a3d)',
          }}
        >
          {isPlaying ? '■ STOP' : '▶ PLAY'}
        </button>
        <button onClick={clearAll} style={styles.clearButton}>
          CLEAR
        </button>
      </div>

      {/* Preset buttons */}
      <div style={styles.presets}>
        <span style={styles.presetLabel}>PATTERNS</span>
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => loadPreset(i)} style={styles.presetButton}>
            {p.name}
          </button>
        ))}
      </div>

      {/* Step indicator LEDs */}
      <div style={styles.stepIndicators}>
        <div style={styles.trackLabelSpacer} />
        {Array.from({ length: stepCount }, (_, i) => (
          <div
            key={i}
            style={{
              ...styles.stepLed,
              background: i === currentStep ? '#ff3b30' : i % 4 === 0 ? '#555' : '#2a2a2a',
              boxShadow: i === currentStep ? '0 0 8px #ff3b30' : 'none',
            }}
          />
        ))}
      </div>

      {/* Beat numbers */}
      <div style={styles.stepIndicators}>
        <div style={styles.trackLabelSpacer} />
        {Array.from({ length: stepCount }, (_, i) => (
          <div key={i} style={{
            ...styles.stepNumber,
            color: i % 16 === 0 ? '#888' : i % 4 === 0 ? '#555' : '#333',
            fontWeight: i % 16 === 0 ? 700 : 400,
          }}>
            {i % 4 === 0 ? i / 4 + 1 : '·'}
          </div>
        ))}
      </div>

      {/* Sequencer grid */}
      <div style={styles.grid}>
        {tracks.map((track, trackIdx) => (
          <div key={trackIdx} style={styles.trackRow}>
            <div style={styles.trackControls}>
              <button
                style={{ ...styles.trackLabel, borderLeftColor: track.color }}
                onClick={() => handlePreview(track.sound)}
              >
                {track.name}
              </button>
              <select
                value={track.sound}
                onChange={e => changeSound(trackIdx, e.target.value as DrumSound)}
                style={styles.soundSelect}
              >
                {ALL_SOUNDS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div style={styles.stepsRow}>
              {track.steps.map((active, stepIdx) => {
                const barBoundary = stepIdx % 16 === 0 && stepIdx > 0;
                return (
                  <button
                    key={stepIdx}
                    onClick={() => toggleStep(trackIdx, stepIdx)}
                    style={{
                      ...styles.stepButton,
                      ...(barBoundary ? { marginLeft: 6 } : {}),
                      background: active
                        ? track.color
                        : stepIdx % 4 < 2
                          ? '#2a2a2a'
                          : '#222',
                      borderColor: stepIdx === currentStep ? '#fff' : active ? track.color : '#3a3a3a',
                      boxShadow: active
                        ? `0 0 6px ${track.color}40`
                        : stepIdx === currentStep
                          ? '0 0 4px rgba(255,255,255,0.3)'
                          : 'none',
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar (cosmetic) */}
      <div style={styles.bottomBar} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    maxWidth: 1100,
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
  brandSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  brandName: {
    fontSize: 28,
    fontWeight: 900,
    color: '#ff3b30',
    letterSpacing: 4,
    textShadow: '0 0 20px rgba(255, 59, 48, 0.5)',
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  brandSub: {
    fontSize: 9,
    letterSpacing: 6,
    color: '#666',
    fontWeight: 500,
  },
  displaySection: {
    display: 'flex',
    gap: 12,
  },
  display: {
    background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: 6,
    padding: '8px 14px',
    textAlign: 'center' as const,
    minWidth: 60,
  },
  displayLabel: {
    fontSize: 8,
    color: '#555',
    letterSpacing: 2,
    marginBottom: 4,
    fontWeight: 600,
  },
  displayValue: {
    fontSize: 18,
    color: '#ff3b30',
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontWeight: 600,
    textShadow: '0 0 10px rgba(255, 59, 48, 0.4)',
  },
  controls: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-end',
    padding: '16px 24px',
    background: '#1e1e1e',
    borderLeft: '1px solid #333',
    borderRight: '1px solid #333',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
  },
  knobLabel: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#666',
    fontWeight: 600,
  },
  slider: {
    width: '100%',
    accentColor: '#ff3b30',
    cursor: 'pointer',
  },
  playButton: {
    fontFamily: "'Inter', -apple-system, sans-serif",
    fontSize: 13,
    fontWeight: 700,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 24px',
    cursor: 'pointer',
    letterSpacing: 2,
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
    minWidth: 110,
  },
  clearButton: {
    fontFamily: "'Inter', -apple-system, sans-serif",
    fontSize: 11,
    fontWeight: 600,
    color: '#999',
    background: 'linear-gradient(180deg, #333, #272727)',
    border: '1px solid #444',
    borderRadius: 8,
    padding: '12px 16px',
    cursor: 'pointer',
    letterSpacing: 2,
  },
  presets: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    padding: '12px 24px',
    background: '#191919',
    borderLeft: '1px solid #333',
    borderRight: '1px solid #333',
    flexWrap: 'wrap' as const,
  },
  presetLabel: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#555',
    marginRight: 8,
    fontWeight: 600,
  },
  presetButton: {
    fontFamily: "'Inter', -apple-system, sans-serif",
    fontSize: 11,
    color: '#bbb',
    background: 'linear-gradient(180deg, #2a2a2a, #222)',
    border: '1px solid #3a3a3a',
    borderRadius: 6,
    padding: '5px 10px',
    cursor: 'pointer',
    letterSpacing: 0.5,
    fontWeight: 500,
    transition: 'border-color 0.15s',
  },
  stepIndicators: {
    display: 'flex',
    gap: 3,
    padding: '6px 24px',
    background: '#191919',
    borderLeft: '1px solid #333',
    borderRight: '1px solid #333',
    alignItems: 'center',
  },
  stepLed: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    transition: 'background 0.05s, box-shadow 0.05s',
  },
  stepNumber: {
    flex: 1,
    textAlign: 'center' as const,
    fontSize: 9,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
  },
  trackLabelSpacer: {
    width: 140,
    flexShrink: 0,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    padding: '12px 24px',
    background: '#191919',
    borderLeft: '1px solid #333',
    borderRight: '1px solid #333',
  },
  trackRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  trackControls: {
    width: 140,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  trackLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#ccc',
    letterSpacing: 0.5,
    fontFamily: "'Inter', -apple-system, sans-serif",
    background: 'none',
    border: 'none',
    borderLeft: '3px solid',
    cursor: 'pointer',
    textAlign: 'left' as const,
    padding: '3px 4px 3px 6px',
    whiteSpace: 'nowrap' as const,
    minWidth: 56,
  },
  soundSelect: {
    fontFamily: "'Inter', -apple-system, sans-serif",
    fontSize: 9,
    color: '#999',
    background: '#222',
    border: '1px solid #3a3a3a',
    borderRadius: 4,
    padding: '2px 2px',
    cursor: 'pointer',
    flex: 1,
    minWidth: 0,
  },
  stepsRow: {
    display: 'flex',
    gap: 3,
    flex: 1,
  },
  stepButton: {
    flex: 1,
    aspectRatio: '1',
    border: '1px solid',
    borderRadius: 3,
    cursor: 'pointer',
    transition: 'background 0.05s, border-color 0.05s',
    padding: 0,
    maxHeight: 28,
    minWidth: 0,
  },
  bottomBar: {
    height: 8,
    background: 'linear-gradient(180deg, #1e1e1e, #2a2a2a)',
    borderRadius: '0 0 12px 12px',
    border: '1px solid #333',
    borderTop: 'none',
  },
};
