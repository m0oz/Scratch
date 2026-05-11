# Chord Quest

A Duolingo-style web app for learning chord progressions. Hear famous progressions, identify chords by ear, build progressions in order, and freely explore your own combinations with arpeggio / rhythmic / ballad accompaniment patterns.

All audio is synthesized in the browser via Web Audio API — no samples.

## Features

- **Lessons**: progressive paths organized around famous progressions (I-V-vi-IV, 50s doo-wop, Andalusian, Pachelbel, ii-V-I, etc.)
- **Exercises**: listen-and-learn, identify-by-ear, build-in-order, name-that-song
- **Sandbox**: pick a key, chain diatonic chords, hear them in different accompaniment patterns
- **Patterns**: Block, Rhythmic, Arp Up, Arp Up/Down, Alberti, Ballad
- **Song library**: play famous progressions from popular songs

## Dev

```sh
npm install
npm run dev      # localhost:5173
npm run build    # production build into dist/
```

Auto-deploys to GitHub Pages on push to `main` via root `.github/workflows/deploy-web.yml`.
