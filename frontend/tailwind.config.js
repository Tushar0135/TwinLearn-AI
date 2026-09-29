/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F4F3FD',
          100: '#E8E5FB',
          200: '#CDC6F5',
          300: '#AEA1ED',
          400: '#8D7CE3',
          500: '#6E58D6',
          600: '#5639C2',
          700: '#452BA0',
          800: '#372480',
          900: '#2B1C63',
        },
        dark: {
          50: '#F7F7FA',
          100: '#EEEDF3',
          600: '#3A3652',
          700: '#2A2740',
          800: '#1C1A2E',
          900: '#131223',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};