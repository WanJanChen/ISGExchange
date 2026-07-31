/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rosequartz: {
          50: '#fff8f7',
          100: '#fdeeed',
          200: '#f9dedd',
          300: '#f7cac9',
          400: '#e9a9aa',
          500: '#d78c91',
          600: '#b96f79',
          700: '#985661',
        },
        serenity: {
          50: '#f5f7fb',
          100: '#ebeff7',
          200: '#d9e0ee',
          300: '#bccae1',
          400: '#92a8d1',
          500: '#7791c1',
          600: '#5f78a9',
          700: '#4a5e87',
        },
      },
    },
  },
  plugins: [],
}
