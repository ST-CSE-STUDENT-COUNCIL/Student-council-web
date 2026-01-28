import type { ActivityStatus } from '../../types/activities'
import { SearchIcon } from 'lucide-react'

export type SortOption = 'newest' | 'oldest'
export type StatusOption = 'all' | ActivityStatus
export type TypeOption = 'all' | 'event' | 'demand_survey' | 'kakao_invite' | 'notice' | 'survey'

type ActivityFilterProps = {
    search: string
    onSearchChange: (value: string) => void
    sort: SortOption
    onSortChange: (value: SortOption) => void
    status: StatusOption
    onStatusChange: (value: StatusOption) => void
    type: TypeOption
    onTypeChange: (value: TypeOption) => void
}

export const ActivityFilter = ({
    search,
    onSearchChange,
    sort,
    onSortChange,
    status,
    onStatusChange,
    type,
    onTypeChange
}: ActivityFilterProps) => {
    return (
        <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted" />
                <input
                    type="text"
                    placeholder="신청 검색..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-surface border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all text-foreground placeholder-foreground-muted"
                />
            </div>

            <div className="flex flex-row gap-2">
                {/* Status Filter */}
                <div className="flex-1 flex p-1 bg-surface-muted rounded-lg overflow-x-auto no-scrollbar">
                    {(['all', 'active', 'scheduled', 'closed'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => onStatusChange(s)}
                            className={`flex-1 min-w-[3rem] py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${status === s
                                ? 'bg-surface text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-foreground-secondary hover:text-foreground'
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
                    className="w-24 px-2 py-1.5 bg-surface border border-border-default rounded-lg text-xs text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                    <option value="newest">최신순</option>
                    <option value="oldest">오래된순</option>
                </select>
            </div>
            <div>
                <div className="flex-1 flex p-1 bg-surface-muted rounded-lg overflow-x-auto no-scrollbar">
                    {/* 행사, 수요조사, 카톡방초대, 공지, 설문조사 필터*/}
                    {
                        ['all', 'event', 'demand_survey', 'kakao_invite', 'notice', 'survey'].map((k) => (
                            <button
                                key={k}
                                onClick={() => onTypeChange(k as TypeOption)}
                                className={`flex-1 min-w-[3rem] py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${type === k
                                    ? 'bg-surface text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-foreground-secondary hover:text-foreground'
                                    }`}
                            >
                                {k === 'all' ? '전체' :
                                    k === 'event' ? '행사' :
                                        k === 'demand_survey' ? '수요조사' :
                                            k === 'kakao_invite' ? '카톡방초대' :
                                                k === 'notice' ? '공지' :
                                                    k === 'survey' ? '설문조사' : '전체'}
                            </button>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}
