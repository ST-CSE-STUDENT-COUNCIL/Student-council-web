import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/events')({
    component: AdminEventsPage,
})

function AdminEventsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">행사 관리</h1>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                    + 행사 등록
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                행사 관리 페이지(준비중)
            </div>
        </div>
    )
}
