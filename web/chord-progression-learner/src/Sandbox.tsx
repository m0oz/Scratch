// Free-play view: pick a key/mode, chain chords, swap accompaniment patterns.

import { useEffect, useMemo, useRef, useState } from 'react';
import { bigBtn, C, card, h1, h2, muted } from './ui';
import {
  allDiatonicRomans, ALL_KEYS, getChordDisplayName, getChordNotes,
} from './theory';
import type { Mode, NoteName } from './theory';
import {
  PATTERN_IDS, PATTERNS, playChordOnce, playProgression, resumeAudio, stopAllAudio,
} from './audio';
import type { PatternId, PlaybackHandle } from './audio';

const DEFAULT_PROGRESSION = ['I', 'V', 'vi', 'IV'];

export function Sandbox({ onExit }: { onExit: () => void }) {
  const [keyTonic, setKeyTonic] = useState<NoteName>('C');
  const [mode, setMode] = useState<Mode>('major');
  const [progression, setProgression] = useState<string[]>(DEFAULT_PROGRESSION);
  const [pattern, setPattern] = useState<PatternId>('rhythmic');
  const [tempo, setTempo] = useState(96);
  const [loop, setLoop] = useState(true);
  const [activeBar, setActiveBar] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const handleRef = useRef<PlaybackHandle | null>(null);

  useEffect(() => () => { handleRef.current?.stop(); stopAllAudio(); }, []);

  const stop = () => {
    handleRef.current?.stop();
    handleRef.current = null;
    setIsPlaying(false);
    setActiveBar(-1);
  };

  const play = () => {
    if (progression.length === 0) return;
    stop();
    void resumeAudio();
    const chords = progression.map(r => getChordNotes(r, keyTonic, mode));
    handleRef.current = playProgression(chords, pattern, tempo, {
      loop,
      onBarStart: i => setActiveBar(i),
      onComplete: () => { setIsPlaying(false); setActiveBar(-1); },
    });
    setIsPlaying(true);
  };

  const addChord = (r: string) => {
    void resumeAudio();
    playChordOnce(getChordNotes(r, keyTonic, mode), 0.7);
    setProgression(p => [...p, r]);
  };

  const removeAt = (i: number) => {
    setProgression(p => p.filter((_, j) => j !== i));
  };

  const moveLeft = (i: number) => {
    if (i === 0) return;
    setProgression(p => {
      const a = [...p]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a;
    });
  };

  const clear = () => setProgression([]);

  const diatonic = useMemo(() => allDiatonicRomans(mode), [mode]);
  const extras = mode === 'major' ? ['V7', 'IV', 'ii7'] : ['V', 'iv', 'ii°'];
  // Show extras only if not already in diatonic list (V7 isn't, etc.)
  const extrasFiltered = extras.filter(e => !diatonic.includes(e));

  return (
    <>
      <button onClick={onExit} style={{ ...bigBtn(C.textSoft, { small: true }), marginBottom: 12 }}>← Back</button>
      <h1 style={h1}>🛠️ Sandbox</h1>
      <p style={muted}>Chain diatonic chords, swap the accompaniment, hear how it sounds.</p>

      {/* Key/mode/tempo controls */}
      <div style={{ ...card, marginTop: 16 }}>
        <Row>
          <Field label="Key">
            <select
              value={keyTonic}
              onChange={e => setKeyTonic(e.target.value as NoteName)}
              style={selectStyle}
            >
              {ALL_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
          <Field label="Mode">
            <select
              value={mode}
              onChange={e => setMode(e.target.value as Mode)}
              style={selectStyle}
            >
              <option value="major">major</option>
              <option value="minor">minor</option>
            </select>
          </Field>
          <Field label={`Tempo (${tempo} BPM)`}>
            <input
              type="range" min={50} max={180} value={tempo}
              onChange={e => setTempo(Number(e.target.value))}
              style={{ width: 160 }}
            />
          </Field>
        </Row>
      </div>

      {/* Pattern picker */}
      <div style={{ ...card, marginTop: 14 }}>
        <h2 style={{ ...h2, fontSize: 18, marginBottom: 4 }}>🎹 Pattern</h2>
        <div style={muted}>{PATTERNS[pattern].description}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {PATTERN_IDS.map(id => (
            <button
              key={id}
              onClick={() => setPattern(id)}
              style={{
                background: pattern === id ? C.purple : C.borderSoft,
                color: pattern === id ? 'white' : C.text,
                border: 'none', borderRadius: 999, padding: '8px 14px',
                fontWeight: 800, fontSize: 14, cursor: 'pointer',
              }}
            >
              {PATTERNS[id].label}
            </button>
          ))}
        </div>
      </div>

      {/* Progression display */}
      <div style={{ ...card, marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <h2 style={{ ...h2, fontSize: 18, margin: 0 }}>🎶 Your progression</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ ...muted, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
              <input type="checkbox" checked={loop} onChange={e => setLoop(e.target.checked)} />
              Loop
            </label>
            <button
              onClick={isPlaying ? stop : play}
              disabled={progression.length === 0}
              style={{
                ...bigBtn(isPlaying ? C.red : C.green, { small: true }),
                opacity: progression.length === 0 ? 0.5 : 1,
              }}
            >
              {isPlaying ? '■ Stop' : '▶ Play'}
            </button>
          </div>
        </div>

        {progression.length === 0 ? (
          <div style={{ ...muted, marginTop: 12, padding: 12, textAlign: 'center', border: `2px dashed ${C.border}`, borderRadius: 12 }}>
            Tap chord pads below to add chords →
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {progression.map((r, i) => (
              <div
                key={i}
                style={{
                  position: 'relative',
                  background: activeBar === i ? C.green : C.borderSoft,
                  color: activeBar === i ? 'white' : C.text,
                  borderRadius: 12, padding: '10px 14px', fontWeight: 800,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  minWidth: 70, transition: 'background 100ms ease, color 100ms ease, transform 100ms ease',
                  transform: activeBar === i ? 'translateY(-2px)' : 'none',
                }}
              >
                <div style={{ fontSize: 16 }}>{getChordDisplayName(r, keyTonic, mode)}</div>
                <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{r}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  <button onClick={() => moveLeft(i)} disabled={i === 0} title="Move left"
                    style={miniBtn(C.blue, i === 0)}>←</button>
                  <button onClick={() => removeAt(i)} title="Remove"
                    style={miniBtn(C.red, false)}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {progression.length > 0 && (
          <button onClick={clear} style={{ ...bigBtn(C.textSoft, { small: true }), marginTop: 12 }}>Clear</button>
        )}
      </div>

      {/* Chord pads */}
      <div style={{ ...card, marginTop: 14 }}>
        <h2 style={{ ...h2, fontSize: 18, marginBottom: 4 }}>🎵 Chord pads</h2>
        <div style={muted}>Diatonic chords in {keyTonic} {mode}. Tap to add — also previews the sound.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10, marginTop: 12 }}>
          {diatonic.map(r => (
            <ChordPad
              key={r}
              roman={r}
              label={getChordDisplayName(r, keyTonic, mode)}
              color={C.blue}
              onClick={() => addChord(r)}
            />
          ))}
          {extrasFiltered.map(r => (
            <ChordPad
              key={r}
              roman={r}
              label={getChordDisplayName(r, keyTonic, mode)}
              color={C.purple}
              onClick={() => addChord(r)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function ChordPad({ roman, label, color, onClick }: {
  roman: string; label: string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: C.card,
        color: C.text,
        border: `2px solid ${color}`,
        borderRadius: 14,
        padding: '14px 8px',
        fontWeight: 800,
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'background 100ms ease, transform 80ms ease',
      }}
      onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(2px)'; }}
      onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}
    >
      <div style={{ fontSize: 18 }}>{label}</div>
      <div style={{ fontSize: 11, color: color, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{roman}</div>
    </button>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: C.textSoft, textTransform: 'uppercase' }}>{label}</span>
      {children}
    </label>
  );
}

const selectStyle: React.CSSProperties = {
  background: C.card, border: `2px solid ${C.border}`, borderRadius: 10,
  padding: '6px 10px', fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
};

function miniBtn(color: string, disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? C.border : color,
    color: 'white',
    border: 'none',
    borderRadius: 6,
    padding: '2px 6px',
    cursor: disabled ? 'default' : 'pointer',
    fontWeight: 800,
    fontSize: 12,
  };
}
