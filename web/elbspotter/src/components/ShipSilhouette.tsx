interface Props {
  type: number; // AIS ship type
  className?: string;
}

export function ShipSilhouette({ type, className = '' }: Props) {
  // Cruise / passenger
  if (type >= 60 && type <= 69) {
    return (
      <svg viewBox="0 0 200 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Hull */}
        <path d="M10 55 L20 65 L180 65 L195 55 L185 45 L15 45 Z" fill="#003591" opacity="0.9"/>
        {/* Main superstructure */}
        <rect x="40" y="30" width="120" height="18" rx="2" fill="#0057B8"/>
        {/* Upper deck */}
        <rect x="55" y="18" width="90" height="14" rx="2" fill="#006FCF"/>
        {/* Top deck */}
        <rect x="70" y="8" width="60" height="12" rx="2" fill="#0090D0"/>
        {/* Funnel */}
        <rect x="145" y="4" width="14" height="26" rx="3" fill="#FFB400"/>
        <rect x="148" y="2" width="8" height="6" rx="1" fill="#FF8C00"/>
        {/* Windows row 1 */}
        {[50, 65, 80, 95, 110, 125, 140, 155].map((x) => (
          <rect key={x} x={x} y="35" width="7" height="5" rx="1" fill="#00BCD4" opacity="0.8"/>
        ))}
        {/* Windows row 2 */}
        {[60, 75, 90, 105, 120, 135].map((x) => (
          <rect key={x} x={x} y="23" width="6" height="4" rx="1" fill="#00BCD4" opacity="0.7"/>
        ))}
        {/* Bow wave */}
        <path d="M10 62 Q0 70 -5 75" stroke="#00A3E0" strokeWidth="1.5" opacity="0.5"/>
      </svg>
    );
  }
  // Tanker
  if (type >= 80 && type <= 89) {
    return (
      <svg viewBox="0 0 200 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Hull */}
        <path d="M5 50 L15 62 L185 62 L198 50 L190 42 L10 42 Z" fill="#003591" opacity="0.9"/>
        {/* Deck */}
        <rect x="15" y="38" width="170" height="6" rx="1" fill="#0057B8"/>
        {/* Tanks */}
        {[20, 50, 80, 110, 140].map((x) => (
          <ellipse key={x} cx={x + 10} cy="34" rx="14" ry="9" fill="#002255" stroke="#0057B8" strokeWidth="1.5"/>
        ))}
        {/* Pipes */}
        <line x1="20" y1="38" x2="170" y2="38" stroke="#0090D0" strokeWidth="1.5"/>
        {/* Superstructure rear */}
        <rect x="155" y="20" width="32" height="22" rx="2" fill="#006FCF"/>
        {/* Funnel */}
        <rect x="170" y="10" width="10" height="14" rx="2" fill="#FFB400"/>
        {/* Mast */}
        <line x1="35" y1="24" x2="35" y2="38" stroke="#0090D0" strokeWidth="2"/>
        <line x1="25" y1="24" x2="45" y2="24" stroke="#0090D0" strokeWidth="1.5"/>
      </svg>
    );
  }
  // Default: Container ship
  return (
    <svg viewBox="0 0 200 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hull */}
      <path d="M8 52 L18 64 L182 64 L196 52 L188 44 L12 44 Z" fill="#003591" opacity="0.9"/>
      {/* Deck */}
      <rect x="18" y="40" width="164" height="6" rx="1" fill="#0057B8"/>
      {/* Containers row 1 - back */}
      {[20, 38, 56, 74, 92, 110, 128].map((x, i) => (
        <rect key={x} x={x} y="28" width="16" height="14" rx="1"
          fill={['#E63946','#2A9D8F','#E9C46A','#264653','#F4A261','#E76F51','#A8DADC'][i % 7]}
          opacity="0.9"/>
      ))}
      {/* Containers row 2 - front */}
      {[20, 38, 56, 74, 92, 110, 128].map((x, i) => (
        <rect key={x} x={x} y="15" width="16" height="12" rx="1"
          fill={['#264653','#E9C46A','#E63946','#2A9D8F','#F4A261','#A8DADC','#E76F51'][i % 7]}
          opacity="0.9"/>
      ))}
      {/* Superstructure */}
      <rect x="148" y="12" width="38" height="30" rx="2" fill="#006FCF"/>
      {/* Funnel */}
      <rect x="166" y="4" width="12" height="12" rx="2" fill="#FFB400"/>
      <rect x="169" y="1" width="6" height="5" rx="1" fill="#FF8C00"/>
      {/* Bridge windows */}
      {[150, 160, 170].map((x) => (
        <rect key={x} x={x} y="18" width="8" height="6" rx="1" fill="#00BCD4" opacity="0.8"/>
      ))}
      {/* Bow mast */}
      <line x1="22" y1="10" x2="22" y2="28" stroke="#0090D0" strokeWidth="2"/>
      <line x1="14" y1="10" x2="30" y2="10" stroke="#0090D0" strokeWidth="1.5"/>
    </svg>
  );
}
