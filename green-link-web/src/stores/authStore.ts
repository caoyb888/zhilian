import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AccountInfo, LoginData } from '@/types/api'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  accountInfo: AccountInfo | null
  setAuth: (data: LoginData) => void
  updateTokens: (accessToken: string, refreshToken: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      accountInfo: null,

      setAuth: (data: LoginData) =>
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accountInfo: data.accountInfo,
        }),

      updateTokens: (accessToken: string, refreshToken: string) =>
        set({ accessToken, refreshToken }),

      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, accountInfo: null }),
    }),
    {
      name: 'gl-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        accountInfo: state.accountInfo,
      }),
    }
  )
)
