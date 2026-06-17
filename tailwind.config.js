/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0A1410',
        base2: '#0E1B15',
        surface: '#13251D',
        surface2: '#193026',
        line: '#27463A',
        text: '#EAF2EC',
        muted: '#8AA396',
        home: '#28C7F0',
        away: '#FF3D6E',
        lime: '#C6FF3D',
        gold: '#F5C842',
        silver: '#C9D3CE',
        bronze: '#C8915A',
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

