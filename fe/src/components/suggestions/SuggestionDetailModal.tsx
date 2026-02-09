import type { Suggestion } from '../../types/suggestions'
import { Modal } from '../ui/Modal'
import { STATUS_META } from './constants'

export function SuggestionDetailModal({
    suggestion,
    isOpen,
    onClose,
}: {
    suggestion: Suggestion | null
    isOpen: boolean
    onClose: () => void
}) {
    return (
        <Modal
            isOpen={isOpen && !!suggestion}
            onClose={onClose}
            title={suggestion ? suggestion.title : ''}
            maxWidth="max-w-2xl"
        >
            {suggestion && (
                <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_META[suggestion.status].badge}`}>
                                <span className={`h-2 w-2 rounded-full ${STATUS_META[suggestion.status].dot}`} />
                                {STATUS_META[suggestion.status].label}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(suggestion.created_at).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{suggestion.author_name}</div>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {suggestion.content}
                    </p>

                    {STATUS_META[suggestion.status].description.trim().length > 0 && (
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-4">
                            <p className="text-xs text-slate-500 dark:text-slate-400">{STATUS_META[suggestion.status].description}</p>
                        </div>
                    )}

                    {suggestion.status === 'rejected' && suggestion.rejection_reason && (
                        <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-4">
                            <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-400">반려 사유</h4>
                            <p className="mt-1 text-sm text-rose-700 dark:text-rose-300 whitespace-pre-wrap">{suggestion.rejection_reason}</p>
                        </div>
                    )}

                    {suggestion.status === 'approved' && suggestion.resolution_note && (
                        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
                            <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">반영 내용</h4>
                            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300 whitespace-pre-wrap">{suggestion.resolution_note}</p>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    )
}

