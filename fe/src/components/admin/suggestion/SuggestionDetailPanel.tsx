import { AlertCircle, Clock, UserRound } from 'lucide-react'
import type { Suggestion } from '../../../types/suggestions'
import { STATUS_META, STATUS_TABS, formatDateTime } from './constants'
import type { ActionDraft, SuggestionStatus } from './types'

type SuggestionDetailPanelProps = {
  isLoading: boolean
  selectedSuggestion: Suggestion | null
  actionDraft: ActionDraft
  onActionDraftChange: (draft: ActionDraft) => void
  onSave: () => void
  isSaving: boolean
  onDelete: () => void
  isDeleting: boolean
}

export function SuggestionDetailPanel({
  isLoading,
  selectedSuggestion,
  actionDraft,
  onActionDraftChange,
  onSave,
  isSaving,
  onDelete,
  isDeleting,
}: SuggestionDetailPanelProps) {
  const noteBorderTone = actionDraft.status === 'rejected'
    ? 'border-rose-200 focus:ring-rose-100'
    : actionDraft.status === 'in_progress'
      ? 'border-amber-200 focus:ring-amber-100'
      : actionDraft.status === 'approved'
        ? 'border-emerald-200 focus:ring-emerald-100'
        : 'border-gray-200 focus:ring-gray-200'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
      {isLoading ? (
        <div className="text-center text-gray-500 py-10 flex flex-col items-center gap-2">
          <Clock size={40} className="text-gray-300" />
          <p>건의 내용을 불러오는 중입니다.</p>
        </div>
      ) : !selectedSuggestion ? (
        <div className="text-center text-gray-500 py-10 flex flex-col items-center gap-2">
          <AlertCircle size={40} className="text-gray-300" />
          <p>확인할 건의를 선택하세요.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${STATUS_META[selectedSuggestion.status].dot}`} />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_META[selectedSuggestion.status].badge} ${STATUS_META[selectedSuggestion.status].border}`}>
                {STATUS_META[selectedSuggestion.status].label}
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight">{selectedSuggestion.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <UserRound size={14} />
                {selectedSuggestion.author_name}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {formatDateTime(selectedSuggestion.created_at)}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">건의 내용</p>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
              {selectedSuggestion.content}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">건의 상태</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200"
                value={actionDraft.status}
                onChange={(event) => onActionDraftChange({
                  ...actionDraft,
                  status: event.target.value as SuggestionStatus
                })}
              >
                {STATUS_TABS.filter((tab) => tab.value !== 'all').map((tab) => (
                  <option key={tab.value} value={tab.value}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                {actionDraft.status === 'rejected' ? '반려 사유' : '조치 내용 / 비고'}
              </label>
              <textarea
                className={`w-full border rounded-xl px-3 py-2 text-sm min-h-[90px] focus:ring-2 ${noteBorderTone}`}
                placeholder={
                  actionDraft.status === 'rejected'
                    ? '학생에게 전달될 반려 사유를 작성하세요.'
                    : '진행 경과 또는 완료 보고를 입력하세요.'
                }
                value={actionDraft.resolutionNote}
                onChange={(event) => onActionDraftChange({
                  ...actionDraft,
                  resolutionNote: event.target.value
                })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={onSave}
              disabled={isSaving}
              className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors ${isSaving ? 'bg-gray-400' : 'bg-gray-900 hover:bg-black'}`}
            >
              {isSaving ? '저장 중...' : '업데이트'}
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors ${isDeleting ? 'bg-rose-300' : 'bg-rose-500 hover:bg-rose-600'}`}
            >
              {isDeleting ? '삭제 중...' : '건의 삭제'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
