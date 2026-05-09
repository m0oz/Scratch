import { useMemo, useState } from 'react'
import { crosses, varieties, varietyById, type Variety } from './data'
import Trees from './Trees'

const CURRENT_YEAR = new Date().getFullYear()

const COLOR_EMOJI: Record<Variety['color'], string> = {
  red: '🍎',
  green: '🍏',
  yellow: '🍐',
  pink: '🍑',
  bicolor: '🍎',
}

const COLOR_LABEL: Record<Variety['color'], string> = {
  red: 'rot',
  green: 'grün',
  yellow: 'gelb',
  pink: 'rosa',
  bicolor: 'zweifarbig',
}

function ageLabel(year: number): string {
  const age = CURRENT_YEAR - year
  if (age <= 0) return 'aktuelle Züchtung'
  if (age === 1) return '1 Jahr alt'
  return `${age} Jahre alt`
}

function parentNames(v: Variety): string | null {
  if (!v.parents) return null
  const a = varietyById(v.parents[0])?.name ?? v.parents[0]
  const b = varietyById(v.parents[1])?.name ?? v.parents[1]
  return `${a} × ${b}`
}

type Tab = 'list' | 'game' | 'trees'

export default function App() {
  const [tab, setTab] = useState<Tab>('list')

  return (
    <div className="page">
      <header className="header">
        <h1>
          <span className="apple">🍎</span> Apfelsorten lernen
        </h1>
        <nav className="tabs">
          <button
            className={tab === 'list' ? 'tab active' : 'tab'}
            onClick={() => setTab('list')}
          >
            Sorten
          </button>
          <button
            className={tab === 'game' ? 'tab active' : 'tab'}
            onClick={() => setTab('game')}
          >
            Kreuzung üben
          </button>
          <button
            className={tab === 'trees' ? 'tab active' : 'tab'}
            onClick={() => setTab('trees')}
          >
            Meine Bäume
          </button>
        </nav>
      </header>

      <main className="content">
        {tab === 'list' && <VarietyList />}
        {tab === 'game' && <CrossingGame />}
        {tab === 'trees' && <Trees />}
      </main>

      <footer className="footer">
        <small>
          Daten: bekannte Apfelzüchtungen · Alter berechnet aus dem Jahr der
          ersten Beschreibung.
        </small>
      </footer>
    </div>
  )
}

function VarietyList() {
  const [sort, setSort] = useState<'year' | 'name'>('year')
  const sorted = useMemo(() => {
    const copy = [...varieties]
    if (sort === 'year') copy.sort((a, b) => a.year - b.year)
    else copy.sort((a, b) => a.name.localeCompare(b.name, 'de'))
    return copy
  }, [sort])

  return (
    <section>
      <div className="toolbar">
        <span>{varieties.length} Sorten</span>
        <div className="sort">
          <label>
            Sortieren:&nbsp;
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'year' | 'name')}
            >
              <option value="year">nach Jahr</option>
              <option value="name">nach Name</option>
            </select>
          </label>
        </div>
      </div>

      <ul className="grid">
        {sorted.map((v) => (
          <li key={v.id} className={`card color-${v.color}`}>
            <div className="card-head">
              <span className="emoji" aria-hidden>
                {COLOR_EMOJI[v.color]}
              </span>
              <div>
                <h2 className="card-name">{v.name}</h2>
                <div className="card-sub">
                  {v.country} · {COLOR_LABEL[v.color]}
                </div>
              </div>
            </div>
            <div className="age">
              <strong>{v.year}</strong>
              <span className="age-pill">{ageLabel(v.year)}</span>
            </div>
            <div className="taste">{v.taste}</div>
            {v.parents ? (
              <div className="lineage">
                <span className="lineage-label">Eltern:</span> {parentNames(v)}
              </div>
            ) : (
              <div className="lineage muted">Zufallssämling / Ursprung unbekannt</div>
            )}
            {v.notes && <div className="notes">{v.notes}</div>}
          </li>
        ))}
      </ul>
    </section>
  )
}

type Slot = 'a' | 'b'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Round = {
  target: Variety
  pool: Variety[]
}

function makeRound(prev?: Variety): Round {
  const candidates = prev ? crosses.filter((c) => c.id !== prev.id) : crosses
  const target = candidates[Math.floor(Math.random() * candidates.length)]!
  const correctIds = new Set(target.parents!)
  const distractors = shuffle(
    varieties.filter((v) => !correctIds.has(v.id) && v.id !== target.id),
  ).slice(0, 4)
  const pool = shuffle([
    varietyById(target.parents![0])!,
    varietyById(target.parents![1])!,
    ...distractors,
  ])
  return { target, pool }
}

