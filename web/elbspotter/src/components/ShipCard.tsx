import { ShipData } from '../types';
import { compassLabel } from '../utils/distance';
import { lookupPort } from '../data/ports';
import { ShipSilhouette } from './ShipSilhouette';

interface Props {
  ship: ShipData;
  isNew?: boolean;
}

function timeAgo(ms: number): string {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

export function ShipCard({ ship, isNew }: Props) {
  const destPort = lookupPort(ship.destination);
  const eta = ship.etaText;
  const compass = compassLabel(ship.course);
  const mt = `https://www.marinetraffic.com/en/ais/details/ships/mmsi:${ship.mmsi}`;

  const isLarge = ship.length && ship.length >= 200;
  const isCruise = ship.shipType >= 60 && ship.shipType <= 69;

  return (
    <div
      className={`relative rounded-xl border overflow-hidden transition-all duration-500 ${
        isNew
          ? 'border-ship-amber bg-navy-800 shadow-lg shadow-ship-amber/20 ring-1 ring-ship-amber/40'
          : 'border-navy-600 bg-navy-800 hover:border-airbus-sky/60'
      }`}
    >
      {isNew && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-ship-amber to-transparent animate-pulse"/>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isNew && (
                <span className="text-xs font-mono bg-ship-amber/20 text-ship-amber border border-ship-amber/40 px-1.5 py-0.5 rounded animate-pulse-slow">
                  NEW
                </span>
              )}
              <a
                href={mt}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-bold text-white hover:text-airbus-sky transition-colors truncate"
                title="View on MarineTraffic"
              >
                {ship.name || 'Unknown Vessel'}
              </a>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-navy-600 bg-navy-700/60 px-1.5 py-0.5 rounded font-mono">
                {ship.typeName}
              </span>
              <span title={ship.flagCountry}>{ship.flagEmoji}</span>
              <span className="text-xs text-white/40">{ship.flagCountry}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-bold text-ship-amber">{ship.distance.toFixed(1)}</div>
            <div className="text-xs text-white/40">km away</div>
          </div>
        </div>

        {/* Ship image + stats */}
        <div className="flex gap-4 items-center mb-3">
          <div className="w-44 shrink-0">
            <ShipSilhouette type={ship.shipType} className="w-full h-auto drop-shadow-lg"/>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm flex-1">
            <Stat label="Speed" value={`${ship.speed.toFixed(1)} kn`}/>
            <Stat label="Course" value={`${Math.round(ship.course)}° ${compass}`}/>
            {ship.length && <Stat label="Length" value={`${ship.length} m`}/>}
            {ship.width && <Stat label="Beam" value={`${ship.width} m`}/>}
            {ship.imoNumber ? <Stat label="IMO" value={String(ship.imoNumber)}/> : null}
            {ship.callSign && <Stat label="Call" value={ship.callSign}/>}
          </div>
        </div>

        {/* Size badge */}
        {isLarge && (
          <div className="mb-2 flex gap-1 flex-wrap">
            <span className="text-xs bg-airbus-blue/30 border border-airbus-blue/50 text-airbus-sky px-2 py-0.5 rounded-full">
              {isCruise ? '🛳 Cruise Ship' : '📦 Large Freighter'}
            </span>
            {ship.length && ship.length >= 300 && (
              <span className="text-xs bg-ship-amber/20 border border-ship-amber/40 text-ship-amber px-2 py-0.5 rounded-full">
                ⚓ Ultra-large class
              </span>
            )}
          </div>
        )}

        {/* Route */}
        {ship.destination && (
          <div className="border-t border-navy-700 pt-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-xs text-white/50 mb-1">
                  <span>DESTINATION</span>
                  {eta && <span className="text-ship-amber ml-auto">ETA {eta}</span>}
                </div>
                <div className="font-semibold text-white truncate">
                  {destPort ? (
                    <span>{destPort.flag} {destPort.name}</span>
                  ) : (
                    <span>{ship.destination}</span>
                  )}
                </div>
                {destPort && (
                  <div className="text-xs text-white/50 mt-1 leading-snug">{destPort.description}</div>
                )}
              </div>
            </div>
            {destPort && (
              <div className="mt-2 bg-navy-700/60 rounded-lg px-3 py-2 text-xs text-white/60 leading-relaxed border border-navy-600">
                💡 {destPort.funFact}
              </div>
            )}
          </div>
        )}

        <div className="mt-2 text-xs text-white/25 font-mono">
          First seen {timeAgo(ship.firstSeen)} · MMSI {ship.mmsi}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-white/40 uppercase tracking-wide">{label}</div>
      <div className="text-white font-mono text-sm">{value}</div>
    </div>
  );
}
