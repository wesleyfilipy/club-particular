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
        dark: '#010013',
        surface: '#0b0a1f',
        'surface-elevated': '#13122b',
        gold: {
          light: '#a8aeff',
          DEFAULT: '#6b76ff',
          dark: '#3e4be1',
        },
        border: '#25244a',
      },
    },
  },
  plugins: [],
}
