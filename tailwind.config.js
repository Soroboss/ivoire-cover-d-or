/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#EA580C',
          'orange-glow': '#F97316',
          hover: '#C2410C',
          dark: '#0f172a',
          'dark-mid': '#1e293b',
          gray: '#475569',
          lightgray: '#f1f5f9',
          muted: '#94a3b8',
          cream: '#FFFBF7',
          surface: '#ffffff',
          line: 'rgba(15, 23, 42, 0.08)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 24px -4px rgba(15, 23, 42, 0.08), 0 8px 16px -8px rgba(234, 88, 12, 0.12)',
        'soft-lg': '0 12px 40px -8px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(234, 88, 12, 0.08)',
        'glow-orange': '0 0 0 1px rgba(234, 88, 12, 0.15), 0 8px 32px -4px rgba(234, 88, 12, 0.25)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        'mesh-dark':
          'radial-gradient(ellipse 120% 80% at 100% -20%, rgba(234, 88, 12, 0.22) 0%, transparent 50%), radial-gradient(ellipse 80% 60% at -10% 110%, rgba(249, 115, 22, 0.12) 0%, transparent 45%), linear-gradient(180deg, #0f172a 0%, #111827 100%)',
        'mesh-app':
          'radial-gradient(ellipse 100% 100% at 100% 0%, rgba(234, 88, 12, 0.06) 0%, transparent 42%), radial-gradient(ellipse 80% 80% at 0% 100%, rgba(15, 23, 42, 0.04) 0%, transparent 50%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      },
    },
  },
  plugins: [],
}
