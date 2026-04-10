interface Props {
  model: 'XL' | 'ST';
  className?: string;
}

export function BelugaSilhouette({ model, className = '' }: Props) {
  if (model === 'XL') {
    // BelugaXL - the extra-wide bulging fuselage
    return (
      <svg viewBox="0 0 240 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Main fuselage - the famous bulge */}
        <path
          d="M20 55 Q15 50 18 42 Q30 20 60 15 Q100 8 140 10 Q175 10 195 20 Q210 28 215 40 L218 55 Q215 62 205 65 L35 65 Q22 62 20 55 Z"
          fill="#0090D0" opacity="0.95"
        />
        {/* Underside / lower fuselage (cargo bay) */}
        <path
          d="M35 65 L205 65 Q210 68 210 72 L210 75 Q205 78 40 78 Q30 78 28 75 L28 72 Q30 68 35 65 Z"
          fill="#006FCF"
        />
        {/* White livery stripe */}
        <path
          d="M35 55 Q80 50 140 52 Q175 53 205 55"
          stroke="white" strokeWidth="4" opacity="0.6"
        />
        {/* Cockpit windows */}
        <ellipse cx="48" cy="42" rx="8" ry="5" fill="white" opacity="0.9"/>
        <ellipse cx="62" cy="40" rx="7" ry="4" fill="white" opacity="0.9"/>
        <ellipse cx="75" cy="39" rx="6" ry="3.5" fill="white" opacity="0.8"/>
        {/* Nose */}
        <path d="M20 55 Q10 52 5 48 Q8 44 18 42" fill="#003591"/>
        {/* Tail */}
        <path d="M215 40 Q222 32 225 25 L230 22 Q225 30 218 55" fill="#003591"/>
        {/* Vertical stabilizer */}
        <path d="M205 25 L218 15 L225 10 L224 22 L215 28 Z" fill="#003591"/>
        {/* Horizontal stabilizer */}
        <path d="M210 55 L230 48 L232 52 L212 62 Z" fill="#003591"/>
        <path d="M210 55 L230 62 L232 58 L212 62 Z" fill="#003591" opacity="0.6"/>
        {/* Wings */}
        <path d="M130 65 L160 90 L170 90 L145 65 Z" fill="#0057B8" opacity="0.9"/>
        <path d="M130 65 L100 90 L110 90 L135 65 Z" fill="#0057B8" opacity="0.9"/>
        {/* Engine 1 */}
        <ellipse cx="115" cy="90" rx="10" ry="5" fill="#002255" stroke="#0090D0" strokeWidth="1"/>
        {/* Engine 2 */}
        <ellipse cx="155" cy="90" rx="10" ry="5" fill="#002255" stroke="#0090D0" strokeWidth="1"/>
        {/* Airbus logo on tail area */}
        <text x="185" y="62" fontSize="7" fill="white" fontFamily="sans-serif" opacity="0.7">AIRBUS</text>
        {/* Beluga smile */}
        <path d="M30 60 Q40 64 55 60" stroke="white" strokeWidth="2" opacity="0.5" fill="none"/>
        {/* Eye */}
        <circle cx="38" cy="48" r="4" fill="white" opacity="0.9"/>
        <circle cx="39" cy="48" r="2" fill="#001840"/>
      </svg>
    );
  }

  // Beluga ST (original, slightly slimmer bulge)
  return (
    <svg viewBox="0 0 240 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main fuselage */}
      <path
        d="M22 55 Q18 50 20 43 Q32 22 65 17 Q100 11 138 12 Q172 12 192 22 Q207 30 210 44 L212 55 Q210 62 200 65 L38 65 Q24 62 22 55 Z"
        fill="#0090D0" opacity="0.95"
      />
      {/* Lower fuselage */}
      <path
        d="M38 65 L200 65 Q205 68 205 72 L205 75 Q200 78 42 78 Q32 78 30 75 L30 72 Q32 68 38 65 Z"
        fill="#006FCF"
      />
      {/* White stripe */}
      <path d="M38 56 Q90 51 138 53 Q170 54 200 56" stroke="white" strokeWidth="3.5" opacity="0.6"/>
      {/* Cockpit */}
      <ellipse cx="50" cy="44" rx="7" ry="4.5" fill="white" opacity="0.9"/>
      <ellipse cx="63" cy="42" rx="6" ry="4" fill="white" opacity="0.9"/>
      {/* Nose */}
      <path d="M22 55 Q12 52 7 48 Q10 44 20 43" fill="#003591"/>
      {/* Tail */}
      <path d="M210 44 Q218 35 222 28 L226 25 Q220 32 212 55" fill="#003591"/>
      {/* Vertical stabilizer */}
      <path d="M200 27 L212 18 L218 14 L217 24 L208 30 Z" fill="#003591"/>
      {/* Horizontal stabilizer */}
      <path d="M205 55 L225 49 L227 53 L207 62 Z" fill="#003591"/>
      <path d="M205 55 L225 61 L227 57 L207 62 Z" fill="#003591" opacity="0.6"/>
      {/* Wings */}
      <path d="M125 65 L152 88 L162 88 L138 65 Z" fill="#0057B8" opacity="0.9"/>
      <path d="M125 65 L98 88 L108 88 L132 65 Z" fill="#0057B8" opacity="0.9"/>
      {/* Engines */}
      <ellipse cx="112" cy="88" rx="9" ry="4.5" fill="#002255" stroke="#0090D0" strokeWidth="1"/>
      <ellipse cx="148" cy="88" rx="9" ry="4.5" fill="#002255" stroke="#0090D0" strokeWidth="1"/>
      {/* Label */}
      <text x="178" y="62" fontSize="6" fill="white" fontFamily="sans-serif" opacity="0.7">AIRBUS</text>
      {/* Eye and smile */}
      <circle cx="38" cy="49" r="3.5" fill="white" opacity="0.9"/>
      <circle cx="39" cy="49" r="1.8" fill="#001840"/>
      <path d="M32 58 Q40 62 52 58" stroke="white" strokeWidth="1.5" opacity="0.45" fill="none"/>
    </svg>
  );
}
