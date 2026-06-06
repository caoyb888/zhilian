import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeKey } from '@/styles/themeSchema'

interface ThemeState {
  currentTheme: ThemeKey
  setTheme: (theme: ThemeKey) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: 'nordic',
      setTheme: (theme: ThemeKey) => set({ currentTheme: theme }),
    }),
    {
      name: 'gl-theme',
      partialize: (state) => ({ currentTheme: state.currentTheme }),
    }
  )
)
