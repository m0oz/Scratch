import { useCallback, useEffect, useRef, useState } from 'react';
import { ShipData, PlaneData, AppNotification } from './types';
import { useShipTracker } from './hooks/useShipTracker';
import { usePlaneTracker } from './hooks/usePlaneTracker';
import { ShipCard } from './components/ShipCard';
import { PlaneCard } from './components/PlaneCard';
import { NotificationToast } from './components/NotificationToast';
import { SetupModal } from './components/SetupModal';
import { compassLabel } from './utils/distance';

const LS_API_KEY = 'elbewatch_aiskey';
const LS_NOTIF_HISTORY = 'elbewatch_history';

function useAISKey() {
  const [key, setKey] = useState(() => localStorage.getItem(LS_API_KEY) ?? '');
  const save = useCallback((k: string) => {
    setKey(k);
    if (k) localStorage.setItem(LS_API_KEY, k);
    else localStorage.removeItem(LS_API_KEY);
  }, []);
  return [key, save] as const;
}

function StatusDot({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${active ? 'bg-beluga-teal animate-pulse' : 'bg-white/20'}`}/>
      <span className="text-xs text-white/50 font-mono">{label}</span>
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="text-5xl mb-3 opacity-30">{icon}</div>
      <div className="text-white/40 font-semibold text-sm">{title}</div>
      <div className="text-white/25 text-xs mt-1 max-w-xs">{sub}</div>
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

  // Request browser notification permission on load
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
      new Notification(notif.title, {
        body: notif.message,
        icon: notif.type === 'ship' ? '🚢' : '🐋',
        tag: notif.vesselId,
        requireInteraction: false,
      });
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

  const { ships, connected: shipConnected, error: shipError } = useShipTracker(apiKey, handleNewShip);
  const { planes, loading: planeLoading, error: planeError, lastChecked, nextCheckIn } = usePlaneTracker(handleNewPlane);

  const dismissNotif = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, dismissed: true } : n));
      localStorage.setItem(LS_NOTIF_HISTORY, JSON.stringify(next));
      return next;
    });
  }, []);

  const recentHistory = notifications.slice(0, 20);

  return (
    <div className="min-h-screen bg-navy-950 text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotif}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-navy-950/90 backdrop-blur-md border-b border-navy-700">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="text-2xl">🌊</span>
              <span className="absolute -top-1 -right-1 text-xs">✈</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight leading-none">
                <span className="text-airbus-sky">Elbe</span>
                <span className="text-white"> Watch</span>
              </h1>
              <p className="text-xs text-white/40 leading-none mt-0.5 font-mono">53.545°N 9.834°E · Finkenwerder</p>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-4 ml-4">
            <StatusDot active={shipConnected} label={shipConnected ? 'AIS live' : apiKey ? 'AIS connecting…' : 'AIS offline'} />
            <StatusDot active={!planeError} label={planeLoading ? 'Scanning…' : lastChecked ? `Scanned ${Math.round((Date.now() - lastChecked.getTime()) / 60000)}m ago` : 'OpenSky ready'} />
          </div>

          <div className="ml-auto flex items-center gap-4">
            {/* Next plane check countdown */}
            {lastChecked && !planeLoading && (
              <div className="text-xs text-white/30 font-mono hidden sm:block">
                next scan {nextCheckIn}s
              </div>
            )}
            {/* Ship error indicator */}
            {shipError && <span className="text-xs text-red-400 font-mono">{shipError}</span>}
            {planeError && <span className="text-xs text-red-400 font-mono">{planeError}</span>}
            {/* History toggle */}
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="text-xs text-white/40 hover:text-white/70 transition-colors font-mono flex items-center gap-1"
            >
              🕐 {notifications.filter((n) => !n.dismissed).length > 0 && (
                <span className="bg-ship-amber text-navy-950 text-xs font-bold px-1 rounded">
                  {notifications.filter((n) => !n.dismissed).length}
                </span>
              )}
              Log
            </button>
            <SetupModal onSave={saveKey} initialKey={apiKey} />
          </div>
        </div>

        {/* Notification history drawer */}
        {showHistory && (
          <div className="border-t border-navy-700 bg-navy-900/90 px-6 py-3 max-h-48 overflow-y-auto">
            {recentHistory.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-4">No events yet — waiting for vessels…</p>
            ) : (
              <div className="space-y-1">
                {recentHistory.map((n) => (
                  <div key={n.id} className="flex items-start gap-2 text-xs">
                    <span className="shrink-0 text-white/30 font-mono w-12">
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

      {/* Main content */}
      <main className="max-w-[1600px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ships column */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚢</span>
              <h2 className="text-base font-bold text-white">Ships on the Elbe</h2>
            </div>
            {ships.length > 0 && (
              <span className="bg-ship-amber/20 border border-ship-amber/40 text-ship-amber text-xs font-bold px-2 py-0.5 rounded-full">
                {ships.length}
              </span>
            )}
            <div className="ml-auto">
              <StatusDot
                active={shipConnected}
                label={shipConnected ? 'Live AIS' : apiKey ? 'Reconnecting…' : 'No API key'}
              />
            </div>
          </div>

          {!apiKey && (
            <div className="mb-4 bg-ship-amber/10 border border-ship-amber/30 rounded-xl p-4 text-sm">
              <p className="font-semibold text-ship-amber mb-1">Ship tracking needs an AISStream API key</p>
              <p className="text-white/50 text-xs">
                Get a free key at{' '}
                <a href="https://aisstream.io" target="_blank" rel="noopener noreferrer" className="text-airbus-sky hover:underline">
                  aisstream.io
                </a>
                {' '}and enter it via the Setup button above.
              </p>
            </div>
          )}

          {ships.length === 0 ? (
            <div className="border border-navy-700 rounded-xl">
              <EmptyState
                icon="⚓"
                title={apiKey ? 'Watching the Elbe…' : 'Ship tracking offline'}
                sub={apiKey
                  ? 'No large vessels within 4 km right now. You\'ll get a notification the moment one appears!'
                  : 'Enter an AISStream API key to start tracking ships on the Elbe.'}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {ships.map((ship) => (
                <ShipCard key={ship.mmsi} ship={ship} isNew={newIds.has(ship.mmsi)} />
              ))}
            </div>
          )}
        </section>

        {/* Planes column */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐋</span>
              <h2 className="text-base font-bold text-white">Beluga Watch</h2>
            </div>
            {planes.length > 0 && (
              <span className="bg-beluga-teal/20 border border-beluga-teal/40 text-beluga-teal text-xs font-bold px-2 py-0.5 rounded-full">
                {planes.length}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {planeLoading && (
                <span className="text-xs text-white/30 font-mono animate-pulse">scanning…</span>
              )}
              <StatusDot active={!planeError} label="OpenSky" />
            </div>
          </div>

          {planes.length === 0 ? (
            <div className="border border-navy-700 rounded-xl">
              <EmptyState
                icon="🐋"
                title="No Belugas nearby"
                sub={`All 11 Airbus Belugas are accounted for — none within 15 km right now. Scans every 5 minutes.${nextCheckIn > 0 ? ` Next in ${nextCheckIn}s.` : ''}`}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {planes.map((plane) => (
                <PlaneCard key={plane.icao24} plane={plane} isNew={newIds.has(plane.icao24)} />
              ))}
            </div>
          )}

          {/* Beluga fleet at a glance */}
          <div className="mt-6 border border-navy-700 rounded-xl p-4 bg-navy-800/40">
            <div className="text-xs text-white/40 uppercase tracking-wide mb-3 font-semibold">Airbus Beluga Fleet</div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {[
                { reg: 'F-GXLH', name: 'BelugaXL #1', model: 'XL' },
                { reg: 'F-GXLJ', name: 'BelugaXL #2', model: 'XL' },
                { reg: 'F-GXLK', name: 'BelugaXL #3', model: 'XL' },
                { reg: 'F-GXLL', name: 'BelugaXL #4', model: 'XL' },
                { reg: 'F-GXLM', name: 'BelugaXL #5', model: 'XL' },
                { reg: 'F-GXLN', name: 'BelugaXL #6', model: 'XL' },
                { reg: 'F-GSTA', name: 'Beluga ST #1', model: 'ST' },
                { reg: 'F-GSTB', name: 'Beluga ST #2', model: 'ST' },
                { reg: 'F-GSTC', name: 'Beluga ST #3', model: 'ST' },
                { reg: 'F-GSTD', name: 'Beluga ST #4', model: 'ST' },
                { reg: 'F-GSTE', name: 'Beluga ST #5', model: 'ST' },
              ].map((b) => {
                const spotted = planes.find((p) => p.registration === b.reg);
                return (
                  <div
                    key={b.reg}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-colors ${
                      spotted
                        ? 'border-beluga-teal/60 bg-beluga-teal/10 text-beluga-teal'
                        : 'border-navy-600 text-white/30'
                    }`}
                  >
                    <span>{spotted ? '●' : '○'}</span>
                    <span>{b.reg}</span>
                    <span className="ml-auto text-current/60">{b.model}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-700 mt-8 py-4 px-6 text-center">
        <p className="text-xs text-white/20 font-mono">
          Ship data: AISStream.io · Plane data: OpenSky Network · Built for Hamburg Finkenwerder 🌊
        </p>
      </footer>
    </div>
  );
}
