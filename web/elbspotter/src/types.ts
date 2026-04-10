export interface ShipData {
  mmsi: string;
  name: string;
  shipType: number;
  typeName: string;
  flagEmoji: string;
  flagCountry: string;
  speed: number; // knots
  course: number; // degrees
  heading?: number;
  lat: number;
  lon: number;
  destination: string;
  callSign?: string;
  imoNumber?: number;
  length?: number; // meters (A + B from Dimension)
  width?: number;  // meters (C + D from Dimension)
  draught?: number;
  etaText?: string; // pre-formatted ETA string
  timestamp: number;
  distance: number; // km from user
  firstSeen: number;
  lastSeen: number;
  moored: boolean;
}

export interface PlaneData {
  icao24: string;
  callsign: string;
  originCountry: string;
  lat: number;
  lon: number;
  baroAltitude: number | null; // meters
  onGround: boolean;
  velocity: number | null; // m/s
  trueTrack: number | null; // degrees
  verticalRate: number | null; // m/s positive = climbing
  distance: number; // km from user
  belugaModel: 'XL' | 'ST';
  registration: string;
  timestamp: number;
  firstSeen: number;
  lastSeen: number;
}

export interface AppNotification {
  id: string;
  type: 'ship' | 'plane';
  title: string;
  message: string;
  timestamp: number;
  vesselId: string; // mmsi or icao24
  dismissed: boolean;
}
