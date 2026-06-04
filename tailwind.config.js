/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg:       '#0A0E1A',
          surface:  '#111827',
          card:     '#1a2235',
          border:   '#1e2d45',
          cyan:     '#00F5FF',
          lime:     '#39FF14',
          yellow:   '#FFE600',
          red:      '#FF2D55',
          purple:   '#BF5AF2',
          orange:   '#FF9F0A',
          text:     '#E2E8F0',
          muted:    '#64748B',
        }
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan':   '0 0 20px rgba(0, 245, 255, 0.5), 0 0 40px rgba(0, 245, 255, 0.2)',
        'neon-lime':   '0 0 20px rgba(57, 255, 20, 0.5), 0 0 40px rgba(57, 255, 20, 0.2)',
        'neon-red':    '0 0 20px rgba(255, 45, 85, 0.5), 0 0 40px rgba(255, 45, 85, 0.2)',
        'neon-yellow': '0 0 20px rgba(255, 230, 0, 0.4), 0 0 40px rgba(255, 230, 0, 0.15)',
        'card':        '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-glow':  'pulseGlow 2s ease-in-out infinite',
        'scan':        'scan 2s linear infinite',
        'matrix-fall': 'matrixFall 1s ease-out',
        'glitch':      'glitch 0.3s ease-in-out infinite',
        'slide-up':    'slideUp 0.4s ease-out',
        'fade-in':     'fadeIn 0.5s ease-out',
        'spin-slow':   'spin 3s linear infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
        'ticker':      'ticker 20s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0,245,255,0.3)' },
          '50%':      { boxShadow: '0 0 30px rgba(0,245,255,0.8), 0 0 60px rgba(0,245,255,0.3)' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        matrixFall: {
          '0%':   { opacity: 0, transform: 'translateY(-20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '25%':      { transform: 'translate(-2px, 1px)' },
          '50%':      { transform: 'translate(2px, -1px)' },
          '75%':      { transform: 'translate(-1px, 2px)' },
        },
        slideUp: {
          '0%':   { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: 0 },
          '100%': { opacity: 1 },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'grid-cyber': `
          linear-gradient(rgba(0,245,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,245,255,0.04) 1px, transparent 1px)
        `,
        'gradient-cyber': 'linear-gradient(135deg, #0A0E1A 0%, #111827 50%, #0d1f3c 100%)',
      },
      backgroundSize: {
        'grid-40': '40px 40px',
      },
    },
  },
  plugins: [],
}
