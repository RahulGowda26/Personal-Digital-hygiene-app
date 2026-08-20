/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        theme: {
          1: '#E6223A',
          2: '#690722',
          3: '#621D43',
          4: '#644765',
          5: '#374365',
          6: '#062A48',
          7: '#03213D',
        },
        paper: {
          50: '#fdfdfb',
          100: '#f9f9f6',
          200: '#f1f1e8',
          300: '#e5e5d3',
          400: '#d5d5b7',
        }
      },
      fontFamily: {
        hand: ['"Patrick Hand"', 'cursive'],
        marker: ['"Kalam"', 'cursive'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
