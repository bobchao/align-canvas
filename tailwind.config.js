/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#16a34a',
          light: '#22c55e',
          dark: '#15803d',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'PingFang TC',
          'Microsoft JhengHei',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
