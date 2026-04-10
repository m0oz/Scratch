import { useCallback, useEffect, useRef, useState } from 'react';
import { ShipData, PlaneData, AppNotification } from './types';
import { useShipTracker } from './hooks/useShipTracker';
import { usePlaneTracker } from './hooks/usePlaneTracker';
import { ShipCard } from './components/ShipCard';
import { PlaneCard } from './components/PlaneCard';
import { NotificationToast } from './components/NotificationToast';
import { SetupModal, AppSettings, loadSettings } from './components/SetupModal';
import { compassLabel } from './utils/distance';
import { DEFAULT_AIS_KEY, BELUGA_AIRCRAFT, SHIP_DETECTION_RADIUS_KM } from './config';

const LS_NOTIF_HISTORY = 'elbspotter_history';

function Pill({ active, label, icon }: { active: boolean; label: string; icon: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
      active
        ? 'bg-white/20 text-white'
        : 'bg-white/10 text-white/50'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-300 animate-pulse' : 'bg-white/30'}`}/>
      <span>{icon} {label}</span>
    </div>
  );
}

function SectionHeader({ icon, title, count, color }: {
  icon: string; title: string; count: number; color: 'amber' | 'teal' | 'slate';
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">{icon}</span>
      <h2 className="text-sm font-extrabold text-ink uppercase tracking-wide">{title}</h2>
      {count > 0 && (
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full text-white ${
          color === 'amber' ? 'bg-ship-amber' : color === 'teal' ? 'bg-beluga-teal' : 'bg-slate-400'
        }`}>
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 py-5 px-5
                    bg-white rounded-2xl border border-dashed border-blue-100 shadow-sm">
      <div className="text-3xl shrink-0">{icon}</div>
      <div>
        <div className="text-ink font-bold text-sm">{title}</div>
        <div className="text-muted text-xs mt-0.5 leading-relaxed">{sub}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings(DEFAULT_AIS_KEY));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_NOTIF_HISTORY) ?? '[]'); } catch { return []; }
  });
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const notifPermission = useRef<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then((p) => { notifPermission.current = p; });
    }
  }, []);

  const addNotification = useCallback((notif: AppNotification) => {
    setNotifications((prev) => {
      const next = [notif, ...prev].slice(0, 50);
      localStorage.setItem(LS_NOTIF_HISTORY, JSON.stringify(next));
      return next;
    });
    setNewIds((prev) => new Set([...prev, notif.vesselId]));
    setTimeout(() => {
      setNewIds((prev) => { const n = new Set(prev); n.delete(notif.vesselId); return n; });
    }, 30_000);
    if (notifPermission.current === 'granted') {
      new Notification(notif.title, { body: notif.message, tag: notif.vesselId, requireInteraction: false });
    }
  }, []);

  const handleNewShip = useCallback(() => {}, []);

  const handleNewPlane = useCallback((plane: PlaneData) => {
    const alt = plane.baroAltitude != null ? `${Math.round(plane.baroAltitude * 3.281).toLocaleString()} ft` : '';
    const phase = plane.onGround ? 'on the ground' : (plane.baroAltitude ?? 999) < 600 ? 'low pass / approach' : 'flying overhead';
    addNotification({
      id: `plane-${plane.icao24}-${Date.now()}`,
      type: 'plane',
      title: `Beluga ${plane.belugaModel} spotted! 🐋`,
      message: `${plane.registration} · ${phase} · ${plane.distance.toFixed(1)} km away${alt ? ` · ${alt}` : ''}`,
      timestamp: Date.now(),
      vesselId: plane.icao24,
      dismissed: false,
    });
  }, [addNotification]);

  const shipTrackerSettings = {
    lat: settings.lat, lon: settings.lon,
    shipCloseKm: settings.notifyShipClose ? settings.shipCloseKm : 0,
    minShipLength: settings.minShipLength,
  };
  const belugaTrackerSettings = {
    lat: settings.lat, lon: settings.lon,
    belugaCloseKm: settings.notifyBelugaLanding ? settings.belugaCloseKm : 0,
  };
  const { ships, mooredShips, connected: shipConnected, error: shipError } = useShipTracker(settings.apiKey, handleNewShip, shipTrackerSettings);
  const { planes, loading: planeLoading, error: planeError, lastChecked, nextCheckIn } = usePlaneTracker(handleNewPlane, belugaTrackerSettings);

  const dismissNotif = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, dismissed: true } : n));
      localStorage.setItem(LS_NOTIF_HISTORY, JSON.stringify(next));
      return next;
    });
  }, []);


  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* <NotificationToast notifications={notifications} onDismiss={dismissNotif} /> */}

      {/* Header — Airbus blue gradient */}
      <header className="sticky top-0 z-40 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #003591 0%, #0090D0 100%)' }}>
        <div className="max-w-[1600px] mx-auto px-5 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mr-2">
              <svg viewBox="0 0 64 64" className="w-9 h-9 drop-shadow-sm select-none shrink-0">
                <g transform="rotate(-45 32 32)">
                  {/* Lens */}
                  <ellipse cx="12" cy="32" rx="5" ry="10" fill="white" opacity="0.85"/>
                  <ellipse cx="12" cy="32" rx="3.5" ry="8" fill="#89b4f0" opacity="0.4"/>
                  <ellipse cx="11" cy="29" rx="1.5" ry="3" fill="white" opacity="0.5" transform="rotate(-10 11 29)"/>
                  <ellipse cx="16" cy="32" rx="2" ry="10.5" fill="#F5A700"/>
                  {/* First tube */}
                  <rect x="16" y="24" width="16" height="16" rx="2" fill="white" opacity="0.7"/>
                  <rect x="17" y="25.5" width="14" height="13" rx="1.5" fill="white" opacity="0.3"/>
                  <ellipse cx="32" cy="32" rx="2" ry="9" fill="#F5A700"/>
                  {/* Second tube */}
                  <rect x="32" y="25.5" width="14" height="13" rx="2" fill="white" opacity="0.55"/>
                  <rect x="33" y="27" width="12" height="10" rx="1.5" fill="white" opacity="0.2"/>
                  <ellipse cx="46" cy="32" rx="2" ry="8" fill="#F5A700"/>
                  {/* Eyepiece */}
                  <rect x="46" y="26" width="8" height="12" rx="2" fill="white" opacity="0.45"/>
                  <ellipse cx="54" cy="32" rx="1.5" ry="7" fill="#F5A700"/>
                  {/* Highlight */}
                  <line x1="18" y1="26" x2="44" y2="26" stroke="white" strokeWidth="1" opacity="0.4" strokeLinecap="round"/>
                </g>
              </svg>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white leading-none drop-shadow">
                  Elb<span className="text-yellow-300">spotter</span>
                </h1>
                <p className="text-[10px] text-white/60 leading-none mt-0.5 font-mono">
                  {settings.lat.toFixed(3)}°N {settings.lon.toFixed(3)}°E · {settings.locationLabel}
                </p>
              </div>
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <Pill
                active={shipConnected}
                label={shipConnected ? 'AIS live' : settings.apiKey ? 'connecting…' : 'AIS offline'}
                icon="🚢"
              />
              <Pill
                active={!planeError}
                label={planeLoading ? 'scanning…' : lastChecked ? `${Math.round((Date.now() - lastChecked.getTime()) / 60000)}m ago` : 'ADS-B'}
                icon="🐋"
              />
              {nextCheckIn > 0 && !planeLoading && (
                <span className="text-[10px] text-white/40 font-mono hidden sm:block">
                  next scan {nextCheckIn}s
                </span>
              )}
            </div>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-3">
              {(shipError || planeError) && (
                <span className="text-xs text-red-300 font-mono">{shipError || planeError}</span>
              )}
              <SetupModal settings={settings} onSave={setSettings} />
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-[1600px] mx-auto px-4 py-7 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Ships column */}
        <section>
          <SectionHeader icon="🚢" title="Ships on the Elbe" count={ships.length} color="amber" />

          {ships.length === 0 ? (
            <EmptyState
              icon="⚓"
              title={shipConnected ? 'Watching the Elbe…' : 'AIS connecting…'}
              sub={`No large vessels passing within ${SHIP_DETECTION_RADIUS_KM} km right now. You'll get a notification the moment one appears!`}
            />
          ) : (
            <div className="space-y-4">
              {ships.map((ship) => (
                <ShipCard key={ship.mmsi} ship={ship} isNew={newIds.has(ship.mmsi)} />
              ))}
            </div>
          )}

          {/* Moored ships in port */}
          {mooredShips.length > 0 && (
            <div className="mt-5">
              <SectionHeader icon="⚓" title="In Port" count={mooredShips.length} color="slate" />
              <div className="space-y-2.5">
                {mooredShips.map((ship) => (
                  <ShipCard key={ship.mmsi} ship={ship} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Planes column */}
        <section>
          <SectionHeader icon="🐋" title="Beluga Watch" count={planes.length} color="teal" />

          {planes.length === 0 ? (
            <EmptyState
              icon="🐋"
              title="No Belugas nearby"
              sub={`Scanning 280 km for Belugas — none detected right now.${nextCheckIn > 0 ? ` Next scan in ${nextCheckIn}s.` : ''}`}
            />
          ) : (
            <div className="space-y-4">
              {planes.map((plane) => (
                <PlaneCard key={plane.icao24} plane={plane} isNew={newIds.has(plane.icao24)} />
              ))}
            </div>
          )}

          {/* Fleet grid */}
          <div className="mt-6 bg-white rounded-2xl shadow-card p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-muted uppercase tracking-widest">
                Airbus Beluga Fleet
              </div>
              <a
                href={`https://globe.airplanes.live/?icaoFilter=${Object.keys(BELUGA_AIRCRAFT).join(',')}&enableLabels&extendedLabels=2`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-airbus-sky hover:text-airbus-blue transition-colors flex items-center gap-1"
              >
                🗺 Live map
              </a>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              {Object.entries(BELUGA_AIRCRAFT).map(([hex, b]) => {
                const spotted = planes.find((p) => p.registration === b.registration);
                return (
                  <div
                    key={hex}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all ${
                      spotted
                        ? 'border-beluga-teal bg-beluga-pale text-beluga-dark font-bold shadow-beluga/30 shadow-sm'
                        : 'border-gray-100 text-muted/60'
                    }`}
                  >
                    <span className={spotted ? 'text-beluga-teal' : 'text-gray-300'}>
                      {spotted ? '●' : '○'}
                    </span>
                    <span>{b.registration}</span>
                    <span className="ml-auto text-[10px] opacity-60">{b.model}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-4 px-6 text-center">
        <p className="text-xs text-muted/50 font-mono">
          Elbspotter by Alba · AISStream.io · airplanes.live · Hamburg Finkenwerder 🌊
        </p>
      </footer>
    </div>
  );
}
