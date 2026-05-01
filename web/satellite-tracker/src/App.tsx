import { useEffect, useMemo, useState } from 'react'
import { SkyView } from './SkyView'
import { classifyGarbage, computeOverhead, loadCatalog } from './satellites'
import type { GarbageEstimate, LatLon, SatPosition, SatRecord } from './types'

type Phase = 'ask-location' | 'loading' | 'ready' | 'error'

const ELEVATION_VISIBLE = 10 // deg — below this we don't list the satellite

export default function App() {
  const [phase, setPhase] = useState<Phase>('ask-location')
  const [observer, setObserver] = useState<LatLon | null>(null)
  const [catalog, setCatalog] = useState<SatRecord[]>([])
  const [progress, setProgress] = useState({ loaded: 0, total: 1 })
  const [now, setNow] = useState<Date>(() => new Date())
  const [hovered, setHovered] = useState<SatPosition | null>(null)
  const [error, setError] = useState<string>('')
  const [manualLat, setManualLat] = useState('')
  const [manualLon, setManualLon] = useState('')
  const [cleanupActive, setCleanupActive] = useState(false)
  const [cleanedIds, setCleanedIds] = useState<Set<string>>(() => new Set())

  const onCleaned = (id: string) =>
    setCleanedIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })

  // Tick the clock once per second so satellites move smoothly.
  useEffect(() => {
    if (phase !== 'ready') return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [phase])

  const askLocation = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not available in this browser. Enter coordinates manually.')
      return
    }
    setError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setObserver({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitudeKm: pos.coords.altitude ? pos.coords.altitude / 1000 : 0,
        })
        startLoad()
      },
      (err) => {
        setError(`Couldn't get your location (${err.message}). Enter it manually below.`)
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    )
  }

  const submitManual = () => {
    const lat = Number(manualLat)
    const lon = Number(manualLon)
    if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      setError('Latitude must be between -90 and 90, longitude between -180 and 180.')
      return
    }
    setError('')
    setObserver({ latitude: lat, longitude: lon, altitudeKm: 0 })
    startLoad()
  }

  const startLoad = () => {
    setPhase('loading')
    loadCatalog((loaded, total) => setProgress({ loaded, total }))
      .then((cat) => {
        if (cat.length === 0) {
          setPhase('error')
          setError(
            'Could not load any satellite TLE data. CelesTrak may be unreachable from this network.'
          )
          return
        }
        setCatalog(cat)
        setPhase('ready')
      })
      .catch((e) => {
        setPhase('error')
        setError(`Failed to load satellite catalogue: ${e.message ?? e}`)
      })
  }

  const positions = useMemo(() => {
    if (!observer || catalog.length === 0) return []
    return computeOverhead(catalog, observer, now)
  }, [observer, catalog, now])

  const visible = useMemo(
    () =>
      positions
        .filter((p) => p.elevation >= ELEVATION_VISIBLE && !cleanedIds.has(p.rec.noradId))
        .sort((a, b) => b.elevation - a.elevation),
    [positions, cleanedIds]
  )

  const above = useMemo(
    () => positions.filter((p) => p.elevation > 0 && !cleanedIds.has(p.rec.noradId)),
    [positions, cleanedIds]
  )

  const garbage: GarbageEstimate = useMemo(
    () => classifyGarbage(above, now),
    [above, now]
  )

  if (phase === 'ask-location') {
    return <Welcome onUseLocation={askLocation} onManual={submitManual} manualLat={manualLat} manualLon={manualLon} setManualLat={setManualLat} setManualLon={setManualLon} error={error} />
  }

  if (phase === 'loading') {
    return <LoadingScreen progress={progress} />
  }

  if (phase === 'error') {
    return (
      <CenterMessage>
        <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
        <p style={{ opacity: 0.8 }}>{error}</p>
        <button style={primaryBtn} onClick={() => setPhase('ask-location')}>Start over</button>
      </CenterMessage>
    )
  }

  return (
    <Layout
      observer={observer!}
      now={now}
      positions={positions}
      visible={visible}
      garbage={garbage}
      hovered={hovered}
      onHover={setHovered}
      cleanupActive={cleanupActive}
      cleanedIds={cleanedIds}
      onCleaned={onCleaned}
      onToggleCleanup={() => setCleanupActive((v) => !v)}
      onResetCleanup={() => setCleanedIds(new Set())}
    />
  )
}

