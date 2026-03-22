import { useState } from 'react'
import { pieces } from './data/pieces'
import SheetMusicDisplay from './components/SheetMusicDisplay'
import PlayerControls from './components/PlayerControls'

type ViewMode = 'guqin' | 'accordion'

export default function App() {
  const [selectedId, setSelectedId] = useState(pieces[0].id)
  const [viewMode, setViewMode] = useState<ViewMode>('accordion')
  const [isPlaying, setIsPlaying] = useState(false)
  const [tempoOverride, setTempoOverride] = useState<number | null>(null)

  const piece = pieces.find((p) => p.id === selectedId)!
  const tempo = tempoOverride ?? piece.bpm

  function selectPiece(id: string) {
    setSelectedId(id)
    setIsPlaying(false)
    setTempoOverride(null)
  }

  return (
    <div className="min-h-screen bg-parchment text-inkblack">
      {/* Header */}
      <header className="bg-crimson text-white shadow-md">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-wide">
              古琴 <span className="opacity-50 mx-1">→</span> 手风琴
            </h1>
            <p className="text-red-200 text-sm mt-0.5">
              Guqin Music Transcribed for Accordion
            </p>
          </div>
          <p className="text-red-300 text-xs text-right hidden sm:block max-w-xs leading-relaxed">
            Famous Chinese guqin pieces adapted for accordion with synthetic audio preview
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Piece selector */}
        <nav className="flex flex-wrap gap-2">
          {pieces.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPiece(p.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
                ${p.id === selectedId
                  ? 'bg-crimson border-crimson text-white shadow-sm'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-crimson hover:text-crimson'}`}
            >
              {p.titleZh}
              <span className="ml-1.5 opacity-60 text-xs">{p.titlePinyin}</span>
            </button>
          ))}
        </nav>

        {/* Piece info */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className="text-3xl font-serif font-bold">{piece.titleZh}</h2>
                <span className="text-lg text-gray-500 font-serif">{piece.titleEn}</span>
              </div>
              <p className="text-crimson font-medium text-sm mt-1">{piece.period}</p>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed max-w-2xl">
                {piece.description}
              </p>
            </div>

            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200 shrink-0 self-start">
              <button
                onClick={() => setViewMode('guqin')}
                className={`px-3.5 py-2 text-sm font-medium transition-colors
                  ${viewMode === 'guqin'
                    ? 'bg-jade text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                古琴原曲
              </button>
              <button
                onClick={() => setViewMode('accordion')}
                className={`px-3.5 py-2 text-sm font-medium transition-colors
                  border-l border-gray-200
                  ${viewMode === 'accordion'
                    ? 'bg-jade text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                手风琴改编
              </button>
            </div>
          </div>
        </div>

        {/* Sheet music */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <div className="px-4 py-1.5 border-b border-gray-100">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              {viewMode === 'guqin'
                ? '古琴谱 · Guqin Notation'
                : '手风琴谱 · Accordion Score'}
            </span>
          </div>
          <SheetMusicDisplay
            abc={viewMode === 'guqin' ? piece.guqinAbc : piece.accordionAbc}
          />
        </div>

        {/* Player */}
        <PlayerControls
          piece={piece}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          tempo={tempo}
          onTempoChange={setTempoOverride}
        />

        {/* Adaptation notes (accordion view only) */}
        {viewMode === 'accordion' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
            <h3 className="font-semibold text-amber-800 mb-1.5">
              改编说明 · Adaptation Notes
            </h3>
            <p className="text-sm text-amber-700 leading-relaxed">
              {piece.adaptationNotes}
            </p>
          </div>
        )}

        <footer className="text-center text-xs text-gray-400 pt-2 pb-6">
          Guqin melodies are simplified transcriptions for educational purposes.
          Accordion sound synthesised with Tone.js &amp; abcjs.
        </footer>
      </main>
    </div>
  )
}
