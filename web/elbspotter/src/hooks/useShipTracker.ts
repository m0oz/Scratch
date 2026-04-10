import { useEffect, useRef, useState, useCallback } from 'react';
import { ShipData } from '../types';
import {
  MY_LOCATION,
  SHIP_DETECTION_RADIUS_KM,
  SHIP_CLOSE_RADIUS_KM,
  MIN_SHIP_LENGTH_M,
  MIN_SHIP_SPEED_KNOTS,
  ELBE_BOUNDING_BOX,
  ELBE_INBOUND_RANGE,
  VESSEL_TIMEOUT_MS,
  MOORED_VESSEL_TIMEOUT_MS,
} from '../config';
import { haversineKm, mmsiToFlag, estimateShipEtaMinutes } from '../utils/distance';
import { formatETA } from '../data/ports';

const AISSTREAM_WS = 'wss://stream.aisstream.io/v0/stream';

function shipTypeName(code: number): string {
  if (code >= 20 && code <= 29) return 'Wing-in-Ground';
  if (code === 30) return 'Fishing Vessel';
  if (code === 31 || code === 32) return 'Towing Vessel';
  if (code === 33) return 'Dredger';
  if (code === 34) return 'Dive Vessel';
  if (code === 35) return 'Military';
  if (code === 36) return 'Sailing Vessel';
  if (code === 37) return 'Pleasure Craft';
  if (code >= 40 && code <= 49) return 'High-Speed Craft';
  if (code === 50) return 'Pilot Vessel';
  if (code === 51) return 'SAR Vessel';
  if (code === 52) return 'Tug';
  if (code === 53) return 'Port Tender';
  if (code === 55) return 'Law Enforcement';
  if (code === 58) return 'Medical Transport';
  if (code === 59) return 'Special Craft';
  if (code === 65) return 'Cruise Ship';
  if (code >= 60 && code <= 69) return 'Passenger Ship';
  if (code >= 75 && code <= 79) return 'Container Ship';
  if (code >= 70 && code <= 74) return 'Cargo Ship';
  if (code >= 80 && code <= 89) return 'Tanker';
  if (code >= 90 && code <= 99) return 'Other';
  return 'Vessel';
}

function shipDirection(course: number, speed: number): 'inbound' | 'outbound' | null {
  if (speed < 1.0) return null;
  const [lo, hi] = ELBE_INBOUND_RANGE;
  return course >= lo && course <= hi ? 'inbound' : 'outbound';
}

interface ShipOpts {
  lat: number;
  lon: number;
  shipCloseKm: number;
  minShipLength: number;
}

const DEFAULT_OPTS: ShipOpts = {
  lat: MY_LOCATION.lat,
  lon: MY_LOCATION.lon,
  shipCloseKm: SHIP_CLOSE_RADIUS_KM,
  minShipLength: MIN_SHIP_LENGTH_M,
};

/** Build a ShipData object from position + static cache data. */
function buildShipData(
  mmsi: string, name: string,
  pos: { lat: number; lon: number; speed: number; course: number; distance: number },
  cached: Partial<ShipData>,
  shipType: number,
  existing?: ShipData,
): ShipData {
  const { emoji, country } = mmsiToFlag(mmsi);
  const now = Date.now();
  return {
    mmsi,
    name: name || 'Unknown Vessel',
    shipType: cached.shipType ?? shipType,
    typeName: cached.typeName ?? shipTypeName(cached.shipType ?? shipType),
    flagEmoji: emoji,
    flagCountry: country,
    speed: pos.speed,
    course: pos.course,
    lat: pos.lat,
    lon: pos.lon,
    destination: cached.destination ?? '',
    length: cached.length,
    width: cached.width,
    etaText: cached.etaText,
    distance: pos.distance,
    timestamp: now,
    firstSeen: existing?.firstSeen ?? now,
    lastSeen: now,
    moored: pos.speed < MIN_SHIP_SPEED_KNOTS,
    direction: shipDirection(pos.course, pos.speed),
    passEtaMinutes: estimateShipEtaMinutes(pos.distance, pos.speed),
  };
}

export interface UseShipTrackerResult {
  ships: ShipData[];
  mooredShips: ShipData[];
  connected: boolean;
  error: string | null;
  reconnect: () => void;
}

