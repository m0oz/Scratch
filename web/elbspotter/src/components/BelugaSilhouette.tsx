interface Props {
  model: 'XL' | 'ST';
  className?: string;
}

export function BelugaSilhouette({ model, className = '' }: Props) {
  const isXL = model === 'XL';

  // Clean side-profile silhouette — no cartoon features
  return (
    <svg viewBox="0 0 280 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Upper fuselage — the distinctive cargo bulge */}
      <path
        d={isXL
          ? 'M25 52 Q20 45 22 36 Q30 16 55 10 Q90 2 140 4 Q185 4 210 12 Q230 20 238 36 L240 48 Q238 54 230 56 L35 56 Q26 55 25 52 Z'
          : 'M25 52 Q20 46 22 38 Q32 20 58 14 Q92 6 140 8 Q182 8 208 16 Q226 24 234 38 L236 48 Q234 54 226 56 L38 56 Q28 55 25 52 Z'
        }
        fill="#0090D0"
      />
      {/* Lower fuselage */}
      <path
        d="M35 56 L230 56 Q234 58 234 62 L232 65 Q228 67 40 67 Q32 67 30 64 L30 61 Q32 58 35 56 Z"
        fill="#006FCF"
      />
      {/* Cockpit — dropped below the bulge, distinctive Beluga feature */}
      <path
        d="M25 52 Q15 50 10 46 Q12 42 22 38"
        fill="#003591"
      />
      {/* Cockpit windows */}
      <rect x="16" y="43" width="6" height="3" rx="1" fill="#89b4f0" opacity="0.8" transform="rotate(-8 19 44.5)"/>
      <rect x="24" y="41" width="5" height="2.5" rx="1" fill="#89b4f0" opacity="0.7" transform="rotate(-5 26.5 42)"/>
      {/* White belly stripe */}
      <path
        d="M40 50 Q100 46 160 47 Q200 48 230 50"
        stroke="white" strokeWidth="2" opacity="0.3"
      />
      {/* Vertical stabiliser */}
      <path d="M225 20 L240 6 L246 4 L244 16 L232 24 Z" fill="#003591"/>
      {/* Horizontal stabiliser (T-tail) */}
      <path d="M238 8 L260 2 L262 6 L240 14 Z" fill="#003591"/>
      <path d="M238 8 L258 14 L260 10 L240 6 Z" fill="#003591" opacity="0.7"/>
      {/* Tail cone */}
      <path d="M238 36 Q245 28 248 20 L246 16 Q242 26 240 48" fill="#003591" opacity="0.8"/>
      {/* Wing */}
      <path
        d="M140 56 L165 82 L175 84 L152 56 Z"
        fill="#0057B8" opacity="0.85"
      />
      <path
        d="M140 56 L115 82 L125 84 L142 56 Z"
        fill="#0057B8" opacity="0.85"
      />
      {/* Engine pods */}
      <path d="M120 80 Q118 76 122 74 L132 74 Q136 76 134 80 Z" fill="#003C6E"/>
      <path d="M158 80 Q156 76 160 74 L170 74 Q174 76 172 80 Z" fill="#003C6E"/>
      {/* Engine intakes */}
      <ellipse cx="127" cy="74" rx="5" ry="2" fill="#002255"/>
      <ellipse cx="165" cy="74" rx="5" ry="2" fill="#002255"/>
      {/* Landing gear doors (subtle detail) */}
      <rect x="90" y="65" width="8" height="2" rx="1" fill="#005090" opacity="0.5"/>
      <rect x="180" y="65" width="8" height="2" rx="1" fill="#005090" opacity="0.5"/>
      {/* AIRBUS text on fuselage */}
      <text x="80" y="53" fontSize="6" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold" opacity="0.4" letterSpacing="2">AIRBUS</text>
    </svg>
  );
}
