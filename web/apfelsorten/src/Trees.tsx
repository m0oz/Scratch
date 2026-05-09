import { useEffect, useMemo, useState } from 'react'
import { varieties, varietyById } from './data'

const STORAGE_KEY = 'apfelsorten:trees:v1'
const CURRENT_YEAR = new Date().getFullYear()

export type TreeYield = {
  year: number
  amountKg?: number
  notes?: string
}

export type Tree = {
  id: string
  name: string
  varietyId?: string
  varietyOther?: string
  rootstock?: string
  plantedYear?: number
  plantedDate?: string
  location?: string
  growth?: string
  notes?: string
  yields: TreeYield[]
}

function loadTrees(): Tree[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Tree[]
  } catch {
    return []
  }
}

function saveTrees(trees: Tree[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trees))
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function emptyTree(): Tree {
  return {
    id: newId(),
    name: '',
    yields: [],
  }
}

function treeAge(t: Tree): number | null {
  const y = t.plantedYear ?? (t.plantedDate ? Number(t.plantedDate.slice(0, 4)) : null)
  if (!y || isNaN(y)) return null
  return Math.max(0, CURRENT_YEAR - y)
}

function totalYield(t: Tree): number {
  return t.yields.reduce((sum, y) => sum + (y.amountKg ?? 0), 0)
}

function varietyDisplay(t: Tree): string {
  if (t.varietyId) {
    const v = varietyById(t.varietyId)
    if (v) return v.name
  }
  return t.varietyOther ?? '—'
}

