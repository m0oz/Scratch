import { useEffect, useRef } from 'react'
import abcjs from 'abcjs'

interface Props {
  abc: string
}

export default function SheetMusicDisplay({ abc }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    abcjs.renderAbc(containerRef.current, abc, {
      responsive: 'resize',
      staffwidth: 660,
      wrap: {
        minSpacing: 1.6,
        maxSpacing: 2.8,
        preferredMeasuresPerLine: 4,
      },
      paddingtop: 12,
      paddingbottom: 12,
      paddingleft: 12,
      paddingright: 12,
    })
  }, [abc])

  return <div ref={containerRef} className="w-full min-h-[160px] abcjs-container" />
}
