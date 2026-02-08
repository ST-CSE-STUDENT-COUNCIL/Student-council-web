import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { LockKeyhole } from 'lucide-react'

import type { Suggestion } from '../../../../types/suggestions'
import { useAuthStore } from '../../../../store/useAuthStore'
import {
    SuggestionCreateModal,
    SuggestionDetailModal,
    SuggestionFilters,
    SuggestionHero,
    SuggestionList,
    SuggestionPageSizeSelect,
    SuggestionPagination,
} from '../../../../components/suggestions'
import { SEO } from '../../../../components/common/SEO'
import { useAllSuggestions, useSuggestion, useCreateSuggestion, useSuggestionStats } from '../../../../hooks/queries/useSuggestions'

export const Route = createFileRoute('/_main/(service)/suggestion/')({
    component: SuggestionPage,
})

function SuggestionPage() {
    const user = useAuthStore((state) => state.user)
    const [statusFilter, setStatusFilter] = useState<
        'all' | Suggestion['status']
    >('all')
    const [search, setSearch] = useState('')

    // Query hook for list
    const { data: suggestionsData } = useAllSuggestions(statusFilter)
    const suggestions = suggestionsData?.suggestions || []

    const { data: statsData } = useSuggestionStats()
    const totalAll = statsData?.total || 0

    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [pageSize, setPageSize] = useState(10)
    const [page, setPage] = useState(1)

    // Mutation for create
    const createMutation = useCreateSuggestion()

    // Query for detail (only if selectedId is present)
    const { data: selectedSuggestion } = useSuggestion(selectedId)

    const stats = useMemo(() => {
        return { all: totalAll, received: 0, in_progress: 0, approved: 0, rejected: 0 }
    }, [totalAll])

    const filteredSuggestions = useMemo(() => {
        return suggestions.filter((item) => {
            if (!user) {
                return false
            }
            if (user.role !== 'admin' && item.author_id !== user.id) {
                return false
            }
            const q = search.trim().toLowerCase()
            const matchesSearch =
                q.length === 0 ||
                item.title.toLowerCase().includes(q)
            return matchesSearch
        })
    }, [search, suggestions, user])

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredSuggestions.length / pageSize) || 1)
    }, [filteredSuggestions.length, pageSize])

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [page, totalPages])

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [page])

    useEffect(() => {
        setPage(1)
    }, [pageSize])

    useEffect(() => {
        setPage(1)
    }, [statusFilter, search])

    const visibleSuggestions = useMemo(() => {
        const start = (page - 1) * pageSize
        const end = start + pageSize
        return filteredSuggestions.slice(start, end)
    }, [filteredSuggestions, page, pageSize])

    // 비로그인 사용자 안내 화면
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
            <SEO
                title="건의함"
                description="학생회에 바라는 점을 건의주세요."
                url="/suggestion"
            />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 space-y-10">
                <SuggestionHero
                    stats={stats}
                    statusFilter={statusFilter}
                    onStatusFilterChange={(st) => {
                        setStatusFilter(st)
                        setPage(1)
                    }}
                />

                {!user ? (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center shadow-lg transition-transform hover:scale-[1.01]">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-3xl">
                            <LockKeyhole className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">로그인이 필요합니다</h2>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">
                            건의사항을 조회하거나 작성하려면 로그인이 필요합니다.
                        </p>
                        <Link
                            to="/login"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
                        >
                            로그인하러 가기
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div className="flex-1">
                                <SuggestionFilters search={search} onSearchChange={setSearch} />
                            </div>
                            <div className="flex items-center gap-3 sm:gap-4">
                                <SuggestionPageSizeSelect value={pageSize} onChange={setPageSize} />
                                <button
                                    type="button"
                                    className="shrink-0 rounded-xl bg-slate-900 dark:bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                    onClick={() => {
                                        if (user?.verification_status !== 'approved') {
                                            toast.error('학적 인증이 완료된 사용자만 건의사항을 작성할 수 있습니다.')
                                            return
                                        }
                                        setIsCreateOpen(true)
                                    }}
                                >
                                    새 건의 작성
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-6 lg:gap-8">
                            <div className="space-y-4">
                                <SuggestionList
                                    items={visibleSuggestions}
                                    onSelect={(item) => setSelectedId(item.id)}
                                />
                                <SuggestionPagination
                                    page={page}
                                    totalPages={totalPages}
                                    onPageChange={setPage}
                                />
                            </div>
                        </div>
                    </>
                )}

                <SuggestionDetailModal
                    isOpen={!!selectedId && !!selectedSuggestion}
                    suggestion={selectedSuggestion || null}
                    onClose={() => setSelectedId(null)}
                />

                <SuggestionCreateModal
                    isOpen={isCreateOpen}
                    submitting={createMutation.isPending}
                    onClose={() => setIsCreateOpen(false)}
                    onSubmit={async ({ title, content }) => {
                        createMutation.mutate({ title, content }, {
                            onSuccess: () => {
                                setIsCreateOpen(false)
                                setPage(1)
                            }
                        })
                    }}
                />
            </div>
        </div>
    )
}
