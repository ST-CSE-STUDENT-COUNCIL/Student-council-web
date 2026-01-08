import type { Suggestion } from '../../types/suggestions'
import { STATUS_META } from './constants'

export function SuggestionList({ items, onSelect }: {
    items: Suggestion[]
    onSelect?: (item: Suggestion) => void
}) {
    return (
        <section className="space-y-4">
            {items.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-slate-500 shadow-sm">
                    등록된 건의사항이 없습니다.
                </div>
            )}

            {items.map((item) => (
                <article
                    key={item.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                    onClick={() => onSelect?.(item)}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_META[item.status].badge}`}>
                                <span className={`h-2 w-2 rounded-full ${STATUS_META[item.status].dot}`} />
                                {STATUS_META[item.status].label}
                            </span>
                            <span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-slate-500">{item.author_name}</div>
                    </div>

                    <h3 className="mt-3 text-xl font-semibold text-slate-900">{item.title}</h3>
                </article>
            ))}
        </section>
    )
}
