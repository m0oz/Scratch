export interface GuqinPiece {
  id: string
  titleZh: string
  titleEn: string
  titlePinyin: string
  period: string
  description: string
  adaptationNotes: string
  bpm: number
  timeSignature: '4/4' | '3/4'
  guqinAbc: string
  accordionAbc: string
  /** [note, startBeat, durationInBeats] — 1 beat = quarter note */
  playbackNotes: [string, number, number][]
}

// ── 1. 阳关三叠 ─────────────────────────────────────────────────────────────
const yangGuanAbc = `X:1
T:阳关三叠
T:Yang Guan San Die (Three Stanzas at Yang Pass)
C:Traditional (Tang Dynasty, poem by Wang Wei)
M:4/4
L:1/8
Q:1/4=72
K:G
!tenuto!G8|A4B4|!tenuto!d8|d4B4|A4G4|!tenuto!G8|
A4B4|d4e4|d4B4|!tenuto!A8|
G4A4|!tenuto!B8|d4e4|!tenuto!d8|B4A4|!tenuto!G8||`

const yangGuanAccordionAbc = `X:2
T:阳关三叠 — 手风琴改编
T:Yang Guan San Die (Accordion Adaptation)
M:4/4
L:1/8
Q:1/4=72
K:G
V:1 clef=treble name="右手" subname="R.H."
V:2 clef=bass name="左手" subname="L.H."
[V:1] G8|A4B4|d8|d4B4|A4G4|G8|A4B4|d4e4|d4B4|A8|G4A4|B8|d4e4|d8|B4A4|G8||
[V:2] G,8|G,8|G,8|G,8|G,8|G,8|G,8|G,8|G,8|D,8|G,8|G,8|G,8|G,8|G,8|G,8||`

const yangGuanNotes: [string, number, number][] = [
  ['G4', 0, 4],
  ['A4', 4, 2], ['B4', 6, 2],
  ['D5', 8, 4],
  ['D5', 12, 2], ['B4', 14, 2],
  ['A4', 16, 2], ['G4', 18, 2],
  ['G4', 20, 4],
  ['A4', 24, 2], ['B4', 26, 2],
  ['D5', 28, 2], ['E5', 30, 2],
  ['D5', 32, 2], ['B4', 34, 2],
  ['A4', 36, 4],
  ['G4', 40, 2], ['A4', 42, 2],
  ['B4', 44, 4],
  ['D5', 48, 2], ['E5', 50, 2],
  ['D5', 52, 4],
  ['B4', 56, 2], ['A4', 58, 2],
  ['G4', 60, 4],
]

// ── 2. 梅花三弄 ─────────────────────────────────────────────────────────────
const meiHuaAbc = `X:3
T:梅花三弄
T:Mei Hua San Nong (Three Variations on Plum Blossoms)
C:Traditional (attr. Huan Yi, Jin Dynasty)
M:4/4
L:1/8
Q:1/4=84
K:D
!trill!f4e4|d8|A4B4|d8|
!trill!F4E4|D8|A,4B,4|D8|
A4F4|E4D4|!tenuto!F8|E4D4|D8||`

const meiHuaAccordionAbc = `X:4
T:梅花三弄 — 手风琴改编
T:Mei Hua San Nong (Accordion Adaptation)
M:4/4
L:1/8
Q:1/4=84
K:D
V:1 clef=treble name="右手" subname="R.H."
V:2 clef=bass name="左手" subname="L.H."
[V:1] f4e4|d8|A4B4|d8|F4E4|D8|A,4B,4|D8|A4F4|E4D4|F8|E4D4|D8||
[V:2] D,8|D,8|A,8|D,8|D,8|D,8|A,8|D,8|A,8|A,8|D,8|D,8|D,8||`

const meiHuaNotes: [string, number, number][] = [
  // First variation — high register
  ['F#5', 0, 2], ['E5', 2, 2],
  ['D5', 4, 4],
  ['A4', 8, 2], ['B4', 10, 2],
  ['D5', 12, 4],
  // Second variation — middle register
  ['F#4', 16, 2], ['E4', 18, 2],
  ['D4', 20, 4],
  ['A3', 24, 2], ['B3', 26, 2],
  ['D4', 28, 4],
  // Bridge and coda
  ['A4', 32, 2], ['F#4', 34, 2],
  ['E4', 36, 2], ['D4', 38, 2],
  ['F#4', 40, 4],
  ['E4', 44, 2], ['D4', 46, 2],
  ['D4', 48, 4],
]

