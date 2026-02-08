import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../../../../lib/api/search'
import { getImageUrl } from '../../../../lib/utils'
import { Calendar, Megaphone, Users, Search as SearchIcon, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export const Route = createFileRoute('/_main/(service)/search/')({
    component: SearchPage,
    validateSearch: (search: Record<string, unknown>) => {
        return {
            q: search.q as string || '',
        }
    },
})

function SearchPage() {
    const { q } = useSearch({ from: '/_main/(service)/search/' })

    const { data, isLoading, error } = useQuery({
        queryKey: ['search', q],
        queryFn: () => searchApi.search(q),
        enabled: !!q,
        staleTime: 1000 * 60, // 1분 캐시
    })

    const results = data?.results || []

    // 아이콘 매핑
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'activity': return <Calendar className="w-5 h-5 text-indigo-500" />
            case 'notice': return <Megaphone className="w-5 h-5 text-orange-500" />
            case 'club': return <Users className="w-5 h-5 text-green-500" />
            default: return <SearchIcon className="w-5 h-5 text-gray-400" />
        }
    }

    // 타입 이름 매핑
    const getTypeName = (type: string) => {
        switch (type) {
            case 'activity': return '활동'
            case 'notice': return '공지사항'
            case 'club': return '동아리'
            default: return '기타'
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-12 min-h-[60vh]">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">통합 검색</h1>
                    {q ? (
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            "<span className="font-bold text-indigo-600 dark:text-indigo-400">{q}</span>" 검색 결과
                            {data && <span className="ml-2 text-sm bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400">{data.total_count}건</span>}
                        </p>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400">검색어를 입력해주세요.</p>
                    )}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-center">
                        검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
                    </div>
                )}

                {/* Results List */}
                {!isLoading && !error && q && results.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <SearchIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">검색 결과가 없습니다</h3>
                        <p className="text-slate-500 dark:text-slate-400">다른 키워드로 검색해보세요.</p>
                    </div>
                )}

                <div className="grid gap-4">
                    {results.map((item) => (
                        <Link
                            key={`${item.type}-${item.id}`}
                            to={item.url}
                            className="bg-white dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl p-4 md:p-6 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all group flex gap-4 md:gap-6"
                        >
                            {/* Thumbnail (Optional) */}
                            {item.thumbnail_url && (
                                <div className="hidden sm:block w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                    <img
                                        src={getImageUrl(item.thumbnail_url)}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            )}

                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {getTypeIcon(item.type)}
                                        <span>{getTypeName(item.type)}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                        <span>{format(new Date(item.date), 'yyyy.MM.dd', { locale: ko })}</span>
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                        {item.title}
                                    </h3>
                                    {item.description && (
                                        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-bold mt-4 md:mt-0 group-hover:translate-x-1 transition-transform">
                                    자세히 보기 <ChevronRight className="w-4 h-4 ml-1" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
