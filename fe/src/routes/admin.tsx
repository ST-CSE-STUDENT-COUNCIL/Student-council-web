import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AdminSidebar } from '../components/layout/AdminSidebar'
import { useAuthStore } from '../store/useAuthStore'

export const Route = createFileRoute('/admin')({
    component: AdminLayout,
    beforeLoad: ({ location }) => {
        // Auth Check
        const state = useAuthStore.getState()
        if (!state.isAuthenticated || !state.user) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: location.href,
                },
            })
        }

        // Role Check
        if (state.user.role !== 'admin' && state.user.role !== 'council') {
            alert('접근 권한이 없습니다.')
            throw redirect({ to: '/' })
        }
    }
})

function AdminLayout() {
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
