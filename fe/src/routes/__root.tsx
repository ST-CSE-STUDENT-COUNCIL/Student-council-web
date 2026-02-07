import { createRootRoute, Outlet } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { VerificationPromptModal } from '../components/auth/VerificationPromptModal'
import { Toaster } from 'sonner'
import NotFound from './-404'
import { useAuthInit } from '../hooks/useAuthInit'
import { SEO } from '../components/common/SEO'

// DevTools는 개발 환경에서만 로드
const TanStackRouterDevtools = import.meta.env.DEV
    ? lazy(() =>
        import('@tanstack/router-devtools').then((res) => ({
            default: res.TanStackRouterDevtools,
        }))
    )
    : () => null

// 앱 초기화를 처리하는 래퍼 컴포넌트
function RootComponent() {
    const { isInitialized } = useAuthInit()

    // 인증 초기화 중에는 로딩 표시
    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#020617]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">로딩 중...</span>
                </div>
            </div>
        )
    }

    return (
        <>
            <SEO title="홈" />
            <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#020617] font-sans selection:bg-blue-100 dark:selection:bg-indigo-900/50 selection:text-blue-900 dark:selection:text-indigo-100 transition-colors">
                <Header />
                <main className="flex-1 w-full">
                    <Outlet />
                </main>
                <Footer />
            </div>
            <VerificationPromptModal />
            <Toaster richColors position="top-center" closeButton />
            <Suspense fallback={null}>
                <TanStackRouterDevtools position="bottom-right" />
            </Suspense>
        </>
    )
}

export const Route = createRootRoute({
    notFoundComponent: NotFound,
    component: RootComponent,
})
