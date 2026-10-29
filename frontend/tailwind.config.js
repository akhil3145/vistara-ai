/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0B1120', // deep background
          900: '#131E36', // panel/sidebar background
          850: '#1A2849', // elevated card
          800: '#223354', // subtle borders
          700: '#2F426A',
          600: '#435882',
        },
        slate: {
          850: '#151F33',
        },
        teal: {
          DEFAULT: '#14B8A6',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
        },
        sky: {
          DEFAULT: '#0EA5E9',
          500: '#0EA5E9',
          600: '#0284C7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}

