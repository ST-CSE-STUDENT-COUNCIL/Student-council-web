import { Filter } from 'lucide-react'
import { ALL_SUB_CATEGORIES, BOARD_SUB_CATEGORIES, CATEGORIES } from './constants'

type NoticeFilterProps = {
    filterMain: string
    setFilterMain: (value: string) => void
    filterSub: string
    setFilterSub: (value: string) => void
}

export function NoticeFilter({ filterMain, setFilterMain, filterSub, setFilterSub }: NoticeFilterProps) {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 text-gray-600">
                <Filter size={18} />
                <span className="font-medium text-sm">필터:</span>
            </div>

            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => {
                        setFilterMain('all')
                        setFilterSub('all')
                    }}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterMain === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterMain === c.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            <div className="h-4 w-px bg-gray-300 hidden md:block" />

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setFilterSub('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterSub === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                >
                    전체 분류
                </button>
                {(filterMain === 'all' ? ALL_SUB_CATEGORIES : BOARD_SUB_CATEGORIES[filterMain] || []).map(c => (
                    <button
                        key={c.value}
                        onClick={() => setFilterSub(c.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterSub === c.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                    >
                        {c.label}
                    </button>
                ))}
            </div>
        </div>
    )
}
