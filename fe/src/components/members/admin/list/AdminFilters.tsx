import { Coins, Filter, Search } from 'lucide-react'

type ViewKey = 'pending' | 'all' | 'rejected' | 'blocked'
type RoleFilter = 'all' | 'student' | 'admin' | 'council'
type DuesFilter = 'all' | 'paid' | 'unpaid'

type AdminFiltersProps = {
    search: string
    onSearchChange: (value: string) => void
    roleFilter: RoleFilter
    onRoleFilterChange: (value: RoleFilter) => void
    duesFilter: DuesFilter
    onDuesFilterChange: (value: DuesFilter) => void
    view: ViewKey
    onViewChange: (value: ViewKey) => void
}

export function AdminFilters({
    search,
    onSearchChange,
    roleFilter,
    onRoleFilterChange,
    duesFilter,
    onDuesFilterChange,
    view,
    onViewChange,
}: AdminFiltersProps) {
    const viewOptions: Array<{ key: ViewKey; label: string }> = [
        { key: 'all', label: '전체 회원' },
        { key: 'pending', label: '승인 대기' },
        { key: 'rejected', label: '거절' },
        { key: 'blocked', label: '차단' },
    ]

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full flex-1 min-w-[240px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="이름, 학번, 전공, 연락처로 검색"
                        className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1">
                    <Filter size={16} className="text-gray-500" />
                    <select
                        value={roleFilter}
                        onChange={(e) => onRoleFilterChange(e.target.value as RoleFilter)}
                        className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none"
                    >
                        <option value="all">전체 역할</option>
                        <option value="student">학생</option>
                        <option value="admin">관리자</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1">
                    <Coins size={16} className="text-gray-500" />
                    <select
                        value={duesFilter}
                        onChange={(e) => onDuesFilterChange(e.target.value as DuesFilter)}
                        className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none"
                    >
                        <option value="all">회비 전체</option>
                        <option value="paid">회비 납부</option>
                        <option value="unpaid">미납</option>
                    </select>
                </div>

                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-1 py-1">
                    {viewOptions.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => onViewChange(item.key)}
                            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                view === item.key
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-700 hover:bg-white'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
