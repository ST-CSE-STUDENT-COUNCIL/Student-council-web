import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { User } from '../types/users'

type AuthState = {
    user: User | null
    isAuthenticated: boolean
    accessToken: string | null
    rememberMe: boolean
    isInitialized: boolean  // 초기화 완료 여부
    login: (user: User, accessToken: string, rememberMe?: boolean) => void
    setUser: (user: User | null) => void
    setAccessToken: (token: string) => void
    logout: () => void
    setInitialized: (value: boolean) => void
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
            isInitialized: false,
            login: (user, accessToken, rememberMe = true) => {
                // rememberMe가 false면 sessionStorage로 전환
                if (!rememberMe) {
                    // localStorage에서 제거하고 sessionStorage에 저장
                    localStorage.removeItem('auth-storage')
                }
                set({ user, accessToken, isAuthenticated: true, rememberMe, isInitialized: true })
            },
            setUser: (user) => set({ user }),
            setAccessToken: (accessToken) => set({ accessToken }),
            logout: () => {
                // 로그아웃 시 모든 storage 클리어
                localStorage.removeItem('auth-storage')
                sessionStorage.removeItem('auth-storage')
                set({ user: null, accessToken: null, isAuthenticated: false, rememberMe: true, isInitialized: true })
            },
            setInitialized: (value) => set({ isInitialized: value }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => getStorage()),
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated,
                rememberMe: state.rememberMe,
                // isInitialized는 저장하지 않음 (매 세션마다 갱신 시도)
            }),
        },
    ),
)
