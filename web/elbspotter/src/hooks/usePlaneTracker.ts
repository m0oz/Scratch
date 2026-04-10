import { useCallback, useEffect, useRef, useState } from 'react';
import { PlaneData } from '../types';
import {
  MY_LOCATION,
  PLANE_DETECTION_RADIUS_KM,
  ADSB_RADIUS_NM,
  BELUGA_AIRCRAFT,
  VESSEL_TIMEOUT_MS,
  LOW_ALTITUDE_THRESHOLD_M,
  FINKENWERDER,
  INBOUND_BEARING_TOLERANCE_DEG,
  ETA_NOTIFICATION_MINUTES,
} from '../config';
import { haversineKm, isHeadingToward, estimateEtaMinutes } from '../utils/distance';

const POLL_SLOW_MS = 5 * 60 * 1000;  // 5 min — no Beluga in range
const POLL_FAST_MS = 60 * 1000;       // 1 min — Beluga detected or inbound
const NEARBY_THRESHOLD_KM = 10;

function adsbUrl(lat: number, lon: number) {
  return `https://api.airplanes.live/v2/point/${lat}/${lon}/${ADSB_RADIUS_NM}`;
}

interface AdsbAircraft {
  hex: string;
  flight?: string;
  lat?: number;
  lon?: number;
  alt_baro?: number | 'ground';
  gs?: number;
  track?: number;
  baro_rate?: number;
  on_ground?: boolean;
}

interface PlaneOpts {
  lat: number;
  lon: number;
  belugaCloseKm: number;
}

const DEFAULT_OPTS: PlaneOpts = { lat: MY_LOCATION.lat, lon: MY_LOCATION.lon, belugaCloseKm: 2.0 };

export interface UsePlaneTrackerResult {
  planes: PlaneData[];
  loading: boolean;
  error: string | null;
  lastChecked: Date | null;
  nextCheckIn: number;
}

export function usePlaneTracker(opts: PlaneOpts = DEFAULT_OPTS): UsePlaneTrackerResult {
  const [planes, setPlanes] = useState<Map<string, PlaneData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [nextCheckIn, setNextCheckIn] = useState(0);
  const knownIds = useRef<Set<string>>(new Set());
  const landingNotified = useRef<Set<string>>(new Set());
  const etaNotified = useRef<Set<string>>(new Set());
  const belugaNearby = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout>>();

  function currentPollMs() {
    return belugaNearby.current ? POLL_FAST_MS : POLL_SLOW_MS;
  }

  function notify(title: string, body: string, tag: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, tag });
    }
  }

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
        const velocityMs = ac.gs != null ? ac.gs / 1.944 : null;
        const distToFink = haversineKm(FINKENWERDER.lat, FINKENWERDER.lon, lat, lon);
        const inbound = !onGround && ac.track != null && ac.gs != null && ac.gs > 50 &&
          isHeadingToward(lat, lon, ac.track, FINKENWERDER.lat, FINKENWERDER.lon, INBOUND_BEARING_TOLERANCE_DEG);
        const eta = inbound ? estimateEtaMinutes(distToFink, velocityMs) : null;

        const plane: PlaneData = {
          icao24,
          callsign: (ac.flight ?? '').trim() || belugaInfo.registration,
          lat, lon,
          baroAltitude: altFt != null ? altFt * 0.3048 : null,
          onGround,
          velocity: velocityMs,
          trueTrack: ac.track ?? null,
          verticalRate: ac.baro_rate != null ? ac.baro_rate / 196.85 : null,
          distance,
          belugaModel: belugaInfo.model,
          registration: belugaInfo.registration,
          timestamp: now,
          firstSeen: now,
          lastSeen: now,
          isInbound: inbound,
          etaMinutes: eta,
          distanceToFinkenwerder: distToFink,
        };
        found.set(icao24, plane);

        // Landing notification
        const isLanding = opts.belugaCloseKm > 0 && distance <= opts.belugaCloseKm && (
          onGround ||
          (plane.baroAltitude != null && plane.baroAltitude < LOW_ALTITUDE_THRESHOLD_M) ||
          (plane.verticalRate != null && plane.verticalRate < -1)
        );
        if (isLanding && !landingNotified.current.has(icao24)) {
          landingNotified.current.add(icao24);
          const alt = plane.baroAltitude != null ? `${Math.round(plane.baroAltitude * 3.281).toLocaleString()} ft` : '';
          notify(
            `Beluga ${plane.belugaModel} landing nearby!`,
            `${plane.registration} · ${distance.toFixed(1)} km away${alt ? ` · ${alt}` : onGround ? ' · on the ground' : ''}`,
            `beluga-landing-${icao24}`,
          );
        }

        // ETA notification — ~5 minutes before arrival
        if (eta != null && eta <= ETA_NOTIFICATION_MINUTES && !etaNotified.current.has(icao24)) {
          etaNotified.current.add(icao24);
          notify(
            `Beluga ${plane.belugaModel} arriving in ~${Math.round(eta)} min!`,
            `${plane.registration} · ${Math.round(distToFink)} km from Finkenwerder`,
            `beluga-eta-${icao24}`,
          );
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
            landingNotified.current.delete(id);
            etaNotified.current.delete(id);
          }
        }
        return next;
      });

      belugaNearby.current = [...found.values()].some((p) => p.distance <= NEARBY_THRESHOLD_KM || p.isInbound);
      setLastChecked(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fetch error');
    } finally {
      setLoading(false);
    }
  };

  const scheduleNext = useCallback(() => {
    clearTimeout(pollTimer.current);
    pollTimer.current = setTimeout(async () => {
      await poll();
      scheduleNext();
    }, currentPollMs());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastChecked) return;
      const elapsed = Date.now() - lastChecked.getTime();
      setNextCheckIn(Math.max(0, Math.round((currentPollMs() - elapsed) / 1000)));
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
