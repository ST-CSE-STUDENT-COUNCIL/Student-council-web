export function SuggestionPageSizeSelect({
    value,
    onChange,
    options = [5, 10, 20, 30, 50],
}: {
    value: number
    onChange: (v: number) => void
    options?: number[]
}) {
    return (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="text-xs text-slate-500 dark:text-slate-500">표시 개수</span>
            <select
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 dark:text-white"
            >
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}개
                    </option>
                ))}
            </select>
        </div>
    )
}
