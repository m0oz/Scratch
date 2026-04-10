import { useEffect, useRef, useState, useCallback } from 'react';
import { ShipData } from '../types';
import {
  MY_LOCATION,
  SHIP_DETECTION_RADIUS_KM,
  SHIP_CLOSE_RADIUS_KM,
  MIN_SHIP_LENGTH_M,
  MIN_SHIP_SPEED_KNOTS,
  ELBE_BOUNDING_BOX,
  VESSEL_TIMEOUT_MS,
  MOORED_VESSEL_TIMEOUT_MS,
} from '../config';
import { haversineKm, mmsiToFlag } from '../utils/distance';
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

export interface UseShipTrackerResult {
  ships: ShipData[];
  mooredShips: ShipData[];
  connected: boolean;
  error: string | null;
  reconnect: () => void;
}

export function useShipTracker(
  apiKey: string,
  onNewShip: (ship: ShipData) => void,
  opts: { lat: number; lon: number; shipCloseKm: number } = { lat: MY_LOCATION.lat, lon: MY_LOCATION.lon, shipCloseKm: SHIP_CLOSE_RADIUS_KM },
): UseShipTrackerResult {
  const [ships, setShips] = useState<Map<string, ShipData>>(new Map());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const onNewShipRef = useRef(onNewShip);
  onNewShipRef.current = onNewShip;
  // Static data cache (name, type, dimensions come separately)
  const staticCache = useRef<Map<string, Partial<ShipData>>>(new Map());
  // Position cache — stores last position for ships not yet confirmed large
  const positionCache = useRef<Map<string, { lat: number; lon: number; speed: number; course: number; heading?: number; distance: number; name: string; shipType: number; timestamp: number }>>(new Map());
  // Track which ships already triggered a close-range notification
  const closeNotified = useRef<Set<string>>(new Set());
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const shouldReconnect = useRef(true);

  const connect = useCallback(() => {
    if (!apiKey) return;
    // Close any existing connection cleanly
    const prev = wsRef.current;
    if (prev) {
      if (prev.readyState === WebSocket.CONNECTING || prev.readyState === WebSocket.OPEN) {
        prev.onclose = null; // prevent triggering reconnect from intentional close
        prev.close();
      }
    }

    const ws = new WebSocket(AISSTREAM_WS);
    wsRef.current = ws;

    ws.onopen = () => {
      if (ws !== wsRef.current) return; // stale connection (strict mode)
      setConnected(true);
      setError(null);
      ws.send(
        JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: [ELBE_BOUNDING_BOX],
          FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
        }),
      );
    };

    ws.onmessage = async (event: MessageEvent) => {
      try {
        const raw = event.data;
        const text = typeof raw === 'string' ? raw : await (raw as Blob).text();
        const msg = JSON.parse(text);
        handleMessage(msg);
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      if (ws !== wsRef.current) return;
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      if (ws !== wsRef.current) return; // stale connection, ignore
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

    if (type === 'ShipStaticData') {
      const s = message.ShipStaticData as Record<string, unknown>;
      const dim = s.Dimension as Record<string, number> | undefined;
      const prev = staticCache.current.get(mmsi) ?? {};
      const length = dim ? (dim.A ?? 0) + (dim.B ?? 0) : undefined;
      staticCache.current.set(mmsi, {
        ...prev,
        shipType: (s.Type as number) ?? 0,
        typeName: shipTypeName((s.Type as number) ?? 0),
        destination: ((s.Destination as string) ?? '').trim(),
        callSign: s.CallSign as string,
        imoNumber: s.ImoNumber as number,
        length,
        width: dim ? (dim.C ?? 0) + (dim.D ?? 0) : undefined,
        draught: s.MaximumStaticDraught as number,
        etaText: formatETA(s.Eta as { Day?: number; Month?: number; Hour?: number; Minute?: number } | undefined) ?? undefined,
      });
      const cached = staticCache.current.get(mmsi)!;
      const isLargeEnough = length != null && length >= MIN_SHIP_LENGTH_M;

      setShips((prevShips) => {
        const existingShip = prevShips.get(mmsi);

        // Ship already in display — update or remove
        if (existingShip) {
          const next = new Map(prevShips);
          if (!isLargeEnough) {
            next.delete(mmsi);
          } else {
            next.set(mmsi, { ...existingShip, ...cached } as ShipData);
          }
          return next;
        }

        // Ship not yet in display — promote from position cache if large enough
        if (!isLargeEnough) return prevShips;
        const pos = positionCache.current.get(mmsi);
        if (!pos) return prevShips;

        const { emoji, country } = mmsiToFlag(mmsi);
        const now = Date.now();
        const isMoored = pos.speed < MIN_SHIP_SPEED_KNOTS;
        const ship: ShipData = {
          mmsi,
          name: pos.name || ((meta.ShipName as string) ?? '').trim() || 'Unknown Vessel',
          shipType: cached.shipType ?? pos.shipType ?? 0,
          typeName: cached.typeName ?? shipTypeName(cached.shipType ?? pos.shipType ?? 0),
          flagEmoji: emoji,
          flagCountry: country,
          speed: pos.speed,
          course: pos.course,
          heading: pos.heading,
          lat: pos.lat,
          lon: pos.lon,
          destination: cached.destination ?? '',
          callSign: cached.callSign,
          imoNumber: cached.imoNumber,
          length: cached.length,
          width: cached.width,
          draught: cached.draught,
          etaText: cached.etaText,
          distance: pos.distance,
          timestamp: now,
          firstSeen: now,
          lastSeen: now,
          moored: isMoored,
        };
        const next = new Map(prevShips);
        next.set(mmsi, ship);
        if (!isMoored) {
          setTimeout(() => onNewShipRef.current(ship), 0);
        }
        return next;
      });
      return;
    }

    if (type !== 'PositionReport') return;

    const pos = message.PositionReport as Record<string, unknown>;
    const lat = (meta.latitude ?? pos.Latitude) as number;
    const lon = (meta.longitude ?? pos.Longitude) as number;
    const speed = pos.Sog as number;
    const course = pos.Cog as number;
    const shipType = pos.ShipType as number | undefined;

    if (!lat || !lon) return;

    const distance = haversineKm(opts.lat, opts.lon, lat, lon);
    if (distance > SHIP_DETECTION_RADIUS_KM) return;

    // Always cache position — so when ShipStaticData confirms length, we can promote
    positionCache.current.set(mmsi, {
      lat, lon, speed: speed ?? 0, course: course ?? 0,
      heading: pos.TrueHeading as number | undefined,
      distance, name: ((meta.ShipName as string) ?? '').trim(),
      shipType: shipType ?? 0, timestamp: Date.now(),
    });

    const cached = staticCache.current.get(mmsi) ?? {};
    const resolvedType = cached.shipType ?? shipType ?? 0;
    // Only show ships with confirmed length >= 150m
    if (!cached.length || cached.length < MIN_SHIP_LENGTH_M) return;

    const isMoored = (speed ?? 0) < MIN_SHIP_SPEED_KNOTS;
    const { emoji, country } = mmsiToFlag(mmsi);
    const now = Date.now();

    setShips((prev) => {
      const existing = prev.get(mmsi);
      const next = new Map(prev);
      const updated: ShipData = {
        mmsi,
        name: ((meta.ShipName as string) ?? '').trim() || 'Unknown Vessel',
        shipType: resolvedType,
        typeName: cached.typeName ?? shipTypeName(resolvedType),
        flagEmoji: emoji,
        flagCountry: country,
        speed: speed ?? 0,
        course: course ?? 0,
        heading: pos.TrueHeading as number | undefined,
        lat,
        lon,
        destination: cached.destination ?? '',
        callSign: cached.callSign,
        imoNumber: cached.imoNumber,
        length: cached.length,
        width: cached.width,
        draught: cached.draught,
        etaText: cached.etaText,
        distance,
        timestamp: now,
        firstSeen: existing?.firstSeen ?? now,
        lastSeen: now,
        moored: isMoored,
      };
      next.set(mmsi, updated);

      if (!existing && !isMoored) {
        // New moving ship in range
        setTimeout(() => onNewShipRef.current(updated), 0);
      }

      // Close-range notification — fires once per ship
      if (opts.shipCloseKm > 0 && distance <= opts.shipCloseKm && !closeNotified.current.has(mmsi)) {
        closeNotified.current.add(mmsi);
        const name = updated.name;
        const len = updated.length ? `${updated.length} m` : '';
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`${name} is right next to you!`, {
            body: `${updated.typeName}${len ? ` · ${len}` : ''} · ${(distance * 1000).toFixed(0)} m away`,
            tag: `close-${mmsi}`,
          });
        }
      }

      return next;
    });
  };

  // Cleanup stale ships (moored ships get a longer grace period)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const movingCutoff = now - VESSEL_TIMEOUT_MS;
      const mooredCutoff = now - MOORED_VESSEL_TIMEOUT_MS;
      setShips((prev) => {
        const next = new Map(prev);
        for (const [mmsi, ship] of prev) {
          const cutoff = ship.moored ? mooredCutoff : movingCutoff;
          if (ship.lastSeen < cutoff) next.delete(mmsi);
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
