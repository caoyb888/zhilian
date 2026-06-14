/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // === 运行时主题变量（由 <html data-theme> 控制）===
        theme: {
          bg: 'var(--theme-bg)',
          surface: 'var(--theme-surface)',
          border: 'var(--theme-border)',
          'text-main': 'var(--theme-text-main)',
          'text-muted': 'var(--theme-text-muted)',
          accent: 'var(--theme-accent)',
          'accent-hover': 'var(--theme-accent-hover)',
          'accent-fg': 'var(--theme-accent-fg)',
        },
        // === 保留原有 emerald 品牌色阶（兼容旧代码过渡）===
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
          // 风格 A：智慧极客绿（Tech-Sleek Eco）
          tech: {
            bg: '#020617',
            surface: '#0f172a',
            neon: '#34d399',
            cyan: '#22d3ee',
            border: '#1e293b',
          },
          // 风格 B：清新北欧绿（Clean Nordic）
          nordic: {
            bg: '#fafaf9',
            surface: '#ffffff',
            forest: '#047857',
            clay: '#78716c',
            border: '#e7e5e4',
          },
          // 风格 C：商务蔚蓝绿（Vibrant Blue-Green）
          office: {
            bg: '#f8fafc',
            surface: '#ffffff',
            navy: '#0369a1',
            mint: '#059669',
            border: '#e2e8f0',
          },
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        nordic: '0 4px 20px -2px rgb(4 120 87 / 0.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '0.25' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateX(-50%) translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.7s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
