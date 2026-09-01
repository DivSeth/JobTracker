import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./entrypoints/**/*.{ts,tsx,html}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        surface: '#f7f9fb',
        'surface-card': '#ffffff',
        'surface-container': '#e8eff3',
        primary: '#0053db',
        'primary-dim': '#003da6',
        success: '#22c55e',
        error: '#ef4444',
        'on-surface': '#1a1a2e',
        'on-surface-muted': '#6b7f88',
        'outline-variant': 'rgba(107, 127, 136, 0.15)',
      },
    },
  },
  plugins: [],
}

export default config
