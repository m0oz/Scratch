// Music theory: notes, scales, roman numerals → MIDI chord voicings.

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type NoteName = typeof NOTE_NAMES[number];
export type Mode = 'major' | 'minor';

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

// Diatonic chord qualities for each scale degree.
// Major: I ii iii IV V vi vii°
const MAJOR_QUALITIES: Quality[] = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
// Minor (natural): i ii° III iv v VI VII
const MINOR_QUALITIES: Quality[] = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'];

const ROMAN_TO_DEGREE: Record<string, number> = {
  I: 0, II: 1, III: 2, IV: 3, V: 4, VI: 5, VII: 6,
};

export type Quality = 'maj' | 'min' | 'dim' | 'aug';

export type ChordSpec = {
  degree: number;        // 0..6
  quality: Quality;      // explicit quality from the numeral
  seventh: boolean;
  romanRaw: string;
};

const ROMAN_RE = /^([ivIV]+)(°|o|dim|\+|aug)?(maj7|M7|7)?$/;

export function parseRoman(roman: string): ChordSpec {
  const m = ROMAN_RE.exec(roman.trim());
  if (!m) throw new Error(`Cannot parse roman numeral: "${roman}"`);
  const [, lettersRaw, qual, seventhTag] = m;
  const upper = lettersRaw.toUpperCase();
  const degree = ROMAN_TO_DEGREE[upper];
  if (degree === undefined) throw new Error(`Unknown numeral: ${roman}`);

  let quality: Quality;
  if (qual === '°' || qual === 'o' || qual === 'dim') quality = 'dim';
  else if (qual === '+' || qual === 'aug') quality = 'aug';
  else quality = lettersRaw === upper ? 'maj' : 'min';

  const seventh = seventhTag !== undefined;
  return { degree, quality, seventh, romanRaw: roman };
}

export function diatonicRoman(degree: number, mode: Mode, seventh = false): string {
  const q = (mode === 'major' ? MAJOR_QUALITIES : MINOR_QUALITIES)[degree];
  const base = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][degree];
  const letters = q === 'maj' || q === 'aug' ? base : base.toLowerCase();
  const tail = q === 'dim' ? '°' : q === 'aug' ? '+' : '';
  return `${letters}${tail}${seventh ? '7' : ''}`;
}

export function allDiatonicRomans(mode: Mode): string[] {
  return [0, 1, 2, 3, 4, 5, 6].map(d => diatonicRoman(d, mode));
}

function noteIndex(name: string): number {
  const idx = NOTE_NAMES.indexOf(name as NoteName);
  if (idx < 0) throw new Error(`Unknown note: ${name}`);
  return idx;
}

// Build the chord's MIDI notes given a key tonic, mode and base octave.
// Returns notes in root position: [root, third, fifth, (seventh?)].
export function getChordNotes(
  roman: string,
  keyTonic: string,
  mode: Mode,
  octave = 4,
): number[] {
  const spec = parseRoman(roman);
  const scale = mode === 'major' ? MAJOR_SCALE : MINOR_SCALE;
  const tonicMidi = 12 * (octave + 1) + noteIndex(keyTonic); // C4 = MIDI 60
  const root = tonicMidi + scale[spec.degree];

  const intervals: number[] = [0];
  // third
  intervals.push(spec.quality === 'maj' || spec.quality === 'aug' ? 4 : 3);
  // fifth
  if (spec.quality === 'dim') intervals.push(6);
  else if (spec.quality === 'aug') intervals.push(8);
  else intervals.push(7);

  if (spec.seventh) {
    // Most common in popular music: dom7 on V (b7), maj7 elsewhere on major triads,
    // m7 on minor, m7♭5 on diminished. Heuristic: if the chord is V of the key,
    // use dominant 7; otherwise major triads use maj7.
    if (spec.quality === 'maj') {
      const isFive = spec.degree === 4;
      intervals.push(isFive ? 10 : 11);
    } else if (spec.quality === 'min' || spec.quality === 'dim') {
      intervals.push(10);
    } else {
      intervals.push(11);
    }
  }

  return intervals.map(i => root + i);
}

export function getChordDisplayName(
  roman: string,
  keyTonic: string,
  mode: Mode,
): string {
  const spec = parseRoman(roman);
  const scale = mode === 'major' ? MAJOR_SCALE : MINOR_SCALE;
  const tonicIdx = noteIndex(keyTonic);
  const rootIdx = (tonicIdx + scale[spec.degree]) % 12;
  const rootName = NOTE_NAMES[rootIdx];

  let suffix = '';
  if (spec.quality === 'min') suffix = 'm';
  else if (spec.quality === 'dim') suffix = '°';
  else if (spec.quality === 'aug') suffix = '+';

  let seventh = '';
  if (spec.seventh) {
    if (spec.quality === 'maj' && spec.degree !== 4) seventh = 'maj7';
    else if (spec.quality === 'dim') seventh = 'ø7';
    else seventh = '7';
  }

  return `${rootName}${suffix}${seventh}`;
}

// All keys for the key picker.
export const ALL_KEYS: NoteName[] = [...NOTE_NAMES];
