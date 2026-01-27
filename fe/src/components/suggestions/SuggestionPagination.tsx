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
        <div className="flex items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span className="text-xs text-slate-500 dark:text-slate-500">
                페이지 {page} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={!canPrev}
                    onClick={() => goTo(page - 1)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${canPrev
                            ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        }`}
                >
                    이전
                </button>
                <button
                    type="button"
                    disabled={!canNext}
                    onClick={() => goTo(page + 1)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${canNext
                            ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        }`}
                >
                    다음
                </button>
            </div>
        </div>
    )
}
