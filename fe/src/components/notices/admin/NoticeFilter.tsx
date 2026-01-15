import { Search, Filter, SortAsc, SortDesc, X, ChevronDown } from 'lucide-react'
import { ALL_SUB_CATEGORIES, BOARD_SUB_CATEGORIES, CATEGORIES } from './constants'
import { useState, useRef, useEffect } from 'react'

type SortOption = 'newest' | 'oldest' | 'title'

type NoticeFilterProps = {
    filterMain: string
    setFilterMain: (value: string) => void
    filterSub: string
    setFilterSub: (value: string) => void
    searchQuery?: string
    onSearchChange?: (query: string) => void
    sortBy?: SortOption
    onSortChange?: (sort: SortOption) => void
}

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'newest', label: '최신순', icon: <SortDesc size={14} /> },
    { value: 'oldest', label: '오래된순', icon: <SortAsc size={14} /> },
    { value: 'title', label: '제목순', icon: <SortAsc size={14} /> },
]

export function NoticeFilter({
    filterMain,
    setFilterMain,
    filterSub,
    setFilterSub,
    searchQuery = '',
    onSearchChange,
    sortBy = 'newest',
    onSortChange
}: NoticeFilterProps) {
    const [showSortDropdown, setShowSortDropdown] = useState(false)
    const [localSearch, setLocalSearch] = useState(searchQuery)
    const sortRef = useRef<HTMLDivElement>(null)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearchChange?.(localSearch)
        }, 300)
        return () => clearTimeout(timer)
    }, [localSearch, onSearchChange])

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
                setShowSortDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const currentSort = SORT_OPTIONS.find(s => s.value === sortBy)
    const hasActiveFilters = filterMain !== 'all' || filterSub !== 'all' || localSearch

    const clearFilters = () => {
        setFilterMain('all')
        setFilterSub('all')
        setLocalSearch('')
        onSearchChange?.('')
    }

    return (
        <div className="space-y-4 mb-6">
            {/* Search Bar */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        value={localSearch}
                        onChange={e => setLocalSearch(e.target.value)}
                        placeholder="공지사항 검색..."
                        className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
                    />
                    {localSearch && (
                        <button
                            onClick={() => {
                                setLocalSearch('')
                                onSearchChange?.('')
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Sort Dropdown */}
                <div className="relative" ref={sortRef}>
                    <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        className={`flex items-center gap-2 px-4 py-3.5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all min-w-[140px] ${showSortDropdown ? 'ring-2 ring-blue-500/20 border-blue-500' : ''}`}
                    >
                        <span className="text-gray-400">{currentSort?.icon}</span>
                        <span className="text-sm font-medium text-gray-700">{currentSort?.label}</span>
                        <ChevronDown size={16} className={`ml-auto text-gray-400 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showSortDropdown && (
                        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-100/50 py-1 min-w-[160px] z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                            {SORT_OPTIONS.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        onSortChange?.(option.value)
                                        setShowSortDropdown(false)
                                    }}
                                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${sortBy === option.value
                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className={sortBy === option.value ? 'text-blue-500' : 'text-gray-400'}>{option.icon}</span>
                                    {option.label}
                                    {sortBy === option.value && (
                                        <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                    {/* Main Category Pills */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Filter size={16} />
                            <span className="text-xs font-semibold uppercase tracking-wider">게시판</span>
                        </div>
                        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => {
                                    setFilterMain('all')
                                    setFilterSub('all')
                                }}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filterMain === 'all'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                전체
                            </button>
                            {CATEGORIES.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => {
                                        setFilterMain(c.value)
                                        setFilterSub('all')
                                    }}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filterMain === c.value
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden lg:block h-6 w-px bg-gray-200" />

                    {/* Sub Category Pills */}
                    <div className="flex items-center gap-3 flex-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">분류</span>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                onClick={() => setFilterSub('all')}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterSub === 'all'
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                전체
                            </button>
                            {(filterMain === 'all' ? ALL_SUB_CATEGORIES : BOARD_SUB_CATEGORIES[filterMain] || []).map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => setFilterSub(c.value)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterSub === c.value
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all whitespace-nowrap"
                        >
                            <X size={14} />
                            필터 초기화
                        </button>
                    )}
                </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">활성 필터:</span>
                    <div className="flex flex-wrap gap-1.5">
                        {filterMain !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                                {CATEGORIES.find(c => c.value === filterMain)?.label}
                                <button
                                    onClick={() => {
                                        setFilterMain('all')
                                        setFilterSub('all')
                                    }}
                                    className="hover:bg-indigo-100 rounded-full p-0.5"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {filterSub !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                {ALL_SUB_CATEGORIES.find(c => c.value === filterSub)?.label}
                                <button
                                    onClick={() => setFilterSub('all')}
                                    className="hover:bg-blue-100 rounded-full p-0.5"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        {localSearch && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                "{localSearch}"
                                <button
                                    onClick={() => {
                                        setLocalSearch('')
                                        onSearchChange?.('')
                                    }}
                                    className="hover:bg-gray-200 rounded-full p-0.5"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
