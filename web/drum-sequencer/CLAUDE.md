# DR-808 Drum Sequencer

Browser-based drum machine built with React + TypeScript + Vite. All sounds are synthesized via Web Audio API (no samples).

## Architecture

- `src/App.tsx` — Main UI component, sequencer scheduler, vocalize mode, all inline styles
- `src/audioEngine.ts` — Sound catalog (50+ synthesized drums across 7 categories), playback via Web Audio API oscillators + noise
- `src/beatDetector.ts` — Microphone input analysis for vocalize mode: frequency band splitting, onset detection, hit quantization
- `src/patterns.ts` — Track/Pattern interfaces, 10 preset patterns, default track factory
- `src/main.tsx` — React entry point

## Key concepts

- **Scheduling**: Web Audio API clock with 100ms lookahead and 25ms timer granularity for sample-accurate timing
- **Swing**: Applied to odd-numbered steps as a fraction of step duration
- **Vocalize mode**: 4-beat count-in (calibrates noise floor), then 2-bar recording window. Hits are detected via energy onset across 3 frequency bands (kick <300Hz, snare 300-5kHz, hat >5kHz) and quantized to the step grid
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
