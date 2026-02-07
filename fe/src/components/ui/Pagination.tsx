
import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginationProps = {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    const canPrev = currentPage > 1
    const canNext = currentPage < totalPages

    const goTo = (target: number) => {
        if (target < 1 || target > totalPages) return
        onPageChange(target)
    }

    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-between gap-4 py-4 text-sm text-slate-600">
            <span className="text-xs text-slate-500">
                페이지 {currentPage} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={!canPrev}
                    onClick={() => goTo(currentPage - 1)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${canPrev
                            ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                        }`}
                >
                    <ChevronLeft size={16} />
                    이전
                </button>
                <button
                    type="button"
                    disabled={!canNext}
                    onClick={() => goTo(currentPage + 1)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${canNext
                            ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                        }`}
                >
                    다음
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    )
}
