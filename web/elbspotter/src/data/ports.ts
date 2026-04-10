export interface PortInfo {
  name: string;
  country: string;
  flag: string;
  description: string;
  funFact: string;
}

// Lookup by AIS destination string fragments (uppercase)
const PORT_DATABASE: { patterns: string[]; info: PortInfo }[] = [
  {
    patterns: ['HAMBURG', 'HAM', 'DE HAM', 'HHLA', 'EUROGATE'],
    info: {
      name: 'Hamburg',
      country: 'Germany',
      flag: '🇩🇪',
      description: 'Europe\'s third-largest port, gateway to Central Europe',
      funFact: 'Over 9,000 ships call at Hamburg each year, handling 130+ million tonnes of cargo.',
    },
  },
  {
    patterns: ['ROTTERDAM', 'ROTTDAM', 'NLRTM', 'NL RTM'],
    info: {
      name: 'Rotterdam',
      country: 'Netherlands',
      flag: '🇳🇱',
      description: 'Europe\'s largest port, crossroads of global trade',
      funFact: 'Rotterdam handles over 460 million tonnes of goods per year — more than any other European port.',
    },
  },
  {
    patterns: ['ANTWERP', 'ANTWER', 'BEANR'],
    info: {
      name: 'Antwerp',
      country: 'Belgium',
      flag: '🇧🇪',
      description: 'Diamond capital of the world, Europe\'s second largest port',
      funFact: 'More than 60% of the world\'s rough diamonds pass through Antwerp each year.',
    },
  },
  {
    patterns: ['BREMERHAVEN', 'BREMER', 'DEBRV', 'BREMEN'],
    info: {
      name: 'Bremerhaven',
      country: 'Germany',
      flag: '🇩🇪',
      description: 'Germany\'s gateway to the sea, major automotive export hub',
      funFact: 'Over 2 million vehicles roll through Bremerhaven annually — it\'s Europe\'s largest car port.',
    },
  },
  {
    patterns: ['FELIXSTOWE', 'FELIX', 'GBFXT'],
    info: {
      name: 'Felixstowe',
      country: 'United Kingdom',
      flag: '🇬🇧',
      description: 'UK\'s busiest container port',
      funFact: 'Felixstowe handles around 42% of UK container trade with connections to over 700 ports worldwide.',
    },
  },
  {
    patterns: ['SINGAPORE', 'SGSIN', 'SG SIN'],
    info: {
      name: 'Singapore',
      country: 'Singapore',
      flag: '🇸🇬',
      description: 'Crossroads of Asia, one of the world\'s busiest ports',
      funFact: 'A ship arrives or departs Singapore every 2 minutes — over 130,000 ship calls per year.',
    },
  },
  {
    patterns: ['SHANGHAI', 'CNSHA', 'CN SHA'],
    info: {
      name: 'Shanghai',
      country: 'China',
      flag: '🇨🇳',
      description: 'World\'s busiest container port since 2010',
      funFact: 'Shanghai Port moves over 47 million TEU containers annually — enough to circle the Earth 3 times if lined up.',
    },
  },
  {
    patterns: ['NINGBO', 'CNNGB'],
    info: {
      name: 'Ningbo-Zhoushan',
      country: 'China',
      flag: '🇨🇳',
      description: 'World\'s busiest port by tonnage',
      funFact: 'Ningbo-Zhoushan handles over 1.2 billion tonnes of cargo per year, surpassing all other ports.',
    },
  },
  {
    patterns: ['BUSAN', 'KRPUS'],
    info: {
      name: 'Busan',
      country: 'South Korea',
      flag: '🇰🇷',
      description: 'Northeast Asia\'s largest port, South Korea\'s trade lifeline',
      funFact: 'Busan is home to the world\'s 5th busiest container terminal, processing over 22 million TEU per year.',
    },
  },
  {
    patterns: ['HONG KONG', 'HKHKG'],
    info: {
      name: 'Hong Kong',
      country: 'Hong Kong',
      flag: '🇭🇰',
      description: 'Asia\'s world city, a premier container transshipment hub',
      funFact: 'Hong Kong has been one of the world\'s top container ports for over 40 years.',
    },
  },
  {
    patterns: ['LE HAVRE', 'LEHAVRE', 'FRLEH', 'FR LEH'],
    info: {
      name: 'Le Havre',
      country: 'France',
      flag: '🇫🇷',
      description: 'France\'s leading container port, gateway to Paris',
      funFact: 'Le Havre UNESCO World Heritage city centre was rebuilt after WWII by Auguste Perret in pioneering concrete.',
    },
  },
  {
    patterns: ['GDANSK', 'GDYNIA', 'PLGDN', 'PLGDY'],
    info: {
      name: 'Gdańsk / Gdynia',
      country: 'Poland',
      flag: '🇵🇱',
      description: 'Baltic Sea\'s fastest growing major ports',
      funFact: 'Gdańsk Port is the largest on the Baltic and grew its container traffic by 500% in just 15 years.',
    },
  },
  {
    patterns: ['OSLO', 'NOOSL'],
    info: {
      name: 'Oslo',
      country: 'Norway',
      flag: '🇳🇴',
      description: 'Norway\'s capital, a scenic fjord city',
      funFact: 'The Oslo Fjord stretches over 100 km inland and is home to dozens of charming island communities.',
    },
  },
  {
    patterns: ['COPENHAGEN', 'KOEBEN', 'DKCPH', 'DK CPH'],
    info: {
      name: 'Copenhagen',
      country: 'Denmark',
      flag: '🇩🇰',
      description: 'Scandinavia\'s most visited cruise destination',
      funFact: 'Copenhagen is the world\'s most popular cruise embarkation port in northern Europe.',
    },
  },
  {
    patterns: ['AMSTERDAM', 'NLAMS'],
    info: {
      name: 'Amsterdam',
      country: 'Netherlands',
      flag: '🇳🇱',
      description: 'Venice of the North, major bulk and cruise port',
      funFact: 'Amsterdam has more canals than Venice — over 100 km of waterways running through the city.',
    },
  },
];

export function lookupPort(destination: string): PortInfo | null {
  if (!destination) return null;
  const upper = destination.toUpperCase().trim();
  for (const entry of PORT_DATABASE) {
    for (const pattern of entry.patterns) {
      if (upper.includes(pattern)) return entry.info;
    }
  }
  return null;
}

export function formatETA(eta: { Day?: number; Month?: number; Hour?: number; Minute?: number } | undefined): string | null {
  if (!eta || !eta.Day || !eta.Month) return null;
  const now = new Date();
  const year = now.getFullYear();
  const date = new Date(year, (eta.Month ?? 1) - 1, eta.Day ?? 1, eta.Hour ?? 0, eta.Minute ?? 0);
  if (date < now) date.setFullYear(year + 1);
  const diff = date.getTime() - now.getTime();
  const hours = Math.round(diff / 3_600_000);
  if (hours < 1) return 'soon';
  if (hours < 24) return `~${hours}h`;
  return `~${Math.round(hours / 24)}d`;
}