function Welcome(props: {
  onUseLocation: () => void
  onManual: () => void
  manualLat: string
  manualLon: string
  setManualLat: (s: string) => void
  setManualLon: (s: string) => void
  error: string
}) {
  return (
    <CenterMessage>
      <div style={{ textAlign: 'center', maxWidth: 540 }}>
        <h1 style={{ fontSize: '2.4rem', margin: '0 0 0.4em', letterSpacing: '-0.02em' }}>
          Satellites Above
        </h1>
        <p style={{ opacity: 0.78, lineHeight: 1.5, margin: '0 0 2rem' }}>
          See what's whizzing over your head right now — Starlinks, the ISS, GPS, weather satellites,
          spent rockets and known debris — projected onto your local night sky.
        </p>
        <button style={primaryBtn} onClick={props.onUseLocation}>
          Use my location
        </button>
        <div style={{ marginTop: '2rem', opacity: 0.65 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
            Or enter manually
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <input
              style={inputStyle}
              placeholder="Latitude"
              value={props.manualLat}
              onChange={(e) => props.setManualLat(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="Longitude"
              value={props.manualLon}
              onChange={(e) => props.setManualLon(e.target.value)}
            />
            <button style={secondaryBtn} onClick={props.onManual}>Go</button>
          </div>
        </div>
        {props.error && (
          <p style={{ color: '#fda4af', marginTop: '1.4rem' }}>{props.error}</p>
        )}
      </div>
    </CenterMessage>
  )
}

function LoadingScreen({ progress }: { progress: { loaded: number; total: number } }) {
  const pct = Math.round((progress.loaded / progress.total) * 100)
  return (
    <CenterMessage>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0 }}>Tuning into the heavens…</h2>
        <p style={{ opacity: 0.7 }}>Pulling fresh orbital data from CelesTrak.</p>
        <div style={{ width: 280, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', margin: '1rem auto' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#7ecbff,#a78bfa)' }} />
        </div>
        <div style={{ opacity: 0.5, fontSize: 12 }}>{progress.loaded} / {progress.total}</div>
      </div>
    </CenterMessage>
  )
}

function Layout(props: {
  observer: LatLon
  now: Date
  positions: SatPosition[]
  visible: SatPosition[]
  garbage: GarbageEstimate
  hovered: SatPosition | null
  onHover: (p: SatPosition | null) => void
  cleanupActive: boolean
  cleanedIds: Set<string>
  onCleaned: (id: string) => void
  onToggleCleanup: () => void
  onResetCleanup: () => void
}) {
  const {
    observer,
    now,
    visible,
    garbage,
    positions,
    hovered,
    onHover,
    cleanupActive,
    cleanedIds,
    onCleaned,
    onToggleCleanup,
    onResetCleanup,
  } = props

  const garbagePct =
    garbage.total > 0
      ? Math.round(((garbage.alreadyDebris + garbage.endOfLifeSoon) / garbage.total) * 100)
      : 0

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 380px',
        gridTemplateRows: '100vh',
        gap: 0,
        height: '100vh',
        background: 'radial-gradient(circle at 50% -20%, #0d1638 0%, #04050d 60%)',
      }}
    >
      <SkyView
        observer={observer}
        positions={positions}
        when={now}
        hovered={hovered}
        onHover={onHover}
        cleanupActive={cleanupActive}
        cleanedIds={cleanedIds}
        onCleaned={onCleaned}
      />
      <aside
        style={{
          padding: '24px 24px 32px',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(8,10,22,0.65)',
          backdropFilter: 'blur(8px)',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.55 }}>
          Sky over
        </div>
        <h2 style={{ margin: '4px 0 12px', fontSize: 18 }}>
          {observer.latitude.toFixed(2)}°, {observer.longitude.toFixed(2)}°
        </h2>
        <div style={{ opacity: 0.55, fontSize: 12 }}>
          {now.toLocaleTimeString()} local
        </div>

        <Stat label="Satellites currently above the horizon" value={String(positions.filter((p) => p.elevation > 0).length)} accent="#7ecbff" />
        <Stat label={`Visible (above ${ELEVATION_VISIBLE}°)`} value={String(visible.length)} accent="#a78bfa" />

        <h3 style={sectionH}>Space cleanup</h3>
        <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.5, marginBottom: 10 }}>
          Activate the orbital vacuum and sweep your cursor over the sky to
          clean up debris and spent rocket bodies. {cleanedIds.size > 0 && (
            <>You've collected <b style={{ color: '#7ecbff' }}>{cleanedIds.size}</b> object{cleanedIds.size === 1 ? '' : 's'} so far.</>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            style={{
              ...primaryBtn,
              padding: '10px 18px',
              fontSize: 14,
              background: cleanupActive
                ? 'linear-gradient(90deg,#fbbf24,#fb7185)'
                : 'linear-gradient(90deg,#7ecbff,#a78bfa)',
            }}
            onClick={onToggleCleanup}
          >
            {cleanupActive ? 'Stop cleanup' : 'Activate ESA vacuum'}
          </button>
          {cleanedIds.size > 0 && (
            <button style={secondaryBtn} onClick={onResetCleanup}>
              Reset
            </button>
          )}
        </div>
        {cleanupActive && (
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
            Hover over red (debris) and orange (rocket bodies) targets to suck them in.
          </div>
        )}

        <h3 style={sectionH}>Will it become space junk?</h3>
        <div style={{ opacity: 0.7, fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
          Of the {garbage.total} objects passing overhead right now, an estimated{' '}
          <b style={{ color: '#fbbf24' }}>{garbage.alreadyDebris + garbage.endOfLifeSoon}</b>{' '}
          (~{garbagePct}%) are already space garbage or past their nominal mission lifetime.
        </div>
        <GarbageBar garbage={garbage} />
        <Legend />

        <h3 style={sectionH}>Overhead now</h3>
        {visible.length === 0 ? (
          <p style={{ opacity: 0.6, fontSize: 13 }}>
            Nothing visible above {ELEVATION_VISIBLE}° at the moment. Try again in a minute — the sky changes fast.
          </p>
        ) : (
          <ul style={listStyle}>
            {visible.slice(0, 40).map((s) => {
              const age = now.getUTCFullYear() - s.rec.launchYear
              const isHovered = hovered?.rec.noradId === s.rec.noradId
              return (
                <li
                  key={s.rec.noradId}
                  onMouseEnter={() => onHover(s)}
                  onMouseLeave={() => onHover(null)}
                  style={{
                    ...rowStyle,
                    background: isHovered ? 'rgba(126,203,255,0.12)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ ...dot, background: familyColor(s.rec.family) }} />
                    <span style={{ fontWeight: 600 }}>{s.rec.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                    <span>El {s.elevation.toFixed(0)}° · Az {s.azimuth.toFixed(0)}°</span>
                    <span>{age}y · {s.heightKm.toFixed(0)} km</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <p style={{ opacity: 0.4, fontSize: 11, marginTop: 24, lineHeight: 1.5 }}>
          Orbital data: CelesTrak. Propagation: SGP4 via satellite.js. Lifetime estimates are
          heuristic (Starlink ~5y, OneWeb ~7y, GPS ~15y, ISS ~30y, generic ~10y) and don't reflect
          official end-of-life schedules.
        </p>
      </aside>
    </div>
  )
}

function GarbageBar({ garbage }: { garbage: GarbageEstimate }) {
  if (garbage.total === 0) return null
  const aPct = (garbage.alreadyDebris / garbage.total) * 100
  const ePct = (garbage.endOfLifeSoon / garbage.total) * 100
  const lPct = (garbage.longLived / garbage.total) * 100
  return (
    <div>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
        <div style={{ width: `${aPct}%`, background: '#ef4444' }} title={`${garbage.alreadyDebris} already debris`} />
        <div style={{ width: `${ePct}%`, background: '#fbbf24' }} title={`${garbage.endOfLifeSoon} past nominal lifetime`} />
        <div style={{ width: `${lPct}%`, background: '#34d399' }} title={`${garbage.longLived} healthy`} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.7, marginTop: 6 }}>
        <span style={{ color: '#ef4444' }}>{garbage.alreadyDebris} debris</span>
        <span style={{ color: '#fbbf24' }}>{garbage.endOfLifeSoon} ageing</span>
        <span style={{ color: '#34d399' }}>{garbage.longLived} healthy</span>
      </div>
    </div>
  )
}

function Legend() {
  const items: [string, string][] = [
    ['Starlink', 'starlink'],
    ['OneWeb', 'oneweb'],
    ['ISS / stations', 'iss'],
    ['GPS / Galileo', 'gps'],
    ['Iridium', 'iridium'],
    ['Weather', 'weather'],
    ['Science', 'science'],
    ['Rocket bodies', 'rocket-body'],
    ['Tracked debris', 'debris'],
    ['Other', 'other'],
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', margin: '14px 0 4px' }}>
      {items.map(([label, family]) => (
        <div key={family} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.85 }}>
          <span style={{ ...dot, background: familyColor(family) }} />
          {label}
        </div>
      ))}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 11, opacity: 0.55, letterSpacing: 1.4, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: accent, letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  )
}

function CenterMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'radial-gradient(circle at 50% 0%, #0d1638 0%, #04050d 60%)',
      }}
    >
      {children}
    </div>
  )
}

const primaryBtn: React.CSSProperties = {
  background: 'linear-gradient(90deg,#7ecbff,#a78bfa)',
  color: '#08081a',
  border: 0,
  borderRadius: 999,
  padding: '12px 28px',
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '0.01em',
  boxShadow: '0 8px 30px rgba(126,203,255,0.25)',
}

const secondaryBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  color: '#e8eaf3',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 8,
  padding: '8px 16px',
  fontSize: 14,
  cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#e8eaf3',
  fontSize: 14,
  width: 130,
}

const sectionH: React.CSSProperties = {
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 2,
  opacity: 0.55,
  margin: '28px 0 10px',
}

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
}

const rowStyle: React.CSSProperties = {
  padding: '8px 8px',
  borderRadius: 6,
  cursor: 'default',
  transition: 'background 80ms',
}

const dot: React.CSSProperties = {
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: 999,
}

function familyColor(family: string): string {
  return (
    {
      starlink: '#7ecbff',
      oneweb: '#a78bfa',
      iridium: '#f472b6',
      gps: '#fbbf24',
      iss: '#34d399',
      weather: '#60a5fa',
      science: '#f59e0b',
      debris: '#ef4444',
      'rocket-body': '#fb923c',
      other: '#cbd5e1',
    } as Record<string, string>
  )[family] ?? '#cbd5e1'
}
