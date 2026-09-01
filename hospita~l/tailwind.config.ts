import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // IntegraMed brand palette
        primary: {
          DEFAULT: '#413074',
          50:  '#f0eef8',
          100: '#d9d4ef',
          200: '#b3a9de',
          300: '#8d7ece',
          400: '#6753bd',
          500: '#413074',
          600: '#372860',
          700: '#2d204d',
          800: '#22183a',
          900: '#181026',
        },
        secondary: {
          DEFAULT: '#736FA1',
          50:  '#f4f3f9',
          100: '#e1e0ef',
          200: '#c3c1de',
          300: '#a5a2ce',
          400: '#8783bd',
          500: '#736FA1',
          600: '#5f5b87',
          700: '#4c476d',
          800: '#383453',
          900: '#25213a',
        },
        accent: {
          DEFAULT: '#0FB7B8',
          50:  '#e6fafa',
          100: '#b0f0f0',
          200: '#7ae5e6',
          300: '#44dbdb',
          400: '#0FB7B8',
          500: '#0d9fa0',
          600: '#0b8788',
          700: '#096f70',
          800: '#075758',
          900: '#053f3f',
        },
        surface: {
          DEFAULT: '#F7F8FA',
          50:  '#ffffff',
          100: '#F7F8FA',
          200: '#eef0f3',
          300: '#dde1e7',
          400: '#ccd2db',
          500: '#bbc3cf',
        },
        // Status de leitos
        bed: {
          available:   '#0FB7B8',   // Disponível — teal
          occupied:    '#e53e3e',   // Ocupado — vermelho
          cleaning:    '#f6ad55',   // Limpeza — amarelo
          maintenance: '#718096',   // Manutenção — cinza
          reserved:    '#413074',   // Reservado — roxo
          blocked:     '#2d3748',   // Bloqueado — escuro
        },
      },
      fontFamily: {
        sans: ['Amaranth', 'system-ui', 'sans-serif'],
        display: ['League Spartan', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(65,48,116,0.08), 0 1px 2px -1px rgba(65,48,116,0.08)',
        'card-hover': '0 4px 6px -1px rgba(65,48,116,0.12), 0 2px 4px -2px rgba(65,48,116,0.08)',
      },
    },
  },
  plugins: [],
}

export default config
