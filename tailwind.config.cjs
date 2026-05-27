/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        apex: {
          bg: 'rgba(10, 12, 16, 0.78)',
          border: 'rgba(228, 64, 64, 0.6)',
          accent: '#e44040',
          text: '#f5f5f5',
          dim: '#a8a8a8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
}
