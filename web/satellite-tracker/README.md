# Satellites Above

A live "what's overhead right now?" sky chart. Asks for your location, fetches
current orbital elements from CelesTrak, propagates every object with SGP4, and
plots them onto a polar projection of the local night sky alongside the brightest
named stars.

It also estimates how many of the satellites passing over you at this moment are
already classified as space debris or are past the nominal end of their mission
lifetime — i.e. likely future space garbage.

## Run locally

```sh
npm install
npm run dev
```

Then open http://localhost:5173.

## Notes

- Geolocation requires HTTPS in most browsers. Manual lat/lon input is provided
  as a fallback.
- TLEs are pulled directly from `celestrak.org/NORAD/elements/gp.php`. If that
  domain is blocked from your network, the catalogue won't load.
- Lifetime heuristics are rough (Starlink ~5y, OneWeb ~7y, GPS ~15y, ISS ~30y,
  generic ~10y) — they're intended to give a feel for fleet ageing, not for
  formal orbital decay forecasting.
- Satellites only reflect sunlight, so most are realistically visible to the eye
  for a window after dusk and before dawn. Dimmed dots in the sky view indicate
  objects currently in Earth's shadow.
