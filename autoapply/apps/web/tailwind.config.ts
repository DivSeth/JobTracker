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
        background: 'var(--background)',
        surface: {
          DEFAULT: 'var(--surface-container)',
          abyss: 'var(--surface-abyss)',
          card: 'var(--surface-card)',
          variant: 'var(--surface-variant)',
          bright: 'var(--surface-bright)',
          container: 'var(--surface-container)',
          'container-low': 'var(--surface-container-low)',
          'container-high': 'var(--surface-container-high)',
          'container-highest': 'var(--surface-container-highest)',
          'container-lowest': 'var(--surface-container-lowest)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          container: 'var(--primary-container)',
          fixed: 'var(--primary-fixed)',
          'fixed-dim': 'var(--primary-fixed-dim)',
          dim: 'var(--primary-container)',
        },
        'electric-indigo': 'var(--electric-indigo)',
        'deep-violet': 'var(--deep-violet)',
        secondary: {
          DEFAULT: 'var(--secondary)',
          container: 'var(--secondary-container)',
        },
        tertiary: {
          DEFAULT: 'var(--tertiary)',
          container: 'var(--tertiary-container)',
        },
        'on-surface': {
          DEFAULT: 'var(--on-surface)',
          variant: 'var(--on-surface-variant)',
          muted: 'var(--on-surface-variant)',
        },
        'on-primary': 'var(--on-primary)',
        outline: {
          DEFAULT: 'var(--outline)',
          variant: 'var(--outline-variant)',
        },
        'success-vibrant': 'var(--success-vibrant)',
        'error-vibrant': 'var(--error-vibrant)',
        'warning-vibrant': 'var(--warning-vibrant)',
        // backward-compat aliases
        success: 'var(--success-vibrant)',
        error: 'var(--error-vibrant)',
        'border-glow': 'var(--border-glow)',
        'border-subtle': 'var(--border-whisper)',
        'border-whisper': 'var(--border-whisper)',
      },
      fontFamily: {
        display: ['var(--font-geist-sans)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',
        '2xl': '0.75rem',
        card: '0.5rem',
        full: '9999px',
      },
      spacing: {
        sidebar: '220px',
      },
      boxShadow: {
        ambient: '0 12px 40px rgba(0,0,0,0.2)',
        card: 'var(--shadow-card)',
      },
      fontSize: {
        label: ['0.6875rem', { lineHeight: '1rem', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
}

export default config
