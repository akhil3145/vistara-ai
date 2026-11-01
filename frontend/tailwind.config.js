/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: 'rgb(var(--c-base) / <alpha-value>)',
        sidebar: 'rgb(var(--c-sidebar) / <alpha-value>)',
        panel: 'rgb(var(--c-panel) / <alpha-value>)',
        raised: 'rgb(var(--c-raised) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        'line-strong': 'rgb(var(--c-line-strong) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        faint: 'rgb(var(--c-faint) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        lime: 'rgb(var(--c-lime) / <alpha-value>)',
        cyan: 'rgb(var(--c-cyan) / <alpha-value>)',
        success: 'rgb(var(--c-success) / <alpha-value>)',
        warning: 'rgb(var(--c-warning) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        panel: '0 18px 45px -30px rgba(0, 0, 0, 0.55)',
        lift: '0 24px 55px -28px rgba(0, 0, 0, 0.65)',
        glow: '0 0 0 1px rgba(32, 201, 176, 0.12), 0 20px 55px -30px rgba(32, 201, 176, 0.35)',
        'inner-line': 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      },
      backgroundImage: {
        'panel-sheen':
          'linear-gradient(140deg, rgb(var(--c-raised) / 0.55) 0%, rgb(var(--c-panel) / 0.1) 52%, transparent 100%)',
        'hero-spot':
          'radial-gradient(ellipse at 78% 18%, rgba(32, 201, 176, 0.16) 0%, transparent 55%), radial-gradient(ellipse at 12% 8%, rgba(56, 189, 248, 0.1) 0%, transparent 45%)',
        'grid-fade':
          'linear-gradient(rgb(var(--c-line) / 0.35) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-line) / 0.35) 1px, transparent 1px)',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        'scan-sweep': {
          '0%': { transform: 'translateY(-10%)', opacity: '0' },
          '15%': { opacity: '0.7' },
          '85%': { opacity: '0.7' },
          '100%': { transform: 'translateY(110%)', opacity: '0' },
        },
        'fade-rise': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.8s ease-in-out infinite',
        'scan-sweep': 'scan-sweep 3.6s ease-in-out infinite',
        'fade-rise': 'fade-rise 320ms ease-out both',
      },
    },
  },
  plugins: [],
}