function CrossingGame() {
  const [round, setRound] = useState<Round>(() => makeRound())
  const [slotA, setSlotA] = useState<Variety | null>(null)
  const [slotB, setSlotB] = useState<Variety | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const usedIds = new Set(
    [slotA?.id, slotB?.id].filter((x): x is string => Boolean(x)),
  )

  function placeIntoSlot(slot: Slot, v: Variety) {
    if (slot === 'a') {
      if (slotB?.id === v.id) setSlotB(null)
      setSlotA(v)
    } else {
      if (slotA?.id === v.id) setSlotA(null)
      setSlotB(v)
    }
    setResult(null)
    setPickedId(null)
  }

  function clearSlot(slot: Slot) {
    if (slot === 'a') setSlotA(null)
    else setSlotB(null)
    setResult(null)
  }

  function check() {
    if (!slotA || !slotB) return
    const correct = new Set(round.target.parents!)
    const ok = correct.has(slotA.id) && correct.has(slotB.id) && slotA.id !== slotB.id
    setResult(ok ? 'correct' : 'wrong')
    setScore((s) => ({
      correct: s.correct + (ok ? 1 : 0),
      total: s.total + 1,
    }))
  }

  function nextRound() {
    setRound(makeRound(round.target))
    setSlotA(null)
    setSlotB(null)
    setResult(null)
    setPickedId(null)
  }

  function reveal() {
    const [pa, pb] = round.target.parents!
    setSlotA(varietyById(pa)!)
    setSlotB(varietyById(pb)!)
    setResult(null)
  }

  // Click-to-place fallback (for touch devices)
  function onCandidateClick(v: Variety) {
    if (usedIds.has(v.id)) return
    setPickedId((cur) => (cur === v.id ? null : v.id))
  }
  function onSlotClick(slot: Slot) {
    const occupant = slot === 'a' ? slotA : slotB
    if (occupant) {
      clearSlot(slot)
      return
    }
    if (!pickedId) return
    const v = varietyById(pickedId)
    if (v) placeIntoSlot(slot, v)
  }

  // Native HTML5 drag & drop
  function onDragStart(e: React.DragEvent, v: Variety) {
    if (usedIds.has(v.id)) {
      e.preventDefault()
      return
    }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', v.id)
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  function onDrop(e: React.DragEvent, slot: Slot) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    const v = varietyById(id)
    if (v) placeIntoSlot(slot, v)
  }

  const target = round.target

  return (
    <section className="game">
      <div className="game-head">
        <div className="prompt">
          <div className="prompt-label">Welche zwei Sorten ergeben</div>
          <div className="prompt-target">
            <span className="emoji" aria-hidden>
              {COLOR_EMOJI[target.color]}
            </span>
            <strong>{target.name}</strong>
            <span className="prompt-year">({target.year})</span>
          </div>
        </div>
        <div className="score">
          {score.correct} / {score.total} richtig
        </div>
      </div>

      <div className="cross-row">
        <DropSlot
          label="Eltern­sorte 1"
          slot="a"
          variety={slotA}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => onSlotClick('a')}
          onClear={() => clearSlot('a')}
          highlight={pickedId !== null && !slotA}
        />
        <div className="cross-sign" aria-hidden>
          ×
        </div>
        <DropSlot
          label="Eltern­sorte 2"
          slot="b"
          variety={slotB}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => onSlotClick('b')}
          onClear={() => clearSlot('b')}
          highlight={pickedId !== null && !slotB}
        />
        <div className="cross-arrow" aria-hidden>
          →
        </div>
        <div className="target-card">
          <span className="emoji" aria-hidden>
            {COLOR_EMOJI[target.color]}
          </span>
          <div>
            <div className="target-name">{target.name}</div>
            <div className="target-sub">{target.country} · {target.year}</div>
          </div>
        </div>
      </div>

      {result && (
        <div className={`result ${result}`}>
          {result === 'correct' ? (
            <>
              <strong>Richtig!</strong> {target.name} = {parentNames(target)}.
            </>
          ) : (
            <>
              <strong>Leider falsch.</strong> Probier es nochmal oder lass dir die
              Lösung zeigen.
            </>
          )}
        </div>
      )}

      <div className="actions">
        <button
          className="btn primary"
          onClick={check}
          disabled={!slotA || !slotB || result === 'correct'}
        >
          Prüfen
        </button>
        <button className="btn" onClick={reveal} disabled={result === 'correct'}>
          Lösung zeigen
        </button>
        <button className="btn" onClick={nextRound}>
          Nächste Sorte
        </button>
      </div>

      <h3 className="pool-heading">Eltern­sorten zur Auswahl</h3>
      <p className="hint">
        Ziehe zwei Sorten in die Felder oben – auf dem Handy: tippe eine Sorte
        an und dann ein Feld.
      </p>
      <ul className="pool">
        {round.pool.map((v) => {
          const used = usedIds.has(v.id)
          const picked = pickedId === v.id
          return (
            <li key={v.id}>
              <button
                className={`chip color-${v.color}${used ? ' used' : ''}${
                  picked ? ' picked' : ''
                }`}
                draggable={!used}
                onDragStart={(e) => onDragStart(e, v)}
                onClick={() => onCandidateClick(v)}
                disabled={used}
                aria-pressed={picked}
              >
                <span className="emoji" aria-hidden>
                  {COLOR_EMOJI[v.color]}
                </span>
                <span className="chip-name">{v.name}</span>
                <span className="chip-year">{v.year}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function DropSlot(props: {
  label: string
  slot: Slot
  variety: Variety | null
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, slot: Slot) => void
  onClick: () => void
  onClear: () => void
  highlight: boolean
}) {
  const { label, slot, variety, onDragOver, onDrop, onClick, onClear, highlight } =
    props
  return (
    <div
      className={`slot${variety ? ' filled' : ''}${highlight ? ' highlight' : ''}`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, slot)}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {variety ? (
        <div className={`slot-content color-${variety.color}`}>
          <span className="emoji" aria-hidden>
            {COLOR_EMOJI[variety.color]}
          </span>
          <span className="slot-name">{variety.name}</span>
          <span className="slot-year">{variety.year}</span>
          <button
            className="slot-clear"
            onClick={(e) => {
              e.stopPropagation()
              onClear()
            }}
            aria-label="Entfernen"
            title="Entfernen"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="slot-placeholder">
          <div className="slot-label">{label}</div>
          <div className="slot-hint">hier ablegen</div>
        </div>
      )}
    </div>
  )
}
