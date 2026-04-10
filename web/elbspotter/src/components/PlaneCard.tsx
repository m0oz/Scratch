import { useEffect, useState } from 'react';
import { PlaneData } from '../types';
import { compassLabel } from '../utils/distance';
import { BelugaSilhouette } from './BelugaSilhouette';
import { LOW_ALTITUDE_THRESHOLD_M } from '../config';

const photoCache = new Map<string, string | null>();

function usePlanePhoto(registration: string) {
  const [url, setUrl] = useState<string | null>(photoCache.get(registration) ?? null);
  const [loaded, setLoaded] = useState(photoCache.has(registration));

  useEffect(() => {
    if (photoCache.has(registration)) return;
    fetch(`https://api.planespotters.net/pub/photos/reg/${registration}`)
      .then((r) => r.json())
      .then((data) => {
        const src = data?.photos?.[0]?.thumbnail_large?.src ?? null;
        photoCache.set(registration, src);
        setUrl(src);
      })
      .catch(() => {
        photoCache.set(registration, null);
      })
      .finally(() => setLoaded(true));
  }, [registration]);

  return { url, loaded };
}

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

function flightPhase(plane: PlaneData): { label: string; bg: string; text: string; icon: string } {
  if (plane.onGround)
    return { label: 'On Ground', bg: 'bg-gray-100', text: 'text-gray-500', icon: '🛑' };
  const alt = plane.baroAltitude ?? 0;
  const vr  = plane.verticalRate ?? 0;
  if (alt < LOW_ALTITUDE_THRESHOLD_M) {
    if (vr < -1) return { label: 'Landing',    bg: 'bg-beluga-pale', text: 'text-beluga-dark', icon: '⬇' };
    if (vr >  1) return { label: 'Taking Off', bg: 'bg-beluga-pale', text: 'text-beluga-dark', icon: '⬆' };
    return       { label: 'Low Pass',          bg: 'bg-green-50',   text: 'text-green-700',    icon: '✈' };
  }
  if (plane.isInbound) return { label: 'Inbound EDHI', bg: 'bg-green-50', text: 'text-green-700', icon: '🎯' };
  if (vr < -2) return { label: 'Descending', bg: 'bg-sky-50',     text: 'text-sky-700',      icon: '↘' };
  if (vr >  2) return { label: 'Climbing',   bg: 'bg-sky-50',     text: 'text-sky-700',      icon: '↗' };
  return         { label: 'Cruising',        bg: 'bg-airbus-pale', text: 'text-airbus-blue',  icon: '→' };
}

