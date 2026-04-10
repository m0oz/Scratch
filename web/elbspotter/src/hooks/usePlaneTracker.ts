import { useEffect, useRef, useState } from 'react';
import { PlaneData } from '../types';
import {
  MY_LOCATION,
  PLANE_DETECTION_RADIUS_KM,
  ADSB_RADIUS_NM,
  BELUGA_AIRCRAFT,
  VESSEL_TIMEOUT_MS,
  LOW_ALTITUDE_THRESHOLD_M,
} from '../config';

const POLL_SLOW_MS = 5 * 60 * 1000;  // 5 min — no Beluga nearby
const POLL_FAST_MS = 60 * 1000;       // 1 min — Beluga within 10 km
const NEARBY_THRESHOLD_KM = 10;
import { haversineKm } from '../utils/distance';

// airplanes.live: community ADS-B network, native CORS support, no API key needed.
// Endpoint: /v2/point/LAT/LON/RADIUS_NM
// Response units: altitude = feet, speed = knots, vertical rate = ft/min.
// We convert to metres/m-per-s internally so PlaneCard display code stays unchanged.
function adsbUrl(lat: number, lon: number) {
  return `https://api.airplanes.live/v2/point/${lat}/${lon}/${ADSB_RADIUS_NM}`;
}

interface AdsbAircraft {
  hex: string;               // ICAO24 lowercase
  flight?: string;           // callsign, may have trailing spaces
  r?: string;                // registration
  lat?: number;
  lon?: number;
  alt_baro?: number | 'ground'; // feet, or literal "ground"
  gs?: number;               // ground speed, knots
  track?: number;            // true track, degrees
  baro_rate?: number;        // vertical rate, ft/min
  on_ground?: boolean;
}

export interface UsePlaneTrackerResult {
  planes: PlaneData[];
  loading: boolean;
  error: string | null;
  lastChecked: Date | null;
  nextCheckIn: number; // seconds
}

export function usePlaneTracker(
  onNewPlane: (plane: PlaneData) => void,
  opts: { lat: number; lon: number; belugaCloseKm: number } = { lat: MY_LOCATION.lat, lon: MY_LOCATION.lon, belugaCloseKm: 2.0 },
): UsePlaneTrackerResult {
  const [planes, setPlanes] = useState<Map<string, PlaneData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [nextCheckIn, setNextCheckIn] = useState(0);
  const onNewPlaneRef = useRef(onNewPlane);
  onNewPlaneRef.current = onNewPlane;
  const knownIds = useRef<Set<string>>(new Set());
  const landingNotified = useRef<Set<string>>(new Set());
  const belugaNearby = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout>>();

  const poll = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(adsbUrl(opts.lat, opts.lon));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { ac?: AdsbAircraft[] };

      const now = Date.now();
      const found = new Map<string, PlaneData>();

      for (const ac of data.ac ?? []) {
        const icao24 = (ac.hex ?? '').toLowerCase();
        const belugaInfo = BELUGA_AIRCRAFT[icao24];
        if (!belugaInfo) continue;

        const lat = ac.lat;
        const lon = ac.lon;
        if (lat == null || lon == null) continue;

        const distance = haversineKm(opts.lat, opts.lon, lat, lon);
        if (distance > PLANE_DETECTION_RADIUS_KM) continue;

        const onGround = ac.on_ground === true || ac.alt_baro === 'ground';
        const altFt = typeof ac.alt_baro === 'number' ? ac.alt_baro : null;

        const isNew = !knownIds.current.has(ac.hex?.toLowerCase() ?? icao24);
        const plane: PlaneData = {
          icao24: ac.hex?.toLowerCase() ?? icao24,
          callsign: (ac.flight ?? '').trim() || belugaInfo.registration,
          originCountry: 'France',
          lat,
          lon,
          // Convert to the units PlaneData/PlaneCard expect (metres, m/s)
          baroAltitude: altFt != null ? altFt * 0.3048 : null,
          onGround,
          velocity: ac.gs != null ? ac.gs / 1.944 : null,           // knots → m/s
          trueTrack: ac.track ?? null,
          verticalRate: ac.baro_rate != null ? ac.baro_rate / 196.85 : null, // ft/min → m/s
          distance,
          belugaModel: belugaInfo.model,
          registration: belugaInfo.registration,
          timestamp: now,
          firstSeen: now, // preserved from prev inside setPlanes below
          lastSeen: now,
        };
        found.set(plane.icao24, plane);

        if (isNew) {
          knownIds.current.add(plane.icao24);
          setTimeout(() => onNewPlaneRef.current(plane), 0);
        }

        // Beluga landing notification
        const isLanding = opts.belugaCloseKm > 0 && distance <= opts.belugaCloseKm && (
          onGround ||
          (plane.baroAltitude != null && plane.baroAltitude < LOW_ALTITUDE_THRESHOLD_M) ||
          (plane.verticalRate != null && plane.verticalRate < -1)
        );
        if (isLanding && !landingNotified.current.has(plane.icao24)) {
          landingNotified.current.add(plane.icao24);
          if ('Notification' in window && Notification.permission === 'granted') {
            const alt = plane.baroAltitude != null ? `${Math.round(plane.baroAltitude * 3.281).toLocaleString()} ft` : '';
            new Notification(`Beluga ${plane.belugaModel} landing nearby!`, {
              body: `${plane.registration} · ${distance.toFixed(1)} km away${alt ? ` · ${alt}` : onGround ? ' · on the ground' : ''}`,
              tag: `beluga-landing-${plane.icao24}`,
            });
          }
        }
      }

      setPlanes((prev) => {
        const cutoff = now - VESSEL_TIMEOUT_MS;
        const next = new Map(prev);
        for (const [id, p] of found) {
          const prevEntry = prev.get(id);
          next.set(id, { ...p, firstSeen: prevEntry?.firstSeen ?? p.firstSeen });
        }
        for (const [id, p] of next) {
          if (!found.has(id) && p.lastSeen < cutoff) {
            next.delete(id);
            knownIds.current.delete(id);
          }
        }
        return next;
      });

      // Check if any Beluga is within 10 km — switch to fast polling
      const anyNearby = [...found.values()].some((p) => p.distance <= NEARBY_THRESHOLD_KM);
      belugaNearby.current = anyNearby;

      setLastChecked(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fetch error');
    } finally {
      setLoading(false);
    }
  };

  // Schedule next poll with dynamic interval
  const scheduleNext = useCallback(() => {
    clearTimeout(pollTimer.current);
    const interval = belugaNearby.current ? POLL_FAST_MS : POLL_SLOW_MS;
    pollTimer.current = setTimeout(async () => {
      await poll();
      scheduleNext();
    }, interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown to next poll
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastChecked) return;
      const elapsed = Date.now() - lastChecked.getTime();
      const pollMs = belugaNearby.current ? POLL_FAST_MS : POLL_SLOW_MS;
      setNextCheckIn(Math.max(0, Math.round((pollMs - elapsed) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastChecked]);

  useEffect(() => {
    poll().then(scheduleNext);
    return () => clearTimeout(pollTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    planes: Array.from(planes.values()).sort((a, b) => a.distance - b.distance),
    loading,
    error,
    lastChecked,
    nextCheckIn,
  };
}
