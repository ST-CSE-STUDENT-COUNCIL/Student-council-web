import type { Suggestion } from '../../types/suggestions'
import { Modal } from '../common/Modal'
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
                            <span className="text-xs text-slate-400">{new Date(suggestion.created_at).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-slate-500">{suggestion.author_name}</div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {suggestion.content}
                    </p>

                    {STATUS_META[suggestion.status].description.trim().length > 0 && (
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                            <p className="text-xs text-slate-500">{STATUS_META[suggestion.status].description}</p>
                        </div>
                    )}

                    {suggestion.status === 'rejected' && suggestion.rejection_reason && (
                        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
                            <h4 className="text-sm font-semibold text-rose-700">반려 사유</h4>
                            <p className="mt-1 text-sm text-rose-700 whitespace-pre-wrap">{suggestion.rejection_reason}</p>
                        </div>
                    )}

                    {suggestion.status === 'approved' && suggestion.resolution_note && (
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                            <h4 className="text-sm font-semibold text-emerald-700">반영 내용</h4>
                            <p className="mt-1 text-sm text-emerald-700 whitespace-pre-wrap">{suggestion.resolution_note}</p>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    )
}
