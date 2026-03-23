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
  /** [note|chord, startBeat, durationInBeats] — 1 beat = quarter note; chord = string[] */
  playbackNotes: [string | string[], number, number][]
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

  // ── 5. 归去来辞 ─────────────────────────────────────────────────────────────
  // Transcribed from John Thompson's score (Shang mode, Am pentatonic: A C D E G)
  // Original score is in bass clef; accordion adaptation transposes melody up an octave.
  {
    id: 'gui-qu-lai-ci',
    titleZh: '归去来辞',
    titleEn: 'Come Away Home',
    titlePinyin: 'Guī Qù Lái Cí',
    period: 'Eastern Jin (Tao Yuanming, 365–427 CE)',
    description:
      '"Come away home! My fields and garden will be full of weeds — why have I not gone back?" ' +
      'Tao Yuanming\'s most famous poem, written on his retirement from government, became a beloved guqin song. ' +
      'The melody is in Shang mode (Am pentatonic: A C D E G), freely paced and deeply lyrical.',
    adaptationNotes:
      'Melody transcribed from John Thompson\'s edition (bass clef original) and transposed up one octave for accordion right hand. ' +
      'Left hand plays full Am/F/G/C chords for polyphonic warmth. ' +
      'Play with rubato — follow the natural rhythm of the classical Chinese text.',
    bpm: 60,
    timeSignature: '4/4',

    guqinAbc: `X:9
T:归去来辞
T:Gui Qu Lai Ci (Come Away Home)
C:Lyrics: Tao Yuanming (365-427 CE); transcr. John Thompson
M:4/4
L:1/8
Q:1/4=60
K:Am clef=bass
%%MIDI program 107
"Am"A,4G,2E,2|A,6C2|E2D2C2A,2|G,4A,4|A,8|
"Am"A,2G,2A,2E,2|"F"G,2A,4G,2|E,2A,6|"Am"G,2A,2C2A,2|G,4E,4|
"Am"A,2G,2A,2C2|"F"A,2G,2E,4|"G"G,4A,4|"Am"C2D2C2A,2|A,8|
"C"C,2D,2E,4|"Am"G,2A,2C2A,2|"G"G,4A,4|"F"C2A,2G,4|"Am"E,2A,6|A,8||`,

    accordionAbc: `X:10
T:归去来辞 — 手风琴改编
T:Gui Qu Lai Ci (Accordion Adaptation)
C:Lyrics: Tao Yuanming (365-427 CE)
M:4/4
L:1/8
Q:1/4=60
K:Am
V:1 clef=treble name="右手" subname="R.H."
V:2 clef=bass name="左手" subname="L.H."
[V:1] A4G2E2|A6c2|e2d2c2A2|G4A4|A8|A2G2A2E2|G2A4G2|E2A6|G2A2c2A2|G4E4|A2G2A2c2|A2G2E4|G4A4|c2d2c2A2|A8|C2D2E4|G2A2c2A2|G4A4|c2A2G4|E2A6|A8||
[V:2] [A,,C,E,]8|[F,,A,,C,]8|[G,,B,,D,]8|[A,,C,E,]8|[A,,C,E,]8|[A,,C,E,]8|[F,,A,,C,]8|[F,,A,,C,]8|[A,,C,E,]8|[A,,C,E,]8|[A,,C,E,]8|[F,,A,,C,]8|[G,,B,,D,]8|[A,,C,E,]8|[A,,C,E,]8|[C,,E,,G,,]8|[A,,C,E,]8|[G,,B,,D,]8|[F,,A,,C,]8|[A,,C,E,]8|[A,,C,E,]8||`,

    // Right-hand melody + left-hand chords (chord = string[])
    // Melody: Am pentatonic (A C D E G), 21 bars × 4 beats = 84 beats
    playbackNotes: [
      // ── Right hand: melody ──────────────────────────────────────────
      // Section 1: 归去来兮，田园将芜胡不归？
      ['A4', 0, 2], ['G4', 2, 1], ['E4', 3, 1],          // bar 1
      ['A4', 4, 3], ['C5', 7, 1],                          // bar 2
      ['E5', 8, 1], ['D5', 9, 1], ['C5', 10, 1], ['A4', 11, 1], // bar 3
      ['G4', 12, 2], ['A4', 14, 2],                        // bar 4
      ['A4', 16, 4],                                        // bar 5

      // Section 2: 既自以心为形役，奚惆悵而独悲。
      ['A4', 20, 1], ['G4', 21, 1], ['A4', 22, 1], ['E4', 23, 1], // bar 6
      ['G4', 24, 1], ['A4', 25, 2], ['G4', 27, 1],        // bar 7
      ['E4', 28, 1], ['A4', 29, 3],                        // bar 8
      ['G4', 32, 1], ['A4', 33, 1], ['C5', 34, 1], ['A4', 35, 1], // bar 9
      ['G4', 36, 2], ['E4', 38, 2],                        // bar 10

      // Section 3: 悟已往之不谏，知来者之可追。
      ['A4', 40, 1], ['G4', 41, 1], ['A4', 42, 1], ['C5', 43, 1], // bar 11
      ['A4', 44, 1], ['G4', 45, 1], ['E4', 46, 2],        // bar 12
      ['G4', 48, 2], ['A4', 50, 2],                        // bar 13
      ['C5', 52, 1], ['D5', 53, 1], ['C5', 54, 1], ['A4', 55, 1], // bar 14
      ['A4', 56, 4],                                        // bar 15

      // Section 4: 实迷途其未远，觉今是而昨非。
      ['C4', 60, 1], ['D4', 61, 1], ['E4', 62, 2],        // bar 16
      ['G4', 64, 1], ['A4', 65, 1], ['C5', 66, 1], ['A4', 67, 1], // bar 17
      ['G4', 68, 2], ['A4', 70, 2],                        // bar 18
      ['C5', 72, 1], ['A4', 73, 1], ['G4', 74, 2],        // bar 19
      ['E4', 76, 1], ['A4', 77, 3],                        // bar 20
      ['A4', 80, 4],                                        // bar 21

      // ── Left hand: chords (whole-bar, polyphonic) ───────────────────
      [['A2', 'C3', 'E3'],  0,  4],  // Am
      [['F2', 'A2', 'C3'],  4,  4],  // F
      [['G2', 'B2', 'D3'],  8,  4],  // G
      [['A2', 'C3', 'E3'], 12,  4],  // Am
      [['A2', 'C3', 'E3'], 16,  4],  // Am

      [['A2', 'C3', 'E3'], 20,  4],  // Am
      [['F2', 'A2', 'C3'], 24,  4],  // F
      [['F2', 'A2', 'C3'], 28,  4],  // F
      [['A2', 'C3', 'E3'], 32,  4],  // Am
      [['A2', 'C3', 'E3'], 36,  4],  // Am

      [['A2', 'C3', 'E3'], 40,  4],  // Am
      [['F2', 'A2', 'C3'], 44,  4],  // F
      [['G2', 'B2', 'D3'], 48,  4],  // G
      [['A2', 'C3', 'E3'], 52,  4],  // Am
      [['A2', 'C3', 'E3'], 56,  4],  // Am

      [['C2', 'E2', 'G2'], 60,  4],  // C
      [['A2', 'C3', 'E3'], 64,  4],  // Am
      [['G2', 'B2', 'D3'], 68,  4],  // G
      [['F2', 'A2', 'C3'], 72,  4],  // F
      [['A2', 'C3', 'E3'], 76,  4],  // Am
      [['A2', 'C3', 'E3'], 80,  4],  // Am
    ],
  },
]
