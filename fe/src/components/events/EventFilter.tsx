import { useRef } from "react"

export type SortOption = 'newest' | 'oldest'
export type StatusOption = 'all' | 'active' | 'scheduled' | 'closed'

interface EventFilterProps {
    search: string
    onSearchChange: (value: string) => void
    sort: SortOption
    onSortChange: (value: SortOption) => void
    status: StatusOption
    onStatusChange: (value: StatusOption) => void
}

export const EventFilter = ({
    search,
    onSearchChange,
    sort,
    onSortChange,
    status,
    onStatusChange
}: EventFilterProps) => {
    return (
        <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="이벤트 검색..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            <div className="flex flex-row gap-2">
                {/* Status Filter */}
                <div className="flex-1 flex p-1 bg-gray-100 rounded-lg overflow-x-auto no-scrollbar">
                    {(['all', 'active', 'scheduled', 'closed'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => onStatusChange(s)}
                            className={`flex-1 min-w-[3rem] py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${status === s
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {s === 'all' ? '전체' :
                                s === 'active' ? '진행중' :
                                    s === 'scheduled' ? '예정' : '마감'}
                        </button>
                    ))}
                </div>

                {/* Sort */}
                <select
                    value={sort}
                    onChange={(e) => onSortChange(e.target.value as SortOption)}
                    className="w-24 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                    <option value="newest">최신순</option>
                    <option value="oldest">오래된순</option>
                </select>
            </div>
        </div>
    )
}