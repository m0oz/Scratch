# Elbspotter — Ship & Beluga Tracker

Desktop-friendly tracker for large ships passing on the Elbe river and Airbus Beluga aircraft near Hamburg Finkenwerder (53.545°N 9.834°E).

## What it tracks

- **Container ships & cruise ships** within 4 km on the Elbe via live AIS data (AISStream WebSocket)
- **All 11 Airbus Beluga aircraft** (6× BelugaXL + 5× Beluga ST) within 15 km via OpenSky Network

## Notifications

Browser desktop notifications fire the moment a new vessel is spotted. Toasts appear in the UI with ship details, and an event log accumulates in the header.

## Setup

1. **Plane tracking** works immediately — no API key needed (OpenSky is free, polled every 5 min)
2. **Ship tracking** needs a free [AISStream.io](https://aisstream.io) API key — enter it via the ⚙ Setup button

## Local dev

```sh
npm install
npm run dev   # http://localhost:5173
```

## Stack

React 19 · TypeScript · Tailwind CSS · Vite
