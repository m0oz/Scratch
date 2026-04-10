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
  direction: 'inbound' | 'outbound' | null; // heading into or out of Hamburg port
  passEtaMinutes: number | null; // estimated minutes until ship passes user location
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
  isInbound: boolean; // heading toward Finkenwerder
  etaMinutes: number | null; // estimated minutes to EDHI
  distanceToFinkenwerder: number; // km to EDHI
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
