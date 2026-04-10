import { useEffect, useRef, useState } from 'react';
import { PlaneData } from '../types';
import {
  MY_LOCATION,
  PLANE_DETECTION_RADIUS_KM,
  OPENSKY_BBOX,
  OPENSKY_POLL_INTERVAL_MS,
  BELUGA_AIRCRAFT,
  VESSEL_TIMEOUT_MS,
} from '../config';
import { haversineKm } from '../utils/distance';

const OPENSKY_URL = 'https://opensky-network.org/api/states/all';

type StateVector = [
  string,           // 0  icao24
  string | null,    // 1  callsign
  string,           // 2  origin_country
  number | null,    // 3  time_position
  number,           // 4  last_contact
  number | null,    // 5  longitude
  number | null,    // 6  latitude
  number | null,    // 7  baro_altitude
  boolean,          // 8  on_ground
  number | null,    // 9  velocity (m/s)
  number | null,    // 10 true_track
  number | null,    // 11 vertical_rate
  unknown,          // 12 sensors
  number | null,    // 13 geo_altitude
  string | null,    // 14 squawk
  boolean,          // 15 spi
  number,           // 16 position_source
];

export interface UsePlaneTrackerResult {
  planes: PlaneData[];
  loading: boolean;
  error: string | null;
  lastChecked: Date | null;
  nextCheckIn: number; // seconds
}

export function usePlaneTracker(onNewPlane: (plane: PlaneData) => void): UsePlaneTrackerResult {
  const [planes, setPlanes] = useState<Map<string, PlaneData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [nextCheckIn, setNextCheckIn] = useState(0);
  const onNewPlaneRef = useRef(onNewPlane);
  onNewPlaneRef.current = onNewPlane;
  const knownIds = useRef<Set<string>>(new Set());

  const poll = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lamin: String(OPENSKY_BBOX.lamin),
        lomin: String(OPENSKY_BBOX.lomin),
        lamax: String(OPENSKY_BBOX.lamax),
        lomax: String(OPENSKY_BBOX.lomax),
      });
      const res = await fetch(`${OPENSKY_URL}?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { states?: StateVector[] };

      const now = Date.now();
      const found = new Map<string, PlaneData>();

      for (const sv of data.states ?? []) {
        const icao24 = (sv[0] ?? '').toLowerCase();
        const belugaInfo = BELUGA_AIRCRAFT[icao24];
        if (!belugaInfo) continue;

        const lat = sv[6];
        const lon = sv[5];
        if (lat == null || lon == null) continue;

        const distance = haversineKm(MY_LOCATION.lat, MY_LOCATION.lon, lat, lon);
        if (distance > PLANE_DETECTION_RADIUS_KM) continue;

        const isNew = !knownIds.current.has(icao24);
        const plane: PlaneData = {
          icao24,
          callsign: (sv[1] ?? '').trim() || belugaInfo.registration,
          originCountry: sv[2],
          lat,
          lon,
          baroAltitude: sv[7],
          onGround: sv[8],
          velocity: sv[9],
          trueTrack: sv[10],
          verticalRate: sv[11],
          distance,
          belugaModel: belugaInfo.model,
          registration: belugaInfo.registration,
          timestamp: now,
          firstSeen: now, // will be overridden from prev in setPlanes below
          lastSeen: now,
        };
        found.set(icao24, plane);

        if (isNew) {
          knownIds.current.add(icao24);
          setTimeout(() => onNewPlaneRef.current(plane), 0);
        }
      }

      // Remove planes that left the area
      setPlanes((prev) => {
        const cutoff = now - VESSEL_TIMEOUT_MS;
        const next = new Map(prev);
        // merge new sightings, preserving firstSeen from prev
        for (const [id, p] of found) {
          const prevEntry = prev.get(id);
          next.set(id, { ...p, firstSeen: prevEntry?.firstSeen ?? p.firstSeen });
        }
        // evict stale
        for (const [id, p] of next) {
          if (!found.has(id) && p.lastSeen < cutoff) {
            next.delete(id);
            knownIds.current.delete(id);
          }
        }
        return next;
      });

      setLastChecked(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fetch error');
    } finally {
      setLoading(false);
    }
  };

  // Countdown to next check
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastChecked) return;
      const elapsed = Date.now() - lastChecked.getTime();
      const remaining = Math.max(0, Math.round((OPENSKY_POLL_INTERVAL_MS - elapsed) / 1000));
      setNextCheckIn(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastChecked]);

  useEffect(() => {
    poll();
    const timer = setInterval(poll, OPENSKY_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
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
