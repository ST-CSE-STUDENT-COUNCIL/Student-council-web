import type { Event } from '../../types/events'

interface EventListProps {
    events: Event[]
    onEventSelect?: (event: Event) => void
    selectedEventId?: number
    className?: string
}

export const EventList = ({ events, onEventSelect, selectedEventId, className }: EventListProps) => {
    if (!events.length) {
        return (
            <div className="text-center py-20 text-gray-500">
                등록된 행사가 없습니다.
            </div>
        )
    }

    return (
        <div className={className || "flex flex-col gap-4 mt-6"}>
            {events.map((event) => (
                <div
                    key={event.id}
                    onClick={() => onEventSelect?.(event)}
                    className={`
                        bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-pointer relative
                        transition-all duration-200 hover:shadow-md hover:border-blue-200
                        ${selectedEventId === event.id
                            ? 'ring-2 ring-blue-500 border-transparent bg-blue-50 z-10 -translate-y-1 shadow-lg'
                            : 'hover:-translate-y-0.5'}
                    `}
                >
                    <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${event.status === 'active' ? 'bg-green-100 text-green-800' :
                            event.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {event.status === 'active' ? '진행중' :
                                event.status === 'scheduled' ? '예정' : '마감'}
                        </span>
                        <h4 className="flex-1 text-base font-semibold text-gray-900 truncate flex items-center gap-2">
                            {event.isPinned && (
                                <svg className="w-4 h-4 text-orange-500 fill-current shrink-0" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                /* Or a Pin icon: */
                                /* <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg> */
                            )}
                            {event.title}
                        </h4>
                    </div>

                    <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                        <span className="truncate pr-4">{event.description}</span>
                        {!['notice', 'survey', 'kakao', 'payment'].includes(event.category || '') && (
                            <span className="whitespace-nowrap font-medium">
                                {event.currentCount} / {event.maxCount}명
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}