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
        }
      }
    },
  },
  plugins: [],
};
