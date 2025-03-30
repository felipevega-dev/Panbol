/** @type {import('tailwindcss').Config} */
module.exports = {
  // Actualización para incluir todas las rutas a los archivos de componentes
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}
