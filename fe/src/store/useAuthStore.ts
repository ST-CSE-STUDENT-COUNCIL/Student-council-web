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

// 커스텀 스토리지 구현: rememberMe 상태에 따라 저장소 결정
const authStorage = {
    getItem: (name: string) => {
        // localStorage를 먼저 확인하고, 없으면 sessionStorage 확인
        const local = localStorage.getItem(name)
        if (local) return local
        return sessionStorage.getItem(name)
    },
    setItem: (name: string, value: string) => {
        try {
            const parsed = JSON.parse(value)
            const rememberMe = parsed.state?.rememberMe

            if (rememberMe) {
                localStorage.setItem(name, value)
                sessionStorage.removeItem(name)
            } else {
                sessionStorage.setItem(name, value)
                localStorage.removeItem(name)
            }
        } catch (e) {
            console.error('Failed to save auth state:', e)
            // 에러 발생 시 localStorage에 저장 (fallback)
            localStorage.setItem(name, value)
        }
    },
    removeItem: (name: string) => {
        localStorage.removeItem(name)
        sessionStorage.removeItem(name)
    },
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
                set({ user, accessToken, isAuthenticated: true, rememberMe, isInitialized: true })
            },
            setUser: (user) => set({ user }),
            setAccessToken: (accessToken) => set({ accessToken }),
            logout: () => {
                set({ user: null, accessToken: null, isAuthenticated: false, rememberMe: true, isInitialized: true })
            },
            setInitialized: (value) => set({ isInitialized: value }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => authStorage),
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated,
                rememberMe: state.rememberMe,
                // isInitialized는 저장하지 않음
            }),
            onRehydrateStorage: () => (state) => {
                // isInitialized는 useAuthInit 훅에서 토큰 갱신 후 설정한다.
                // 여기서는 데이터 복원만 완료되었으므로 false 유지 (토큰 유효성은 아직 미확인)
                // 단, accessToken이 없는 경우에만 초기화 완료로 처리
                if (!state?.accessToken) {
                    state?.setInitialized(true)
                }
                // accessToken이 있는 경우: useAuthInit이 refresh 후 true로 설정
            },
        },
    ),
)
