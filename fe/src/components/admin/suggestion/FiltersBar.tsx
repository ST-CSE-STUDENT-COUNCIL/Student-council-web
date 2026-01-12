import { Filter, Search } from 'lucide-react'
import { STATUS_TABS } from './constants'
import type { SuggestionStatus } from './types'

type FiltersBarProps = {
  statusFilter: 'all' | SuggestionStatus
  onStatusFilterChange: (value: 'all' | SuggestionStatus) => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
}

export function FiltersBar({
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
}: FiltersBarProps) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <Filter size={18} />
          <span className="text-sm font-medium">상태별 보기</span>
        </div>
        <div className="relative w-full lg:w-5/12">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300"
            placeholder="제목, 작성자, 내용 검색"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onStatusFilterChange(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${statusFilter === tab.value
              ? 'bg-gray-900 text-white border-gray-900 shadow-md'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
