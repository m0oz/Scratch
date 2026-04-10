// Pre-configured AISStream key (public AIS data — free tier)
export const DEFAULT_AIS_KEY = '1cfbd243411f5be686acec93819c447ed53513db';

export const MY_LOCATION = {
  lat: 53.5453971,
  lon: 9.8344917,
  label: 'Finkenwerder, Hamburg',
};

// Finkenwerder airfield (EDHI) — Beluga ETA destination
export const FINKENWERDER = { lat: 53.5354, lon: 9.8345 };

// Detection radii
export const SHIP_DETECTION_RADIUS_KM = 30.0;
export const PLANE_DETECTION_RADIUS_KM = 300.0; // wide scan to catch inbound Belugas

// AIS bounding box around the Elbe between Hamburg and the sea
export const ELBE_BOUNDING_BOX = [
  [53.35, 8.8],  // SW [lat, lon]
  [53.70, 10.2], // NE [lat, lon]
];

// Ship types to track (AIS type codes)
export const INTERESTING_SHIP_TYPES = new Set([
  // Passenger / cruise
  60, 61, 62, 63, 64, 65, 66, 67, 68, 69,
  // Cargo / container
  70, 71, 72, 73, 74, 75, 76, 77, 78, 79,
  // Tanker (large ones)
  80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
]);

// Minimum ship length to display (metres)
export const MIN_SHIP_LENGTH_M = 150;

// Distance at which a close-range notification fires (km)
export const SHIP_CLOSE_RADIUS_KM = 0.5;

// Minimum speed to be "passing" (not anchored)
export const MIN_SHIP_SPEED_KNOTS = 1.5;

// Elbe heading: ships heading roughly east/upstream (45-180°) are inbound to port,
// ships heading roughly west/downstream (180-360°/0-45°) are outbound to sea.
// These are bearings from Finkenwerder toward the sea and toward Hamburg port.
export const ELBE_INBOUND_RANGE = [45, 180] as const;  // heading towards Hamburg port

// Known Airbus Beluga ICAO24 hex codes (lowercase)
export const BELUGA_AIRCRAFT: Record<string, { registration: string; model: 'XL' | 'ST'; name: string }> = {
  // BelugaXL (A330-743L) — 6 active
  '395d66': { registration: 'F-GXLG', model: 'XL', name: 'BelugaXL #1' },
  '395d67': { registration: 'F-GXLH', model: 'XL', name: 'BelugaXL #2' },
  '395d68': { registration: 'F-GXLI', model: 'XL', name: 'BelugaXL #3' },
  '395d69': { registration: 'F-GXLJ', model: 'XL', name: 'BelugaXL #4' },
  '395d6d': { registration: 'F-GXLN', model: 'XL', name: 'BelugaXL #5' },
  '395d6e': { registration: 'F-GXLO', model: 'XL', name: 'BelugaXL #6' },
  // Beluga ST (A300-600ST) — all retired, but may still appear in ADS-B data
  '394a60': { registration: 'F-GSTA', model: 'ST', name: 'Beluga ST #1' },
  '394a61': { registration: 'F-GSTB', model: 'ST', name: 'Beluga ST #2' },
  '394a62': { registration: 'F-GSTC', model: 'ST', name: 'Beluga ST #3' },
  '394a63': { registration: 'F-GSTD', model: 'ST', name: 'Beluga ST #4' },
  '394a65': { registration: 'F-GSTF', model: 'ST', name: 'Beluga ST #5' },
};

// Query radius sent to airplanes.live (nautical miles). 150 nm ≈ 278 km.
export const ADSB_RADIUS_NM = 150;

// How long to keep a vessel in view after last signal (ms)
export const VESSEL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
export const MOORED_VESSEL_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Low altitude threshold for takeoff/landing (meters)
export const LOW_ALTITUDE_THRESHOLD_M = 600;

// Beluga ETA notification: alert this many minutes before arrival
export const ETA_NOTIFICATION_MINUTES = 5;

// Bearing tolerance for "heading toward target" (degrees)
export const INBOUND_BEARING_TOLERANCE_DEG = 45;
