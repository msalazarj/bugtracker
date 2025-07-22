// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // Esto le dice a Tailwind que escanee todos los archivos JS, JSX, TS, TSX dentro de la carpeta src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};