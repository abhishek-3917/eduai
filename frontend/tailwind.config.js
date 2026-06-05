/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // support class-based dark mode
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0F172A',      // deep slate
          card: '#1E293B',    // slate 800
          border: '#334155',  // slate 700
          text: '#F8FAFC',    // slate 50
          muted: '#94A3B8'    // slate 400
        },
        brand: {
          primary: '#8B5CF6',  // violet 500
          hover: '#7C3AED',    // violet 600
          glow: 'rgba(139, 92, 246, 0.15)'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
