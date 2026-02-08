import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useEffect, useState, useMemo } from 'react'
import { ActivityFilter, type SortOption, type StatusOption, type TypeOption } from '../../../../components/activities/ActivityFilter'
import { ActivityList } from '../../../../components/activities/ActivityList'
import { ActivityCard } from '../../../../components/activities/ActivityCard'
import { activityApi } from '../../../../lib/api/activities'
import { supabase } from '../../../../lib/supabase'
import type { ActivityListItem, Activity } from '../../../../types/activities'
import { getActivityStatus } from '../../../../types/activities'
import { SEO } from '../../../../components/common/SEO'

export const Route = createFileRoute('/_main/(service)/activities/')({
    component: ActivitiesPage,
})

function ActivitiesPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { id: queryId } = useSearch({ strict: false }) as any
    const [activities, setActivities] = useState<ActivityListItem[]>([])
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
    const [loading, setLoading] = useState(true)

    // Filter & Sort States
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState<SortOption>('newest')
    const [status, setStatus] = useState<StatusOption>('all')
    const [type, setType] = useState<TypeOption>('all')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 5

    const fetchActivities = async () => {
        try {
            setLoading(true)
            const response = await activityApi.getAll({
                is_active_only: false,
                page: 1,
                page_size: 100
            })
            setActivities(response.activities)

            if (response.activities.length > 0) {
                // URL에 id가 있고 목록에 존재하면 그 활동 선택, 아니면 첫 번째 활동 선택
                const targetId = queryId || response.activities[0].id
                const detail = await activityApi.getById(targetId)
                setSelectedActivity(detail)
            }
        } catch (error) {
            console.error('Failed to fetch activities', error)
        } finally {
            setLoading(false)
        }
    }

    // URL id가 변경되면 해당 활동 선택 (단, 초기 로딩 이후)
    useEffect(() => {
        if (queryId && !loading && activities.length > 0) {
            activityApi.getById(queryId).then(setSelectedActivity).catch(console.error)
        }
    }, [queryId])

    const selectActivity = async (activity: ActivityListItem) => {
        try {
            const detail = await activityApi.getById(activity.id)
            setSelectedActivity(detail)
        } catch (error) {
            console.error('Failed to fetch activity detail', error)
        }
    }

    useEffect(() => {
        fetchActivities()
    }, [])

    // Real-time subscription for selected activity
    useEffect(() => {
        if (!selectedActivity) return

        console.log(`Subscribing to activity ${selectedActivity.id} updates...`)

        const channel = supabase
            .channel(`activity-detail-${selectedActivity.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'activities',
                    filter: `id=eq.${selectedActivity.id}`,
                },
                (payload) => {
                    console.log('Realtime update received:', payload)
                    const newCount = payload.new.current_count

                    if (typeof newCount === 'number') {
                        console.log(`Updating current_count: ${selectedActivity.current_count} -> ${newCount}`)

                        // Update selected activity detail
                        setSelectedActivity((prev) =>
                            prev ? { ...prev, current_count: newCount, is_active: payload.new.is_active } : null
                        )

                        // Update list item for consistency (only for the selected item)
                        setActivities((prev) =>
                            prev.map((activity) =>
                                activity.id === selectedActivity.id
                                    ? { ...activity, current_count: newCount, is_active: payload.new.is_active }
                                    : activity
                            )
                        )
                    }
                }
            )
            .subscribe((status) => {
                console.log(`Subscription status for activity ${selectedActivity.id}:`, status)
            })

        return () => {
            console.log(`Unsubscribing from activity ${selectedActivity.id}`)
            supabase.removeChannel(channel)
        }
    }, [selectedActivity?.id])

    useEffect(() => {
        setCurrentPage(1)
    }, [search, sort, status, type])

    const filteredActivities = useMemo(() => {
        return activities
            .filter((activity) => {
                if (status !== 'all') {
                    const activityStatus = getActivityStatus(activity)
                    if (activityStatus !== status) return false
                }

                if (search.trim()) {
                    const query = search.toLowerCase()
                    return (
                        activity.title.toLowerCase().includes(query) ||
                        activity.description?.toLowerCase().includes(query)
                    )
                }
                return true
            })
            .filter((activity) => {
                if (type !== 'all') {
                    if (activity.type !== type) return false
                }
                return true
            })
            .sort((a, b) => {
                const statusOrder = { active: 0, scheduled: 1, closed: 2 }
                const aStatus = getActivityStatus(a)
                const bStatus = getActivityStatus(b)
                const statusDiff = (statusOrder[aStatus] ?? 3) - (statusOrder[bStatus] ?? 3)
                if (statusDiff !== 0) return statusDiff

                if (sort === 'newest') return b.id - a.id
                return a.id - b.id
            })
    }, [activities, status, search, sort, type])

    const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE)
    const paginatedActivities = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredActivities.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredActivities, currentPage])

    return (
        <div className="container mx-auto px-4 py-8">
            <SEO
                title="사업 신청"
                description="학생회 행사 및 사업 신청"
                url="/activities"
            />
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8 mt-6">
                    {/* Left Column: Large Selected Card */}
                    <div className="w-full lg:w-2/3 lg:shrink-0 lg:grow-0">
                        <div className="sticky top-8">
                            {selectedActivity ? (
                                <div className="transform transition-all duration-500 hover:scale-[1.01] animate-fade-in">
                                    <ActivityCard activity={selectedActivity} />
                                </div>
                            ) : (
                                <div className="h-96 flex items-center justify-center bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                                    <p className="text-gray-500 text-lg">신청을 선택해주세요</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Filter & List */}
                    <div className="w-full lg:w-1/3 lg:shrink-0 lg:grow-0 flex flex-col sticky top-8 max-h-[calc(100vh-4rem)]">
                        <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl flex flex-col flex-1 min-h-0 border border-gray-100 dark:border-slate-800 shadow-sm">
                            <div className="mb-4 shrink-0">
                                <ActivityFilter
                                    search={search}
                                    onSearchChange={setSearch}
                                    sort={sort}
                                    onSortChange={setSort}
                                    status={status}
                                    onStatusChange={setStatus}
                                    type={type}
                                    onTypeChange={setType}
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 px-2 py-2">
                                <ActivityList
                                    activities={paginatedActivities}
                                    onActivitySelect={selectActivity}
                                    selectedActivityId={selectedActivity?.id}
                                    className="flex flex-col gap-4"
                                />
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 pt-2 border-t border-gray-200 dark:border-slate-800 shrink-0">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>

                                    <div className="flex gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-all ${currentPage === page
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
