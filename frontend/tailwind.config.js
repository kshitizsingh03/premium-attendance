/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        premium: {
          50: '#f0f4f8',
          100: '#dbeafe',
          500: '#3b82f6',
          900: '#1e3a8a',
          dark: '#0f172a',
          card: 'rgba(30, 41, 59, 0.7)', // Translucent dark
          border: 'rgba(255, 255, 255, 0.1)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'premium-glow': 'conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)',
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(0,0,0,0.5)',
        'btn': '0 4px 14px 0 rgba(0, 118, 255, 0.39)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
      }
    },
  },
  plugins: [],
}
