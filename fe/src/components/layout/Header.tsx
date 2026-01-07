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
        <header className="sticky top-0 z-50 w-full border-b border-indigo-50/80 bg-white/95 backdrop-blur-xl transition-all shadow-sm">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo Area */}
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-slate-900 hover:opacity-80 transition-opacity">
                        <div className="bg-slate-900 p-1.5 rounded-lg text-white shadow-sm">
                            <Code2 className="w-5 h-5" />
                        </div>
                        <span className="tracking-tight hidden sm:inline-block">서울과학기술대학교 컴퓨터공학과 학생회</span>
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
                                className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                            >
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                    <span className="text-xs font-bold">{user?.name?.[0] || 'U'}</span>
                                </div>
                                <span className="font-semibold text-gray-700 hidden lg:inline-block">
                                    {user?.name}
                                </span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                title="로그아웃"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/login"
                                className="flex items-center gap-1.5 px-4 py-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors"
                            >
                                <LogIn className="w-4 h-4" />
                                로그인
                            </Link>
                            <Link
                                to="/signup"
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm shadow-indigo-200 active:scale-95 transition-all"
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
