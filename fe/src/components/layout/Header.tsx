import { Link, useNavigate, useLocation } from '@tanstack/react-router'
import { useAuthStore } from '../../store/useAuthStore'
import { authApi } from '../../lib/api/auth'
import { navItems } from './Menu'
import { ADMIN_MENU_ITEMS } from './AdminSidebar'
import Menu from './Menu'
import { Code2, LogOut, LogIn, UserPlus, Menu as MenuIcon, X, Search } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ThemeToggle } from '../common/ThemeToggle'

export default function Header() {
    const { isAuthenticated, user, logout } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()
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
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md transition-all shadow-sm dark:shadow-none supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#020617]/60" role="banner">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo Area */}
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-slate-900 dark:text-slate-100 hover:opacity-80 transition-opacity rounded-lg" >
                        <div className="bg-slate-900 dark:bg-indigo-500 p-1.5 rounded-lg text-white shadow-sm shadow-indigo-500/20">
                            <Code2 className="w-5 h-5" />
                        </div>
                        <span className="tracking-tight hidden sm:inline-block">서울과학기술대학교 컴퓨터공학과 학생회</span>
                        <span className="tracking-tight sm:hidden font-bold text-lg">ST CSE</span>
                    </Link>
                </div>

                {/* Main Navigation - Desktop */}
                <div className="hidden xl:block">
                    <Menu />
                </div>

                {/* User Actions */}
                <div className="flex items-center gap-3 text-sm">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/mypage"
                                className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                aria-label="마이페이지로 이동"
                            >
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shadow-sm">
                                    <span className="text-xs font-bold">{user?.name?.[0] || 'U'}</span>
                                </div>
                                <span className="font-semibold text-gray-700 dark:text-slate-200 hidden lg:inline-block">
                                    {user?.name}
                                </span>
                            </Link>
                            {(user?.role === 'admin' || user?.role === 'council') && (
                                <Link
                                    to="/admin"
                                    className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                                >
                                    <span>⚙️ 관리자</span>
                                </Link>
                            )}
                            {!location.pathname.startsWith('/admin') && <ThemeToggle />}
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                title="로그아웃"
                                aria-label="로그아웃"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 md:gap-2">
                            <ThemeToggle />
                            <Link
                                to="/login"
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors md:px-4 md:text-base"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>로그인</span>
                            </Link>
                            <Link
                                to="/signup"
                                className="hidden xl:flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm shadow-indigo-200 dark:shadow-indigo-900/50 active:scale-95 transition-all"
                            >
                                <UserPlus className="w-4 h-4" />
                                회원가입
                            </Link>
                        </div>
                    )}
                    {/* Mobile Menu Button */}
                    <button
                        className="xl:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                        onClick={toggleMenu}
                        aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
                        aria-expanded={isMenuOpen}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Sidebar */}
            {isMenuOpen && createPortal(
                <div className="xl:hidden fixed inset-0 z-[9999] flex justify-end" role="dialog" aria-label="모바일 네비게이션">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeMenu} />

                    {/* Sidebar Panel */}
                    <nav className="relative w-[85%] max-w-[320px] h-full bg-white dark:bg-[#020617] shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
                        <div className="p-5 flex justify-between items-center border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                            <span className="font-bold text-lg text-slate-900 dark:text-white">Menu</span>
                            <button
                                onClick={closeMenu}
                                className="p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                                aria-label="메뉴 닫기"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="px-5 pb-2 pt-2">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="통합 검색..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-[#020617] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 transition-all outline-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value
                                            if (val.trim()) {
                                                navigate({ to: '/search', search: { q: val } })
                                                closeMenu()
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex-1 p-4 space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    search={item.search}
                                    onClick={closeMenu}
                                    activeOptions={{ includeSearch: false }}
                                    className="px-4 py-3.5 text-base font-medium text-gray-600 dark:text-slate-400 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-400 [&.active]:text-indigo-700 dark:[&.active]:text-indigo-400 [&.active]:bg-indigo-50 dark:[&.active]:bg-indigo-500/10 transition-all flex items-center justify-between group"
                                >
                                    {item.label}
                                    <span className="text-gray-300 dark:text-slate-700 group-hover:text-indigo-400 transition-colors">›</span>
                                </Link>
                            ))}
                        </div>

                        {/* Mobile User Actions */}
                        <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 space-y-4">
                            {!isAuthenticated ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <Link
                                        to="/login"
                                        onClick={closeMenu}
                                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-sm"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        로그인
                                    </Link>
                                    <Link
                                        to="/signup"
                                        onClick={closeMenu}
                                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        회원가입
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 px-2 py-2 mb-2">
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shadow-sm border border-indigo-200 dark:border-indigo-500/30">
                                            <span className="text-lg font-bold">{user?.name?.[0] || 'U'}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-lg">{user?.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                                        </div>
                                    </div>

                                    {(user?.role === 'admin' || user?.role === 'council') && (
                                        <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-white/5 mt-2">
                                            <p className="px-2 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                                관리자 메뉴
                                            </p>
                                            {ADMIN_MENU_ITEMS.map((item) => (
                                                <Link
                                                    key={item.href}
                                                    to={item.href}
                                                    onClick={closeMenu}
                                                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors"
                                                >
                                                    <item.icon className="w-4 h-4" />
                                                    {item.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <Link
                                            to="/mypage"
                                            onClick={closeMenu}
                                            className="flex items-center justify-center py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 font-medium hover:bg-gray-50 transition shadow-sm"
                                        >
                                            마이페이지
                                        </Link>
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                closeMenu();
                                            }}
                                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-medium hover:bg-red-100 transition border border-red-100 dark:border-transparent"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            로그아웃
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>,
                document.body
            )}
        </header>
    )
}
