/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.76rem', { lineHeight: '1.15rem' }],
        'xs': ['0.84rem', { lineHeight: '1.3rem' }],
        'sm': ['0.94rem', { lineHeight: '1.45rem' }],
        'base': ['1.05rem', { lineHeight: '1.6rem' }],
        'lg': ['1.18rem', { lineHeight: '1.75rem' }],
        'xl': ['1.32rem', { lineHeight: '1.9rem' }],
        '2xl': ['1.6rem', { lineHeight: '2.15rem' }],
        '3xl': ['2rem', { lineHeight: '2.45rem' }],
      },
      colors: {
        oomapas: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36abf7',
          500: '#0d90e6',
          600: '#0272c4',
          700: '#035ba0',
          800: '#074d83',
          900: '#0c416e',
          950: '#082947',
        },
        navy: {
          850: '#0e1f36',
          900: '#0b192c',
          950: '#060d17',
        },
      },
      boxShadow: {
        'card-subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 8px 24px -4px rgba(11, 25, 44, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 16px 32px -4px rgba(11, 25, 44, 0.1)',
        'glow-primary': '0 0 20px -3px rgba(2, 132, 199, 0.25)',
      },
    },
  },
  plugins: [],
}
