import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../../store/useThemeStore'

export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useThemeStore()

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    }

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label={resolvedTheme === 'dark' ? "라이트 모드로 전환" : "다크 모드로 전환"}
            title={resolvedTheme === 'dark' ? "라이트 모드로 전환" : "다크 모드로 전환"}
        >
            <div className="relative w-5 h-5">
                <Sun
                    className={`absolute inset-0 w-full h-full transition-all duration-500 transform ${resolvedTheme === 'dark'
                            ? '-rotate-90 opacity-0 scale-0'
                            : 'rotate-0 opacity-100 scale-100 text-amber-500'
                        }`}
                />
                <Moon
                    className={`absolute inset-0 w-full h-full transition-all duration-500 transform ${resolvedTheme === 'dark'
                            ? 'rotate-0 opacity-100 scale-100 text-indigo-400'
                            : 'rotate-90 opacity-0 scale-0'
                        }`}
                />
            </div>
        </button>
    )
}
