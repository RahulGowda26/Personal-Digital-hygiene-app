/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#121212',
          surface: '#18181b',
          surface2: '#27272a',
          neon: '#ff2a42',
          neonDark: '#cc1e32',
          text: '#f4f4f5',
          textMuted: '#a1a1aa'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outline: ['Oswald', 'sans-serif'],
        cursive: ['"Great Vibes"', 'cursive'],
      },
      backgroundImage: {
        'scanline': 'linear-gradient(rgba(18, 18, 18, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
      },
      backgroundSize: {
        'scanline-size': '100% 4px, 3px 100%',
      }
    },
  },
  plugins: [],
};
