// Pre-configured AISStream key (public AIS data — free tier)
export const DEFAULT_AIS_KEY = '1cfbd243411f5be686acec93819c447ed53513db';

export const MY_LOCATION = {
  lat: 53.5453971,
  lon: 9.8344917,
  label: 'Finkenwerder, Hamburg',
};

// Detection radii
export const SHIP_DETECTION_RADIUS_KM = 4.0;
export const PLANE_DETECTION_RADIUS_KM = 15.0;

// AIS bounding box around the Elbe between Hamburg and the sea
export const ELBE_BOUNDING_BOX = [
  [53.35, 8.8],  // SW [lat, lon]
  [53.70, 10.2], // NE [lat, lon]
];

// OpenSky bounding box
export const OPENSKY_BBOX = {
  lamin: 53.35,
  lomin: 8.8,
  lamax: 53.70,
  lomax: 10.2,
};

// Ship types to track (AIS type codes)
export const INTERESTING_SHIP_TYPES = new Set([
  // Passenger / cruise
  60, 61, 62, 63, 64, 65, 66, 67, 68, 69,
  // Cargo / container
  70, 71, 72, 73, 74, 75, 76, 77, 78, 79,
  // Tanker (large ones)
  80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
]);

// Minimum speed to be "passing" (not anchored)
export const MIN_SHIP_SPEED_KNOTS = 1.5;

// Known Airbus Beluga ICAO24 hex codes (lowercase)
export const BELUGA_AIRCRAFT: Record<string, { registration: string; model: 'XL' | 'ST'; name: string }> = {
  // BelugaXL (A330-743L)
  '3c76fd': { registration: 'F-GXLH', model: 'XL', name: 'BelugaXL #1' },
  '3c76ff': { registration: 'F-GXLJ', model: 'XL', name: 'BelugaXL #2' },
  '3c7700': { registration: 'F-GXLK', model: 'XL', name: 'BelugaXL #3' },
  '3c7701': { registration: 'F-GXLL', model: 'XL', name: 'BelugaXL #4' },
  '3c7702': { registration: 'F-GXLM', model: 'XL', name: 'BelugaXL #5' },
  '3c7703': { registration: 'F-GXLN', model: 'XL', name: 'BelugaXL #6' },
  // Beluga ST (A300-600ST)
  '3c4b26': { registration: 'F-GSTA', model: 'ST', name: 'Beluga #1' },
  '3c4b28': { registration: 'F-GSTB', model: 'ST', name: 'Beluga #2' },
  '3c4b2a': { registration: 'F-GSTC', model: 'ST', name: 'Beluga #3' },
  '3c4b2c': { registration: 'F-GSTD', model: 'ST', name: 'Beluga #4' },
  '3c4b2e': { registration: 'F-GSTE', model: 'ST', name: 'Beluga #5' },
};

// How often to poll OpenSky (ms) — anonymous limit is ~400 calls/day
export const OPENSKY_POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// How long to keep a vessel in view after last signal (ms)
export const VESSEL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// Low altitude threshold for takeoff/landing (meters)
export const LOW_ALTITUDE_THRESHOLD_M = 600;
