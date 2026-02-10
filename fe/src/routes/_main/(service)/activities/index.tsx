import { createFileRoute, useSearch, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useMemo } from 'react'
import { ActivityFilter, type SortOption, type StatusOption, type TypeOption } from '../../../../components/activities/ActivityFilter'
import { ActivityList } from '../../../../components/activities/ActivityList'
import { ActivityCard } from '../../../../components/activities/ActivityCard'
import { supabase } from '../../../../lib/supabase'
import type { ActivityListItem, Activity } from '../../../../types/activities'
import { getActivityStatus } from '../../../../types/activities'
import { SEO } from '../../../../components/common/SEO'
import { useQueryClient } from '@tanstack/react-query'
import { useActivities, useActivity, activityKeys } from '../../../../hooks/queries/useActivities'

export const Route = createFileRoute('/_main/(service)/activities/')({
    component: ActivitiesPage,
})

function ActivitiesPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { id: queryId } = useSearch({ strict: false }) as any
    const navigate = useNavigate({ from: Route.fullPath })
    const queryClient = useQueryClient()

    // ...

    const selectActivity = (activity: ActivityListItem) => {
        navigate({
            search: (prev: any) => ({ ...prev, id: activity.id }),
        })
    }

    // Filter & Sort States (Keep these)
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState<SortOption>('newest')
    const [status, setStatus] = useState<StatusOption>('all')
    const [type, setType] = useState<TypeOption>('all')

    // Pagination (Dynamic based on screen width)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(5)

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                // 모바일: 세로 배치이므로 5개
                setItemsPerPage(5)
            } else if (window.innerWidth < 1280) {
                // 태블릿 ~ 일반 노트북: 3개 (높이 맞춤)
                setItemsPerPage(3)
            } else if (window.innerWidth < 1540) {
                // 중대형 데스크탑: 4개
                setItemsPerPage(4)
            } else {
                // 초대형 모니터: 5개
                setItemsPerPage(5)
            }
        }

        // Initial check
        handleResize()

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // itemsPerPage 변경 시 1페이지로 리셋
    useEffect(() => {
        setCurrentPage(1)
    }, [itemsPerPage])

    // 1. Fetch All Activities (using useActivities)
    const { data: listData, isLoading: listLoading } = useActivities({
        isActiveOnly: false,
        page: 1,
        pageSize: 100
    })
    const activities = listData?.activities || []

    // 2. Derive Selected Activity ID
    // If queryId exists, try to use it.
    // Otherwise, if activities loaded, use the first one.
    const firstActivityId = activities.length > 0 ? activities[0].id : 0
    const targetId = queryId ? Number(queryId) : firstActivityId

    // 3. Fetch Selected Activity Detail (using useActivity)
    const { data: selectedActivity, isLoading: detailLoading } = useActivity(targetId)

    const loading = listLoading || (targetId > 0 && detailLoading)

    // Real-time subscription for selected activity
    useEffect(() => {
        if (!targetId || !selectedActivity) return

        console.log(`Subscribing to activity ${targetId} updates...`)

        const channel = supabase
            .channel(`activity-detail-${targetId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'activities',
                    filter: `id=eq.${targetId}`,
                },
                (payload) => {
                    console.log('Realtime update received:', payload)
                    const newCount = payload.new.current_count

                    if (typeof newCount === 'number') {
                        // Update Query Cache: Detail
                        queryClient.setQueryData(activityKeys.detail(targetId), (old: Activity | undefined) => {
                            if (!old) return old
                            return { ...old, current_count: newCount, is_active: payload.new.is_active }
                        })

                        // Update Query Cache: List
                        // Note: useActivities uses generic key with options.
                        // We need to invalidate or set data for the active query.
                        // Ideally, invalidateQueries is safer strictly speaking, but for instant update:
                        // We iterate over the cache or just invalidate. For simplicity + speed, let's invalidate list.
                        // Or better, update specific list cache if we know the key.
                        // But since we use useActivities with hardcoded options above:
                        queryClient.setQueryData(
                            activityKeys.list({ isActiveOnly: false, page: 1, pageSize: 100 }),
                            (old: any) => {
                                if (!old?.activities) return old
                                return {
                                    ...old,
                                    activities: old.activities.map((act: ActivityListItem) =>
                                        act.id === targetId
                                            ? { ...act, current_count: newCount, is_active: payload.new.is_active }
                                            : act
                                    )
                                }
                            }
                        )
                    }
                }
            )
            .subscribe((status) => {
                console.log(`Subscription status for activity ${targetId}:`, status)
            })

        return () => {
            console.log(`Unsubscribing from activity ${targetId}`)
            supabase.removeChannel(channel)
        }
    }, [targetId, queryClient, selectedActivity]) // selectedActivity dependency to ensure we have initial data? Actually targetId is enough.

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

    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage)
    const paginatedActivities = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filteredActivities.slice(start, start + itemsPerPage)
    }, [filteredActivities, currentPage, itemsPerPage])

    return (
        <div className="container mx-auto px-4 py-8">
            <SEO
                title="신청"
                description="학생회 행사 및 설문조사 신청 등 다양한 활동에 참여하세요."
                url="/activities"
                keywords="행사신청, 설문조사, MT, 축제, 컴퓨터공학과, 학년행사"
            />
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8 mt-6 lg:items-stretch">
                    {/* Left Column: Large Selected Card */}
                    <div className="w-full lg:w-2/3 lg:shrink-0 lg:grow-0">
                        <div className="h-full">
                            {selectedActivity ? (
                                <div className="transform transition-all duration-500 hover:scale-[1.01] animate-fade-in h-full">
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
                    <div className="w-full lg:w-1/3 lg:shrink-0 lg:grow-0 flex flex-col">
                        <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl flex flex-col flex-1 min-h-0 border border-gray-100 dark:border-slate-800 shadow-sm h-full">
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
            )
            }
        </div >
    )
}
