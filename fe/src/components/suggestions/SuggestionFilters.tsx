export function SuggestionFilters({ search, onSearchChange }: {
    search: string
    onSearchChange: (value: string) => void
}) {
    return (
        <section className="px-1">
            <div className="relative">
                <input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="검색어를 입력하세요 (예: 휴게실, 자습실, 장비)"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 dark:text-white dark:placeholder-slate-500"
                />
                <svg
                    className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </section>
    )
}
