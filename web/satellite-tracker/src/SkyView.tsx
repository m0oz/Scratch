import { useEffect, useMemo, useRef, useState } from 'react'
import { BRIGHT_STARS, starToAzEl } from './stars'
import type { LatLon, SatPosition } from './types'

type Props = {
  observer: LatLon
  positions: SatPosition[]
  when: Date
  hovered: SatPosition | null
  onHover: (p: SatPosition | null) => void
  cleanupActive: boolean
  cleanedIds: Set<string>
  onCleaned: (id: string) => void
}

const SUCTION_RADIUS_PX = 70

/** Polar projection: az/el → x/y on a unit-radius disk centred at zenith. */
function project(az: number, el: number): { x: number; y: number } {
  // Horizon (el=0) at radius 1, zenith (el=90) at the centre.
  const r = (90 - el) / 90
  const a = (az * Math.PI) / 180
  // Astronomy convention: north up, east right. Canvas y+ is down, so:
  return { x: r * Math.sin(a), y: -r * Math.cos(a) }
}

const FAMILY_COLOR: Record<string, string> = {
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
}

export function SkyView({
  observer,
  positions,
  when,
  hovered,
  onHover,
  cleanupActive,
  cleanedIds,
  onCleaned,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const [vacuumScreen, setVacuumScreen] = useState<{ x: number; y: number } | null>(null)

  // Pre-compute star screen positions; they don't move noticeably while hovering.
  const stars = useMemo(() => {
    return BRIGHT_STARS.map((s) => {
      const { az, el } = starToAzEl(s, observer.latitude, observer.longitude, when)
      return { star: s, az, el }
    }).filter((s) => s.el > 0)
  }, [observer.latitude, observer.longitude, when])

  // Background random faint stars, seeded so they don't dance between renders.
  const bgStars = useMemo(() => {
    const out: { x: number; y: number; b: number }[] = []
    let seed = 1337
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 0xffffffff
    }
    for (let i = 0; i < 600; i++) {
      // Uniform on the disk.
      const r = Math.sqrt(rand())
      const a = rand() * Math.PI * 2
      out.push({ x: r * Math.cos(a), y: r * Math.sin(a), b: 0.2 + rand() * 0.6 })
    }
    return out
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const size = Math.min(wrap.clientWidth, wrap.clientHeight)
      canvas.width = size * dpr
      canvas.height = size * dpr
      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)

      const cx = size / 2
      const cy = size / 2
      const R = size / 2 - 10

      // Sky gradient (deep blue → near-black at zenith).
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
      grad.addColorStop(0, '#0a1430')
      grad.addColorStop(0.6, '#070b1c')
      grad.addColorStop(1, '#02030a')
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      // Faint background stars.
      for (const s of bgStars) {
        const px = cx + s.x * R
        const py = cy + s.y * R
        ctx.fillStyle = `rgba(255,255,255,${s.b * 0.45})`
        ctx.fillRect(px, py, 1, 1)
      }

      // Compass ring + cardinal directions.
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 1
      for (const elTick of [0, 30, 60]) {
        const r = ((90 - elTick) / 90) * R
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      for (let azDeg = 0; azDeg < 360; azDeg += 30) {
        const a = (azDeg * Math.PI) / 180
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.sin(a) * R, cy - Math.cos(a) * R)
        ctx.stroke()
      }
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      ctx.font = '600 13px ui-sans-serif, system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const cardinals: [string, number][] = [
        ['N', 0], ['E', 90], ['S', 180], ['W', 270],
      ]
      for (const [label, az] of cardinals) {
        const a = (az * Math.PI) / 180
        const px = cx + Math.sin(a) * (R + 0)
        const py = cy - Math.cos(a) * (R + 0)
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.fillText(label, px - Math.sin(a) * -2, py + Math.cos(a) * -2)
      }

      // Bright named stars.
      for (const { star, az, el } of stars) {
        const p = project(az, el)
        const px = cx + p.x * R
        const py = cy + p.y * R
        const radius = Math.max(0.8, 3.2 - star.mag * 0.9)
        ctx.beginPath()
        ctx.arc(px, py, radius, 0, Math.PI * 2)
        ctx.fillStyle = '#f3f4ff'
        ctx.shadowColor = 'rgba(255,255,255,0.7)'
        ctx.shadowBlur = 6
        ctx.fill()
        ctx.shadowBlur = 0
        if (star.mag < 1.5) {
          ctx.fillStyle = 'rgba(255,255,255,0.55)'
          ctx.font = '11px ui-sans-serif, system-ui'
          ctx.textAlign = 'left'
          ctx.fillText(star.name, px + radius + 3, py + 3)
        }
      }

      // Satellites above the horizon (omit ones already vacuumed up).
      const above = positions.filter(
        (s) => s.elevation > 0 && !cleanedIds.has(s.rec.noradId)
      )
      for (const s of above) {
        const p = project(s.azimuth, s.elevation)
        const px = cx + p.x * R
        const py = cy + p.y * R
        const color = FAMILY_COLOR[s.rec.family] ?? FAMILY_COLOR.other
        const isJunk = s.rec.family === 'debris' || s.rec.family === 'rocket-body'
        const alpha = s.sunlit ? 1 : 0.55
        ctx.beginPath()
        ctx.arc(px, py, isJunk ? 2.2 : 3, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.globalAlpha = alpha
        ctx.shadowColor = color
        ctx.shadowBlur = s.sunlit ? 10 : 0
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      }

      // Cleanup suction cone: if vacuum is active and over the disk, draw a
      // glowing cone aimed at the nearest junk satellite.
      if (cleanupActive && pointerRef.current) {
        const { x: mx, y: my } = pointerRef.current
        const px = mx
        const py = my
        // Find nearest junk satellite within radius.
        let target: { x: number; y: number; sat: SatPosition } | null = null
        let bestD = SUCTION_RADIUS_PX
        for (const s of above) {
          if (s.rec.family !== 'debris' && s.rec.family !== 'rocket-body') continue
          const p = project(s.azimuth, s.elevation)
          const sx = cx + p.x * R
          const sy = cy + p.y * R
          const d = Math.hypot(sx - px, sy - py)
          if (d < bestD) {
            bestD = d
            target = { x: sx, y: sy, sat: s }
          }
        }
        // Faint detection ring.
        ctx.beginPath()
        ctx.arc(px, py, SUCTION_RADIUS_PX, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(0, 80, 180, 0.45)'
        ctx.setLineDash([4, 4])
        ctx.stroke()
        ctx.setLineDash([])
        if (target) {
          const dx = target.x - px
          const dy = target.y - py
          const len = Math.hypot(dx, dy) || 1
          const nx = dx / len
          const ny = dy / len
          const perp = { x: -ny, y: nx }
          const w = 6 + (1 - len / SUCTION_RADIUS_PX) * 10
          ctx.beginPath()
          ctx.moveTo(px + perp.x * w, py + perp.y * w)
          ctx.lineTo(target.x + perp.x * 2, target.y + perp.y * 2)
          ctx.lineTo(target.x - perp.x * 2, target.y - perp.y * 2)
          ctx.lineTo(px - perp.x * w, py - perp.y * w)
          ctx.closePath()
          const beam = ctx.createLinearGradient(px, py, target.x, target.y)
          beam.addColorStop(0, 'rgba(120, 200, 255, 0.55)')
          beam.addColorStop(1, 'rgba(120, 200, 255, 0.05)')
          ctx.fillStyle = beam
          ctx.fill()
        }
      }

      // Hovered satellite halo + label.
      if (hovered && hovered.elevation > 0) {
        const p = project(hovered.azimuth, hovered.elevation)
        const px = cx + p.x * R
        const py = cy + p.y * R
        ctx.beginPath()
        ctx.arc(px, py, 9, 0, Math.PI * 2)
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5
        ctx.stroke()
        const label = hovered.rec.name
        ctx.font = '600 12px ui-sans-serif, system-ui'
        const w = ctx.measureText(label).width + 12
        ctx.fillStyle = 'rgba(0,0,0,0.65)'
        ctx.fillRect(px + 12, py - 11, w, 22)
        ctx.fillStyle = '#fff'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, px + 18, py)
      }
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [positions, stars, bgStars, hovered, cleanupActive, cleanedIds, vacuumScreen])

  // Pointer interaction → find nearest sat (and feed the vacuum in cleanup mode).
  const handleMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const size = rect.width
    const cx = size / 2
    const cy = size / 2
    const R = size / 2 - 10
    const localX = ev.clientX - rect.left
    const localY = ev.clientY - rect.top
    const mx = localX - cx
    const my = localY - cy
    pointerRef.current = { x: localX, y: localY }
    setVacuumScreen({ x: localX, y: localY })
    if (Math.hypot(mx, my) > R + 4) {
      onHover(null)
      return
    }
    if (cleanupActive) {
      onHover(null)
      return
    }
    let best: SatPosition | null = null
    let bestD = 18
    for (const s of positions) {
      if (s.elevation <= 0) continue
      const p = project(s.azimuth, s.elevation)
      const px = p.x * R
      const py = p.y * R
      const d = Math.hypot(mx - px, my - py)
      if (d < bestD) {
        bestD = d
        best = s
      }
    }
    onHover(best)
  }

  // Cleanup ticker: while the vacuum is over the disk, sweep up the closest
  // junk object inside the suction radius once every ~120ms.
  useEffect(() => {
    if (!cleanupActive) return
    const id = setInterval(() => {
      const canvas = canvasRef.current
      const ptr = pointerRef.current
      if (!canvas || !ptr) return
      const rect = canvas.getBoundingClientRect()
      const size = rect.width
      const cx = size / 2
      const cy = size / 2
      const R = size / 2 - 10
      let target: SatPosition | null = null
      let bestD = SUCTION_RADIUS_PX
      for (const s of positions) {
        if (s.elevation <= 0) continue
        if (cleanedIds.has(s.rec.noradId)) continue
        if (s.rec.family !== 'debris' && s.rec.family !== 'rocket-body') continue
        const p = project(s.azimuth, s.elevation)
        const sx = cx + p.x * R
        const sy = cy + p.y * R
        const d = Math.hypot(sx - ptr.x, sy - ptr.y)
        if (d < bestD) {
          bestD = d
          target = s
        }
      }
      if (target) onCleaned(target.rec.noradId)
    }, 120)
    return () => clearInterval(id)
  }, [cleanupActive, positions, cleanedIds, onCleaned])

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerMove={handleMove}
        onPointerLeave={() => {
          onHover(null)
          pointerRef.current = null
          setVacuumScreen(null)
        }}
        style={{
          borderRadius: '50%',
          boxShadow: '0 0 60px rgba(80,140,255,0.18)',
          cursor: cleanupActive ? 'none' : 'default',
        }}
      />
      {cleanupActive && vacuumScreen && (
        <Vacuum
          x={vacuumScreen.x}
          y={vacuumScreen.y}
          parent={wrapRef.current}
          canvas={canvasRef.current}
        />
      )}
    </div>
  )
}

