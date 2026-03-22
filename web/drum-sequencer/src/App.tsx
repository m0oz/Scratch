import { useState, useCallback, useRef, useEffect } from 'react';
import { playSound, resumeAudio, getAudioContext, type DrumSound } from './audioEngine';
import { PRESETS, DEFAULT_TRACKS, type Track } from './patterns';

const STEPS = 16;
const SCHEDULE_AHEAD = 0.1; // seconds to schedule ahead
const LOOKAHEAD = 25; // ms between scheduler checks

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(() =>
    PRESETS[0].tracks.map(t => ({ ...t, steps: [...t.steps] }))
  );
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
  const isPlayingRef = useRef(false);
  const nextStepRef = useRef(0);
  const nextStepTimeRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const scheduler = useCallback(() => {
    const ctx = getAudioContext();
    while (nextStepTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD) {
      const step = nextStepRef.current;
      const time = nextStepTimeRef.current;

      // Play sounds for this step
      for (const track of tracksRef.current) {
        if (track.steps[step]) {
          playSound(track.sound, time);
        }
      }

      // Update visual on the main thread
      setCurrentStep(step);

      // Calculate next step time with swing
      const secondsPerStep = 60.0 / bpmRef.current / 4;
      const isOddStep = step % 2 === 1;
      const swingAmount = isOddStep ? swingRef.current * secondsPerStep * 0.5 : 0;
      nextStepTimeRef.current = time + secondsPerStep + swingAmount;
      nextStepRef.current = (step + 1) % STEPS;
    }
    timerRef.current = window.setTimeout(scheduler, LOOKAHEAD);
  }, []);

  const handlePlay = useCallback(() => {
    resumeAudio();
    if (isPlayingRef.current) {
      // Stop
      isPlayingRef.current = false;
      setIsPlaying(false);
      setCurrentStep(-1);
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    } else {
      // Start
      isPlayingRef.current = true;
      setIsPlaying(true);
      nextStepRef.current = 0;
      nextStepTimeRef.current = getAudioContext().currentTime;
      scheduler();
    }
  }, [scheduler]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const toggleStep = useCallback((trackIndex: number, stepIndex: number) => {
    setTracks(prev => {
      const next = prev.map((t, i) =>
        i === trackIndex
          ? { ...t, steps: t.steps.map((s, j) => (j === stepIndex ? !s : s)) }
          : t
      );
      return next;
    });
  }, []);

  const handlePreview = useCallback((sound: DrumSound) => {
    resumeAudio();
    playSound(sound);
  }, []);

  const loadPreset = useCallback((index: number) => {
    const preset = PRESETS[index];
    setTracks(preset.tracks.map(t => ({ ...t, steps: [...t.steps] })));
    setBpm(preset.bpm);
  }, []);

  const clearAll = useCallback(() => {
    setTracks(DEFAULT_TRACKS());
  }, []);

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
        <span style={styles.presetLabel}>PATTERNS:</span>
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => loadPreset(i)} style={styles.presetButton}>
            {p.name}
          </button>
        ))}
      </div>

      {/* Step indicator LEDs */}
      <div style={styles.stepIndicators}>
        <div style={styles.trackLabelSpacer} />
        {Array.from({ length: STEPS }, (_, i) => (
          <div
            key={i}
            style={{
              ...styles.stepLed,
              background: i === currentStep ? '#ff3b30' : i % 4 === 0 ? '#666' : '#333',
              boxShadow: i === currentStep ? '0 0 8px #ff3b30' : 'none',
            }}
          />
        ))}
      </div>

      {/* Beat numbers */}
      <div style={styles.stepIndicators}>
        <div style={styles.trackLabelSpacer} />
        {Array.from({ length: STEPS }, (_, i) => (
          <div key={i} style={styles.stepNumber}>
            {i % 4 === 0 ? i / 4 + 1 : '·'}
          </div>
        ))}
      </div>

      {/* Sequencer grid */}
      <div style={styles.grid}>
        {tracks.map((track, trackIdx) => (
          <div key={trackIdx} style={styles.trackRow}>
            <button
              style={{ ...styles.trackLabel, borderLeftColor: track.color }}
              onClick={() => handlePreview(track.sound)}
              title={`Preview ${track.name}`}
            >
              {track.name}
            </button>
            {track.steps.map((active, stepIdx) => (
              <button
                key={stepIdx}
                onClick={() => toggleStep(trackIdx, stepIdx)}
                style={{
                  ...styles.stepButton,
                  background: active
                    ? track.color
                    : stepIdx % 4 < 2
                      ? '#2a2a2a'
                      : '#222',
                  borderColor: stepIdx === currentStep ? '#fff' : active ? track.color : '#444',
                  boxShadow: active
                    ? `0 0 6px ${track.color}40`
                    : stepIdx === currentStep
                      ? '0 0 4px rgba(255,255,255,0.3)'
                      : 'none',
                  opacity: active ? 1 : 0.8,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <span>Click track names to preview sounds</span>
        <span>·</span>
        <span>Click grid cells to toggle steps</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "'Orbitron', 'Share Tech Mono', monospace",
    maxWidth: 960,
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
    border: '1px solid #444',
    borderBottom: 'none',
  },
  brandSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  brandName: {
    fontSize: 32,
    fontWeight: 900,
    color: '#ff3b30',
    letterSpacing: 4,
    textShadow: '0 0 20px rgba(255, 59, 48, 0.5)',
  },
  brandSub: {
    fontSize: 10,
    letterSpacing: 6,
    color: '#888',
  },
  displaySection: {
    display: 'flex',
    gap: 16,
  },
  display: {
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: 6,
    padding: '8px 16px',
    textAlign: 'center' as const,
    minWidth: 70,
  },
  displayLabel: {
    fontSize: 8,
    color: '#666',
    letterSpacing: 2,
    marginBottom: 4,
  },
  displayValue: {
    fontSize: 20,
    color: '#ff3b30',
    fontFamily: "'Share Tech Mono', monospace",
    textShadow: '0 0 10px rgba(255, 59, 48, 0.4)',
  },
  controls: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-end',
    padding: '16px 24px',
    background: '#1e1e1e',
    borderLeft: '1px solid #444',
    borderRight: '1px solid #444',
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
    color: '#888',
  },
  slider: {
    width: '100%',
    accentColor: '#ff3b30',
    cursor: 'pointer',
  },
  playButton: {
    fontFamily: "'Orbitron', monospace",
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 24px',
    cursor: 'pointer',
    letterSpacing: 2,
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
    minWidth: 120,
  },
  clearButton: {
    fontFamily: "'Orbitron', monospace",
    fontSize: 11,
    fontWeight: 700,
    color: '#aaa',
    background: 'linear-gradient(180deg, #3a3a3a, #2a2a2a)',
    border: '1px solid #555',
    borderRadius: 8,
    padding: '12px 16px',
    cursor: 'pointer',
    letterSpacing: 2,
  },
  presets: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    padding: '12px 24px',
    background: '#1a1a1a',
    borderLeft: '1px solid #444',
    borderRight: '1px solid #444',
    flexWrap: 'wrap' as const,
  },
  presetLabel: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#666',
    marginRight: 8,
  },
  presetButton: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 11,
    color: '#ccc',
    background: 'linear-gradient(180deg, #333, #252525)',
    border: '1px solid #555',
    borderRadius: 6,
    padding: '6px 12px',
    cursor: 'pointer',
    letterSpacing: 1,
  },
  stepIndicators: {
    display: 'flex',
    gap: 4,
    padding: '6px 24px',
    background: '#1a1a1a',
    borderLeft: '1px solid #444',
    borderRight: '1px solid #444',
    alignItems: 'center',
  },
  stepLed: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    transition: 'background 0.05s, box-shadow 0.05s',
  },
  stepNumber: {
    flex: 1,
    textAlign: 'center' as const,
    fontSize: 10,
    color: '#555',
    fontFamily: "'Share Tech Mono', monospace",
  },
  trackLabelSpacer: {
    width: 80,
    flexShrink: 0,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '12px 24px',
    background: '#1a1a1a',
    borderLeft: '1px solid #444',
    borderRight: '1px solid #444',
  },
  trackRow: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  trackLabel: {
    width: 80,
    flexShrink: 0,
    fontSize: 10,
    fontWeight: 700,
    color: '#ccc',
    letterSpacing: 1,
    fontFamily: "'Orbitron', monospace",
    background: 'none',
    border: 'none',
    borderLeft: '3px solid',
    paddingLeft: 8,
    cursor: 'pointer',
    textAlign: 'left' as const,
    padding: '4px 4px 4px 8px',
  },
  stepButton: {
    flex: 1,
    aspectRatio: '1',
    border: '1px solid',
    borderRadius: 3,
    cursor: 'pointer',
    transition: 'background 0.05s, border-color 0.05s',
    padding: 0,
    maxHeight: 36,
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    padding: '16px 24px',
    background: 'linear-gradient(180deg, #1e1e1e, #2a2a2a)',
    borderRadius: '0 0 12px 12px',
    border: '1px solid #444',
    borderTop: 'none',
    fontSize: 10,
    color: '#555',
    letterSpacing: 1,
  },
};
