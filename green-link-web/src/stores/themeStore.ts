import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeKey } from '@/styles/themeSchema'

interface ThemeState {
  currentTheme: ThemeKey
  setTheme: (theme: ThemeKey) => void
}

function applyThemeToDOM(theme: ThemeKey) {
  document.documentElement.setAttribute('data-theme', theme)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: 'nordic',
      setTheme: (theme: ThemeKey) => {
        applyThemeToDOM(theme)
        set({ currentTheme: theme })
      },
    }),
    {
      name: 'gl-theme',
      partialize: (state) => ({ currentTheme: state.currentTheme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDOM(state.currentTheme)
        }
      },
    }
  )
)
