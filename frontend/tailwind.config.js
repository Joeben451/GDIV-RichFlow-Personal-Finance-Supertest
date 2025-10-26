/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        dark: '#1E1E1E',
        gold: '#EDCA69',
        purple: '#7345AF'
      }
    },
  },
  plugins: [],
}
