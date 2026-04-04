/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        'surface-bright': '#FFFFFF',
        'surface-container': '#F1F5F9',
        'surface-container-high': '#E2E8F0',
        'surface-container-highest': '#CBD5E1',
        'surface-container-low': '#F8FAFC',
        'surface-container-lowest': '#FFFFFF',
        'surface-variant': '#E2E8F0',
        
        primary: {
          DEFAULT: '#16A34A',
          container: '#86EFAC',
          dim: '#15803D',
          fixed: '#BBF7D0'
        },
        
        'on-background': '#0F172A',
        'on-surface': '#0F172A',
        'on-surface-variant': '#475569',
        'on-primary': '#FFFFFF',
        'on-primary-fixed': '#14532D',
        
        error: '#DC2626',
        'error-container': '#FCA5A5',
        'on-error': '#FFFFFF',
        
        warning: '#D97706',
        'warning-container': '#FDE68A',

        outline: '#94A3B8',
        'outline-variant': '#CBD5E1',

        // Weather state colors
        rain: {
          DEFAULT: '#3B82F6',
          light: '#93C5FD',
          bg: '#EFF6FF',
        },
        heat: {
          DEFAULT: '#F97316',
          light: '#FED7AA',
          bg: '#FFF7ED',
        },
        aqi: {
          good: '#16A34A',
          moderate: '#CA8A04',
          unhealthy: '#EA580C',
          severe: '#7C3AED',
          hazardous: '#DC2626',
          bg: '#F5F3FF',
        },
        flood: {
          DEFAULT: '#2563EB',
          bg: '#EFF6FF',
        },
        curfew: {
          DEFAULT: '#9F1239',
          bg: '#FFF1F2',
        },
      },
      fontFamily: {
        heading: ['"Manrope"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(15, 23, 42, 0.08)',
        glow: '0 0 20px rgba(22, 163, 74, 0.25)',
        'glow-sm': '0 0 10px rgba(22, 163, 74, 0.2)',
        card: '0 2px 12px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
}
