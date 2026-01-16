import { Search, FileX, Inbox } from 'lucide-react'

type EmptyStateVariant = 'search' | 'empty' | 'noData'

type EmptyStateProps = {
    variant?: EmptyStateVariant
    title?: string
    description?: string
    action?: React.ReactNode
}

const icons = {
    search: Search,
    empty: FileX,
    noData: Inbox,
}

const defaultTitles = {
    search: '검색 결과가 없습니다',
    empty: '데이터가 없습니다',
    noData: '등록된 항목이 없습니다',
}

export function EmptyState({
    variant = 'noData',
    title,
    description,
    action,
}: EmptyStateProps) {
    const Icon = icons[variant]
    const displayTitle = title || defaultTitles[variant]

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {displayTitle}
            </h3>
            {description && (
                <p className="text-sm text-gray-500 max-w-sm mb-4">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}
