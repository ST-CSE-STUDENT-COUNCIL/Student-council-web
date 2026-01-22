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
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                        <div className="mb-6 flex justify-center">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                                <LockKeyhole className="w-10 h-10 text-blue-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                            로그인이 필요합니다
                        </h2>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            건의함을 이용하시려면 로그인이 필요합니다.<br />
                            학생회에 건의사항을 전달하고 답변을 받아보세요.
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center w-full py-3 px-6 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                        >
                            로그인하러 가기
                        </Link>
                        <p className="mt-4 text-sm text-gray-500">
                            계정이 없으신가요?{' '}
                            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                                회원가입하기
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                <SuggestionHero
                    stats={stats}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1">
                        <SuggestionFilters search={search} onSearchChange={setSearch} />
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                        <SuggestionPageSizeSelect value={pageSize} onChange={setPageSize} />
                        <button
                            type="button"
                            className="shrink-0 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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
