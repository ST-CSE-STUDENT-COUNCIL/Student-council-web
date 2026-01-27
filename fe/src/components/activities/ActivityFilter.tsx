import type { ActivityStatus } from '../../types/activities'
import { SearchIcon } from 'lucide-react'

export type SortOption = 'newest' | 'oldest'
export type StatusOption = 'all' | ActivityStatus

type ActivityFilterProps = {
    search: string
    onSearchChange: (value: string) => void
    sort: SortOption
    onSortChange: (value: SortOption) => void
    status: StatusOption
    onStatusChange: (value: StatusOption) => void
}

export const ActivityFilter = ({
    search,
    onSearchChange,
    sort,
    onSortChange,
    status,
    onStatusChange
}: ActivityFilterProps) => {
    return (
        <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="신청 검색..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
            </div>

            <div className="flex flex-row gap-2">
                {/* Status Filter */}
                <div className="flex-1 flex p-1 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-x-auto no-scrollbar">
                    {(['all', 'active', 'scheduled', 'closed'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => onStatusChange(s)}
                            className={`flex-1 min-w-[3rem] py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${status === s
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
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
                    className="w-24 px-2 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                    <option value="newest">최신순</option>
                    <option value="oldest">오래된순</option>
                </select>
            </div>

        </div>
    )
}
