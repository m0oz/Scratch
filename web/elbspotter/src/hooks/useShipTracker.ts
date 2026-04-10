import { useEffect, useRef, useState, useCallback } from 'react';
import { ShipData } from '../types';
import {
  MY_LOCATION,
  SHIP_DETECTION_RADIUS_KM,
  INTERESTING_SHIP_TYPES,
  MIN_SHIP_SPEED_KNOTS,
  ELBE_BOUNDING_BOX,
  VESSEL_TIMEOUT_MS,
  MOORED_VESSEL_TIMEOUT_MS,
} from '../config';
import { haversineKm, mmsiToFlag } from '../utils/distance';
import { formatETA } from '../data/ports';

const AISSTREAM_WS = 'wss://stream.aisstream.io/v0/stream';

const SHIP_TYPE_NAMES: Record<number, string> = {
  60: 'Passenger Ship', 61: 'Passenger Ship', 62: 'Passenger Ship',
  63: 'Passenger Ship', 64: 'Passenger Ship', 65: 'Cruise Ship',
  66: 'Passenger Ship', 67: 'Passenger Ship', 68: 'Passenger Ship', 69: 'Passenger Ship',
  70: 'Cargo Ship', 71: 'Cargo Ship', 72: 'Cargo Ship',
  73: 'Cargo Ship', 74: 'Cargo Ship', 75: 'Container Ship',
  76: 'Container Ship', 77: 'Container Ship', 78: 'Container Ship', 79: 'Container Ship',
  80: 'Tanker', 81: 'Tanker', 82: 'Tanker',
  83: 'Tanker', 84: 'Tanker', 85: 'Tanker',
  86: 'Tanker', 87: 'Tanker', 88: 'Tanker', 89: 'Tanker',
};

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
): UseShipTrackerResult {
  const [ships, setShips] = useState<Map<string, ShipData>>(new Map());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const onNewShipRef = useRef(onNewShip);
  onNewShipRef.current = onNewShip;
  // Static data cache (name, type, dimensions come separately)
  const staticCache = useRef<Map<string, Partial<ShipData>>>(new Map());
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const shouldReconnect = useRef(true);

  const connect = useCallback(() => {
    if (!apiKey || wsRef.current?.readyState === WebSocket.CONNECTING) return;
    wsRef.current?.close();

    const ws = new WebSocket(AISSTREAM_WS);
    wsRef.current = ws;

    ws.onopen = () => {
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

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string);
        handleMessage(msg);
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      setConnected(false);
      if (shouldReconnect.current && apiKey) {
        reconnectTimer.current = setTimeout(connect, 8000);
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
      const existing = staticCache.current.get(mmsi) ?? {};
      staticCache.current.set(mmsi, {
        ...existing,
        shipType: (s.Type as number) ?? 0,
        typeName: SHIP_TYPE_NAMES[(s.Type as number) ?? 0] ?? 'Vessel',
        destination: ((s.Destination as string) ?? '').trim(),
        callSign: s.CallSign as string,
        imoNumber: s.ImoNumber as number,
        length: dim ? (dim.A ?? 0) + (dim.B ?? 0) : undefined,
        width: dim ? (dim.C ?? 0) + (dim.D ?? 0) : undefined,
        draught: s.MaximumStaticDraught as number,
        etaText: formatETA(s.Eta as { Day?: number; Month?: number; Hour?: number; Minute?: number } | undefined) ?? undefined,
      });
      // Update existing ship entry if present
      setShips((prev) => {
        const existing = prev.get(mmsi);
        if (!existing) return prev;
        const next = new Map(prev);
        next.set(mmsi, { ...existing, ...staticCache.current.get(mmsi) } as ShipData);
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

    const distance = haversineKm(MY_LOCATION.lat, MY_LOCATION.lon, lat, lon);
    if (distance > SHIP_DETECTION_RADIUS_KM) return;

    const cached = staticCache.current.get(mmsi) ?? {};
    const resolvedType = cached.shipType ?? shipType ?? 0;
    if (resolvedType !== 0 && !INTERESTING_SHIP_TYPES.has(resolvedType)) return;

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
        typeName: cached.typeName ?? SHIP_TYPE_NAMES[resolvedType] ?? 'Vessel',
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
        // New moving ship in range — notify
        setTimeout(() => onNewShipRef.current(updated), 0);
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
