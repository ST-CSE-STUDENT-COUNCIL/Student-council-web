import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

type ThemeState = {
    theme: Theme
    setTheme: (theme: Theme) => void
    resolvedTheme: 'light' | 'dark'
}

// 시스템 테마 감지
const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// 테마 적용 함수
const applyTheme = (theme: Theme) => {
    const resolved = theme === 'system' ? getSystemTheme() : theme
    const root = document.documentElement

    if (resolved === 'dark') {
        root.classList.add('dark')
    } else {
        root.classList.remove('dark')
    }

    return resolved
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'system',
            resolvedTheme: getSystemTheme(),
            setTheme: (theme) => {
                const resolved = applyTheme(theme)
                set({ theme, resolvedTheme: resolved })
            },
        }),
        {
            name: 'theme-storage',
            onRehydrateStorage: () => (state) => {
                // 저장된 테마 복원 시 적용
                if (state) {
                    applyTheme(state.theme)
                }
            },
        }
    )
)

// 시스템 테마 변경 감지
if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const { theme, setTheme } = useThemeStore.getState()
        if (theme === 'system') {
            setTheme('system') // 재적용
        }
    })

    // 초기 로드 시 테마 적용
    const stored = localStorage.getItem('theme-storage')
    if (stored) {
        try {
            const { state } = JSON.parse(stored)
            if (state?.theme) {
                applyTheme(state.theme)
            }
        } catch {
            applyTheme('system')
        }
    }
}
