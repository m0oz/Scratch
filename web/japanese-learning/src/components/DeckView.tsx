import type { Deck, Card } from '../types'
import type { useStore } from '../store'

interface Props {
  deck: Deck
  store: ReturnType<typeof useStore>
  onBack: () => void
  onStudy: () => void
  onAddCard: () => void
}

function speak(text: string) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'ja-JP'
  utt.rate = 0.9
  window.speechSynthesis.speak(utt)
}

export default function DeckView({ deck, store, onBack, onStudy, onAddCard }: Props) {
  const dueCount = store.getDueCount(deck.id)

  function handleDeleteCard(card: Card) {
    if (!deck.isBuiltIn && confirm(`Karte "${card.japanese}" löschen?`)) {
      store.deleteCardFromDeck(deck.id, card.id)
    }
  }

  return (
    <div className="flex flex-col flex-1 px-4 pb-8">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">‹</button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">
            {deck.emoji} {deck.name}
          </h2>
          <p className="text-sm text-gray-400">{deck.description}</p>
        </div>
      </div>

      {/* Study button */}
      <button
        onClick={onStudy}
        disabled={dueCount === 0}
        className={`w-full py-4 rounded-2xl font-semibold text-lg mb-4 transition-colors ${
          dueCount > 0
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {dueCount > 0 ? `${dueCount} Karten lernen` : 'Heute alles gelernt ✓'}
      </button>

      {/* Card list */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-600">{deck.cards.length} Karten</h3>
        {!deck.isBuiltIn && (
          <button
            onClick={onAddCard}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Karte hinzufügen
          </button>
        )}
      </div>

      <div className="space-y-2">
        {deck.cards.map(card => {
          const progress = store.getCardProgress(card.id)
          const isNew = progress.repetitions === 0 && progress.dueDate === 0
          const isDue = Date.now() >= progress.dueDate

          return (
            <div
              key={card.id}
              className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3"
            >
              <button
                onClick={() => speak(card.japanese)}
                className="text-sky-400 hover:text-sky-600 text-xl flex-shrink-0"
                title="Vorlesen"
              >
                🔊
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-medium text-gray-800" style={{ fontFamily: '"Noto Sans JP", system-ui, sans-serif' }}>
                    {card.japanese}
                  </span>
                  <span className="text-sm text-gray-400">{card.romaji}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{card.german}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                {isNew ? (
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Neu</span>
                ) : isDue ? (
                  <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Fällig</span>
                ) : (
                  <span className="text-xs text-gray-300">{progress.interval}d</span>
                )}
              </div>
              {!deck.isBuiltIn && (
                <button
                  onClick={() => handleDeleteCard(card)}
                  className="text-gray-300 hover:text-red-400 text-lg leading-none flex-shrink-0"
                >
                  ×
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
