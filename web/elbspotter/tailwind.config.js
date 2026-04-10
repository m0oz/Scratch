/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#000b1e',
          900: '#001228',
          800: '#001840',
          700: '#002255',
          600: '#003080',
        },
        airbus: {
          blue: '#003591',
          sky:  '#0090D0',
          pale: '#EEF5FF',
        },
        ship: {
          amber: '#F5A700',
          dark:  '#C47F00',
          pale:  '#FFF7E0',
        },
        beluga: {
          teal:  '#00A896',
          dark:  '#007A6E',
          pale:  '#E4FAF7',
        },
        ink:   '#1A2B4A',
        muted: '#6B84A3',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-in':  'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        bounceIn: {
          '0%':   { opacity: '0', transform: 'scale(0.85) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      boxShadow: {
        card:        '0 2px 12px rgba(0,53,145,0.08)',
        'card-hover':'0 6px 24px rgba(0,53,145,0.14)',
        ship:        '0 4px 20px rgba(245,167,0,0.20)',
        beluga:      '0 4px 20px rgba(0,168,150,0.20)',
      },
    },
  },
  plugins: [],
}