export default function Trees() {
  const [trees, setTrees] = useState<Tree[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setTrees(loadTrees())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) saveTrees(trees)
  }, [trees, loaded])

  const sortedTrees = useMemo(
    () => [...trees].sort((a, b) => a.name.localeCompare(b.name, 'de')),
    [trees],
  )

  function addTree() {
    const t = emptyTree()
    setTrees((prev) => [...prev, t])
    setEditingId(t.id)
  }

  function updateTree(id: string, patch: Partial<Tree>) {
    setTrees((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  function deleteTree(id: string) {
    if (!confirm('Diesen Baum wirklich löschen?')) return
    setTrees((prev) => prev.filter((t) => t.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function addYield(id: string) {
    setTrees((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              yields: [...t.yields, { year: CURRENT_YEAR }].sort(
                (a, b) => b.year - a.year,
              ),
            }
          : t,
      ),
    )
  }

  function updateYield(id: string, idx: number, patch: Partial<TreeYield>) {
    setTrees((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              yields: t.yields.map((y, i) => (i === idx ? { ...y, ...patch } : y)),
            }
          : t,
      ),
    )
  }

  function deleteYield(id: string, idx: number) {
    setTrees((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, yields: t.yields.filter((_, i) => i !== idx) } : t,
      ),
    )
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(trees, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `apfelbaeume-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        if (!Array.isArray(data)) throw new Error('not an array')
        const cleaned: Tree[] = data
          .filter((x): x is Tree => x && typeof x.id === 'string')
          .map((x) => ({
            ...x,
            yields: Array.isArray(x.yields) ? x.yields : [],
          }))
        if (
          trees.length === 0 ||
          confirm(`${cleaned.length} Bäume importieren? Bestehende werden ersetzt.`)
        ) {
          setTrees(cleaned)
        }
      } catch {
        alert('Datei konnte nicht gelesen werden.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <section className="trees">
      <div className="trees-head">
        <div>
          <h2 className="trees-title">Meine Apfelbäume</h2>
          <p className="hint">
            {trees.length === 0
              ? 'Noch keine Bäume erfasst. Lege deinen ersten Baum an.'
              : `${trees.length} ${trees.length === 1 ? 'Baum' : 'Bäume'} · gespeichert lokal im Browser.`}
          </p>
        </div>
        <div className="trees-actions">
          <button className="btn primary" onClick={addTree}>
            + Neuer Baum
          </button>
          <button className="btn" onClick={exportJson} disabled={trees.length === 0}>
            Export
          </button>
          <label className="btn">
            Import
            <input
              type="file"
              accept="application/json,.json"
              onChange={importJson}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {sortedTrees.length === 0 ? (
        <div className="empty">
          <span className="empty-emoji" aria-hidden>
            🌳
          </span>
          <p>Klicke auf „Neuer Baum", um einen Eintrag anzulegen.</p>
        </div>
      ) : (
        <ul className="tree-grid">
          {sortedTrees.map((t) => (
            <TreeCard
              key={t.id}
              tree={t}
              editing={editingId === t.id}
              onEdit={() => setEditingId(t.id)}
              onCloseEdit={() => setEditingId(null)}
              onChange={(patch) => updateTree(t.id, patch)}
              onDelete={() => deleteTree(t.id)}
              onAddYield={() => addYield(t.id)}
              onUpdateYield={(idx, patch) => updateYield(t.id, idx, patch)}
              onDeleteYield={(idx) => deleteYield(t.id, idx)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function TreeCard(props: {
  tree: Tree
  editing: boolean
  onEdit: () => void
  onCloseEdit: () => void
  onChange: (patch: Partial<Tree>) => void
  onDelete: () => void
  onAddYield: () => void
  onUpdateYield: (idx: number, patch: Partial<TreeYield>) => void
  onDeleteYield: (idx: number) => void
}) {
  const {
    tree,
    editing,
    onEdit,
    onCloseEdit,
    onChange,
    onDelete,
    onAddYield,
    onUpdateYield,
    onDeleteYield,
  } = props

  const age = treeAge(tree)
  const total = totalYield(tree)
  const variety = varietyDisplay(tree)

  if (!editing) {
    return (
      <li className="tree-card">
        <div className="tree-card-head">
          <h3>{tree.name || <em>(unbenannt)</em>}</h3>
          <span className="tree-variety">{variety}</span>
        </div>
        <div className="tree-meta">
          {tree.plantedYear || tree.plantedDate ? (
            <span>
              Gepflanzt {tree.plantedDate ?? tree.plantedYear}
              {age !== null && ` · ${age} ${age === 1 ? 'Jahr' : 'Jahre'} alt`}
            </span>
          ) : (
            <span className="muted">Pflanzdatum unbekannt</span>
          )}
          {tree.rootstock && <span>Unterlage: {tree.rootstock}</span>}
          {tree.location && <span>Standort: {tree.location}</span>}
        </div>
        {tree.growth && (
          <div className="tree-section">
            <span className="tree-label">Wachstum:</span> {tree.growth}
          </div>
        )}
        {tree.yields.length > 0 ? (
          <div className="tree-section">
            <span className="tree-label">Erträge:</span>
            <ul className="yields-summary">
              {tree.yields
                .slice()
                .sort((a, b) => b.year - a.year)
                .map((y, i) => (
                  <li key={i}>
                    {y.year}: {y.amountKg !== undefined ? `${y.amountKg} kg` : '—'}
                    {y.notes && <span className="muted"> · {y.notes}</span>}
                  </li>
                ))}
            </ul>
            <div className="tree-total">Summe: {total} kg</div>
          </div>
        ) : (
          <div className="tree-section muted">Noch keine Erträge erfasst.</div>
        )}
        {tree.notes && (
          <div className="tree-section">
            <span className="tree-label">Notizen:</span> {tree.notes}
          </div>
        )}
        <div className="tree-actions">
          <button className="btn" onClick={onEdit}>
            Bearbeiten
          </button>
          <button className="btn danger" onClick={onDelete}>
            Löschen
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="tree-card editing">
      <div className="form-row">
        <label>
          Name
          <input
            type="text"
            value={tree.name}
            placeholder="z. B. Baum hinter der Scheune"
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Sorte (aus Liste)
          <select
            value={tree.varietyId ?? ''}
            onChange={(e) =>
              onChange({ varietyId: e.target.value || undefined })
            }
          >
            <option value="">— wählen —</option>
            {varieties.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sorte (frei)
          <input
            type="text"
            value={tree.varietyOther ?? ''}
            placeholder="falls nicht in der Liste"
            onChange={(e) =>
              onChange({ varietyOther: e.target.value || undefined })
            }
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Pflanzdatum
          <input
            type="date"
            value={tree.plantedDate ?? ''}
            onChange={(e) =>
              onChange({ plantedDate: e.target.value || undefined })
            }
          />
        </label>
        <label>
          Pflanzjahr
          <input
            type="number"
            min={1900}
            max={CURRENT_YEAR}
            value={tree.plantedYear ?? ''}
            onChange={(e) =>
              onChange({
                plantedYear: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </label>
        <label>
          Unterlage
          <input
            type="text"
            value={tree.rootstock ?? ''}
            placeholder="z. B. M9, M26, MM106"
            onChange={(e) =>
              onChange({ rootstock: e.target.value || undefined })
            }
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Standort
          <input
            type="text"
            value={tree.location ?? ''}
            placeholder="Garten, Reihe, GPS …"
            onChange={(e) =>
              onChange({ location: e.target.value || undefined })
            }
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Wachstum
          <textarea
            rows={2}
            value={tree.growth ?? ''}
            placeholder="Höhe, Stamm­umfang, Form, Gesundheit …"
            onChange={(e) => onChange({ growth: e.target.value || undefined })}
          />
        </label>
      </div>

      <div className="yields-edit">
        <div className="yields-head">
          <span className="tree-label">Erträge</span>
          <button className="btn small" onClick={onAddYield}>
            + Ertrag
          </button>
        </div>
        {tree.yields.length === 0 && (
          <div className="muted">Noch keine Einträge.</div>
        )}
        {tree.yields.map((y, idx) => (
          <div key={idx} className="yield-row">
            <input
              type="number"
              min={1900}
              max={CURRENT_YEAR + 1}
              value={y.year}
              onChange={(e) =>
                onUpdateYield(idx, { year: Number(e.target.value) })
              }
              style={{ width: '5rem' }}
            />
            <input
              type="number"
              step="0.1"
              min={0}
              placeholder="kg"
              value={y.amountKg ?? ''}
              onChange={(e) =>
                onUpdateYield(idx, {
                  amountKg: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              style={{ width: '6rem' }}
            />
            <input
              type="text"
              placeholder="Notiz (z. B. Schnitt, Krankheit)"
              value={y.notes ?? ''}
              onChange={(e) =>
                onUpdateYield(idx, { notes: e.target.value || undefined })
              }
            />
            <button
              className="btn small danger"
              onClick={() => onDeleteYield(idx)}
              aria-label="Ertrag löschen"
              title="Ertrag löschen"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="form-row">
        <label>
          Notizen
          <textarea
            rows={2}
            value={tree.notes ?? ''}
            placeholder="Pflege, Schädlinge, Veredelung, Beobachtungen …"
            onChange={(e) => onChange({ notes: e.target.value || undefined })}
          />
        </label>
      </div>

      <div className="tree-actions">
        <button className="btn primary" onClick={onCloseEdit}>
          Fertig
        </button>
        <button className="btn danger" onClick={onDelete}>
          Löschen
        </button>
      </div>
    </li>
  )
}
