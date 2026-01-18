import { createRootRoute, Outlet } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

// DevTools는 개발 환경에서만 로드
const TanStackRouterDevtools = import.meta.env.DEV
    ? lazy(() =>
        import('@tanstack/router-devtools').then((res) => ({
            default: res.TanStackRouterDevtools,
        }))
    )
    : () => null

export const Route = createRootRoute({
    component: () => (
        <>
            <div className="flex flex-col min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
                <Header />
                <main className="flex-1 w-full">
                    <Outlet />
                </main>
                <Footer />
            </div>
            <Suspense fallback={null}>
                <TanStackRouterDevtools position="bottom-right" />
            </Suspense>
        </>
    ),
})

