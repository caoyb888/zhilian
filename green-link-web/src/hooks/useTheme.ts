import { useThemeStore } from '@/stores/themeStore'
import { COMPONENT_THEMES, type ThemeKey } from '@/styles/themeSchema'

/**
 * 主题 Hook：读取当前激活主题，返回对应 Tailwind 类名组合
 */
export function useTheme() {
  const currentTheme = useThemeStore((state) => state.currentTheme)
  const setTheme = useThemeStore((state) => state.setTheme)

  const theme = COMPONENT_THEMES[currentTheme] ?? COMPONENT_THEMES['nordic']

  return {
    themeKey: currentTheme,
    setTheme,
    theme,
    isTheme: (key: ThemeKey) => currentTheme === key,
  }
}
