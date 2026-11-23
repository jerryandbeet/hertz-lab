/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lab: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          accent: '#2563eb',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          cyan: '#06b6d4',
          purple: '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(15, 23, 42, 0.06)',
        'glass-hover': '0 12px 40px 0 rgba(15, 23, 42, 0.1)',
        'glass-active': '0 4px 16px 0 rgba(15, 23, 42, 0.08)',
        'hud': '0 16px 48px -12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
