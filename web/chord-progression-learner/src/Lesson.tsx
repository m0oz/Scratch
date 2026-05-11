// Duolingo-style lesson flow.

import { useEffect, useMemo, useRef, useState } from 'react';
import { SONGS, getSong } from './data';
import type { Lesson as LessonType, Song } from './data';
import { bigBtn, C, card, h1, h2, muted } from './ui';
import { allDiatonicRomans, getChordDisplayName, getChordNotes } from './theory';
import { ChordBadge } from './App';
import {
  playChordOnce, playProgression, resumeAudio, stopAllAudio,
} from './audio';
import type { PlaybackHandle } from './audio';

type Exercise =
  | { kind: 'intro' }
  | { kind: 'identify'; chordIndex: number; options: string[]; answer: string }
  | { kind: 'order' }
  | { kind: 'name-song'; song: Song; distractors: Song[] }
  | { kind: 'complete' };

const HEARTS = 3;

export function Lesson({
  lesson,
  onExit,
  onComplete,
}: {
  lesson: LessonType;
  onExit: () => void;
  onComplete: (gainedXp: number) => void;
}) {
  const exercises = useMemo<Exercise[]>(() => buildExercises(lesson), [lesson.id]);
  const [step, setStep] = useState(0);
  const [hearts, setHearts] = useState(HEARTS);
  const [correct, setCorrect] = useState(0);
  const completedRef = useRef(false);
  const ex = exercises[step];

  useEffect(() => () => { stopAllAudio(); }, []);

  const advance = (wasCorrect: boolean) => {
    if (!wasCorrect) setHearts(h => Math.max(0, h - 1));
    else setCorrect(c => c + 1);
    stopAllAudio();
    setStep(s => s + 1);
  };

  if (!ex || ex.kind === 'complete') {
    // Award XP once
    if (!completedRef.current) {
      completedRef.current = true;
      const xp = correct * 10 + (hearts === HEARTS ? 20 : hearts === HEARTS - 1 ? 10 : 0);
      onComplete(xp);
    }
    return <Finish lesson={lesson} correct={correct} total={countGraded(exercises)} hearts={hearts} onExit={onExit} />;
  }

  return (
    <>
      <TopRow
        onExit={onExit}
        progress={(step) / Math.max(1, exercises.length - 1)}
        hearts={hearts}
      />

      {hearts <= 0 ? (
        <OutOfHearts onExit={onExit} onRestart={() => { setStep(0); setHearts(HEARTS); setCorrect(0); }} />
      ) : ex.kind === 'intro' ? (
        <IntroStep lesson={lesson} onNext={() => advance(true)} />
      ) : ex.kind === 'identify' ? (
        <IdentifyStep lesson={lesson} ex={ex} onAnswer={advance} />
      ) : ex.kind === 'order' ? (
        <OrderStep lesson={lesson} onAnswer={advance} />
      ) : ex.kind === 'name-song' ? (
        <NameSongStep ex={ex} onAnswer={advance} />
      ) : null}
    </>
  );
}

