import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AccountInfo, LoginData } from '@/types/api'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  accountInfo: AccountInfo | null
  permissions: string[]
  setAuth: (data: LoginData) => void
  setPermissions: (permissions: string[]) => void
  updateTokens: (accessToken: string, refreshToken: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      accountInfo: null,
      permissions: [],

      setAuth: (data: LoginData) =>
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accountInfo: data.accountInfo,
        }),

      setPermissions: (permissions: string[]) => set({ permissions }),

      updateTokens: (accessToken: string, refreshToken: string) =>
        set({ accessToken, refreshToken }),

      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, accountInfo: null, permissions: [] }),
    }),
    {
      name: 'gl-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        accountInfo: state.accountInfo,
        permissions: state.permissions,
      }),
    }
  )
)
