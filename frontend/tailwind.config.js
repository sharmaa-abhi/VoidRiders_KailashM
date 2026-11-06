/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ivory: '#F1EFE8',
        softwhite: '#FAF9F5',
        navy: {
          DEFAULT: '#111923',
          light: '#182333',
          dark: '#0b1118',
          card: '#131b26',
        },
        teal: {
          DEFAULT: '#477F7C',
          light: '#55B7AE',
          dark: '#2E5F5D',
          muted: 'rgba(71, 127, 124, 0.2)',
        },
        gold: {
          DEFAULT: '#B18B56',
          light: '#C9A36D',
          dark: '#8C6B3A',
        },
        stone: {
          DEFAULT: '#E2DDD3',
          light: '#ECE8E1',
          dark: '#C8C2B5',
        },
        theme: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          panel: 'var(--color-panel)',
          border: 'var(--color-border)',
          muted: 'var(--color-muted)',
          text: 'var(--color-text)',
          subtext: 'var(--color-subtext)',
        }
      }
    },
  },
  plugins: [],
}
