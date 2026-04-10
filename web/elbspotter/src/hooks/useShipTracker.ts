import { useEffect, useRef, useState, useCallback } from 'react';
import { ShipData } from '../types';
import {
  MY_LOCATION,
  SHIP_DETECTION_RADIUS_KM,
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
        typeName: shipTypeName((s.Type as number) ?? 0),
        destination: ((s.Destination as string) ?? '').trim(),
        callSign: s.CallSign as string,
        imoNumber: s.ImoNumber as number,
        length: dim ? (dim.A ?? 0) + (dim.B ?? 0) : undefined,
        width: dim ? (dim.C ?? 0) + (dim.D ?? 0) : undefined,
        draught: s.MaximumStaticDraught as number,
        etaText: formatETA(s.Eta as { Day?: number; Month?: number; Hour?: number; Minute?: number } | undefined) ?? undefined,
      });
      // Update or remove existing ship based on confirmed length
      const cachedData = staticCache.current.get(mmsi);
      setShips((prev) => {
        const existing = prev.get(mmsi);
        if (!existing) return prev;
        const next = new Map(prev);
        const confirmedLength = cachedData?.length;
        if (confirmedLength != null && confirmedLength < MIN_SHIP_LENGTH_M) {
          // Too small — remove from display
          next.delete(mmsi);
        } else {
          next.set(mmsi, { ...existing, ...cachedData } as ShipData);
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

    const distance = haversineKm(MY_LOCATION.lat, MY_LOCATION.lon, lat, lon);
    if (distance > SHIP_DETECTION_RADIUS_KM) return;

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
