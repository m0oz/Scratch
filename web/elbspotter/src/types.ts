export interface ShipData {
  mmsi: string;
  name: string;
  shipType: number;
  typeName: string;
  flagEmoji: string;
  flagCountry: string;
  speed: number; // knots
  course: number; // degrees
  lat: number;
  lon: number;
  destination: string;
  length?: number; // meters
  width?: number;  // meters
  etaText?: string;
  timestamp: number;
  distance: number; // km from user
  firstSeen: number;
  lastSeen: number;
  moored: boolean;
  direction: 'inbound' | 'outbound' | null;
  passEtaMinutes: number | null;
}

export interface PlaneData {
  icao24: string;
  callsign: string;
  lat: number;
  lon: number;
  baroAltitude: number | null; // meters
  onGround: boolean;
  velocity: number | null; // m/s
  trueTrack: number | null; // degrees
  verticalRate: number | null; // m/s, positive = climbing
  distance: number; // km from user
  belugaModel: 'XL' | 'ST';
  registration: string;
  timestamp: number;
  firstSeen: number;
  lastSeen: number;
  isInbound: boolean;
  etaMinutes: number | null;
  distanceToFinkenwerder: number;
}
