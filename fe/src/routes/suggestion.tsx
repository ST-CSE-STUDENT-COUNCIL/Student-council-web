import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import type { Suggestion } from '../types/suggestions'
import { suggestionApi } from '../lib/api/suggestions'
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
    const [statusFilter, setStatusFilter] = useState<
        'all' | Suggestion['status']
    >('all')
    const [search, setSearch] = useState('')
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [selected, setSelected] = useState<Suggestion | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [pageSize, setPageSize] = useState(10)
    const [page, setPage] = useState(1)

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const data = await suggestionApi.getAll()
                setSuggestions(data.suggestions)
            } catch (error) {
                console.error('failed to fetch suggestions', error)
            }
        }

        fetchSuggestions()
    }, [])

    const stats = useMemo(() => {
        const base = { all: suggestions.length, received: 0, in_progress: 0, approved: 0, rejected: 0 }
        suggestions.forEach((item) => {
            base[item.status] += 1
        })
        return base
    }, [suggestions])

    const filteredSuggestions = useMemo(() => {
        return suggestions.filter((item) => {
            const matchesStatus =
                statusFilter === 'all' ? true : item.status === statusFilter
            const q = search.trim().toLowerCase()
            const matchesSearch =
                q.length === 0 ||
                item.title.toLowerCase().includes(q) ||
                item.content.toLowerCase().includes(q)
            return matchesStatus && matchesSearch
        })
    }, [statusFilter, search, suggestions])

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
                            onClick={() => setIsCreateOpen(true)}
                        >
                            새 건의 작성
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-6 lg:gap-8">
                    <div className="space-y-4">
                        <SuggestionList
                            items={visibleSuggestions}
                            onSelect={(item) => {
                                setSelected(item)
                                setIsOpen(true)
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
                            const created = await suggestionApi.create({ title, content })
                            setSuggestions((prev) => [created, ...prev])
                            setIsCreateOpen(false)
                        } catch (err) {
                            console.error('failed to create suggestion', err)
                            alert('건의 등록에 실패했습니다. 로그인 상태를 확인해주세요.')
                        } finally {
                            setSubmitting(false)
                        }
                    }}
                />
            </div>
        </div>
    )
}
