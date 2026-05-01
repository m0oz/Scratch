import * as satellite from 'satellite.js'
import type { GarbageEstimate, LatLon, SatFamily, SatPosition, SatRecord } from './types'

// CelesTrak group catalogues. We fetch a few groups so the night sky has a good mix
// of bright LEO traffic, geostationary giants, GPS, ISS and known debris.
const TLE_GROUPS = [
  'stations', // ISS, CSS
  'active', // ~7000 active satellites
  'starlink',
  'oneweb',
  'gps-ops',
  'galileo',
  'glo-ops',
  'iridium-NEXT',
  'weather',
  'science',
  'geo',
  'cosmos-1408-debris',
  'fengyun-1c-debris',
  'iridium-33-debris',
  'cosmos-2251-debris',
] as const

const TLE_URL = (group: string) =>
  `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`

/** Parse 3-line TLE chunks (name + line1 + line2) into SatRecord objects. */
export function parseTLE(text: string): SatRecord[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const out: SatRecord[] = []
  for (let i = 0; i + 2 < lines.length; i += 3) {
    const name = lines[i]
    const tle1 = lines[i + 1]
    const tle2 = lines[i + 2]
    if (!tle1.startsWith('1 ') || !tle2.startsWith('2 ')) continue
    const noradId = tle1.slice(2, 7).trim()
    const intlDesignator = tle1.slice(9, 17).trim()
    const yearTwo = Number(intlDesignator.slice(0, 2))
    // TLE convention: 57–99 → 19xx, 00–56 → 20xx.
    const launchYear = isFinite(yearTwo)
      ? yearTwo >= 57
        ? 1900 + yearTwo
        : 2000 + yearTwo
      : 0
    out.push({
      name,
      noradId,
      intlDesignator,
      launchYear,
      tle1,
      tle2,
      family: classify(name),
    })
  }
  return out
}

function classify(name: string): SatFamily {
  const n = name.toUpperCase()
  if (n.includes('DEB') || n.includes('FRAGMENT')) return 'debris'
  if (n.includes('R/B') || n.includes('ROCKET BODY')) return 'rocket-body'
  if (n.startsWith('STARLINK')) return 'starlink'
  if (n.startsWith('ONEWEB')) return 'oneweb'
  if (n.startsWith('IRIDIUM')) return 'iridium'
  if (n.startsWith('GPS') || n.startsWith('NAVSTAR')) return 'gps'
  if (n.startsWith('ISS') || n === 'ZARYA' || n.includes('CSS (TIANHE)')) return 'iss'
  if (n.includes('NOAA') || n.includes('METOP') || n.includes('GOES') || n.includes('FENGYUN'))
    return 'weather'
  if (n.includes('HUBBLE') || n.includes('TESS') || n.includes('SWIFT') || n.includes('CHEOPS'))
    return 'science'
  return 'other'
}

const FETCH_TIMEOUT_MS = 12000

async function fetchGroup(group: string): Promise<SatRecord[]> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(TLE_URL(group), { signal: ctrl.signal })
    if (!res.ok) throw new Error(`${group}: ${res.status}`)
    const txt = await res.text()
    return parseTLE(txt)
  } finally {
    clearTimeout(t)
  }
}

export async function loadCatalog(
  onProgress?: (loaded: number, total: number) => void
): Promise<SatRecord[]> {
  const seen = new Map<string, SatRecord>()
  let loaded = 0
  for (const group of TLE_GROUPS) {
    try {
      const recs = await fetchGroup(group)
      for (const r of recs) {
        if (!seen.has(r.noradId)) seen.set(r.noradId, r)
      }
    } catch (err) {
      // One group failing shouldn't kill the whole load.
      console.warn('TLE group failed:', group, err)
    }
    loaded += 1
    onProgress?.(loaded, TLE_GROUPS.length)
  }
  return [...seen.values()]
}

