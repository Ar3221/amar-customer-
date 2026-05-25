/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',    // slate 900
          card: '#1e293b',    // slate 800
          border: '#334155',  // slate 700
          accent: '#0ea5e9',  // sky 500
          green: '#10b981',   // emerald 500
          amber: '#f59e0b',   // amber 500
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
