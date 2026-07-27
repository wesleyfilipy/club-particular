/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#090a0f',
        surface: '#12141d',
        'surface-elevated': '#1a1d29',
        gold: {
          light: '#f5d77f',
          DEFAULT: '#d4af37',
          dark: '#997d2e',
        },
        border: '#282c3d',
      },
    },
  },
  plugins: [],
}
