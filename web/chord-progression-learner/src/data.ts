// Songs + lesson catalog.

import type { Mode, NoteName } from './theory';
import type { PatternId } from './audio';

export type Song = {
  id: string;
  title: string;
  artist: string;
  keyTonic: NoteName;
  mode: Mode;
  progression: string[]; // roman numerals
  pattern: PatternId;
  tempo: number;
  hint?: string;
};

export const SONGS: Song[] = [
  // I-V-vi-IV
  { id: 'let-it-be', title: 'Let It Be', artist: 'The Beatles', keyTonic: 'C', mode: 'major', progression: ['I', 'V', 'vi', 'IV'], pattern: 'ballad', tempo: 73 },
  { id: 'with-or-without-you', title: 'With or Without You', artist: 'U2', keyTonic: 'D', mode: 'major', progression: ['I', 'V', 'vi', 'IV'], pattern: 'arpUp', tempo: 110 },
  { id: 'dont-stop-believin', title: "Don't Stop Believin'", artist: 'Journey', keyTonic: 'E', mode: 'major', progression: ['I', 'V', 'vi', 'IV'], pattern: 'arpUpDown', tempo: 119 },
  { id: 'someone-like-you', title: 'Someone Like You', artist: 'Adele', keyTonic: 'A', mode: 'major', progression: ['I', 'V', 'vi', 'IV'], pattern: 'arpUpDown', tempo: 67 },

  // vi-IV-I-V (pop minor)
  { id: 'despacito', title: 'Despacito', artist: 'Luis Fonsi', keyTonic: 'D', mode: 'major', progression: ['vi', 'IV', 'I', 'V'], pattern: 'rhythmic', tempo: 89 },
  { id: 'zombie', title: 'Zombie', artist: 'The Cranberries', keyTonic: 'E', mode: 'minor', progression: ['i', 'III', 'VII', 'VI'], pattern: 'rhythmic', tempo: 84 },

  // I-vi-IV-V (50s doo-wop)
  { id: 'stand-by-me', title: 'Stand By Me', artist: 'Ben E. King', keyTonic: 'A', mode: 'major', progression: ['I', 'vi', 'IV', 'V'], pattern: 'ballad', tempo: 119 },
  { id: 'heart-and-soul', title: 'Heart and Soul', artist: 'Hoagy Carmichael', keyTonic: 'C', mode: 'major', progression: ['I', 'vi', 'IV', 'V'], pattern: 'alberti', tempo: 110 },
  { id: 'earth-angel', title: 'Earth Angel', artist: 'The Penguins', keyTonic: 'G', mode: 'major', progression: ['I', 'vi', 'IV', 'V'], pattern: 'ballad', tempo: 64 },

  // Andalusian cadence (i-VII-VI-V)
  { id: 'hit-the-road-jack', title: 'Hit the Road Jack', artist: 'Ray Charles', keyTonic: 'A', mode: 'minor', progression: ['i', 'VII', 'VI', 'V'], pattern: 'rhythmic', tempo: 132 },
  { id: 'hotel-california', title: 'Hotel California (verse)', artist: 'Eagles', keyTonic: 'B', mode: 'minor', progression: ['i', 'V', 'VII', 'IV'], pattern: 'arpUp', tempo: 75 },

  // ii-V-I (jazz)
  { id: 'autumn-leaves', title: 'Autumn Leaves', artist: 'Jazz Standard', keyTonic: 'G', mode: 'major', progression: ['ii7', 'V7', 'Imaj7'], pattern: 'ballad', tempo: 110 },
  { id: 'fly-me-to-the-moon', title: 'Fly Me to the Moon', artist: 'Bart Howard', keyTonic: 'C', mode: 'major', progression: ['vi', 'ii', 'V', 'I'], pattern: 'ballad', tempo: 119 },

  // Pachelbel I-V-vi-iii-IV-I-IV-V
  { id: 'canon', title: "Pachelbel's Canon", artist: 'Pachelbel', keyTonic: 'D', mode: 'major', progression: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'], pattern: 'arpUp', tempo: 70 },
  { id: 'basket-case', title: 'Basket Case', artist: 'Green Day', keyTonic: 'E', mode: 'major', progression: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'], pattern: 'rhythmic', tempo: 168 },

  // Blues I-IV-V
  { id: 'twist-and-shout', title: 'Twist and Shout', artist: 'The Beatles', keyTonic: 'D', mode: 'major', progression: ['I', 'IV', 'V', 'IV'], pattern: 'rhythmic', tempo: 124 },
  { id: 'wild-thing', title: 'Wild Thing', artist: 'The Troggs', keyTonic: 'A', mode: 'major', progression: ['I', 'IV', 'V', 'IV'], pattern: 'rhythmic', tempo: 96 },
];

export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  progression: string[];
  mode: Mode;
  keyTonic: NoteName;
  pattern: PatternId;
  tempo: number;
  songIds: string[]; // referenced songs that use this progression
  blurb: string;
};

export const LESSONS: Lesson[] = [
  {
    id: 'axis',
    title: 'The Four Chords',
    subtitle: 'I — V — vi — IV',
    emoji: '🎸',
    color: '#58CC02',
    progression: ['I', 'V', 'vi', 'IV'],
    mode: 'major', keyTonic: 'C', pattern: 'rhythmic', tempo: 96,
    songIds: ['let-it-be', 'with-or-without-you', 'dont-stop-believin', 'someone-like-you'],
    blurb: 'The most-used progression in pop music. If you know these four chords, you can play thousands of songs.',
  },
  {
    id: 'doowop',
    title: '50s Doo-Wop',
    subtitle: 'I — vi — IV — V',
    emoji: '💫',
    color: '#FFC800',
    progression: ['I', 'vi', 'IV', 'V'],
    mode: 'major', keyTonic: 'C', pattern: 'ballad', tempo: 84,
    songIds: ['stand-by-me', 'heart-and-soul', 'earth-angel'],
    blurb: 'Slow-dance progression of the 1950s. Warm, nostalgic, eternally singable.',
  },
  {
    id: 'pop-minor',
    title: 'Sad-Pop Loop',
    subtitle: 'vi — IV — I — V',
    emoji: '🌧️',
    color: '#A560E8',
    progression: ['vi', 'IV', 'I', 'V'],
    mode: 'major', keyTonic: 'C', pattern: 'arpUp', tempo: 90,
    songIds: ['despacito'],
    blurb: 'Starting on the relative minor gives the same four chords a sadder, more emotional feel.',
  },
  {
    id: 'andalusian',
    title: 'Andalusian Cadence',
    subtitle: 'i — VII — VI — V',
    emoji: '🔥',
    color: '#FF4B4B',
    progression: ['i', 'VII', 'VI', 'V'],
    mode: 'minor', keyTonic: 'A', pattern: 'rhythmic', tempo: 110,
    songIds: ['hit-the-road-jack'],
    blurb: 'A descending minor walk-down. Iconic in flamenco, classical and surf-rock.',
  },
  {
    id: 'jazz-251',
    title: 'Jazz ii–V–I',
    subtitle: 'ii7 — V7 — Imaj7',
    emoji: '🎷',
    color: '#1CB0F6',
    progression: ['ii7', 'V7', 'Imaj7'],
    mode: 'major', keyTonic: 'C', pattern: 'ballad', tempo: 110,
    songIds: ['autumn-leaves'],
    blurb: 'The backbone of jazz. Smooth voice leading from ii to V to home.',
  },
  {
    id: 'pachelbel',
    title: "Pachelbel's Canon",
    subtitle: 'I — V — vi — iii — IV — I — IV — V',
    emoji: '👑',
    color: '#FF86A8',
    progression: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
    mode: 'major', keyTonic: 'D', pattern: 'arpUp', tempo: 72,
    songIds: ['canon', 'basket-case'],
    blurb: '300 years old and still in the charts. A descending bass line that just keeps giving.',
  },
];

export function getSong(id: string): Song | undefined {
  return SONGS.find(s => s.id === id);
}

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find(l => l.id === id);
}