// ── 3. 酒狂 ─────────────────────────────────────────────────────────────────
const jiuKuangAbc = `X:5
T:酒狂
T:Jiu Kuang (Drunken Ecstasy)
C:Attr. Ruan Ji (210-263 CE)
M:3/4
L:1/8
Q:3/4=112
K:Am
A2G2E2|G4A2|c6|B2A4|A6|
E2G2A2|B4A2|G6|E2D4|E6|
A4G2|E6|A4B2|c4B2|A6||`

const jiuKuangAccordionAbc = `X:6
T:酒狂 — 手风琴改编
T:Jiu Kuang (Accordion Adaptation)
M:3/4
L:1/8
Q:3/4=112
K:Am
V:1 clef=treble name="右手" subname="R.H."
V:2 clef=bass name="左手" subname="L.H."
[V:1] A2G2E2|G4A2|c6|B2A4|A6|E2G2A2|B4A2|G6|E2D4|E6|A4G2|E6|A4B2|c4B2|A6||
[V:2] A,6|E,6|A,6|E,6|A,6|A,6|E,6|A,6|A,6|A,6|A,6|A,6|A,6|E,6|A,6||`

const jiuKuangNotes: [string, number, number][] = [
  // 3/4 time — 1 bar = 3 beats
  ['A4', 0, 1], ['G4', 1, 1], ['E4', 2, 1],
  ['G4', 3, 2], ['A4', 5, 1],
  ['C5', 6, 3],
  ['B4', 9, 1], ['A4', 10, 2],
  ['A4', 12, 3],
  ['E4', 15, 1], ['G4', 16, 1], ['A4', 17, 1],
  ['B4', 18, 2], ['A4', 20, 1],
  ['G4', 21, 3],
  ['E4', 24, 1], ['D4', 25, 2],
  ['E4', 27, 3],
  ['A4', 30, 2], ['G4', 32, 1],
  ['E4', 33, 3],
  ['A4', 36, 2], ['B4', 38, 1],
  ['C5', 39, 2], ['B4', 41, 1],
  ['A4', 42, 3],
]

// ── 4. 广陵散 ────────────────────────────────────────────────────────────────
const guangLingAbc = `X:7
T:广陵散
T:Guang Ling San
C:Attr. Ji Kang (223-262 CE)
M:4/4
L:1/8
Q:1/4=88
K:G
D4G4|!tenuto!A8|B4d4|!tenuto!d8|e4d4|!tenuto!B8|A4G4|!tenuto!G8|
D4G4|A4B4|!tenuto!d8|e4d4|B4A4|!tenuto!G8|
A4G4|!tenuto!G8||`

const guangLingAccordionAbc = `X:8
T:广陵散 — 手风琴改编
T:Guang Ling San (Accordion Adaptation)
M:4/4
L:1/8
Q:1/4=88
K:G
V:1 clef=treble name="右手" subname="R.H."
V:2 clef=bass name="左手" subname="L.H."
[V:1] D4G4|A8|B4d4|d8|e4d4|B8|A4G4|G8|D4G4|A4B4|d8|e4d4|B4A4|G8|A4G4|G8||
[V:2] G,8|D,8|G,8|G,8|G,8|G,8|D,8|G,8|G,8|G,8|G,8|G,8|G,8|G,8|D,8|G,8||`

const guangLingNotes: [string, number, number][] = [
  ['D4', 0, 2], ['G4', 2, 2],
  ['A4', 4, 4],
  ['B4', 8, 2], ['D5', 10, 2],
  ['D5', 12, 4],
  ['E5', 16, 2], ['D5', 18, 2],
  ['B4', 20, 4],
  ['A4', 24, 2], ['G4', 26, 2],
  ['G4', 28, 4],
  ['D4', 32, 2], ['G4', 34, 2],
  ['A4', 36, 2], ['B4', 38, 2],
  ['D5', 40, 4],
  ['E5', 44, 2], ['D5', 46, 2],
  ['B4', 48, 2], ['A4', 50, 2],
  ['G4', 52, 4],
  ['A4', 56, 2], ['G4', 58, 2],
  ['G4', 60, 4],
]

