// A tiny built-in catalogue of the brightest stars (mag < ~2.5). Coordinates
// are J2000 RA (hours) / Dec (degrees) with apparent visual magnitude.
// Source: simplified from the Yale Bright Star Catalogue.

export type Star = {
  name: string
  ra: number // hours
  dec: number // degrees
  mag: number
}

export const BRIGHT_STARS: Star[] = [
  { name: 'Sirius', ra: 6.7525, dec: -16.7161, mag: -1.46 },
  { name: 'Canopus', ra: 6.3992, dec: -52.6957, mag: -0.74 },
  { name: 'Arcturus', ra: 14.2612, dec: 19.1825, mag: -0.05 },
  { name: 'Rigil Kentaurus', ra: 14.6601, dec: -60.8354, mag: -0.27 },
  { name: 'Vega', ra: 18.6156, dec: 38.7836, mag: 0.03 },
  { name: 'Capella', ra: 5.2782, dec: 45.998, mag: 0.08 },
  { name: 'Rigel', ra: 5.2423, dec: -8.2017, mag: 0.13 },
  { name: 'Procyon', ra: 7.6551, dec: 5.225, mag: 0.34 },
  { name: 'Achernar', ra: 1.6286, dec: -57.2367, mag: 0.46 },
  { name: 'Betelgeuse', ra: 5.9195, dec: 7.4071, mag: 0.5 },
  { name: 'Hadar', ra: 14.0637, dec: -60.373, mag: 0.61 },
  { name: 'Altair', ra: 19.8463, dec: 8.8683, mag: 0.77 },
  { name: 'Acrux', ra: 12.4433, dec: -63.0991, mag: 0.77 },
  { name: 'Aldebaran', ra: 4.5987, dec: 16.5093, mag: 0.85 },
  { name: 'Antares', ra: 16.4901, dec: -26.4319, mag: 1.09 },
  { name: 'Spica', ra: 13.4199, dec: -11.1614, mag: 1.04 },
  { name: 'Pollux', ra: 7.7553, dec: 28.0262, mag: 1.14 },
  { name: 'Fomalhaut', ra: 22.9608, dec: -29.6222, mag: 1.16 },
  { name: 'Deneb', ra: 20.6905, dec: 45.2803, mag: 1.25 },
  { name: 'Mimosa', ra: 12.7953, dec: -59.6886, mag: 1.25 },
  { name: 'Regulus', ra: 10.1395, dec: 11.9672, mag: 1.35 },
  { name: 'Adhara', ra: 6.9771, dec: -28.9721, mag: 1.5 },
  { name: 'Shaula', ra: 17.5601, dec: -37.1038, mag: 1.62 },
  { name: 'Castor', ra: 7.5766, dec: 31.8883, mag: 1.57 },
  { name: 'Gacrux', ra: 12.5194, dec: -57.1131, mag: 1.59 },
  { name: 'Bellatrix', ra: 5.4188, dec: 6.3497, mag: 1.64 },
  { name: 'Elnath', ra: 5.4382, dec: 28.6075, mag: 1.65 },
  { name: 'Miaplacidus', ra: 9.22, dec: -69.7172, mag: 1.69 },
  { name: 'Alnilam', ra: 5.6036, dec: -1.2019, mag: 1.69 },
  { name: 'Alnitak', ra: 5.6793, dec: -1.9426, mag: 1.74 },
  { name: 'Mintaka', ra: 5.5334, dec: -0.2991, mag: 2.23 },
  { name: 'Alioth', ra: 12.9005, dec: 55.9598, mag: 1.76 },
  { name: 'Dubhe', ra: 11.0621, dec: 61.7508, mag: 1.81 },
  { name: 'Mirfak', ra: 3.4054, dec: 49.8612, mag: 1.79 },
  { name: 'Wezen', ra: 7.1399, dec: -26.3935, mag: 1.83 },
  { name: 'Alkaid', ra: 13.7923, dec: 49.3133, mag: 1.85 },
  { name: 'Sargas', ra: 17.6222, dec: -42.9978, mag: 1.86 },
  { name: 'Avior', ra: 8.3752, dec: -59.5096, mag: 1.86 },
  { name: 'Atria', ra: 16.8111, dec: -69.0277, mag: 1.91 },
  { name: 'Alhena', ra: 6.6286, dec: 16.3993, mag: 1.93 },
  { name: 'Polaris', ra: 2.5302, dec: 89.2641, mag: 1.98 },
  { name: 'Mirzam', ra: 6.3783, dec: -17.9559, mag: 1.98 },
  { name: 'Alphard', ra: 9.4598, dec: -8.6586, mag: 1.98 },
  { name: 'Hamal', ra: 2.1196, dec: 23.4624, mag: 2.0 },
  { name: 'Algieba', ra: 10.3329, dec: 19.8415, mag: 2.21 },
  { name: 'Diphda', ra: 0.7264, dec: -17.9866, mag: 2.04 },
  { name: 'Nunki', ra: 18.9211, dec: -26.2967, mag: 2.05 },
  { name: 'Menkalinan', ra: 5.9921, dec: 44.9475, mag: 1.9 },
  { name: 'Mizar', ra: 13.3988, dec: 54.9254, mag: 2.23 },
  { name: 'Kochab', ra: 14.8451, dec: 74.1555, mag: 2.08 },
  { name: 'Saiph', ra: 5.7959, dec: -9.6696, mag: 2.09 },
  { name: 'Rasalhague', ra: 17.5823, dec: 12.5601, mag: 2.08 },
  { name: 'Algol', ra: 3.1361, dec: 40.9556, mag: 2.12 },
  { name: 'Almach', ra: 2.0649, dec: 42.3297, mag: 2.1 },
  { name: 'Denebola', ra: 11.8177, dec: 14.5719, mag: 2.14 },
  { name: 'Caph', ra: 0.1531, dec: 59.1497, mag: 2.27 },
  { name: 'Schedar', ra: 0.6751, dec: 56.5373, mag: 2.23 },
  { name: 'Markab', ra: 23.0793, dec: 15.2053, mag: 2.49 },
]

/** Convert a star's equatorial position to az/el for an observer at `when`. */
export function starToAzEl(
  star: Star,
  latitudeDeg: number,
  longitudeDeg: number,
  when: Date
): { az: number; el: number } {
  // Local sidereal time, in degrees, low-precision.
  const jd = when.getTime() / 86400000 + 2440587.5
  const T = (jd - 2451545.0) / 36525
  let gmstHours =
    6.697374558 +
    0.06570982441908 * (jd - 2451545.0) +
    1.00273790935 * (when.getUTCHours() + when.getUTCMinutes() / 60 + when.getUTCSeconds() / 3600) +
    0.000026 * T * T
  gmstHours = ((gmstHours % 24) + 24) % 24
  const lstDeg = (gmstHours * 15 + longitudeDeg) % 360
  const haDeg = ((lstDeg - star.ra * 15 + 360) % 360 + 540) % 360 - 180
  const ha = (haDeg * Math.PI) / 180
  const dec = (star.dec * Math.PI) / 180
  const lat = (latitudeDeg * Math.PI) / 180
  const sinEl = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha)
  const el = Math.asin(Math.max(-1, Math.min(1, sinEl)))
  const cosAz =
    (Math.sin(dec) - Math.sin(el) * Math.sin(lat)) / (Math.cos(el) * Math.cos(lat))
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz)))
  if (Math.sin(ha) > 0) az = 2 * Math.PI - az
  return { az: (az * 180) / Math.PI, el: (el * 180) / Math.PI }
}
