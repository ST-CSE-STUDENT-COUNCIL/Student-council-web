import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { UserProfileResponse } from '../types/users'

export type User = UserProfileResponse

interface AuthState {
    user: User | null
    isAuthenticated: boolean
    accessToken: string | null
    login: (user: User, accessToken: string) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            login: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
            logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage',
        },
    ),
)
