import { useState, useEffect, useRef } from 'react'
import type { Card, CardProgress, Rating } from '../types'

interface Props {
  card: Card
  progress: CardProgress
  onRate: (rating: Rating) => void
  cardNumber: number
  totalCards: number
}

function speak(text: string) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'ja-JP'
  utt.rate = 0.9
  window.speechSynthesis.speak(utt)
}

export default function FlashCard({ card, progress, onRate, cardNumber, totalCards }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [listening, setListening] = useState(false)
  const [spokenText, setSpokenText] = useState('')
  const [showExample, setShowExample] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    setFlipped(false)
    setListening(false)
    setSpokenText('')
    setShowExample(false)
    window.speechSynthesis?.cancel()
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }
  }, [card.id])

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Spracherkennung wird in diesem Browser nicht unterstützt.')
      return
    }
    const rec = new SpeechRecognition()
    rec.lang = 'ja-JP'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setSpokenText(transcript)
      setListening(false)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
    setListening(true)
    setSpokenText('')
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const daysUntilDue = Math.max(0, Math.round((progress.dueDate - Date.now()) / (24 * 60 * 60 * 1000)))
  const isNew = progress.repetitions === 0 && progress.dueDate === 0

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto px-4">
      {/* Progress bar */}
      <div className="w-full flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all"
            style={{ width: `${(cardNumber / totalCards) * 100}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 whitespace-nowrap">{cardNumber}/{totalCards}</span>
      </div>

      {/* Card */}
      <div
        className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 cursor-pointer select-none"
        style={{ minHeight: '280px' }}
        onClick={() => !flipped && setFlipped(true)}
      >
        <div className="p-8 flex flex-col items-center justify-center gap-4 min-h-[280px]">
          {/* Front */}
          <div className="text-center">
            <p className="text-5xl font-bold text-gray-900 mb-3" style={{ fontFamily: '"Noto Sans JP", system-ui, sans-serif' }}>
              {card.japanese}
            </p>
            {flipped && (
              <>
                <p className="text-xl text-gray-500 mb-1" style={{ fontFamily: '"Noto Sans JP", system-ui, sans-serif' }}>
                  {card.reading}
                </p>
                <p className="text-lg text-gray-400">{card.romaji}</p>
              </>
            )}
          </div>

          {flipped && (
            <div className="w-full border-t border-gray-100 pt-4 text-center">
              <p className="text-2xl font-semibold text-indigo-700">{card.german}</p>

              {card.example && (
                <div className="mt-3">
                  {!showExample ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowExample(true) }}
                      className="text-sm text-indigo-400 hover:text-indigo-600 underline"
                    >
                      Beispielsatz anzeigen
                    </button>
                  ) : (
                    <div className="mt-2 text-left bg-indigo-50 rounded-xl p-3">
                      <p className="text-base text-gray-800" style={{ fontFamily: '"Noto Sans JP", system-ui, sans-serif' }}>
                        {card.example}
                      </p>
                      {card.exampleReading && (
                        <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: '"Noto Sans JP", system-ui, sans-serif' }}>
                          {card.exampleReading}
                        </p>
                      )}
                      {card.exampleGerman && (
                        <p className="text-sm text-indigo-600 mt-1">{card.exampleGerman}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!flipped && (
            <p className="text-sm text-gray-400 mt-auto">Tippen zum Aufdecken</p>
          )}
        </div>
      </div>

      {/* Audio + Speech controls */}
      <div className="flex gap-3 w-full">
        <button
          onClick={() => speak(card.japanese)}
          className="flex-1 flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-medium py-3 rounded-xl transition-colors border border-sky-200"
        >
          <span className="text-lg">🔊</span> Vorlesen
        </button>
        <button
          onClick={listening ? stopListening : startListening}
          className={`flex-1 flex items-center justify-center gap-2 font-medium py-3 rounded-xl transition-colors border ${
            listening
              ? 'bg-red-50 border-red-300 text-red-700 animate-pulse'
              : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
          }`}
        >
          <span className="text-lg">{listening ? '⏹' : '🎙'}</span>
          {listening ? 'Stoppen' : 'Sprechen'}
        </button>
      </div>

      {/* Spoken text feedback */}
      {spokenText && (
        <div className="w-full bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
          <p className="text-xs text-gray-400 mb-1">Gehört:</p>
          <p className="text-lg font-medium text-gray-700" style={{ fontFamily: '"Noto Sans JP", system-ui, sans-serif' }}>
            {spokenText}
          </p>
          {spokenText === card.japanese || spokenText === card.reading ? (
            <p className="text-green-600 text-sm mt-1">✓ Perfekt!</p>
          ) : (
            <p className="text-amber-600 text-sm mt-1">Erwartet: {card.japanese}</p>
          )}
        </div>
      )}

      {/* Rating buttons (only shown after flip) */}
      {flipped && (
        <div className="w-full space-y-2">
          <p className="text-center text-xs text-gray-400 uppercase tracking-wide">Wie gut kannst du das?</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { rating: 'again' as Rating, label: 'Nochmal', color: 'bg-red-100 hover:bg-red-200 text-red-700 border-red-200', badge: '1d' },
              { rating: 'hard' as Rating, label: 'Schwer', color: 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200', badge: '' },
              { rating: 'good' as Rating, label: 'Gut', color: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200', badge: '' },
              { rating: 'easy' as Rating, label: 'Leicht', color: 'bg-green-100 hover:bg-green-200 text-green-700 border-green-200', badge: '' },
            ].map(({ rating, label, color }) => (
              <button
                key={rating}
                onClick={() => onRate(rating)}
                className={`flex flex-col items-center py-3 rounded-xl border font-medium transition-colors text-sm ${color}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Card meta info */}
      <div className="text-xs text-gray-400 text-center">
        {isNew ? (
          <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Neue Karte</span>
        ) : (
          <span>Wiederholung #{progress.repetitions} · Intervall: {progress.interval}d</span>
        )}
      </div>
    </div>
  )
}
