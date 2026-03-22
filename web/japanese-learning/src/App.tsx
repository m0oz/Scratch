import { useState } from 'react'
import type { Screen } from './types'
import { useStore } from './store'
import StudySession from './components/StudySession'
import DeckView from './components/DeckView'
import AddCard from './components/AddCard'

export default function App() {
  const store = useStore()
  const [screen, setScreen] = useState<Screen>({ type: 'home' })
  const stats = store.getTotalStats()

  function goHome() {
    setScreen({ type: 'home' })
  }

  if (screen.type === 'study') {
    const deck = store.getDeckById(screen.deckId)
    if (!deck) return null
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header title={`${deck.emoji} ${deck.name}`} onBack={goHome} />
        <StudySession deck={deck} store={store} onFinish={goHome} />
      </div>
    )
  }

  if (screen.type === 'deck') {
    const deck = store.getDeckById(screen.deckId)
    if (!deck) return null
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header title="Deck-Übersicht" onBack={goHome} />
        <DeckView
          deck={deck}
          store={store}
          onBack={goHome}
          onStudy={() => setScreen({ type: 'study', deckId: deck.id })}
          onAddCard={() => setScreen({ type: 'add-card', deckId: deck.id })}
        />
      </div>
    )
  }

  if (screen.type === 'add-card') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header title="Karte hinzufügen" onBack={goHome} />
        <AddCard
          decks={store.allDecks}
          defaultDeckId={screen.deckId}
          store={store}
          onBack={goHome}
        />
      </div>
    )
  }

  // Home screen
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* App header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-10 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          日本語 <span className="text-indigo-600">Lernen</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">Vokabeln mit Spracherkennung</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatBox value={stats.totalCards} label="Karten" color="text-gray-800" />
          <StatBox value={stats.learnedCards} label="Gelernt" color="text-indigo-600" />
          <StatBox value={stats.totalDue} label="Fällig" color={stats.totalDue > 0 ? 'text-amber-500' : 'text-green-500'} />
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6">
        {/* Quick start if due cards exist */}
        {stats.totalDue > 0 && (
          <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200">
            <p className="text-sm opacity-80 mb-1">Bereit zum Lernen</p>
            <p className="text-xl font-bold mb-3">{stats.totalDue} Karte{stats.totalDue !== 1 ? 'n' : ''} fällig</p>
            <button
              onClick={() => {
                const deck = store.allDecks.find(d => store.getDueCount(d.id) > 0)
                if (deck) setScreen({ type: 'study', deckId: deck.id })
              }}
              className="bg-white text-indigo-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Jetzt lernen →
            </button>
          </div>
        )}

        {/* Deck list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">Decks</h2>
            <button
              onClick={() => setScreen({ type: 'add-card' })}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              + Eigene Karte
            </button>
          </div>

          <div className="space-y-2">
            {store.allDecks.map(deck => {
              const dueCount = store.getDueCount(deck.id)
              return (
                <div
                  key={deck.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => setScreen({ type: 'deck', deckId: deck.id })}
                >
                  <span className="text-3xl flex-shrink-0">{deck.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{deck.name}</p>
                    <p className="text-xs text-gray-400 truncate">{deck.cards.length} Karten</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {dueCount > 0 && (
                      <span className="bg-amber-100 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {dueCount}
                      </span>
                    )}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setScreen({ type: 'study', deckId: deck.id })
                      }}
                      disabled={dueCount === 0}
                      className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
                        dueCount > 0
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Lernen
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Speaking tips */}
        <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100">
          <h3 className="font-semibold text-sky-800 mb-2">💡 Sprechen üben</h3>
          <p className="text-sm text-sky-600">
            Bei jeder Karte kannst du mit <strong>🔊</strong> die Aussprache hören und mit <strong>🎙</strong> selbst sprechen.
            Die App vergleicht deine Aussprache und gibt dir Feedback.
          </p>
        </div>
      </div>
    </div>
  )
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
      <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-2xl leading-none font-light">‹</button>
      <h1 className="font-semibold text-gray-800 text-lg">{title}</h1>
    </div>
  )
}

function StatBox({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}
