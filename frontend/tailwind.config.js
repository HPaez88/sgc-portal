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
      // Escalan con --escala-texto (Accesibilidad). Interlineado sin unidades para que crezca con la letra.
      fontSize: {
        '2xs': ['calc(0.6875rem * var(--escala-texto, 1))', { lineHeight: '1.45' }],
        'xs': ['calc(0.75rem * var(--escala-texto, 1))', { lineHeight: '1.45' }],
        'sm': ['calc(0.875rem * var(--escala-texto, 1))', { lineHeight: '1.5' }],
        'base': ['calc(1rem * var(--escala-texto, 1))', { lineHeight: '1.5' }],
        'lg': ['calc(1.125rem * var(--escala-texto, 1))', { lineHeight: '1.45' }],
        'xl': ['calc(1.25rem * var(--escala-texto, 1))', { lineHeight: '1.4' }],
        '2xl': ['calc(1.5rem * var(--escala-texto, 1))', { lineHeight: '1.33' }],
        '3xl': ['calc(1.875rem * var(--escala-texto, 1))', { lineHeight: '1.2' }],
        '4xl': ['calc(2.25rem * var(--escala-texto, 1))', { lineHeight: '1.15' }],
      },
      colors: {
        // Línea de diseño institucional (logo OOMAPAS de Cajeme). El azul profundo de la plataforma (navy) se mantiene.
        marca: { azul: '#0083C0', 'azul-oscuro': '#005B86', verde: '#76BE44', 'verde-claro': '#B1D681' },
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
