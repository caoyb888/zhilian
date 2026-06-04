/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // 保留原有通用 emerald 色阶（AGENTS.md 品牌主色 #10b981）
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
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
  plugins: [],
}