/** Compute look-angles (az/el) from observer to every catalogued sat at `when`. */
export function computeOverhead(
  catalog: SatRecord[],
  observer: LatLon,
  when: Date
): SatPosition[] {
  const obsGd = {
    latitude: satellite.degreesToRadians(observer.latitude),
    longitude: satellite.degreesToRadians(observer.longitude),
    height: (observer.altitudeKm ?? 0),
  }
  const gmst = satellite.gstime(when)
  const sun = sunEciKm(when)

  const out: SatPosition[] = []
  for (const rec of catalog) {
    let satrec
    try {
      satrec = satellite.twoline2satrec(rec.tle1, rec.tle2)
    } catch {
      continue
    }
    const pv = satellite.propagate(satrec, when)
    if (!pv || !pv.position || typeof pv.position === 'boolean') continue
    const eci = pv.position as satellite.EciVec3<number>
    const ecf = satellite.eciToEcf(eci, gmst)
    const look = satellite.ecfToLookAngles(obsGd, ecf)
    const elDeg = satellite.radiansToDegrees(look.elevation)
    const azDeg = (satellite.radiansToDegrees(look.azimuth) + 360) % 360
    const rangeKm = look.rangeSat
    const geo = satellite.eciToGeodetic(eci, gmst)
    const heightKm = geo.height
    if (!isFinite(elDeg) || !isFinite(azDeg)) continue
    const sunlit = isSunlit(eci, sun)
    out.push({ rec, azimuth: azDeg, elevation: elDeg, rangeKm, heightKm, sunlit })
  }
  return out
}

/** Crude (but adequate) sun position in ECI km, low-precision formula from Meeus. */
function sunEciKm(date: Date): { x: number; y: number; z: number } {
  const jd = julianDate(date)
  const n = jd - 2451545.0
  const L = deg2rad(280.46 + 0.9856474 * n)
  const g = deg2rad(357.528 + 0.9856003 * n)
  const lambda = L + deg2rad(1.915) * Math.sin(g) + deg2rad(0.02) * Math.sin(2 * g)
  const epsilon = deg2rad(23.439 - 0.0000004 * n)
  const r = 1.00014 - 0.01671 * Math.cos(g) - 0.00014 * Math.cos(2 * g) // AU
  const AU = 149597870.7
  return {
    x: r * Math.cos(lambda) * AU,
    y: r * Math.cos(epsilon) * Math.sin(lambda) * AU,
    z: r * Math.sin(epsilon) * Math.sin(lambda) * AU,
  }
}

function julianDate(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5
}

function deg2rad(d: number): number {
  return (d * Math.PI) / 180
}

const EARTH_RADIUS_KM = 6378.137

/** True if the satellite is in direct sunlight (not in Earth's umbra). */
function isSunlit(
  sat: { x: number; y: number; z: number },
  sun: { x: number; y: number; z: number }
): boolean {
  const sunMag = Math.hypot(sun.x, sun.y, sun.z)
  const sx = sun.x / sunMag
  const sy = sun.y / sunMag
  const sz = sun.z / sunMag
  // Project the sat position onto the sun direction.
  const proj = sat.x * sx + sat.y * sy + sat.z * sz
  if (proj > 0) return true // on the day side
  // Perpendicular distance from sun line.
  const px = sat.x - proj * sx
  const py = sat.y - proj * sy
  const pz = sat.z - proj * sz
  const perp = Math.hypot(px, py, pz)
  return perp > EARTH_RADIUS_KM
}

/** Heuristic end-of-life classification per object. */
export function classifyGarbage(positions: SatPosition[], now: Date): GarbageEstimate {
  const year = now.getUTCFullYear()
  let alreadyDebris = 0
  let endOfLifeSoon = 0
  let longLived = 0
  for (const p of positions) {
    const age = year - p.rec.launchYear
    const fam = p.rec.family
    const isJunk = fam === 'debris' || fam === 'rocket-body'
    if (isJunk) {
      alreadyDebris += 1
      continue
    }
    // Nominal mission lifetime by family. Past this we count it as "soon".
    const lifetime =
      fam === 'starlink' ? 5 :
      fam === 'oneweb' ? 7 :
      fam === 'iridium' ? 12 :
      fam === 'gps' ? 15 :
      fam === 'iss' ? 30 :
      fam === 'weather' ? 10 :
      fam === 'science' ? 12 :
      10
    if (age >= lifetime) endOfLifeSoon += 1
    else longLived += 1
  }
  return {
    alreadyDebris,
    endOfLifeSoon,
    longLived,
    total: positions.length,
  }
}
