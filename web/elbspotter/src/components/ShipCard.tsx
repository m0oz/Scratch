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
  const isCruise = ship.shipType >= 60 && ship.shipType <= 69;
  const isUltraLarge = ship.length && ship.length >= 300;
  const moored = ship.moored;

  return (
    <div className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 border ${
      moored
        ? 'border-slate-200 shadow-sm opacity-90'
        : isNew
          ? 'border-ship-amber shadow-ship ring-2 ring-ship-amber/30 animate-bounce-in'
          : 'border-blue-100 shadow-card hover:shadow-card-hover'
    }`}>
      {/* Coloured top stripe */}
      <div className={`h-1.5 ${
        moored
          ? 'bg-gradient-to-r from-slate-300 to-slate-400'
          : isNew
            ? 'bg-gradient-to-r from-ship-amber via-yellow-300 to-ship-amber bg-[length:200%] animate-pulse'
            : 'bg-gradient-to-r from-ship-amber to-ship-dark'
      }`}/>

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {moored && (
                <span className="text-[10px] font-bold bg-slate-400 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                  At berth
                </span>
              )}
              {isNew && !moored && (
                <span className="text-[10px] font-bold bg-ship-amber text-white px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse-slow">
                  Now passing!
                </span>
              )}
              <a href={mt} target="_blank" rel="noopener noreferrer"
                className="text-base font-extrabold text-ink hover:text-airbus-sky transition-colors truncate"
                title="View on MarineTraffic">
                {ship.name || 'Unknown Vessel'}
              </a>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] bg-airbus-pale text-airbus-blue font-semibold px-2 py-0.5 rounded-full">
                {ship.typeName}
              </span>
              {isCruise && (
                <span className="text-[11px] bg-pink-50 text-pink-600 font-semibold px-2 py-0.5 rounded-full">
                  🛳 Cruise
                </span>
              )}
              {isUltraLarge && (
                <span className="text-[11px] bg-yellow-50 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
                  ⚓ Ultra-large
                </span>
              )}
              <span title={ship.flagCountry}>{ship.flagEmoji}</span>
              <span className="text-[11px] text-muted">{ship.flagCountry}</span>
            </div>
          </div>
          <div className="text-right shrink-0 bg-ship-pale rounded-xl px-3 py-1.5">
            <div className="text-xl font-extrabold text-ship-amber leading-none">{ship.distance.toFixed(1)}</div>
            <div className="text-[10px] text-muted font-semibold">km away</div>
          </div>
        </div>

        {/* Ship graphic + stats */}
        <div className="flex gap-4 items-center mb-3">
          <div className="w-40 shrink-0 bg-airbus-pale rounded-xl p-2">
            <ShipSilhouette type={ship.shipType} className="w-full h-auto drop-shadow"/>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 flex-1">
            {moored ? (
              <Stat label="Status" value="Moored"/>
            ) : (
              <>
                <Stat label="Speed"  value={`${ship.speed.toFixed(1)} kn`}/>
                <Stat label="Course" value={`${Math.round(ship.course)}° ${compass}`}/>
              </>
            )}
            {ship.length && <Stat label="Length" value={`${ship.length} m`}/>}
            {ship.width  && <Stat label="Beam"   value={`${ship.width} m`}/>}
            {ship.imoNumber ? <Stat label="IMO"  value={String(ship.imoNumber)}/> : null}
            {ship.callSign  && <Stat label="Call" value={ship.callSign}/>}
          </div>
        </div>

        {/* Route info */}
        {ship.destination && (
          <div className="border-t border-blue-50 pt-3">
            <div className="flex items-center justify-between text-[11px] text-muted mb-1">
              <span className="font-bold uppercase tracking-wide">Destination</span>
              {eta && <span className="font-bold text-ship-amber">ETA {eta}</span>}
            </div>
            <div className="font-bold text-ink text-sm mb-1">
              {destPort ? `${destPort.flag} ${destPort.name}` : ship.destination}
            </div>
            {destPort && (
              <p className="text-[11px] text-muted mb-2">{destPort.description}</p>
            )}
            {destPort && (
              <div className="bg-ship-pale border border-yellow-100 rounded-xl px-3 py-2 text-[11px] text-ink/70 leading-relaxed">
                💡 {destPort.funFact}
              </div>
            )}
          </div>
        )}

        <div className="mt-2.5 text-[10px] text-muted/50 font-mono">
          First seen {timeAgo(ship.firstSeen)} · MMSI {ship.mmsi}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted uppercase tracking-wide font-semibold">{label}</div>
      <div className="text-ink font-mono text-sm font-bold">{value}</div>
    </div>
  );
}
