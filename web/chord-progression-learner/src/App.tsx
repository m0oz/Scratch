import { useEffect, useState } from 'react';
import { LESSONS, SONGS, getLesson } from './data';
import type { Lesson, Song } from './data';
import { bigBtn, C, card, h1, h2, muted, pageWrap } from './ui';
import { Lesson as LessonView } from './Lesson';
import { Sandbox } from './Sandbox';
import { playProgression, resumeAudio, stopAllAudio } from './audio';
import type { PlaybackHandle } from './audio';
import { getChordDisplayName, getChordNotes } from './theory';

type View =
  | { kind: 'home' }
  | { kind: 'lesson'; lessonId: string }
  | { kind: 'sandbox' }
  | { kind: 'songs' };

export default function App() {
  const [view, setView] = useState<View>({ kind: 'home' });
  const [xp, setXp] = useState<number>(() => Number(localStorage.getItem('cq.xp') || 0));
  const [streak, setStreak] = useState<number>(() => Number(localStorage.getItem('cq.streak') || 0));
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('cq.completed') || '[]')); }
    catch { return new Set(); }
  });

  useEffect(() => { localStorage.setItem('cq.xp', String(xp)); }, [xp]);
  useEffect(() => { localStorage.setItem('cq.streak', String(streak)); }, [streak]);
  useEffect(() => { localStorage.setItem('cq.completed', JSON.stringify([...completed])); }, [completed]);

  const onLessonComplete = (lessonId: string, gainedXp: number) => {
    setXp(prev => prev + gainedXp);
    setStreak(prev => prev + 1);
    setCompleted(prev => new Set(prev).add(lessonId));
  };

  return (
    <div style={{ minHeight: '100%', background: C.bg }}>
      <TopBar xp={xp} streak={streak} onHome={() => { stopAllAudio(); setView({ kind: 'home' }); }} />
      <div style={pageWrap}>
        {view.kind === 'home' && (
          <Home
            completed={completed}
            onOpenLesson={(id) => { void resumeAudio(); setView({ kind: 'lesson', lessonId: id }); }}
            onOpenSandbox={() => { void resumeAudio(); setView({ kind: 'sandbox' }); }}
            onOpenSongs={() => { void resumeAudio(); setView({ kind: 'songs' }); }}
          />
        )}
        {view.kind === 'lesson' && (
          <LessonView
            lesson={getLesson(view.lessonId)!}
            onExit={() => { stopAllAudio(); setView({ kind: 'home' }); }}
            onComplete={(gainedXp) => { onLessonComplete(view.lessonId, gainedXp); }}
          />
        )}
        {view.kind === 'sandbox' && (
          <Sandbox onExit={() => { stopAllAudio(); setView({ kind: 'home' }); }} />
        )}
        {view.kind === 'songs' && (
          <SongLibrary onExit={() => { stopAllAudio(); setView({ kind: 'home' }); }} />
        )}
      </div>
    </div>
  );
}

function TopBar({ xp, streak, onHome }: { xp: number; streak: number; onHome: () => void }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: C.bg, borderBottom: `2px solid ${C.borderSoft}`,
      padding: '12px 16px',
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onHome}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 20, color: C.text }}
          title="Home"
        >
          🎵 Chord Quest
        </button>
        <div style={{ flex: 1 }} />
        <Pill color={C.yellow}>⭐ {xp} XP</Pill>
        <Pill color={C.red}>🔥 {streak}</Pill>
      </div>
    </div>
  );
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      background: color, color: 'white', fontWeight: 800,
      borderRadius: 999, padding: '6px 12px', fontSize: 14,
    }}>{children}</span>
  );
}

function Home({
  completed,
  onOpenLesson,
  onOpenSandbox,
  onOpenSongs,
}: {
  completed: Set<string>;
  onOpenLesson: (id: string) => void;
  onOpenSandbox: () => void;
  onOpenSongs: () => void;
}) {
  return (
    <>
      <div style={{ textAlign: 'center', padding: '20px 0 28px' }}>
        <h1 style={h1}>Learn chord progressions, the fun way.</h1>
        <p style={{ ...muted, maxWidth: 520, margin: '0 auto' }}>
          Train your ear, build the chord patterns behind your favourite songs,
          and improvise harmonies in the sandbox.
        </p>
      </div>

      <h2 style={h2}>📚 Lessons</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 28 }}>
        {LESSONS.map(l => (
          <LessonCard
            key={l.id}
            lesson={l}
            done={completed.has(l.id)}
            onClick={() => onOpenLesson(l.id)}
          />
        ))}
      </div>

      <h2 style={h2}>🎼 Free play</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        <button onClick={onOpenSandbox} style={{ ...card, ...cardBtn, borderLeft: `8px solid ${C.blue}` }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>🛠️</div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Sandbox</div>
          <div style={muted}>Build your own progressions. Pick a key, chain chords, swap patterns.</div>
        </button>
        <button onClick={onOpenSongs} style={{ ...card, ...cardBtn, borderLeft: `8px solid ${C.pink}` }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>📻</div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Song Library</div>
          <div style={muted}>Play famous songs in their original keys.</div>
        </button>
      </div>
    </>
  );
}

