export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function compassLabel(degrees: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(degrees / 22.5) % 16];
}

export function mmsiToFlag(mmsi: string): { emoji: string; country: string } {
  const prefix = parseInt(mmsi.substring(0, 3));
  const map: [number, number, string, string][] = [
    [201, 201, '🇦🇱', 'Albania'],
    [203, 203, '🇦🇹', 'Austria'],
    [205, 205, '🇧🇪', 'Belgium'],
    [209, 209, '🇨🇾', 'Cyprus'],
    [211, 211, '🇩🇪', 'Germany'],
    [212, 212, '🇨🇾', 'Cyprus'],
    [214, 214, '🇬🇷', 'Greece'],
    [218, 218, '🇩🇪', 'Germany'],
    [219, 220, '🇩🇰', 'Denmark'],
    [224, 224, '🇪🇸', 'Spain'],
    [225, 225, '🇪🇸', 'Spain'],
    [226, 226, '🇫🇷', 'France'],
    [227, 227, '🇫🇷', 'France'],
    [228, 228, '🇫🇷', 'France'],
    [229, 229, '🇲🇹', 'Malta'],
    [230, 230, '🇫🇮', 'Finland'],
    [231, 231, '🇫🇴', 'Faroe Islands'],
    [232, 235, '🇬🇧', 'United Kingdom'],
    [236, 236, '🇬🇮', 'Gibraltar'],
    [237, 237, '🇬🇷', 'Greece'],
    [238, 239, '🇭🇷', 'Croatia'],
    [240, 241, '🇬🇷', 'Greece'],
    [242, 242, '🇲🇦', 'Morocco'],
    [244, 245, '🇳🇱', 'Netherlands'],
    [246, 246, '🇳🇱', 'Netherlands'],
    [247, 247, '🇮🇹', 'Italy'],
    [248, 249, '🇲🇹', 'Malta'],
    [250, 250, '🇮🇪', 'Ireland'],
    [251, 251, '🇮🇸', 'Iceland'],
    [252, 252, '🇱🇮', 'Liechtenstein'],
    [253, 253, '🇱🇺', 'Luxembourg'],
    [254, 254, '🇲🇨', 'Monaco'],
    [255, 255, '🇵🇹', 'Portugal'],
    [256, 256, '🇲🇹', 'Malta'],
    [257, 257, '🇳🇴', 'Norway'],
    [258, 259, '🇳🇴', 'Norway'],
    [261, 261, '🇵🇱', 'Poland'],
    [262, 262, '🇲🇪', 'Montenegro'],
    [263, 263, '🇵🇹', 'Portugal'],
    [264, 264, '🇷🇴', 'Romania'],
    [265, 266, '🇸🇪', 'Sweden'],
    [267, 267, '🇸🇰', 'Slovakia'],
    [268, 268, '🇸🇲', 'San Marino'],
    [269, 269, '🇨🇭', 'Switzerland'],
    [270, 270, '🇨🇿', 'Czech Republic'],
    [271, 271, '🇹🇷', 'Turkey'],
    [272, 272, '🇺🇦', 'Ukraine'],
    [273, 273, '🇷🇺', 'Russia'],
    [275, 275, '🇱🇻', 'Latvia'],
    [276, 276, '🇪🇪', 'Estonia'],
    [277, 277, '🇱🇹', 'Lithuania'],
    [278, 278, '🇸🇮', 'Slovenia'],
    [279, 279, '🇷🇸', 'Serbia'],
    [301, 301, '🇦🇬', 'Antigua and Barbuda'],
    [303, 303, '🇺🇸', 'USA (Alaska)'],
    [304, 305, '🇦🇬', 'Antigua and Barbuda'],
    [306, 306, '🇳🇱', 'Netherlands Antilles'],
    [308, 309, '🇧🇸', 'Bahamas'],
    [310, 310, '🇧🇲', 'Bermuda'],
    [311, 311, '🇧🇸', 'Bahamas'],
    [316, 316, '🇨🇦', 'Canada'],
    [319, 319, '🇰🇾', 'Cayman Islands'],
    [338, 338, '🇺🇸', 'USA'],
    [351, 351, '🇵🇦', 'Panama'],
    [352, 356, '🇵🇦', 'Panama'],
    [357, 357, '🇵🇦', 'Panama'],
    [370, 370, '🇵🇦', 'Panama'],
    [371, 371, '🇵🇦', 'Panama'],
    [372, 372, '🇵🇦', 'Panama'],
    [374, 374, '🇵🇦', 'Panama'],
    [375, 376, '🇻🇨', 'St. Vincent'],
    [378, 378, '🇻🇬', 'British Virgin Islands'],
    [379, 379, '🇻🇬', 'British Virgin Islands'],
    [412, 413, '🇨🇳', 'China'],
    [416, 416, '🇹🇼', 'Taiwan'],
    [419, 419, '🇮🇳', 'India'],
    [421, 421, '🇮🇳', 'India'],
    [431, 432, '🇯🇵', 'Japan'],
    [440, 441, '🇰🇷', 'South Korea'],
    [470, 473, '🇦🇪', 'UAE'],
    [477, 477, '🇭🇰', 'Hong Kong'],
    [525, 525, '🇮🇩', 'Indonesia'],
    [533, 533, '🇲🇾', 'Malaysia'],
    [538, 538, '🇲🇭', 'Marshall Islands'],
    [548, 548, '🇵🇭', 'Philippines'],
    [563, 564, '🇸🇬', 'Singapore'],
    [566, 566, '🇸🇬', 'Singapore'],
    [574, 574, '🇻🇳', 'Vietnam'],
    [620, 620, '🇲🇬', 'Madagascar'],
    [636, 636, '🇱🇷', 'Liberia'],
    [657, 657, '🇹🇿', 'Tanzania'],
    [710, 710, '🇧🇷', 'Brazil'],
  ];
  for (const [lo, hi, emoji, country] of map) {
    if (prefix >= lo && prefix <= hi) return { emoji, country };
  }
  return { emoji: '🏳', country: 'Unknown' };
}
