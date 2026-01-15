import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { User } from '../types/users'

type AuthState = {
    user: User | null
    isAuthenticated: boolean
    accessToken: string | null
    login: (user: User, accessToken: string) => void
    setUser: (user: User | null) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            login: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
            setUser: (user) => set((state) => ({ ...state, user })),
            logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage',
        },
    ),
)
