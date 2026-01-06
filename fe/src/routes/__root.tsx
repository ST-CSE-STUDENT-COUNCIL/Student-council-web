import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

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
            <TanStackRouterDevtools position="bottom-right" />
        </>
    ),
})