const cardBtn: React.CSSProperties = {
  textAlign: 'left',
  border: 'none',
  cursor: 'pointer',
  background: C.card,
  display: 'block',
};

function LessonCard({ lesson, done, onClick }: { lesson: Lesson; done: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...card,
        ...cardBtn,
        borderLeft: `8px solid ${lesson.color}`,
        position: 'relative',
      }}
    >
      <div style={{ fontSize: 30, marginBottom: 6 }}>{lesson.emoji}</div>
      <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 2 }}>{lesson.title}</div>
      <div style={{ ...muted, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13 }}>
        {lesson.subtitle}
      </div>
      <div style={{ ...muted, marginTop: 8, fontSize: 13 }}>
        {lesson.songIds.length} song{lesson.songIds.length === 1 ? '' : 's'}
      </div>
      {done && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: C.green, color: 'white', borderRadius: 999,
          width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 14,
        }}>✓</div>
      )}
    </button>
  );
}

// ── Song library view ────────────────────────────────────────────────

function SongLibrary({ onExit }: { onExit: () => void }) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeBar, setActiveBar] = useState<number>(-1);
  const [handle, setHandle] = useState<PlaybackHandle | null>(null);

  const stop = () => {
    handle?.stop();
    setHandle(null);
    setPlayingId(null);
    setActiveBar(-1);
  };

  const play = (song: Song) => {
    stop();
    void resumeAudio();
    const chords = song.progression.map(r => getChordNotes(r, song.keyTonic, song.mode));
    const h = playProgression(chords, song.pattern, song.tempo, {
      onBarStart: (i) => setActiveBar(i),
      onComplete: () => { setPlayingId(null); setActiveBar(-1); },
    });
    setHandle(h);
    setPlayingId(song.id);
  };

  useEffect(() => () => { handle?.stop(); }, [handle]);

  return (
    <>
      <button onClick={onExit} style={{ ...bigBtn(C.textSoft, { small: true }), marginBottom: 12 }}>← Back</button>
      <h1 style={h1}>📻 Song Library</h1>
      <p style={muted}>Tap any song to hear the chord progression in its original key.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {SONGS.map(song => {
          const isPlaying = playingId === song.id;
          return (
            <div key={song.id} style={{ ...card, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => isPlaying ? stop() : play(song)}
                  style={{
                    width: 48, height: 48, borderRadius: 999, border: 'none',
                    background: isPlaying ? C.red : C.green, color: 'white',
                    fontSize: 20, cursor: 'pointer', fontWeight: 900,
                    boxShadow: `0 3px 0 ${isPlaying ? '#C73838' : C.greenDark}`,
                  }}
                  title={isPlaying ? 'Stop' : 'Play'}
                >{isPlaying ? '■' : '▶'}</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{song.title}</div>
                  <div style={{ ...muted, fontSize: 13 }}>{song.artist} · key of {song.keyTonic} {song.mode} · {song.tempo} BPM</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {song.progression.map((r, i) => (
                  <ChordBadge
                    key={i}
                    label={getChordDisplayName(r, song.keyTonic, song.mode)}
                    roman={r}
                    active={isPlaying && activeBar === i}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function ChordBadge({
  label, roman, active, onClick,
}: { label: string; roman?: string; active?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? C.green : C.borderSoft,
        color: active ? 'white' : C.text,
        borderRadius: 12,
        padding: '8px 12px',
        fontWeight: 800,
        textAlign: 'center',
        minWidth: 60,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 120ms ease, color 120ms ease, transform 120ms ease',
        transform: active ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ fontSize: 16 }}>{label}</div>
      {roman && (
        <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
          {roman}
        </div>
      )}
    </div>
  );
}
