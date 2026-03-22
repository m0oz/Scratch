import { useState } from 'react'
import type { Card, Deck } from '../types'
import type { useStore } from '../store'

interface Props {
  decks: Deck[]
  defaultDeckId?: string
  store: ReturnType<typeof useStore>
  onBack: () => void
}

function generateId() {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export default function AddCard({ decks, defaultDeckId, store, onBack }: Props) {
  const customDecks = decks.filter(d => !d.isBuiltIn)
  const [selectedDeckId, setSelectedDeckId] = useState(defaultDeckId ?? customDecks[0]?.id ?? '')
  const [newDeckName, setNewDeckName] = useState('')
  const [newDeckEmoji, setNewDeckEmoji] = useState('📚')
  const [createNewDeck, setCreateNewDeck] = useState(customDecks.length === 0)
  const [japanese, setJapanese] = useState('')
  const [reading, setReading] = useState('')
  const [romaji, setRomaji] = useState('')
  const [german, setGerman] = useState('')
  const [example, setExample] = useState('')
  const [exampleGerman, setExampleGerman] = useState('')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    if (!japanese.trim() || !german.trim()) return

    let deckId = selectedDeckId

    if (createNewDeck) {
      if (!newDeckName.trim()) return
      const newDeck: Deck = {
        id: generateId(),
        name: newDeckName.trim(),
        emoji: newDeckEmoji,
        description: 'Eigenes Deck',
        cards: [],
        isBuiltIn: false,
      }
      store.addCustomDeck(newDeck)
      deckId = newDeck.id
      setSelectedDeckId(deckId)
      setCreateNewDeck(false)
    }

    const card: Card = {
      id: generateId(),
      japanese: japanese.trim(),
      reading: reading.trim() || japanese.trim(),
      romaji: romaji.trim(),
      german: german.trim(),
      example: example.trim() || undefined,
      exampleGerman: exampleGerman.trim() || undefined,
    }

    store.addCardToDeck(deckId, card)
    setSaved(true)
    setJapanese('')
    setReading('')
    setRomaji('')
    setGerman('')
    setExample('')
    setExampleGerman('')
    setNewDeckName('')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col flex-1 px-4 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">‹</button>
        <h2 className="text-xl font-bold text-gray-800">Karte hinzufügen</h2>
      </div>

      {/* Deck selection */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-600 mb-2">Deck</label>
        {!createNewDeck && customDecks.length > 0 ? (
          <div className="flex gap-2">
            <select
              value={selectedDeckId}
              onChange={e => setSelectedDeckId(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {customDecks.map(d => (
                <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>
              ))}
            </select>
            <button
              onClick={() => setCreateNewDeck(true)}
              className="text-sm text-indigo-600 hover:text-indigo-800 px-3 whitespace-nowrap"
            >
              + Neues Deck
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newDeckEmoji}
                onChange={e => setNewDeckEmoji(e.target.value)}
                placeholder="🎌"
                className="w-14 border border-gray-200 rounded-xl px-3 py-2.5 text-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <input
                type="text"
                value={newDeckName}
                onChange={e => setNewDeckName(e.target.value)}
                placeholder="Deck-Name"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            {customDecks.length > 0 && (
              <button
                onClick={() => setCreateNewDeck(false)}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Bestehendes Deck wählen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Card fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Japanisch *</label>
          <input
            type="text"
            value={japanese}
            onChange={e => setJapanese(e.target.value)}
            placeholder="例: 食べる"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
            style={{ fontFamily: '"Noto Sans JP", system-ui, sans-serif' }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Lesung (Hiragana)</label>
          <input
            type="text"
            value={reading}
            onChange={e => setReading(e.target.value)}
            placeholder="例: たべる"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            style={{ fontFamily: '"Noto Sans JP", system-ui, sans-serif' }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Romaji</label>
          <input
            type="text"
            value={romaji}
            onChange={e => setRomaji(e.target.value)}
            placeholder="Taberu"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Deutsch *</label>
          <input
            type="text"
            value={german}
            onChange={e => setGerman(e.target.value)}
            placeholder="essen"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Beispielsatz (optional)</label>
          <input
            type="text"
            value={example}
            onChange={e => setExample(e.target.value)}
            placeholder="例: ラーメンを食べる。"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            style={{ fontFamily: '"Noto Sans JP", system-ui, sans-serif' }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Beispiel auf Deutsch (optional)</label>
          <input
            type="text"
            value={exampleGerman}
            onChange={e => setExampleGerman(e.target.value)}
            placeholder="Ramen essen."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!japanese.trim() || !german.trim() || (createNewDeck && !newDeckName.trim())}
        className={`mt-6 w-full py-4 rounded-2xl font-semibold text-lg transition-colors ${
          japanese.trim() && german.trim() && (!createNewDeck || newDeckName.trim())
            ? saved
              ? 'bg-green-500 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {saved ? '✓ Gespeichert!' : 'Karte speichern'}
      </button>
    </div>
  )
}
