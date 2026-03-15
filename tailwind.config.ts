import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#fdf4f0',
          100: '#fae5db',
          200: '#f4c8b2',
          300: '#eca17f',
          400: '#e2754d',
          500: '#d4522a',
          600: '#b8411f',
          700: '#98331b',
          800: '#7d2c1c',
          900: '#68261a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
