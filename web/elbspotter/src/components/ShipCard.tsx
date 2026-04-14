import { useState } from 'react';
import { ShipData } from '../types';
import { compassLabel } from '../utils/distance';
import { lookupPort } from '../data/ports';
import { ShipSilhouette } from './ShipSilhouette';

interface Props {
  ship: ShipData;
}

export function ShipCard({ ship }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const destPort = lookupPort(ship.destination);
  const eta = ship.etaText;
  const compass = compassLabel(ship.course);
  const mt = `https://www.marinetraffic.com/en/ais/index/search/all/keyword:${ship.mmsi}`;
  const moored = ship.moored;

  return (
    <div className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 border ${
      moored ? 'border-slate-200 shadow-sm' : 'border-blue-100 shadow-card hover:shadow-card-hover'
    }`}>
      <div className={`h-1 ${
        moored ? 'bg-gradient-to-r from-slate-300 to-slate-400' : 'bg-gradient-to-r from-ship-amber to-ship-dark'
      }`}/>

      <div className="flex gap-3 p-3">
        {/* Ship photo or silhouette fallback */}
        <div className="w-28 h-20 shrink-0 bg-airbus-pale rounded-xl overflow-hidden flex items-center justify-center">
          {imgFailed ? (
            <ShipSilhouette type={ship.shipType} className="w-20 h-auto opacity-60"/>
          ) : (
            <img
              src={`https://photos.marinetraffic.com/ais/showphoto.aspx?mmsi=${ship.mmsi}`}
              alt={ship.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgFailed(true)}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth < 10 || img.naturalHeight < 10) setImgFailed(true);
              }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name + distance */}
          <div className="flex items-start justify-between gap-2">
            <a href={mt} target="_blank" rel="noopener noreferrer"
              className="text-sm font-extrabold text-ink hover:text-airbus-sky transition-colors truncate leading-tight"
              title="View on MarineTraffic">
              {ship.name || 'Unknown Vessel'}
            </a>
            <div className="text-right shrink-0">
              <span className="text-base font-extrabold text-ship-amber">{ship.distance.toFixed(1)}</span>
              <span className="text-[10px] text-muted ml-0.5">km</span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {moored && (
              <span className="text-[10px] font-bold bg-slate-400 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                At berth
              </span>
            )}
            <span className="text-[10px] bg-airbus-pale text-airbus-blue font-semibold px-1.5 py-0.5 rounded-full">
              {ship.typeName}
            </span>
            {ship.length && (
              <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded-full">
                {ship.length} m
              </span>
            )}
            <span className="text-[10px]" title={ship.flagCountry}>{ship.flagEmoji} {ship.flagCountry}</span>
          </div>

          {/* Key stats — single row */}
          <div className="flex items-center gap-3 mt-1.5 text-[11px]">
            {moored ? (
              <Stat label="Status" value="Moored"/>
            ) : (
              <>
                {ship.direction && (
                  <span className={`font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-[10px] ${
                    ship.direction === 'inbound'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-orange-50 text-orange-600'
                  }`}>
                    {ship.direction === 'inbound' ? '↗ Inbound' : '↙ Outbound'}
                  </span>
                )}
                <Stat label="Speed" value={`${ship.speed.toFixed(1)} kn`}/>
                {ship.passEtaMinutes != null && ship.passEtaMinutes < 120 && (
                  <Stat label="ETA" value={ship.passEtaMinutes < 60
                    ? `~${Math.round(ship.passEtaMinutes)} min`
                    : `~${(ship.passEtaMinutes / 60).toFixed(1)} h`
                  }/>
                )}
              </>
            )}
            {ship.width && <Stat label="Beam" value={`${ship.width} m`}/>}
          </div>
        </div>
      </div>

      {/* Destination bar — compact */}
      {ship.destination && (
        <div className="flex items-center justify-between gap-2 px-3 pb-2.5 text-[11px]">
          <div className="flex items-center gap-1.5 text-muted min-w-0">
            <span className="font-bold uppercase tracking-wide shrink-0">Dest</span>
            <span className="font-bold text-ink truncate">
              {destPort ? `${destPort.flag} ${destPort.name}` : ship.destination}
            </span>
          </div>
          {eta && <span className="font-bold text-ship-amber shrink-0">ETA {eta}</span>}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted font-semibold uppercase tracking-wide">{label}</span>
      <span className="text-ink font-mono font-bold">{value}</span>
    </div>
  );
}
