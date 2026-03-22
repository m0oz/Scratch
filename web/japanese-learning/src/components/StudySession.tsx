import { useState, useMemo } from 'react'
import type { Deck, Rating } from '../types'
import type { useStore } from '../store'
import { getDueCards } from '../store'
import FlashCard from './FlashCard'

interface Props {
  deck: Deck
  store: ReturnType<typeof useStore>
  onFinish: () => void
}

export default function StudySession({ deck, store, onFinish }: Props) {
  const dueCards = useMemo(() => getDueCards(deck.cards, store.progress), [])
  const [queue, setQueue] = useState(() => [...dueCards])
  const [current, setCurrent] = useState(0)
  const [doneCount, setDoneCount] = useState(0)
  const [sessionRatings, setSessionRatings] = useState<Record<string, Rating>>({})

  if (dueCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-6 px-4">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 text-center">Alles gelernt!</h2>
        <p className="text-gray-500 text-center">
          Keine fälligen Karten im Deck <strong>{deck.name}</strong>.
        </p>
        <button
          onClick={onFinish}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Zurück
        </button>
      </div>
    )
  }

  const card = queue[current]

  function handleRate(rating: Rating) {
    store.rateCard(card.id, rating)
    setSessionRatings(prev => ({ ...prev, [card.id]: rating }))

    // If "again", add card back to queue to repeat soon
    if (rating === 'again') {
      const insertAt = Math.min(current + 3, queue.length)
      const newQueue = [...queue]
      newQueue.splice(insertAt, 0, card)
      setQueue(newQueue)
    }

    setDoneCount(d => d + 1)
    if (current + 1 >= queue.length) {
      // finished
      setCurrent(queue.length) // trigger finish screen
    } else {
      setCurrent(c => c + 1)
    }
  }

  // Session complete
  if (current >= queue.length) {
    const again = Object.values(sessionRatings).filter(r => r === 'again').length
    const hard = Object.values(sessionRatings).filter(r => r === 'hard').length
    const good = Object.values(sessionRatings).filter(r => r === 'good').length
    const easy = Object.values(sessionRatings).filter(r => r === 'easy').length

    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-6 px-4">
        <div className="text-6xl">🏆</div>
        <h2 className="text-2xl font-bold text-gray-800">Lernsession abgeschlossen!</h2>
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 w-full max-w-sm">
          <p className="text-center text-gray-500 mb-4 text-sm">Ergebnisse dieser Session</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{again}</p>
              <p className="text-xs text-red-400">Nochmal</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-orange-600">{hard}</p>
              <p className="text-xs text-orange-400">Schwer</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{good}</p>
              <p className="text-xs text-blue-400">Gut</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{easy}</p>
              <p className="text-xs text-green-400">Leicht</p>
            </div>
          </div>
        </div>
        <button
          onClick={onFinish}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Zurück zur Übersicht
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 py-4">
      <FlashCard
        card={card}
        progress={store.getCardProgress(card.id)}
        onRate={handleRate}
        cardNumber={Math.min(current + 1, queue.length)}
        totalCards={queue.length}
      />
    </div>
  )
}
