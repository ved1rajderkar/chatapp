/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        chat: {
          bg: '#f8fafc',
          message: '#ffffff',
          sent: '#3b82f6',
          received: '#f1f5f9',
        },
        premium: {
          gold: '#FFD700',
          navy: '#1a2236',
          black: '#000000',
          white: '#ffffff',
          accent: '#bfa14a',
        },
        grayscale: {
          black: '#000000',
          white: '#ffffff',
          gray: '#888888',
          light: '#f5f5f5',
          dark: '#222222',
        },
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      }
    },
  },
  daisyui: {
    themes: [
      "cupcake", "bumblebee", "emerald", "corporate", "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula", "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee", "winter"
    ],
    darkTheme: "dracula",
    base: true,
    styled: true,
    utils: true,
    logs: false,
    rtl: false,
    prefix: "",
  },
  plugins: [require('daisyui')],
} 