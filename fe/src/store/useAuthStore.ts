import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { User } from '../types/users'

type AuthState = {
    user: User | null
    isAuthenticated: boolean
    accessToken: string | null
    rememberMe: boolean
    login: (user: User, accessToken: string, rememberMe?: boolean) => void
    setUser: (user: User | null) => void
    logout: () => void
}

// rememberMe 상태에 따라 storage 선택
const getStorage = () => {
    // 먼저 localStorage에서 rememberMe 값 확인
    try {
        const stored = localStorage.getItem('auth-storage')
        if (stored) {
            const parsed = JSON.parse(stored)
            if (parsed.state?.rememberMe === false) {
                return sessionStorage
            }
        }
    } catch {
        // ignore
    }
    return localStorage
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            rememberMe: true,
            login: (user, accessToken, rememberMe = true) => {
                // rememberMe가 false면 sessionStorage로 전환
                if (!rememberMe) {
                    // localStorage에서 제거하고 sessionStorage에 저장
                    localStorage.removeItem('auth-storage')
                }
                set({ user, accessToken, isAuthenticated: true, rememberMe })
            },
            setUser: (user) => set({ user }),
            logout: () => {
                // 로그아웃 시 모든 storage 클리어
                localStorage.removeItem('auth-storage')
                sessionStorage.removeItem('auth-storage')
                set({ user: null, accessToken: null, isAuthenticated: false, rememberMe: true })
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => getStorage()),
        },
    ),
)

