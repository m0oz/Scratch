import { useCallback, useEffect, useRef, useState } from 'react';
import { ShipData, PlaneData, AppNotification } from './types';
import { useShipTracker } from './hooks/useShipTracker';
import { usePlaneTracker } from './hooks/usePlaneTracker';
import { ShipCard } from './components/ShipCard';
import { PlaneCard } from './components/PlaneCard';
import { NotificationToast } from './components/NotificationToast';
import { SetupModal } from './components/SetupModal';
import { compassLabel } from './utils/distance';
import { DEFAULT_AIS_KEY, BELUGA_AIRCRAFT } from './config';

const LS_API_KEY = 'elbspotter_aiskey';
const LS_NOTIF_HISTORY = 'elbspotter_history';

function useAISKey() {
  const [key, setKey] = useState(() => localStorage.getItem(LS_API_KEY) ?? DEFAULT_AIS_KEY);
  const save = useCallback((k: string) => {
    setKey(k);
    if (k) localStorage.setItem(LS_API_KEY, k);
    else localStorage.removeItem(LS_API_KEY);
  }, []);
  return [key, save] as const;
}

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
    <div className="flex items-center gap-3 mb-5">
      <span className="text-2xl">{icon}</span>
      <h2 className="text-lg font-extrabold text-ink">{title}</h2>
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
    <div className="flex flex-col items-center justify-center py-14 text-center px-8
                    bg-white rounded-2xl border-2 border-dashed border-blue-100 shadow-card">
      <div className="text-6xl mb-3">{icon}</div>
      <div className="text-ink font-bold text-sm">{title}</div>
      <div className="text-muted text-xs mt-1.5 max-w-xs leading-relaxed">{sub}</div>
    </div>
  );
}

export default function App() {
  const [apiKey, saveKey] = useAISKey();
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_NOTIF_HISTORY) ?? '[]'); } catch { return []; }
  });
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const notifPermission = useRef<NotificationPermission>('default');
  const [showHistory, setShowHistory] = useState(false);

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

  const handleNewShip = useCallback((ship: ShipData) => {
    const compass = compassLabel(ship.course);
    addNotification({
      id: `ship-${ship.mmsi}-${Date.now()}`,
      type: 'ship',
      title: `${ship.name} spotted on the Elbe!`,
      message: `${ship.typeName} · ${ship.distance.toFixed(1)} km away · ${ship.speed.toFixed(1)} kn heading ${compass}${ship.destination ? ` → ${ship.destination}` : ''}`,
      timestamp: Date.now(),
      vesselId: ship.mmsi,
      dismissed: false,
    });
  }, [addNotification]);

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

  const { ships, mooredShips, connected: shipConnected, error: shipError } = useShipTracker(apiKey, handleNewShip);
  const { planes, loading: planeLoading, error: planeError, lastChecked, nextCheckIn } = usePlaneTracker(handleNewPlane);

  const dismissNotif = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, dismissed: true } : n));
      localStorage.setItem(LS_NOTIF_HISTORY, JSON.stringify(next));
      return next;
    });
  }, []);

  const pendingCount = notifications.filter((n) => !n.dismissed).length;

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <NotificationToast notifications={notifications} onDismiss={dismissNotif} />

      {/* Header — Airbus blue gradient */}
      <header className="sticky top-0 z-40 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #003591 0%, #0090D0 100%)' }}>
        <div className="max-w-[1600px] mx-auto px-5 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mr-2">
              <span className="text-3xl drop-shadow-sm select-none">🌊</span>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white leading-none drop-shadow">
                  Elb<span className="text-yellow-300">spotter</span>
                </h1>
                <p className="text-[10px] text-white/60 leading-none mt-0.5 font-mono">
                  53.545°N 9.834°E · Finkenwerder
                </p>
              </div>
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <Pill
                active={shipConnected}
                label={shipConnected ? 'AIS live' : apiKey ? 'connecting…' : 'AIS offline'}
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
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="relative flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors font-semibold"
              >
                🕐 Log
                {pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-navy-900 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </button>
              <SetupModal onSave={saveKey} initialKey={apiKey} />
            </div>
          </div>
        </div>

        {/* Event log drawer */}
        {showHistory && (
          <div className="border-t border-white/10 bg-navy-900/95 backdrop-blur px-5 py-3 max-h-44 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-3">No events yet — waiting for vessels…</p>
            ) : (
              <div className="space-y-1">
                {notifications.slice(0, 20).map((n) => (
                  <div key={n.id} className="flex items-start gap-2 text-xs">
                    <span className="shrink-0 text-white/30 font-mono w-11">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="shrink-0">{n.type === 'ship' ? '🚢' : '🐋'}</span>
                    <span className="text-white/60 leading-snug">{n.title} — {n.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main */}
      <main className="max-w-[1600px] mx-auto px-4 py-7 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Ships column */}
        <section>
          <SectionHeader icon="🚢" title="Ships on the Elbe" count={ships.length} color="amber" />

          {ships.length === 0 ? (
            <EmptyState
              icon="⚓"
              title={shipConnected ? 'Watching the Elbe…' : 'AIS connecting…'}
              sub="No large vessels passing within 4 km right now. You'll get a notification the moment one appears!"
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
            <div className="mt-8">
              <SectionHeader icon="⚓" title="In Port" count={mooredShips.length} color="slate" />
              <div className="space-y-3">
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
              sub={`All 11 Airbus Belugas are accounted for — none within 15 km right now. Scans every minute.${nextCheckIn > 0 ? ` Next in ${nextCheckIn}s.` : ''}`}
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
          Elbspotter · AISStream.io · airplanes.live · Hamburg Finkenwerder 🌊
        </p>
      </footer>
    </div>
  );
}
