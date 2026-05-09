# Apfelsorten lernen

Kleine Lern-App für Apfelsorten und ihre Kreuzungen.

- **Sorten:** Liste mit Jahr, Alter, Herkunft, Geschmack und Eltern.
- **Kreuzung üben:** Drag-and-Drop-Spiel – ziehe zwei Eltern­sorten in die Felder
  und prüfe, ob die Kombination die Zielsorte ergibt.
- **Meine Bäume:** Eigene Apfelbäume mit Sorte, Pflanzdatum, Standort,
  Wachstum und Erträgen pro Jahr erfassen. Daten werden lokal im Browser
  gespeichert (localStorage) und können als JSON exportiert/importiert werden.

## Run

```sh
npm install
npm run dev
```

## Daten

Die Daten in `src/data.ts` decken eine Auswahl bekannter Sorten und ihrer
Kreuzungen ab (z. B. Elstar = Golden Delicious × Ingrid Marie, Jonagold =
Jonathan × Golden Delicious). Zufallssämlinge werden als solche markiert.
