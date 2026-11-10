import { useEffect, useRef } from 'react'

type Flake = { x: number; y: number; r: number; vy: number; drift: number; phase: number; o: number }

export function Snow() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let flakes: Flake[] = []
    let raf = 0

    const make = (top = false): Flake => ({
      x: Math.random() * w,
      y: top ? -10 : Math.random() * h,
      r: 0.8 + Math.random() * 2.8,
      vy: 0.3 + Math.random() * 1.1,
      drift: 0.2 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      o: 0.45 + Math.random() * 0.5,
    })

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(220, (w * h) / 7000))
      flakes = Array.from({ length: count }, () => make())
      // Resizing the canvas wipes it; with reduced motion no loop would redraw it.
      if (reduced) draw(0, false)
    }

    const draw = (t: number, move: boolean) => {
      ctx.clearRect(0, 0, w, h)
      for (const f of flakes) {
        if (move) {
          f.y += f.vy * (0.6 + f.r / 3)
          f.x += Math.sin(t / 1400 + f.phase) * f.drift * 0.5
          if (f.y > h + 10) Object.assign(f, make(true))
          if (f.x > w + 10) f.x = -10
          if (f.x < -10) f.x = w + 10
        }
        ctx.beginPath()
        ctx.fillStyle = `rgba(255, 252, 245, ${f.o})`
        ctx.shadowColor = 'rgba(255,255,255,0.8)'
        ctx.shadowBlur = f.r * 2
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const tick = (t: number) => {
      draw(t, true)
      raf = requestAnimationFrame(tick)
    }

    resize()
    window.addEventListener('resize', resize)
    if (!reduced) raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="snow" aria-hidden="true" />
}
