import { Link } from '@tanstack/react-router'
import { useAuthStore } from '../../store/useAuthStore'
import Menu from './Menu'

export default function Header() {
    const { isAuthenticated, user, logout } = useAuthStore()

    const handleLogout = () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            logout()
        }
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* 로고 */}
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center font-bold text-xl text-black">
                        <span>서울과학기술대학교 컴퓨터공학과 학생회</span>
                    </Link>
                </div>

                {/* 바로가기 */}
                <div className="hidden md:block">
                    <Menu />
                </div>

                {/* 우측 메뉴 (로그인/비로그인 분기) */}
                <div className="flex items-center gap-4 text-sm">
                    {isAuthenticated ? (
                        <>
                            <span className="text-gray-600 hidden lg:inline-block">
                                <span className="font-semibold text-black">{user?.name}</span>님
                            </span>
                            <Link
                                to="/mypage"
                                className="text-gray-600 hover:text-black transition-colors"
                            >
                                마이페이지
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-gray-600 hover:text-red-600 transition-colors"
                            >
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="text-gray-600 hover:text-black transition-colors"
                            >
                                로그인
                            </Link>
                            <Link
                                to="/signup"
                                className="text-gray-600 hover:text-black transition-colors"
                            >
                                회원가입
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