export const pieces: GuqinPiece[] = [
  {
    id: 'yang-guan',
    titleZh: '阳关三叠',
    titleEn: 'Three Stanzas at Yang Pass',
    titlePinyin: 'Yáng Guān Sān Dié',
    period: 'Tang Dynasty (618–907 CE)',
    description:
      'Based on the farewell poem "Seeing Yuan Er Off to Anxi" by Wang Wei. One of the most lyrical guqin pieces, expressing tender melancholy at parting. The melody repeats three times, each time with greater emotional depth.',
    adaptationNotes:
      'The pentatonic G-major melody is preserved intact in the right hand. Simple root-position bass notes anchor each bar in the left hand. Guqin slides (吟猱) are replaced by tenuto marks, encouraging a singing tone on the bellows.',
    bpm: 72,
    timeSignature: '4/4',
    guqinAbc: yangGuanAbc,
    accordionAbc: yangGuanAccordionAbc,
    playbackNotes: yangGuanNotes,
  },
  {
    id: 'mei-hua',
    titleZh: '梅花三弄',
    titleEn: 'Three Variations on Plum Blossoms',
    titlePinyin: 'Méi Huā Sān Nòng',
    period: 'Jin Dynasty (attr. Huan Yi, 265–420 CE)',
    description:
      'The iconic theme symbolising the resilient plum blossom returns three times in different registers — high, middle, and low — representing the flower\'s endurance through winter. One of the "Ten Famous Guqin Pieces".',
    adaptationNotes:
      'The D-major pentatonic theme is kept in all three registers (spanning A3–F♯5). The right hand ranges widely, giving the accordion a chance to show its full tonal palette. Bass notes follow the harmonic rhythm (D and A).',
    bpm: 84,
    timeSignature: '4/4',
    guqinAbc: meiHuaAbc,
    accordionAbc: meiHuaAccordionAbc,
    playbackNotes: meiHuaNotes,
  },
  {
    id: 'jiu-kuang',
    titleZh: '酒狂',
    titleEn: 'Drunken Ecstasy',
    titlePinyin: 'Jiǔ Kuáng',
    period: 'Wei Kingdom (attr. Ruan Ji, 210–263 CE)',
    description:
      'Attributed to the poet Ruan Ji, this piece depicts wild, carefree intoxication — drinking to escape political turmoil. The irregular feel in 3/4 time evokes the staggering gait of a drunkard.',
    adaptationNotes:
      'The erratic A-minor pentatonic melody suits the accordion\'s bellows, where push-pull motion naturally suggests an unsteady quality. The simple bass on beats 1 and 3 grounds the wandering melody.',
    bpm: 112,
    timeSignature: '3/4',
    guqinAbc: jiuKuangAbc,
    accordionAbc: jiuKuangAccordionAbc,
    playbackNotes: jiuKuangNotes,
  },
  {
    id: 'guang-ling',
    titleZh: '广陵散',
    titleEn: 'Guang Ling Melody',
    titlePinyin: 'Guǎng Líng Sàn',
    period: 'Wei Kingdom (attr. Ji Kang, 223–262 CE)',
    description:
      'One of the most celebrated guqin pieces, said to have been played by Ji Kang before his execution. Its bold, dramatic character — depicting the swordsman Nie Zheng\'s revenge — sets it apart from the more lyrical guqin repertoire.',
    adaptationNotes:
      'The ascending opening motif (D→G→A→B→D) suits the accordion\'s bold lower register. The melody stays in G-major pentatonic throughout. The left hand alternates G and D to outline the tonic/dominant harmonic motion.',
    bpm: 88,
    timeSignature: '4/4',
    guqinAbc: guangLingAbc,
    accordionAbc: guangLingAccordionAbc,
    playbackNotes: guangLingNotes,
  },
]
