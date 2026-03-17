/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f3f0ff',
          100: '#e9e3ff',
          200: '#d4cbff',
          300: '#b5a8ff',
          400: '#9476ff',
          500: '#7c3aed',  // primary violet
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#0a0014',  // deep space bg
        },
      },
      animation: {
        'pulse-slow':   'pulse 6s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-slower': 'pulse 9s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':        'float 4s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(109,40,217,0.05) 100%)',
      },
    },
  },
  plugins: [],
};