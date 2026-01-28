import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { LockKeyhole } from 'lucide-react'

import type { Suggestion, SuggestionListItem } from '../types/suggestions'
import { suggestionApi } from '../lib/api/suggestions'
import { useAuthStore } from '../store/useAuthStore'
import {
    SuggestionCreateModal,
    SuggestionDetailModal,
    SuggestionFilters,
    SuggestionHero,
    SuggestionList,
    SuggestionPageSizeSelect,
    SuggestionPagination,
} from '../components/suggestions'

export const Route = createFileRoute('/suggestion')({
    component: SuggestionPage,
})

function SuggestionPage() {
    const user = useAuthStore((state) => state.user)
    const [statusFilter, setStatusFilter] = useState<
        'all' | Suggestion['status']
    >('all')
    const [search, setSearch] = useState('')
    const [suggestions, setSuggestions] = useState<SuggestionListItem[]>([])
    const [selected, setSelected] = useState<Suggestion | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [pageSize, setPageSize] = useState(10)
    const [page, setPage] = useState(1)
    const [totalAll, setTotalAll] = useState(0)

    const fetchSuggestions = useCallback(
        async (params?: { status?: 'all' | Suggestion['status'] }) => {
            const nextStatus = params?.status ?? statusFilter

            try {
                const pageSizeAll = 100
                let pageIndex = 1
                let totalPagesAll = 1
                const allItems: SuggestionListItem[] = []

                do {
                    const data = await suggestionApi.getAll({
                        status_filter: nextStatus === 'all' ? undefined : nextStatus,
                        page: pageIndex,
                        page_size: pageSizeAll,
                    })
                    allItems.push(...data.suggestions)
                    totalPagesAll = Math.max(1, data.pagination.total_pages || 1)
                    if (nextStatus === 'all' && pageIndex === 1) {
                        setTotalAll(data.pagination.total)
                    }
                    pageIndex += 1
                } while (pageIndex <= totalPagesAll)

                setSuggestions(allItems)
            } catch (error) {
                console.error('failed to fetch suggestions', error)
                setSuggestions([])
            }
        },
        [statusFilter],
    )

    useEffect(() => {
        fetchSuggestions()
    }, [fetchSuggestions])

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
        <div className="min-h-screen bg-(--color-background) transition-colors">
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
                    <div className="rounded-2xl border border-border-default bg-surface p-8 text-center shadow-lg transition-transform hover:scale-[1.01]">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-3xl">
                            <LockKeyhole className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">로그인이 필요합니다</h2>
                        <p className="mt-2 text-foreground-secondary">
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
                                    className="shrink-0 rounded-xl bg-foreground dark:bg-blue-600 px-5 py-3 text-sm font-semibold text-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:text-white"
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
                                    onSelect={async (item) => {
                                        try {
                                            const detail = await suggestionApi.getById(item.id)
                                            setSelected(detail)
                                            setIsOpen(true)
                                        } catch (error) {
                                            console.error('failed to fetch suggestion detail', error)
                                            toast.error('건의 상세를 불러오지 못했습니다. 다시 시도해주세요.')
                                        }
                                    }}
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
                    isOpen={isOpen && !!selected}
                    suggestion={selected}
                    onClose={() => {
                        setIsOpen(false)
                        setSelected(null)
                    }}
                />

                <SuggestionCreateModal
                    isOpen={isCreateOpen}
                    submitting={submitting}
                    onClose={() => setIsCreateOpen(false)}
                    onSubmit={async ({ title, content }) => {
                        try {
                            setSubmitting(true)
                            await suggestionApi.create({ title, content })
                            setTotalAll((prev) => prev + 1)
                            if (statusFilter === 'all' || statusFilter === 'received') {
                                setPage(1)
                                await fetchSuggestions({ status: statusFilter })
                            }
                            setIsCreateOpen(false)
                        } catch (err) {
                            console.error('failed to create suggestion', err)
                            toast.error('건의 등록에 실패했습니다. 로그인 상태를 확인해주세요.')
                        } finally {
                            setSubmitting(false)
                        }
                    }}
                />
            </div>
        </div>
    )
}
