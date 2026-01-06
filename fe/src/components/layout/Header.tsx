import { Link } from '@tanstack/react-router'
import { useAuthStore } from '../../store/useAuthStore'
import Menu from './Menu'
import { Code2, LogOut, LogIn, UserPlus } from 'lucide-react'

export default function Header() {
    const { isAuthenticated, user, logout } = useAuthStore()

    const handleLogout = () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            logout()
        }
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-md transition-all">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo Area */}
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-slate-900 hover:opacity-80 transition-opacity">
                        <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm">
                            <Code2 className="w-5 h-5" />
                        </div>
                        <span className="tracking-tight hidden sm:inline-block">Computer Science Student Council</span>
                        <span className="tracking-tight sm:hidden">CS App</span>
                    </Link>
                </div>

                {/* Main Navigation - Desktop */}
                <div className="hidden md:block">
                    <Menu />
                </div>

                {/* User Actions */}
                <div className="flex items-center gap-3 text-sm">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-3">
                            <Link
                                to="/mypage"
                                className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                                    <span className="text-xs font-bold">{user?.name?.[0] || 'U'}</span>
                                </div>
                                <span className="font-semibold text-gray-700 hidden lg:inline-block">
                                    {user?.name}
                                </span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                title="로그아웃"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/login"
                                className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                <LogIn className="w-4 h-4" />
                                로그인
                            </Link>
                            <Link
                                to="/signup"
                                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-sm active:scale-95 transition-all"
                            >
                                <UserPlus className="w-4 h-4" />
                                회원가입
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
