/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        dark: '#050505',
        surface: '#0e0d0b',
        'surface-elevated': '#17150f',
        gold: {
          light: '#e8c766',
          DEFAULT: '#d4af37',
          dark: '#a8801f',
        },
        border: '#2c2818',
      },
    },
  },
  plugins: [],
}
