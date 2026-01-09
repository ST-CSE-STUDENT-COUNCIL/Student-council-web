type Props = {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function SuggestionPagination({ page, totalPages, onPageChange }: Props) {
    const canPrev = page > 1
    const canNext = page < totalPages

    const goTo = (target: number) => {
        if (target < 1 || target > totalPages) return
        onPageChange(target)
    }

    return (
        <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
            <span className="text-xs text-slate-500">
                페이지 {page} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={!canPrev}
                    onClick={() => goTo(page - 1)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        canPrev
                            ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                    }`}
                >
                    이전
                </button>
                <button
                    type="button"
                    disabled={!canNext}
                    onClick={() => goTo(page + 1)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        canNext
                            ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                    }`}
                >
                    다음
                </button>
            </div>
        </div>
    )
}
