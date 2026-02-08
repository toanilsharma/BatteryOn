/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic Brand Colors (Commercial Grade)
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Primary Action
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a', // Deep Navy (Industrial Trust)
          950: '#172554',
        },
        // Industrial Safety Colors
        industrial: {
          surface: '#0f172a', // Dark mode background
          paper: '#1e293b',   // Card background
          border: '#334155',
          text: '#f8fafc',
          muted: '#94a3b8',
        },
        safety: {
          success: '#10b981', // Emerald
          warning: '#f59e0b', // Amber
          danger: '#ef4444',  // Red
          info: '#0ea5e9',    // Sky
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Oswald', 'sans-serif'], // For industrial headers
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      boxShadow: {
        'glow': '0 0 15px rgba(59, 130, 246, 0.5)',
        'glow-danger': '0 0 15px rgba(239, 68, 68, 0.5)',
      }
    },
  },
  plugins: [],
}