export function useShipTracker(
  apiKey: string,
  opts: ShipOpts = DEFAULT_OPTS,
): UseShipTrackerResult {
  const [ships, setShips] = useState<Map<string, ShipData>>(new Map());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const staticCache = useRef<Map<string, Partial<ShipData>>>(new Map());
  // Positions for ships not yet confirmed large — promotes when static data arrives
  const positionCache = useRef<Map<string, { lat: number; lon: number; speed: number; course: number; distance: number; name: string; shipType: number }>>(new Map());
  const closeNotified = useRef<Set<string>>(new Set());
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const shouldReconnect = useRef(true);

  const connect = useCallback(() => {
    if (!apiKey) return;
    const prev = wsRef.current;
    if (prev && (prev.readyState === WebSocket.CONNECTING || prev.readyState === WebSocket.OPEN)) {
      prev.onclose = null;
      prev.close();
    }

    const ws = new WebSocket(AISSTREAM_WS);
    wsRef.current = ws;

    ws.onopen = () => {
      if (ws !== wsRef.current) return;
      setConnected(true);
      setError(null);
      ws.send(JSON.stringify({
        APIKey: apiKey,
        BoundingBoxes: [ELBE_BOUNDING_BOX],
        FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
      }));
    };

    ws.onmessage = async (event: MessageEvent) => {
      try {
        const raw = event.data;
        const text = typeof raw === 'string' ? raw : await (raw as Blob).text();
        handleMessage(JSON.parse(text));
      } catch { /* ignore */ }
    };

    ws.onerror = () => { if (ws === wsRef.current) setError('WebSocket connection error'); };
    ws.onclose = () => {
      if (ws !== wsRef.current) return;
      setConnected(false);
      if (shouldReconnect.current && apiKey) {
        reconnectTimer.current = setTimeout(connect, 15000);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const handleMessage = (msg: Record<string, unknown>) => {
    const type = msg.MessageType as string;
    const meta = msg.MetaData as Record<string, unknown>;
    const message = msg.Message as Record<string, unknown>;
    if (!meta || !message) return;
    const mmsi = String(meta.MMSI ?? '');
    if (!mmsi) return;
    const shipName = ((meta.ShipName as string) ?? '').trim();

    // --- ShipStaticData: cache dimensions, promote ship if large enough ---
    if (type === 'ShipStaticData') {
      const s = message.ShipStaticData as Record<string, unknown>;
      const dim = s.Dimension as Record<string, number> | undefined;
      const length = dim ? (dim.A ?? 0) + (dim.B ?? 0) : undefined;
      staticCache.current.set(mmsi, {
        ...staticCache.current.get(mmsi),
        shipType: (s.Type as number) ?? 0,
        typeName: shipTypeName((s.Type as number) ?? 0),
        destination: ((s.Destination as string) ?? '').trim(),
        length,
        width: dim ? (dim.C ?? 0) + (dim.D ?? 0) : undefined,
        etaText: formatETA(s.Eta as { Day?: number; Month?: number; Hour?: number; Minute?: number } | undefined) ?? undefined,
      });

      const cached = staticCache.current.get(mmsi)!;
      const isLarge = length != null && length >= opts.minShipLength;

      setShips((prev) => {
        const existing = prev.get(mmsi);
        if (existing) {
          const next = new Map(prev);
          if (!isLarge) { next.delete(mmsi); } else { next.set(mmsi, { ...existing, ...cached } as ShipData); }
          return next;
        }
        // Promote from position cache
        if (!isLarge) return prev;
        const pos = positionCache.current.get(mmsi);
        if (!pos) return prev;
        const ship = buildShipData(mmsi, pos.name || shipName, pos, cached, pos.shipType);
        const next = new Map(prev);
        next.set(mmsi, ship);
        return next;
      });
      return;
    }

    // --- PositionReport ---
    if (type !== 'PositionReport') return;
    const pos = message.PositionReport as Record<string, unknown>;
    const lat = (meta.latitude ?? pos.Latitude) as number;
    const lon = (meta.longitude ?? pos.Longitude) as number;
    const speed = (pos.Sog as number) ?? 0;
    const course = (pos.Cog as number) ?? 0;
    const shipType = (pos.ShipType as number) ?? 0;
    if (!lat || !lon) return;

    const distance = haversineKm(opts.lat, opts.lon, lat, lon);
    if (distance > SHIP_DETECTION_RADIUS_KM) return;

    // Cache position for all ships in range (before length filter)
    positionCache.current.set(mmsi, { lat, lon, speed, course, distance, name: shipName, shipType });

    const cached = staticCache.current.get(mmsi) ?? {};
    if (!cached.length || cached.length < opts.minShipLength) return;

    setShips((prev) => {
      const existing = prev.get(mmsi);
      const updated = buildShipData(
        mmsi, shipName, { lat, lon, speed, course, distance },
        cached, shipType, existing,
      );
      const next = new Map(prev);
      next.set(mmsi, updated);

      // Close-range notification
      if (opts.shipCloseKm > 0 && distance <= opts.shipCloseKm && !closeNotified.current.has(mmsi)) {
        closeNotified.current.add(mmsi);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`${updated.name} is right next to you!`, {
            body: `${updated.typeName}${updated.length ? ` · ${updated.length} m` : ''} · ${(distance * 1000).toFixed(0)} m away`,
            tag: `close-${mmsi}`,
          });
        }
      }
      return next;
    });
  };

  // Cleanup stale ships
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const movingCutoff = now - VESSEL_TIMEOUT_MS;
      const mooredCutoff = now - MOORED_VESSEL_TIMEOUT_MS;
      setShips((prev) => {
        const next = new Map(prev);
        for (const [mmsi, ship] of prev) {
          if (ship.lastSeen < (ship.moored ? mooredCutoff : movingCutoff)) next.delete(mmsi);
        }
        return next.size === prev.size ? prev : next;
      });
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    shouldReconnect.current = true;
    connect();
    return () => {
      shouldReconnect.current = false;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [apiKey, connect]);

  const allShips = Array.from(ships.values());
  return {
    ships: allShips.filter((s) => !s.moored).sort((a, b) => a.distance - b.distance),
    mooredShips: allShips.filter((s) => s.moored).sort((a, b) => a.distance - b.distance),
    connected,
    error,
    reconnect: connect,
  };
}
