# 8MO8 Rhythm Composer

Browser-based drum machine and bass sequencer built with React + TypeScript + Vite. All sounds are synthesized via Web Audio API (no samples).

## Architecture

- `src/App.tsx` — Main UI component, sequencer scheduler, tap-record, all inline styles
- `src/audioEngine.ts` — Sound catalog (50+ synthesized drums across 7 categories), playback via Web Audio API oscillators + noise
- `src/bassSynth.ts` — Monophonic bass synthesizer with filter envelope, waveform selection, slide/glide
- `src/patterns.ts` — Track/Pattern interfaces, 23+ preset patterns with velocity data, default track factory
- `src/main.tsx` — React entry point

## Key concepts

- **Scheduling**: Web Audio API clock with 100ms lookahead and 25ms timer granularity for sample-accurate timing
- **Swing**: Applied to odd-numbered steps as a fraction of step duration
- **Step velocity**: Each drum step has a velocity level: ghost (0.35x), normal (1x), or accent (1.4x). Click toggles on/off, right-click cycles through velocity levels
- **Tap-to-record**: Per-track recording mode. First tap arms the track (clears steps, auto-starts playback) and records a hit. Subsequent taps record hits at the current step. Loop wrap auto-disarms
- **Bass synth**: Monophonic with selectable waveform (sine/square/saw/tri), lowpass filter with envelope, accent (louder), and slide (portamento from previous note)
- **Key/scale selector**: Bass piano roll shows only notes in the selected key and scale. Changing key transposes existing notes. Changing scale snaps notes to nearest interval. Includes common techno scales (Phrygian Dominant, Whole Tone, etc.)
- **Sound synthesis**: Each drum uses oscillators (sine/square/sawtooth) with frequency/gain envelopes, plus filtered noise. Volume and decay are per-track parameters

## Dev

```sh
npm install
npm run dev      # localhost:5173
npm run build    # production build into dist/
```

No tests or linting configured. All styling is inline (no CSS files).

## Deployment

Deployed automatically via GitHub Pages when pushed to `main`. See root `CLAUDE.md` for details. Base path is injected via `VITE_BASE` env var during CI build.
