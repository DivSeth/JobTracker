import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        'surface-container': 'var(--surface-container)',
        'surface-card': 'var(--surface-card)',
        'surface-container-highest': 'var(--surface-container-highest)',
        primary: {
          DEFAULT: 'var(--primary)',
          dim: 'var(--primary-dim)',
        },
        'on-surface': {
          DEFAULT: 'var(--on-surface)',
          muted: 'var(--on-surface-muted)',
        },
        'outline-variant': 'var(--outline-variant)',
        success: 'var(--success)',
        error: 'var(--error)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        ambient: '0 12px 40px rgba(42, 52, 57, 0.06)',
      },
      fontSize: {
        label: ['0.6875rem', { lineHeight: '1rem', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
}
export default config
