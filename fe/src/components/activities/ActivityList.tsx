import type { ActivityListItem } from '../../types/activities'
import { getActivityStatus, activityTypeLabels } from '../../types/activities'

type ActivityListProps = {
    activities: ActivityListItem[]
    onActivitySelect?: (activity: ActivityListItem) => void
    selectedActivityId?: number
    className?: string
}

export const ActivityList = ({ activities, onActivitySelect, selectedActivityId, className }: ActivityListProps) => {
    if (!activities.length) {
        return (
            <div className="text-center py-20 text-gray-500">
                등록된 신청이 없습니다.
            </div>
        )
    }

    const getStatusBadge = (activity: ActivityListItem) => {
        const status = getActivityStatus(activity)
        const styles = {
            active: 'bg-green-100 text-green-800',
            scheduled: 'bg-blue-100 text-blue-800',
            closed: 'bg-gray-100 text-gray-800'
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
            event: 'bg-purple-100 text-purple-800',
            demand_survey: 'bg-orange-100 text-orange-800',
            survey: 'bg-yellow-100 text-yellow-800',
            kakao_invite: 'bg-amber-100 text-amber-800',
            notice: 'bg-sky-100 text-sky-800'
        }
        const style = typeStyles[activity.type] || 'bg-gray-100 text-gray-800'
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
                        bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-pointer relative
                        transition-all duration-200 hover:shadow-md hover:border-blue-200
                        ${selectedActivityId === activity.id
                            ? 'ring-2 ring-blue-500 border-transparent bg-blue-50 z-10 -translate-y-1 shadow-lg'
                            : 'hover:-translate-y-0.5'}
                    `}
                >
                    {/* 카테고리 배지 - 오른쪽 상단 고정 */}
                    <div className="absolute top-3 right-3">
                        {getCategoryBadge(activity)}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pr-20">
                        {getStatusBadge(activity)}
                        <h4 className="flex-1 text-base font-semibold text-gray-900 truncate">
                            {activity.title}
                        </h4>
                    </div>

                    <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                        <span className="truncate pr-4">{activity.description}</span>
                        {activity.max_capacity && !['notice', 'survey'].includes(activity.type) && (
                            <span className="whitespace-nowrap font-medium">
                                {activity.current_count} / {activity.max_capacity}명
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
