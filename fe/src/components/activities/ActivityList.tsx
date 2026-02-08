import { useState, useEffect } from 'react'
import type { ActivityListItem } from '../../types/activities'
import { getActivityStatus, activityTypeLabels } from '../../types/activities'

type ActivityListProps = {
    activities: ActivityListItem[]
    onActivitySelect?: (activity: ActivityListItem) => void
    selectedActivityId?: number
    className?: string
}

export const ActivityList = ({ activities, onActivitySelect, selectedActivityId, className }: ActivityListProps) => {
    // 1초마다 리렌더링하여 상태(예정->진행중)를 실시간으로 업데이트
    const [, setCurrentTime] = useState(Date.now())

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    if (!activities.length) {
        return (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                등록된 신청이 없습니다.
            </div>
        )
    }

    const getStatusBadge = (activity: ActivityListItem) => {
        const status = getActivityStatus(activity)
        const styles = {
            active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }
        const labels = {
            active: '진행중',
            scheduled: '예정',
            closed: '마감'
        }
        return (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${styles[status]}`}>
                {labels[status]}
            </span>
        )
    }

    const getCategoryBadge = (activity: ActivityListItem) => {
        const typeStyles: Record<string, string> = {
            event: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
            demand_survey: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
            survey: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            kakao_invite: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
            notice: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300'
        }
        const style = typeStyles[activity.type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        return (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${style}`}>
                {activityTypeLabels[activity.type] || activity.type}
            </span>
        )
    }


    return (
        <div className={className || "flex flex-col gap-4 mt-6"}>
            {activities.map((activity) => (
                <div
                    key={activity.id}
                    onClick={() => onActivitySelect?.(activity)}
                    className={`
                        bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 cursor-pointer relative
                        transition-all duration-200 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700
                        ${selectedActivityId === activity.id
                            ? 'ring-2 ring-blue-500 border-transparent bg-blue-50 dark:bg-blue-900/20 z-10 -translate-y-1 shadow-lg'
                            : 'hover:-translate-y-0.5'}
                    `}
                >
                    {/* 카테고리 배지 - 오른쪽 상단 고정 */}
                    <div className="absolute top-3 right-3">
                        {getCategoryBadge(activity)}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pr-20">
                        {getStatusBadge(activity)}
                        <h4 className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {activity.title}
                        </h4>
                    </div>

                    <div className="mt-2 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        <span className="truncate pr-4 min-h-[1.25rem] block flex-1">
                            {activity.description || '\u00A0'}
                        </span>

                    </div>
                </div>
            ))}
        </div>
    )
}
