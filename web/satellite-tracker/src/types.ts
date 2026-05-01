export type LatLon = {
  latitude: number
  longitude: number
  altitudeKm?: number
}

export type SatRecord = {
  name: string
  noradId: string
  intlDesignator: string
  /** Year the object was launched, parsed from the international designator. */
  launchYear: number
  tle1: string
  tle2: string
  /** Loose category guessed from the satellite name. */
  family: SatFamily
}

export type SatFamily =
  | 'starlink'
  | 'oneweb'
  | 'iridium'
  | 'gps'
  | 'iss'
  | 'weather'
  | 'science'
  | 'debris'
  | 'rocket-body'
  | 'other'

export type SatPosition = {
  rec: SatRecord
  /** Azimuth in degrees, 0 = north, 90 = east. */
  azimuth: number
  /** Elevation/altitude angle above horizon in degrees. */
  elevation: number
  /** Range to observer in km. */
  rangeKm: number
  /** Sat altitude above mean sea level in km. */
  heightKm: number
  /** True if currently in sunlight (so visible to the eye after dusk). */
  sunlit: boolean
}

export type GarbageEstimate = {
  alreadyDebris: number
  endOfLifeSoon: number
  longLived: number
  /** Total objects considered (overhead, regardless of elevation). */
  total: number
}
