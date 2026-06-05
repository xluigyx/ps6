/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: "var(--th-bg)",
          surface: "var(--th-surface)",
          text: "var(--th-text)",
          border: "var(--th-border)",
          primary: "var(--th-primary)",
          secondary: "var(--th-secondary)",
          accent: "var(--th-accent)",
          danger: "var(--th-danger)",
          success: "var(--th-success)",
          shadow: "var(--th-shadow)",
        },
        cyber: {
          bg:      '#07090F',
          surface: '#0D1117',
          card:    '#111827',
          border:  '#1E293B',
          cyan:    '#00F5FF',
          lime:    '#39FF14',
          yellow:  '#FFE600',
          red:     '#FF2D55',
          purple:  '#BF5AF2',
          orange:  '#FF9F0A',
          text:    '#F1F5F9',
          muted:   '#64748B',
          dim:     '#1E2D45',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'brutal':        '4px 4px 0px #000000',
        'brutal-cyan':   '4px 4px 0px #00F5FF',
        'brutal-lime':   '4px 4px 0px #39FF14',
        'brutal-red':    '4px 4px 0px #FF2D55',
        'brutal-yellow': '4px 4px 0px #FFE600',
        'brutal-purple': '4px 4px 0px #BF5AF2',
        'brutal-lg':     '6px 6px 0px #000000',
        'neon-cyan':     '0 0 20px rgba(0,245,255,0.4)',
        'neon-lime':     '0 0 20px rgba(57,255,20,0.4)',
        'neon-red':      '0 0 20px rgba(255,45,85,0.4)',
      },
      borderWidth: { '3': '3px' },
      animation: {
        'pulse-glow':  'pulseGlow 2s ease-in-out infinite',
        'scan-line':   'scanLine 2s linear infinite',
        'matrix-in':   'matrixIn 0.5s ease-out',
        'slide-up':    'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'slide-in':    'slideIn 0.4s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':     'fadeIn 0.4s ease-out',
        'ticker':      'ticker 25s linear infinite',
        'bounce-soft': 'bounceSoft 1.2s ease-in-out infinite',
        'shake':       'shake 0.4s ease-in-out',
        'flicker':     'flicker 3s step-end infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0,245,255,0.2)' },
          '50%':      { boxShadow: '0 0 30px rgba(0,245,255,0.7)' },
        },
        scanLine: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        matrixIn: {
          '0%':   { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-6px)' },
          '40%':      { transform: 'translateX(6px)' },
          '60%':      { transform: 'translateX(-4px)' },
          '80%':      { transform: 'translateX(4px)' },
        },
        flicker: {
          '0%, 94%, 96%, 100%': { opacity: '1' },
          '95%':                 { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};

