# Wichtelmarkt

Kleine Weihnachtswichtel-App im Stil eines Mittelaltermarktes, mit Schnee über der ganzen Seite.

Die Auslosung zwischen Mo, Cara, Paul und Maya ist einmalig und fest in `src/draw.ts` hinterlegt (zufällig erzeugt, niemand zieht sich selbst). Die Ziele sind leicht verschleiert, damit ein Blick in den Quellcode nichts verrät. Jede Person wählt ihren Namen, bestätigt ihn und bricht das Siegel, um ihr Wichtelziel zu sehen. Der gewählte Name wird im Browser gemerkt.

Neu auslosen: `src/draw.ts` mit einer neuen zufälligen Zuordnung überschreiben (gleiche Kodierung wie in `unseal`).

```sh
npm install
npm run dev
npm run build
```
