import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export const Route = createRootRoute({
    component: () => (
        <>
            <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8">
                    <Outlet />
                </main>
                <Footer />
            </div>
            <TanStackRouterDevtools position="bottom-right" />
        </>
    ),
})
