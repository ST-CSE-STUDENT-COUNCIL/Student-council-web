import { Outlet, createFileRoute, useNavigate, useLocation } from '@tanstack/react-router'
import { useEffect } from 'react'
import { AdminSidebar } from '../components/layout/AdminSidebar'
import { useAuthStore } from '../store/useAuthStore'
import { useThemeStore } from '../store/useThemeStore'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export const Route = createFileRoute('/admin')({
    component: AdminLayout,
})

function AdminLayout() {
    const { isAuthenticated, user, isInitialized } = useAuthStore()
    const { resolvedTheme, setTheme } = useThemeStore()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        // Hydration 완료 후 체크
        if (isInitialized) {
            if (!isAuthenticated || !user) {
                navigate({
                    to: '/login',
                    search: {
                        redirect: location.href,
                    },
                })
                return
            }

            // Role Check
            if (user.role !== 'admin' && user.role !== 'council') {
                alert('접근 권한이 없습니다.')
                navigate({ to: '/' })
            }
        }
    }, [isInitialized, isAuthenticated, user, navigate, location.href])

    useEffect(() => {
        // 강제로 라이트 모드 적용
        document.documentElement.classList.remove('dark')

        return () => {
            // 언마운트 시 원래 테마 복구 (상태에 있는 테마로)
            const currentTheme = useThemeStore.getState().theme
            setTheme(currentTheme)
        }
    }, [])

    // 테마 변경 감지 시에도 라이트 모드 강제 유지
    useEffect(() => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark')
        }
    }, [resolvedTheme])

    // 초기화 중이거나 인증되지 않았으면 로딩 표시 (혹은 null)
    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <LoadingSpinner />
            </div>
        )
    }

    // 인증 실패 시 렌더링 방지 (useEffect에서 리다이렉트 될 때까지)
    if (!isAuthenticated || !user) return null

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <AdminSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header Placeholder (Optional) */}
                <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center">
                    <span className="font-bold">관리자 페이지</span>
                </div>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
