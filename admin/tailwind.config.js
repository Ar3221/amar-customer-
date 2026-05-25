/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        industrial: {
          950: '#09090b', // deep rich black (Apple/Tesla style)
          900: '#18181b', // onyx card backing
          800: '#27272a', // charcoal borders
          750: '#3f3f46', // cool gray highlights
          DEFAULT: '#a1a1aa'
        },
        brand: {
          glow: '#00f2fe',
          cyan: '#06b6d4',
          emerald: '#10b981',
          orange: '#f97316',
          escalate: '#ef4444'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-fade': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
