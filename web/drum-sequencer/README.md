# 8MO8 Rhythm Composer

A browser-based drum machine and bass sequencer with an 80s-inspired dark UI. All sounds are synthesized in real-time via Web Audio API — no samples needed.

## Features

### Drums
- **50+ synthesized drum sounds** across 7 categories (kick, snare, hi-hat, clap, tom, percussion)
- **16 or 32-step sequencer** with visual playhead and beat grouping
- **Per-step velocity** — ghost notes (soft), normal, and accented hits for dynamic, human-feeling patterns
- **23+ preset patterns** — Rock, Soul, Reggae, Breakbeats (Amen, Funky Drummer, Apache...), Hip-Hop, Electronic (Trap, Dembow)
- **Tap-to-record** — arm a track and tap in your rhythm live; loop wrap auto-stops recording
- **Per-track sound customization** — click any track name to swap sounds, adjust volume and decay

### Bass
- **Monophonic bass synthesizer** with sine, square, sawtooth, and triangle waveforms
- **Piano roll editor** with one octave per page and octave navigation
- **Key and scale selector** — 11 scales including Minor, Dorian, Phrygian Dominant, Blues, Whole Tone, Chromatic
- **Accent and slide rows** — per-step accent for louder hits, slide for acid-style portamento glides
- **Synth controls** — filter cutoff, resonance, waveform selection
- **Smart transpose** — changing key shifts existing notes; changing scale snaps to nearest intervals

### General
- **Adjustable tempo** (60–200 BPM) and **swing**
- **1 or 2 bar** patterns
- **Auto-save** — pattern state persists in localStorage
- **Mobile-friendly** — landscape orientation with portrait rotation prompt
- **Full-width responsive layout** — fills the screen on any device

## Run locally

```sh
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Controls

| Action | Drums | Bass |
|--------|-------|------|
| Toggle step | Click | Click |
| Cycle velocity | Right-click | — |
| Accent | — | ACC row |
| Slide | — | SLD row |
| Change sound | Click track name | — |
| Record live | Tap ● button | — |

## License

GPL
