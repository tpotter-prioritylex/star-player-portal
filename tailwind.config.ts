import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1B2A4A',      // Primary color for headers, nav, buttons, sidebar
        cream: '#FAF7F2',     // Page backgrounds, card backgrounds
        teal: '#2A9D8F',      // Active states, links, progress indicators, badges
        gold: '#D4A843',      // Achievements, completion badges, star ratings, alerts
        dark: '#1A1A1A',      // Body text
        muted: '#6B7280',     // Secondary text, timestamps, placeholders
      },
      fontFamily: {
        'sans': ['DM Sans', 'sans-serif'],      // Body / UI
        'serif': ['Instrument Serif', 'serif'], // Headings
        'mono': ['JetBrains Mono', 'monospace'], // Code
      },
      fontWeight: {
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      }
    },
  },
  plugins: [],
} satisfies Config