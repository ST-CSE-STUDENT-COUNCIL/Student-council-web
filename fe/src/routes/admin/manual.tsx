import { createFileRoute } from '@tanstack/react-router'
import { AdminManualSidebar } from '../../components/admin/manual/AdminManualSidebar'
import { AdminManualContent } from '../../components/admin/manual/AdminManualContent'
import { useState } from 'react'
import { BookOpen, Code2, Paintbrush } from 'lucide-react'

export const Route = createFileRoute('/admin/manual')({
    component: AdminManualPage,
})

function AdminManualPage() {
    const [activePart, setActivePart] = useState<'usage' | 'frontend' | 'backend'>('usage')

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex-none px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        📚 관리자 시스템 매뉴얼
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        시스템 아키텍처 및 관리 가이드 문서입니다.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                        onClick={() => setActivePart('usage')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activePart === 'usage'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        학생회 운영 가이드
                    </button>
                    <button
                        onClick={() => setActivePart('frontend')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activePart === 'frontend'
                            ? 'bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        <Paintbrush className="w-4 h-4" />
                        프론트엔드 가이드
                    </button>
                    <button
                        onClick={() => setActivePart('backend')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activePart === 'backend'
                            ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        <Code2 className="w-4 h-4" />
                        백엔드 가이드
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Scrollable Content Area */}
                <div
                    id="manual-scroll-container"
                    className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth"
                >
                    <AdminManualContent activePart={activePart} />
                </div>

                {/* Fixed Sidebar Navigation */}
                <div className="flex-none w-64 border-l border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                    <AdminManualSidebar activePart={activePart} />
                </div>
            </div>
        </div>
    )
}
