export interface Card {
  id: string
  japanese: string    // kanji + kana (e.g. "食べる", "たべる")
  reading: string     // hiragana reading
  romaji: string
  german: string      // German translation
  example?: string    // example sentence in Japanese
  exampleReading?: string
  exampleGerman?: string
  tags?: string[]
}

export interface Deck {
  id: string
  name: string
  emoji: string
  description: string
  cards: Card[]
  isBuiltIn: boolean
}

export interface CardProgress {
  interval: number      // days until next review
  easeFactor: number    // multiplier, starts at 2.5
  repetitions: number   // successful repetitions in a row
  dueDate: number       // unix timestamp (ms)
  lastReviewed?: number
}

export type Rating = 'again' | 'hard' | 'good' | 'easy'

export type Screen =
  | { type: 'home' }
  | { type: 'study'; deckId: string }
  | { type: 'deck'; deckId: string }
  | { type: 'add-card'; deckId?: string }