function Vacuum({
  x,
  y,
  parent,
  canvas,
}: {
  x: number
  y: number
  parent: HTMLDivElement | null
  canvas: HTMLCanvasElement | null
}) {
  if (!parent || !canvas) return null
  // x/y are relative to the canvas; convert to the wrap container.
  const cRect = canvas.getBoundingClientRect()
  const pRect = parent.getBoundingClientRect()
  const left = cRect.left - pRect.left + x
  const top = cRect.top - pRect.top + y
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        pointerEvents: 'none',
        transform: 'translate(-12px, -52px) rotate(8deg)',
        filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.55))',
      }}
    >
      <svg width="76" height="100" viewBox="0 0 76 100">
        <defs>
          <linearGradient id="vac-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f8fafc" />
            <stop offset="0.6" stopColor="#cbd5e1" />
            <stop offset="1" stopColor="#64748b" />
          </linearGradient>
          <linearGradient id="vac-hose" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#1e293b" />
            <stop offset="1" stopColor="#475569" />
          </linearGradient>
          <radialGradient id="vac-suck" cx="0.5" cy="1" r="0.6">
            <stop offset="0" stopColor="rgba(120,200,255,0.85)" />
            <stop offset="1" stopColor="rgba(120,200,255,0)" />
          </radialGradient>
        </defs>

        {/* Suction glow at the nozzle tip */}
        <ellipse cx="14" cy="98" rx="22" ry="10" fill="url(#vac-suck)" />

        {/* Hose, drawn as a curve from tank to nozzle */}
        <path
          d="M 56 38 C 60 60, 36 70, 18 92"
          stroke="url(#vac-hose)"
          strokeWidth="9"
          fill="none"
          strokeLinecap="round"
        />
        {/* Hose ribbing */}
        <path
          d="M 56 38 C 60 60, 36 70, 18 92"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="9"
          strokeDasharray="2 4"
          fill="none"
          strokeLinecap="round"
        />

        {/* Vacuum tank */}
        <rect x="30" y="6" width="42" height="38" rx="10" fill="url(#vac-body)" stroke="#94a3b8" />
        {/* Tank highlight */}
        <rect x="34" y="10" width="14" height="14" rx="3" fill="rgba(255,255,255,0.5)" />
        {/* Display readout */}
        <rect x="50" y="26" width="18" height="12" rx="2" fill="#0f172a" />
        <circle cx="55" cy="32" r="1.6" fill="#34d399" />
        <rect x="58" y="30" width="8" height="1.5" fill="#34d399" opacity="0.8" />
        <rect x="58" y="33" width="6" height="1.5" fill="#34d399" opacity="0.6" />

        {/* ESA-style roundel badge on the tank */}
        <g transform="translate(38 30)">
          <circle r="9" fill="#003399" stroke="#ffffff" strokeWidth="1.2" />
          <text
            x="0"
            y="3.2"
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontWeight="800"
            fontSize="9"
            fill="#ffffff"
            letterSpacing="0.5"
          >
            esa
          </text>
        </g>

        {/* Nozzle */}
        <polygon points="6,98 30,98 24,80 12,80" fill="#334155" stroke="#0f172a" />
        <rect x="11" y="78" width="14" height="3" fill="#94a3b8" />
      </svg>
    </div>
  )
}
