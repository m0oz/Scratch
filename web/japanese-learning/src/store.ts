import { useState, useCallback } from 'react'
import type { Card, Deck, CardProgress, Rating } from './types'
import { BUILT_IN_DECKS } from './data/vocabulary'

const STORAGE_KEY_PROGRESS = 'jp-learn-progress'
const STORAGE_KEY_DECKS = 'jp-learn-custom-decks'

function loadProgress(): Record<string, CardProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveProgress(progress: Record<string, CardProgress>) {
  localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress))
}

function loadCustomDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DECKS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCustomDecks(decks: Deck[]) {
  localStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(decks))
}

// Simple SRS algorithm based on SM-2
export function calculateNextReview(progress: CardProgress, rating: Rating): CardProgress {
  const now = Date.now()
  let { interval, easeFactor, repetitions } = progress

  if (rating === 'again') {
    interval = 1
    easeFactor = Math.max(1.3, easeFactor - 0.2)
    repetitions = 0
  } else if (rating === 'hard') {
    interval = Math.max(1, Math.round(interval * 1.2))
    easeFactor = Math.max(1.3, easeFactor - 0.15)
    repetitions += 1
  } else if (rating === 'good') {
    interval = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.round(interval * easeFactor)
    repetitions += 1
  } else {
    // easy
    interval = repetitions === 0 ? 3 : Math.round(interval * easeFactor * 1.3)
    easeFactor = Math.min(4.0, easeFactor + 0.15)
    repetitions += 1
  }

  return {
    interval,
    easeFactor,
    repetitions,
    dueDate: now + interval * 24 * 60 * 60 * 1000,
    lastReviewed: now,
  }
}

export function getDefaultProgress(): CardProgress {
  return {
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    dueDate: 0, // due immediately (new card)
  }
}

export function isDue(progress: CardProgress): boolean {
  return Date.now() >= progress.dueDate
}

export function getDueCards(cards: Card[], progress: Record<string, CardProgress>): Card[] {
  return cards.filter(card => {
    const p = progress[card.id] ?? getDefaultProgress()
    return isDue(p)
  })
}

export function useStore() {
  const [progress, setProgress] = useState<Record<string, CardProgress>>(loadProgress)
  const [customDecks, setCustomDecks] = useState<Deck[]>(loadCustomDecks)

  const allDecks = [...BUILT_IN_DECKS, ...customDecks]

  const getDeckById = useCallback(
    (id: string) => allDecks.find(d => d.id === id),
    [customDecks]
  )

  const getCardProgress = useCallback(
    (cardId: string): CardProgress => progress[cardId] ?? getDefaultProgress(),
    [progress]
  )

  const rateCard = useCallback(
    (cardId: string, rating: Rating) => {
      const current = progress[cardId] ?? getDefaultProgress()
      const next = calculateNextReview(current, rating)
      const updated = { ...progress, [cardId]: next }
      setProgress(updated)
      saveProgress(updated)
    },
    [progress]
  )

  const addCustomDeck = useCallback(
    (deck: Deck) => {
      const updated = [...customDecks, deck]
      setCustomDecks(updated)
      saveCustomDecks(updated)
    },
    [customDecks]
  )

  const addCardToDeck = useCallback(
    (deckId: string, card: Card) => {
      const updated = customDecks.map(d =>
        d.id === deckId ? { ...d, cards: [...d.cards, card] } : d
      )
      setCustomDecks(updated)
      saveCustomDecks(updated)
    },
    [customDecks]
  )

  const deleteCardFromDeck = useCallback(
    (deckId: string, cardId: string) => {
      const updated = customDecks.map(d =>
        d.id === deckId ? { ...d, cards: d.cards.filter(c => c.id !== cardId) } : d
      )
      setCustomDecks(updated)
      saveCustomDecks(updated)
    },
    [customDecks]
  )

  const deleteCustomDeck = useCallback(
    (deckId: string) => {
      const updated = customDecks.filter(d => d.id !== deckId)
      setCustomDecks(updated)
      saveCustomDecks(updated)
    },
    [customDecks]
  )

  const getDueCount = useCallback(
    (deckId: string): number => {
      const deck = allDecks.find(d => d.id === deckId)
      if (!deck) return 0
      return getDueCards(deck.cards, progress).length
    },
    [customDecks, progress]
  )

  const getTotalStats = useCallback(() => {
    const totalCards = allDecks.reduce((sum, d) => sum + d.cards.length, 0)
    const learnedCards = Object.values(progress).filter(p => p.repetitions > 0).length
    const totalDue = allDecks.reduce((sum, d) => sum + getDueCards(d.cards, progress).length, 0)
    return { totalCards, learnedCards, totalDue }
  }, [customDecks, progress])

  return {
    allDecks,
    progress,
    getCardProgress,
    rateCard,
    getDeckById,
    getDueCount,
    getTotalStats,
    addCustomDeck,
    addCardToDeck,
    deleteCardFromDeck,
    deleteCustomDeck,
  }
}
