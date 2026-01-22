import { Link, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '../../store/useAuthStore'
import { authApi } from '../../lib/api/auth'
import { navItems } from './Menu'
import Menu from './Menu'
import { Code2, LogOut, LogIn, UserPlus, Menu as MenuIcon, X } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
    const { isAuthenticated, user, logout } = useAuthStore()
    const navigate = useNavigate()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
    const closeMenu = () => setIsMenuOpen(false)

    const handleLogout = async () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            try {
                await authApi.logout()
            } catch (err) {
                console.error('로그아웃 API 호출 실패:', err)
            }
            logout()
            navigate({ to: '/' })
        }
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-indigo-50/80 bg-white/95 backdrop-blur-xl transition-all shadow-sm" role="banner">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo Area */}
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-slate-900 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg" aria-label="홈으로 이동">
                        <div className="bg-slate-900 p-1.5 rounded-lg text-white shadow-sm">
                            <Code2 className="w-5 h-5" />
                        </div>
                        <span className="tracking-tight hidden sm:inline-block">서울과학기술대학교 컴퓨터공학과 학생회</span>
                        <span className="tracking-tight sm:hidden">ST 컴퓨터공학과 학생회</span>
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
                                className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                aria-label="마이페이지로 이동"
                            >
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                    <span className="text-xs font-bold">{user?.name?.[0] || 'U'}</span>
                                </div>
                                <span className="font-semibold text-gray-700 hidden lg:inline-block">
                                    {user?.name}
                                </span>
                            </Link>
                            {(user?.role === 'admin' || user?.role === 'council') && (
                                <Link
                                    to="/admin"
                                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                >
                                    <span>⚙️ 관리자</span>
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                title="로그아웃"
                                aria-label="로그아웃"
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
                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-gray-600 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                        onClick={toggleMenu}
                        aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
                        aria-expanded={isMenuOpen}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white absolute top-16 left-0 w-full shadow-lg h-[calc(100vh-4rem)] overflow-y-auto" role="dialog" aria-label="모바일 네비게이션">
                    <nav className="flex flex-col p-4 space-y-2" role="navigation" aria-label="주요 메뉴">
                        {navItems.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                search={item.search}
                                onClick={closeMenu}
                                className="px-4 py-3 text-base font-medium text-gray-600 rounded-xl hover:bg-gray-50 hover:text-indigo-600 [&.active]:text-indigo-700 [&.active]:bg-indigo-50 transition-all flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                {item.label}
                                <span className="text-gray-300">›</span>
                            </Link>
                        ))}
                        {/* Mobile User Actions (Optional if you want to duplicate or keep header actions visible. Header actions are visible so maybe just navigation here) */}
                    </nav>
                </div>
            )}
        </header>
    )
}
