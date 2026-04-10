import { PlaneData } from '../types';
import { compassLabel } from '../utils/distance';
import { BelugaSilhouette } from './BelugaSilhouette';
import { LOW_ALTITUDE_THRESHOLD_M } from '../config';

interface Props {
  plane: PlaneData;
  isNew?: boolean;
}

function timeAgo(ms: number): string {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

function flightPhase(plane: PlaneData): { label: string; color: string; icon: string } {
  if (plane.onGround) return { label: 'On Ground', color: 'text-white/60', icon: '🛑' };
  const alt = plane.baroAltitude ?? 0;
  const vr = plane.verticalRate ?? 0;
  if (alt < LOW_ALTITUDE_THRESHOLD_M) {
    if (vr < -1) return { label: 'Landing', color: 'text-beluga-teal', icon: '⬇' };
    if (vr > 1) return { label: 'Taking Off', color: 'text-beluga-teal', icon: '⬆' };
    return { label: 'Low Pass', color: 'text-beluga-green', icon: '✈' };
  }
  if (vr < -2) return { label: 'Descending', color: 'text-beluga-teal', icon: '↘' };
  if (vr > 2) return { label: 'Climbing', color: 'text-beluga-teal', icon: '↗' };
  return { label: 'Cruising', color: 'text-white/70', icon: '→' };
}

export function PlaneCard({ plane, isNew }: Props) {
  const phase = flightPhase(plane);
  const compass = plane.trueTrack != null ? compassLabel(plane.trueTrack) : '--';
  const speedKnots = plane.velocity != null ? Math.round(plane.velocity * 1.944) : null;
  const altFt = plane.baroAltitude != null ? Math.round(plane.baroAltitude * 3.281) : null;
  const fr24 = `https://www.flightradar24.com/${plane.callsign.trim()}`;

  const belugaFacts = plane.belugaModel === 'XL'
    ? [
        'The BelugaXL can carry 2 A350 wings at once — none of its competitors come close.',
        'At 63.1m long with a 60.3m wingspan, the BelugaXL is based on the A330-200 airliner.',
        'The BelugaXL\'s cargo hold is 8m wide — wide enough to drive a truck through.',
        'Five BelugaXLs replaced four older Beluga STs, each carrying 30% more volume.',
        'The design took inspiration from the real beluga whale — right down to the painted smile!',
      ]
    : [
        'The original Beluga (ST) first flew in 1994 and is based on the A300-600.',
        'Each Beluga ST can carry one complete A340 fuselage section in a single trip.',
        'The fleet has flown over 9,000 flights in its first 25 years of service.',
        'Beluga STs ship aircraft parts between 11 Airbus production sites in 4 countries.',
        'The ST\'s distinctive hump is 7.1m above the cockpit floor — taller than a double-decker bus.',
      ];

  const randomFact = belugaFacts[Math.floor(Date.now() / 60_000) % belugaFacts.length];

  return (
    <div
      className={`relative rounded-xl border overflow-hidden transition-all duration-500 ${
        isNew
          ? 'border-beluga-teal bg-navy-800 shadow-lg shadow-beluga-teal/20 ring-1 ring-beluga-teal/40'
          : 'border-navy-600 bg-navy-800 hover:border-beluga-teal/60'
      }`}
    >
      {isNew && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-beluga-teal to-transparent animate-pulse"/>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isNew && (
                <span className="text-xs font-mono bg-beluga-teal/20 text-beluga-teal border border-beluga-teal/40 px-1.5 py-0.5 rounded animate-pulse-slow">
                  SPOTTED
                </span>
              )}
              <a
                href={fr24}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-bold text-white hover:text-beluga-teal transition-colors"
                title="View on FlightRadar24"
              >
                {plane.registration}
              </a>
              <span className="text-xs bg-airbus-blue/30 border border-airbus-blue/50 text-airbus-sky px-1.5 py-0.5 rounded">
                Beluga {plane.belugaModel}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span>🇫🇷</span>
              <span className="text-xs text-white/40">Airbus Transport International</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-bold text-beluga-teal">{plane.distance.toFixed(1)}</div>
            <div className="text-xs text-white/40">km away</div>
          </div>
        </div>

        {/* Beluga image + phase */}
        <div className="flex gap-4 items-center mb-3">
          <div className="w-48 shrink-0">
            <BelugaSilhouette model={plane.belugaModel} className="w-full h-auto drop-shadow-lg"/>
          </div>
          <div className="flex-1">
            <div className={`text-lg font-bold ${phase.color} flex items-center gap-2 mb-2`}>
              <span>{phase.icon}</span> {phase.label}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {speedKnots != null && <Stat label="Speed" value={`${speedKnots} kn`}/>}
              {plane.trueTrack != null && <Stat label="Heading" value={`${Math.round(plane.trueTrack)}° ${compass}`}/>}
              {altFt != null && <Stat label="Altitude" value={`${altFt.toLocaleString()} ft`}/>}
              {plane.verticalRate != null && Math.abs(plane.verticalRate) > 0.5 && (
                <Stat
                  label="Vert. rate"
                  value={`${plane.verticalRate > 0 ? '+' : ''}${Math.round(plane.verticalRate * 196.85)} fpm`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Fun fact */}
        <div className="border-t border-navy-700 pt-3">
          <div className="text-xs text-white/40 uppercase tracking-wide mb-1">Did you know</div>
          <div className="bg-navy-700/60 rounded-lg px-3 py-2 text-xs text-white/70 leading-relaxed border border-navy-600">
            🐋 {randomFact}
          </div>
        </div>

        <div className="mt-2 text-xs text-white/25 font-mono">
          First spotted {timeAgo(plane.firstSeen)} · ICAO {plane.icao24.toUpperCase()}
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