function TopRow({ onExit, progress, hearts }: { onExit: () => void; progress: number; hearts: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <button onClick={onExit} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        fontSize: 22, color: C.textSoft, padding: 6,
      }}>✕</button>
      <div style={{
        flex: 1, background: C.borderSoft, height: 14, borderRadius: 999, overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(100, Math.max(0, progress * 100))}%`,
          height: '100%', background: C.green, borderRadius: 999,
          transition: 'width 300ms ease',
          boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.08)',
        }} />
      </div>
      <div style={{ color: C.red, fontWeight: 900, fontSize: 18 }}>
        {Array.from({ length: HEARTS }, (_, i) => (
          <span key={i} style={{ opacity: i < hearts ? 1 : 0.25, marginLeft: 2 }}>❤</span>
        ))}
      </div>
    </div>
  );
}

// ── Steps ────────────────────────────────────────────────────────────

function IntroStep({ lesson, onNext }: { lesson: LessonType; onNext: () => void }) {
  const [activeBar, setActiveBar] = useState(-1);
  const handleRef = useRef<PlaybackHandle | null>(null);

  const chordsMidi = useMemo(
    () => lesson.progression.map(r => getChordNotes(r, lesson.keyTonic, lesson.mode)),
    [lesson]
  );

  const play = () => {
    handleRef.current?.stop();
    void resumeAudio();
    handleRef.current = playProgression(chordsMidi, lesson.pattern, lesson.tempo, {
      onBarStart: i => setActiveBar(i),
      onComplete: () => setActiveBar(-1),
    });
  };

  useEffect(() => { play(); return () => handleRef.current?.stop(); }, []);

  return (
    <div style={card}>
      <div style={{ fontSize: 40 }}>{lesson.emoji}</div>
      <h1 style={{ ...h1, fontSize: 26 }}>{lesson.title}</h1>
      <div style={{ ...muted, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
        {lesson.subtitle} · key of {lesson.keyTonic} {lesson.mode}
      </div>
      <p style={{ marginTop: 12 }}>{lesson.blurb}</p>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        {lesson.progression.map((r, i) => (
          <ChordBadge
            key={i}
            roman={r}
            label={getChordDisplayName(r, lesson.keyTonic, lesson.mode)}
            active={activeBar === i}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <button onClick={play} style={bigBtn(C.blue)}>▶ Listen Again</button>
        <button onClick={onNext} style={bigBtn(C.green)}>Got it! →</button>
      </div>
    </div>
  );
}

function IdentifyStep({
  lesson, ex, onAnswer,
}: {
  lesson: LessonType;
  ex: Extract<Exercise, { kind: 'identify' }>;
  onAnswer: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const chord = useMemo(
    () => getChordNotes(ex.answer, lesson.keyTonic, lesson.mode),
    [ex, lesson]
  );

  const playChord = () => { void resumeAudio(); playChordOnce(chord, 1.8); };

  useEffect(() => { playChord(); }, [ex]);

  const pick = (opt: string) => {
    if (revealed) return;
    setPicked(opt);
    setRevealed(true);
  };

  const isRight = picked === ex.answer;

  return (
    <div style={card}>
      <h2 style={h2}>🎧 Which chord is this?</h2>
      <p style={muted}>Listen carefully. The chord is one of these four.</p>
      <button onClick={playChord} style={{ ...bigBtn(C.blue), marginTop: 12 }}>▶ Play chord</button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 18 }}>
        {ex.options.map(opt => {
          const isAnswer = opt === ex.answer;
          const isPicked = opt === picked;
          let bg = C.card;
          let color = C.text;
          let border = `2px solid ${C.borderSoft}`;
          if (revealed) {
            if (isAnswer) { bg = C.green; color = 'white'; border = `2px solid ${C.green}`; }
            else if (isPicked) { bg = C.red; color = 'white'; border = `2px solid ${C.red}`; }
          } else if (isPicked) {
            border = `2px solid ${C.blue}`;
          }
          return (
            <button
              key={opt}
              onClick={() => pick(opt)}
              disabled={revealed}
              style={{
                background: bg, color, border, borderRadius: 14,
                padding: '16px 12px', cursor: revealed ? 'default' : 'pointer',
                fontWeight: 800, fontSize: 16,
              }}
            >
              <div style={{ fontSize: 20 }}>{getChordDisplayName(opt, lesson.keyTonic, lesson.mode)}</div>
              <div style={{ fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', opacity: 0.8 }}>
                {opt}
              </div>
            </button>
          );
        })}
      </div>

      {revealed && (
        <div style={{
          marginTop: 18, padding: 14, borderRadius: 12,
          background: isRight ? '#E8F8D4' : '#FFE5E5',
          color: isRight ? C.greenDark : '#A11919',
          fontWeight: 700,
        }}>
          {isRight ? '✓ Nice ear!' : `Not quite — that was ${getChordDisplayName(ex.answer, lesson.keyTonic, lesson.mode)} (${ex.answer}).`}
          <div style={{ marginTop: 10 }}>
            <button onClick={() => onAnswer(isRight)} style={bigBtn(isRight ? C.green : C.red)}>
              Continue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderStep({
  lesson, onAnswer,
}: {
  lesson: LessonType;
  onAnswer: (correct: boolean) => void;
}) {
  const [picks, setPicks] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [activeBar, setActiveBar] = useState(-1);
  const handleRef = useRef<PlaybackHandle | null>(null);

  const target = lesson.progression;
  const pool = useMemo(() => {
    // 7 diatonic chords of the lesson's mode, shuffled.
    const arr = allDiatonicRomans(lesson.mode);
    // Ensure all target chords are in the pool (handles 7ths in jazz lesson).
    for (const t of target) if (!arr.includes(t)) arr.push(t);
    return shuffle(arr);
  }, [lesson]);

  const chordsMidi = useMemo(
    () => target.map(r => getChordNotes(r, lesson.keyTonic, lesson.mode)),
    [lesson]
  );

  const playProgRef = () => {
    handleRef.current?.stop();
    void resumeAudio();
    handleRef.current = playProgression(chordsMidi, lesson.pattern, lesson.tempo, {
      onBarStart: i => setActiveBar(i),
      onComplete: () => setActiveBar(-1),
    });
  };

  useEffect(() => { playProgRef(); return () => handleRef.current?.stop(); }, []);

  const pickChord = (r: string) => {
    if (revealed || picks.length >= target.length) return;
    void resumeAudio();
    playChordOnce(getChordNotes(r, lesson.keyTonic, lesson.mode), 0.9);
    const next = [...picks, r];
    setPicks(next);
    if (next.length === target.length) {
      setRevealed(true);
    }
  };

  const reset = () => setPicks([]);

  const isRight = revealed && picks.every((p, i) => p === target[i]);

  return (
    <div style={card}>
      <h2 style={h2}>🧩 Tap the chords in order</h2>
      <p style={muted}>Listen to the progression, then play it back by tapping the chord cards.</p>

      <button onClick={playProgRef} style={{ ...bigBtn(C.blue), marginTop: 12 }}>▶ Listen</button>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6, color: C.textSoft }}>YOUR ANSWER</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', minHeight: 56 }}>
          {Array.from({ length: target.length }, (_, i) => {
            const r = picks[i];
            const showActive = activeBar === i;
            const correct = revealed && r === target[i];
            const wrong = revealed && r !== target[i];
            return (
              <div key={i} style={{
                minWidth: 70, padding: '10px 12px', borderRadius: 12,
                border: `2px dashed ${C.border}`,
                background: r ? (revealed ? (correct ? C.green : C.red) : (showActive ? C.blue : C.borderSoft)) : 'transparent',
                color: r && (revealed || showActive) ? 'white' : C.text,
                fontWeight: 800, textAlign: 'center',
              }}>
                {r ? (
                  <>
                    <div>{getChordDisplayName(r, lesson.keyTonic, lesson.mode)}</div>
                    <div style={{ fontSize: 11, opacity: 0.75, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{r}</div>
                  </>
                ) : <span style={{ color: C.textSoft }}>—</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6, color: C.textSoft }}>CHORD POOL</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pool.map((r, i) => (
            <button
              key={i}
              onClick={() => pickChord(r)}
              disabled={revealed}
              style={{
                background: C.card, border: `2px solid ${C.borderSoft}`, borderRadius: 12,
                padding: '10px 12px', fontWeight: 800, cursor: revealed ? 'default' : 'pointer',
                color: C.text,
              }}
            >
              <div>{getChordDisplayName(r, lesson.keyTonic, lesson.mode)}</div>
              <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{r}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {!revealed && picks.length > 0 && (
          <button onClick={reset} style={bigBtn(C.textSoft, { small: true })}>Clear</button>
        )}
        {revealed && (
          <div style={{
            padding: 14, borderRadius: 12, width: '100%',
            background: isRight ? '#E8F8D4' : '#FFE5E5',
            color: isRight ? C.greenDark : '#A11919',
            fontWeight: 700,
          }}>
            {isRight
              ? '✓ Spot on — that\'s the progression.'
              : `Close! The correct order was ${target.map(r => getChordDisplayName(r, lesson.keyTonic, lesson.mode)).join(' – ')}.`}
            <div style={{ marginTop: 10 }}>
              <button onClick={() => onAnswer(isRight)} style={bigBtn(isRight ? C.green : C.red)}>
                Continue →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NameSongStep({
  ex, onAnswer,
}: {
  ex: Extract<Exercise, { kind: 'name-song' }>;
  onAnswer: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const handleRef = useRef<PlaybackHandle | null>(null);

  const options = useMemo(
    () => shuffle([ex.song, ...ex.distractors]),
    [ex]
  );

  const chordsMidi = useMemo(
    () => ex.song.progression.map(r => getChordNotes(r, ex.song.keyTonic, ex.song.mode)),
    [ex]
  );

  const play = () => {
    handleRef.current?.stop();
    void resumeAudio();
    handleRef.current = playProgression(chordsMidi, ex.song.pattern, ex.song.tempo, {});
  };

  useEffect(() => { play(); return () => handleRef.current?.stop(); }, [ex.song.id]);

  const pick = (id: string) => {
    if (revealed) return;
    setPicked(id);
    setRevealed(true);
  };

  const isRight = picked === ex.song.id;

  return (
    <div style={card}>
      <h2 style={h2}>📻 Name that song</h2>
      <p style={muted}>This progression powers one of these tunes — which one?</p>
      <button onClick={play} style={{ ...bigBtn(C.blue), marginTop: 12 }}>▶ Play again</button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
        {options.map(s => {
          const isAnswer = s.id === ex.song.id;
          const isPicked = s.id === picked;
          let bg = C.card;
          let color = C.text;
          let border = `2px solid ${C.borderSoft}`;
          if (revealed) {
            if (isAnswer) { bg = C.green; color = 'white'; border = `2px solid ${C.green}`; }
            else if (isPicked) { bg = C.red; color = 'white'; border = `2px solid ${C.red}`; }
          }
          return (
            <button
              key={s.id}
              onClick={() => pick(s.id)}
              disabled={revealed}
              style={{
                background: bg, color, border, borderRadius: 14,
                padding: '14px 16px', textAlign: 'left',
                cursor: revealed ? 'default' : 'pointer', fontWeight: 700,
              }}
            >
              <div style={{ fontSize: 16 }}>{s.title}</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>{s.artist}</div>
            </button>
          );
        })}
      </div>

      {revealed && (
        <div style={{
          marginTop: 18, padding: 14, borderRadius: 12,
          background: isRight ? '#E8F8D4' : '#FFE5E5',
          color: isRight ? C.greenDark : '#A11919',
          fontWeight: 700,
        }}>
          {isRight
            ? `✓ Yes — "${ex.song.title}" by ${ex.song.artist}.`
            : `That was "${ex.song.title}" by ${ex.song.artist}.`}
          <div style={{ marginTop: 10 }}>
            <button onClick={() => onAnswer(isRight)} style={bigBtn(isRight ? C.green : C.red)}>
              Continue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Finish({ lesson, correct, total, hearts, onExit }: {
  lesson: LessonType; correct: number; total: number; hearts: number; onExit: () => void;
}) {
  const xp = correct * 10 + (hearts === HEARTS ? 20 : hearts === HEARTS - 1 ? 10 : 0);
  return (
    <div style={{ ...card, textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 60 }}>{lesson.emoji}</div>
      <h1 style={h1}>Lesson complete!</h1>
      <p style={muted}>You learned the <strong>{lesson.title}</strong> progression.</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, margin: '20px 0', flexWrap: 'wrap' }}>
        <Stat label="Correct" value={`${correct}/${total}`} color={C.green} />
        <Stat label="Hearts left" value={`${hearts}/${HEARTS}`} color={C.red} />
        <Stat label="XP gained" value={`+${xp}`} color={C.yellow} />
      </div>
      <button onClick={onExit} style={bigBtn(C.green)}>Back to home</button>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: C.card, border: `2px solid ${color}`, borderRadius: 14,
      padding: '12px 18px', minWidth: 120,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.textSoft, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
    </div>
  );
}

function OutOfHearts({ onExit, onRestart }: { onExit: () => void; onRestart: () => void }) {
  return (
    <div style={{ ...card, textAlign: 'center' }}>
      <div style={{ fontSize: 50 }}>💔</div>
      <h2 style={h2}>Out of hearts</h2>
      <p style={muted}>Don't worry — chord training takes a few tries.</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
        <button onClick={onRestart} style={bigBtn(C.green)}>Try again</button>
        <button onClick={onExit} style={bigBtn(C.textSoft)}>Home</button>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildExercises(lesson: LessonType): Exercise[] {
  const out: Exercise[] = [{ kind: 'intro' }];

  // Two "identify" exercises with chords drawn from the progression
  const uniqueChords = [...new Set(lesson.progression)];
  const picks = shuffle(uniqueChords).slice(0, Math.min(2, uniqueChords.length));
  for (const ans of picks) {
    out.push(makeIdentify(lesson, ans));
  }

  // One "order" exercise
  out.push({ kind: 'order' });

  // One "name song" exercise if we have known songs
  const songs = lesson.songIds.map(id => getSong(id)).filter(Boolean) as Song[];
  if (songs.length > 0) {
    const target = songs[Math.floor(Math.random() * songs.length)];
    const distractorPool = SONGS.filter(s => s.id !== target.id);
    const distractors = shuffle(distractorPool).slice(0, 3);
    out.push({ kind: 'name-song', song: target, distractors });
  }

  out.push({ kind: 'complete' });
  return out;
}

function makeIdentify(lesson: LessonType, answer: string): Exercise {
  const pool = new Set<string>([...lesson.progression]);
  // Add diatonic chords from the same mode as distractors
  for (const r of allDiatonicRomans(lesson.mode)) pool.add(r);
  const distractors = shuffle([...pool].filter(r => r !== answer)).slice(0, 3);
  const options = shuffle([answer, ...distractors]);
  return { kind: 'identify', chordIndex: lesson.progression.indexOf(answer), options, answer };
}

function countGraded(exs: Exercise[]): number {
  return exs.filter(e => e.kind === 'identify' || e.kind === 'order' || e.kind === 'name-song').length;
}
