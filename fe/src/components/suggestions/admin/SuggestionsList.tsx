import { ChevronRight, Inbox, MessageSquare, UserRound } from 'lucide-react'
import type { Suggestion, SuggestionListItem } from '../../../types/suggestions'
import { SuggestionPageSizeSelect, SuggestionPagination } from '../../suggestions'
import { STATUS_META, formatDateTime } from './constants'

type SuggestionsListProps = {
  isLoading: boolean
  filteredCount: number
  items: SuggestionListItem[]
  selectedId: number | null
  selectedSuggestion: Suggestion | null
  onSelect: (id: number) => void
  pageSize: number
  onPageSizeChange: (value: number) => void
  page: number
  totalPages: number
  onPageChange: (value: number) => void
}

export function SuggestionsList({
  isLoading,
  filteredCount,
  items,
  selectedId,
  selectedSuggestion,
  onSelect,
  pageSize,
  onPageSizeChange,
  page,
  totalPages,
  onPageChange,
}: SuggestionsListProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">전체 {filteredCount}건</p>
          <h2 className="text-lg font-semibold">건의 목록</h2>
        </div>
        <SuggestionPageSizeSelect value={pageSize} onChange={onPageSizeChange} />
      </div>
      <div className="divide-y divide-gray-100">
        {isLoading ? (
          <div className="p-10 flex flex-col items-center gap-2 text-gray-500">
            <Inbox size={40} className="text-gray-300" />
            <p>건의 목록을 불러오는 중입니다.</p>
          </div>
        ) : filteredCount === 0 ? (
          <div className="p-10 flex flex-col items-center gap-2 text-gray-500">
            <Inbox size={40} className="text-gray-300" />
            <p>조건에 맞는 건의가 없습니다.</p>
          </div>
        ) : (
          items.map((suggestion) => {
            const meta = STATUS_META[suggestion.status]
            return (
              <button
                key={suggestion.id}
                onClick={() => onSelect(suggestion.id)}
                className={`w-full text-left px-6 py-4 flex flex-col gap-2 transition-colors ${selectedId === suggestion.id
                  ? 'bg-gray-50'
                  : 'hover:bg-gray-50/60'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.badge} ${meta.border}`}>
                      {meta.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {suggestion.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 max-h-12 overflow-hidden">
                      {selectedSuggestion?.id === suggestion.id
                        ? selectedSuggestion.content
                        : '내용은 상세에서 확인하세요.'}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <UserRound size={14} />
                        {suggestion.author_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={14} />
                        {formatDateTime(suggestion.created_at)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
              </button>
            )
          })
        )}
      </div>
      {filteredCount > 0 && (
        <div className="px-6 py-4 border-t border-gray-100">
          <SuggestionPagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}
