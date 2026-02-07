/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 时尚风配色
        primary: {
          50: '#faf9f7',
          100: '#f5f3f0',
          200: '#e8e4de',
          300: '#d4cdc3',
          400: '#b8ad9e',
          500: '#9d8e7b',
          600: '#8a7a66',
          700: '#726454',
          800: '#5f5347',
          900: '#50463c',
          950: '#2a241f',
        },
        accent: {
          50: '#fdf9ef',
          100: '#faf0d5',
          200: '#f4dfa9',
          300: '#ecc973',
          400: '#e4ae42',
          500: '#c9a050',  // 金色主色
          600: '#b8862a',
          700: '#996624',
          800: '#7d5124',
          900: '#684321',
          950: '#3b220f',
        },
        dark: '#1a1a1a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