export function PlaneCard({ plane, isNew }: Props) {
  const { url: photoUrl, loaded: photoLoaded } = usePlanePhoto(plane.registration);
  const phase      = flightPhase(plane);
  const compass    = plane.trueTrack != null ? compassLabel(plane.trueTrack) : '--';
  const speedKnots = plane.velocity  != null ? Math.round(plane.velocity * 1.944) : null;
  const altFt      = plane.baroAltitude != null ? Math.round(plane.baroAltitude * 3.281) : null;
  const fr24       = `https://www.flightradar24.com/${plane.callsign.trim()}`;

  const facts = plane.belugaModel === 'XL' ? [
    'The BelugaXL can carry 2 complete A350 wings at once — nothing else comes close.',
    'At 63.1 m long and 8 m wide inside, you could drive a bus through its cargo hold.',
    'Five BelugaXLs carry 30% more volume than the four Beluga STs they replaced.',
    'Its smile and eyes are painted on — inspired by the real beluga whale!',
    'Based on the A330-200, the XL first flew in July 2018.',
  ] : [
    'The original Beluga ST first flew in 1994 and is based on the A300-600.',
    'Each Beluga ST can carry one complete A340 fuselage section in a single trip.',
    'The fleet has flown over 9,000 flights in its first 25 years of service.',
    'Beluga STs link 11 Airbus production sites across 4 European countries.',
    'The ST\'s hump sits 7.1 m above the cockpit — taller than a double-decker bus.',
  ];

  const fact = facts[Math.floor(Date.now() / 60_000) % facts.length];

  return (
    <div className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 border ${
      isNew
        ? 'border-beluga-teal shadow-beluga ring-2 ring-beluga-teal/30 animate-bounce-in'
        : 'border-blue-100 shadow-card hover:shadow-card-hover'
    }`}>
      {/* Top stripe */}
      <div className={`h-1.5 ${isNew
        ? 'bg-gradient-to-r from-beluga-teal via-green-300 to-beluga-teal bg-[length:200%] animate-pulse'
        : 'bg-gradient-to-r from-beluga-teal to-beluga-dark'
      }`}/>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {isNew && (
                <span className="text-[10px] font-bold bg-beluga-teal text-white px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse-slow">
                  Spotted!
                </span>
              )}
              <a href={fr24} target="_blank" rel="noopener noreferrer"
                className="text-base font-extrabold text-ink hover:text-beluga-teal transition-colors"
                title="View on FlightRadar24">
                {plane.registration}
              </a>
              <span className="text-[11px] bg-airbus-pale text-airbus-blue font-semibold px-2 py-0.5 rounded-full">
                Beluga {plane.belugaModel}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🇫🇷</span>
              <span className="text-[11px] text-muted">Airbus Transport International</span>
            </div>
          </div>
          <div className="text-right shrink-0 bg-beluga-pale rounded-xl px-3 py-1.5">
            <div className="text-xl font-extrabold text-beluga-teal leading-none">{plane.distance.toFixed(1)}</div>
            <div className="text-[10px] text-muted font-semibold">km away</div>
          </div>
        </div>

        {/* Beluga graphic + phase */}
        <div className="flex gap-4 items-center mb-3">
          <div className="w-48 h-28 shrink-0 bg-airbus-pale rounded-xl overflow-hidden flex items-center justify-center">
            {photoLoaded && photoUrl ? (
              <img src={photoUrl} alt={plane.registration} className="w-full h-full object-cover"/>
            ) : (
              <BelugaSilhouette model={plane.belugaModel} className="w-40 h-auto opacity-50 p-2"/>
            )}
          </div>
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${phase.bg} ${phase.text}`}>
                <span>{phase.icon}</span> {phase.label}
              </div>
              {plane.isInbound && plane.etaMinutes != null && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-sm font-bold bg-green-50 text-green-700">
                  ETA ~{Math.round(plane.etaMinutes)} min
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {speedKnots != null   && <Stat label="Speed"    value={`${speedKnots} kn`}/>}
              {plane.trueTrack != null && <Stat label="Heading" value={`${Math.round(plane.trueTrack)}° ${compass}`}/>}
              {altFt != null        && <Stat label="Altitude" value={`${altFt.toLocaleString()} ft`}/>}
              {plane.distanceToFinkenwerder > 5 && (
                <Stat label="To EDHI" value={`${Math.round(plane.distanceToFinkenwerder)} km`}/>
              )}
              {plane.verticalRate != null && Math.abs(plane.verticalRate) > 0.5 && (
                <Stat label="Vert. rate"
                  value={`${plane.verticalRate > 0 ? '+' : ''}${Math.round(plane.verticalRate * 196.85)} fpm`}/>
              )}
            </div>
          </div>
        </div>

        {/* Fun fact */}
        <div className="border-t border-blue-50 pt-3">
          <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">Did you know</div>
          <div className="bg-beluga-pale border border-teal-100 rounded-xl px-3 py-2 text-[11px] text-ink/70 leading-relaxed">
            🐋 {fact}
          </div>
        </div>

        <div className="mt-2.5 text-[10px] text-muted/50 font-mono">
          First spotted {timeAgo(plane.firstSeen)} · ICAO {plane.icao24.toUpperCase()}
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
