// Shared design tokens & style helpers.

import type { CSSProperties } from 'react';

export const C = {
  green: '#58CC02',
  greenDark: '#46A302',
  blue: '#1CB0F6',
  blueDark: '#168FCC',
  yellow: '#FFC800',
  red: '#FF4B4B',
  purple: '#A560E8',
  pink: '#FF86A8',
  bg: '#FFFAEC',
  card: '#FFFFFF',
  text: '#2D3436',
  textSoft: '#5B6770',
  border: '#E5E7EB',
  borderSoft: '#F0F1F4',
  shadow: 'rgba(0, 0, 0, 0.06)',
};

// Big juicy "Duolingo" style 3D button with bottom shadow that compresses on click.
export function bigBtn(color: string, opts: { width?: string | number; small?: boolean } = {}): CSSProperties {
  return {
    background: color,
    color: 'white',
    border: 'none',
    borderRadius: 14,
    padding: opts.small ? '10px 18px' : '14px 24px',
    fontSize: opts.small ? 14 : 16,
    fontWeight: 800,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    boxShadow: `0 4px 0 ${darken(color)}`,
    transition: 'transform 80ms ease, box-shadow 80ms ease',
    width: opts.width,
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  };
}

// Slightly darker shade for shadow / bottom edge.
function darken(hex: string): string {
  const h = hex.replace('#', '');
  const r = Math.max(0, parseInt(h.slice(0, 2), 16) - 38);
  const g = Math.max(0, parseInt(h.slice(2, 4), 16) - 38);
  const b = Math.max(0, parseInt(h.slice(4, 6), 16) - 38);
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

export const card: CSSProperties = {
  background: C.card,
  borderRadius: 18,
  padding: 20,
  boxShadow: `0 2px 0 ${C.borderSoft}, 0 0 0 2px ${C.borderSoft}`,
};

export const pageWrap: CSSProperties = {
  maxWidth: 760,
  margin: '0 auto',
  padding: '20px 16px 80px',
};

export const h1: CSSProperties = {
  fontSize: 32,
  fontWeight: 900,
  margin: '0 0 6px',
  letterSpacing: '-0.5px',
};

export const h2: CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  margin: '0 0 8px',
};

export const muted: CSSProperties = {
  color: C.textSoft,
  fontSize: 15,
};
