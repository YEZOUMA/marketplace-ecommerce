/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff9f1',
          100: '#d7f0dd',
          500: '#1f9d55',
          600: '#18803f',
          700: '#146633',
        },
      },
    },
  },
  plugins: [],
};
