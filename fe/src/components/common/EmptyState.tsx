import { Search, FileX, Inbox, AlertCircle, RefreshCcw } from 'lucide-react'

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
            <div className="w-16 h-16 rounded-full bg-surface-muted flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-foreground-muted" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
                {displayTitle}
            </h3>
            {description && (
                <p className="text-sm text-foreground-secondary max-w-sm mb-4">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}

type ErrorStateProps = {
    message?: string
    onRetry?: () => void
}

export function ErrorState({
    message = "데이터를 불러오는 중 오류가 발생했습니다.",
    onRetry
}: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] py-12 px-4">
            <div className="max-w-md text-center">
                <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">오류가 발생했습니다</h3>
                <p className="text-foreground-secondary mb-6 leading-relaxed">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-surface font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                    >
                        <RefreshCcw size={18} />
                        다시 시도
                    </button>
                )}
            </div>
        </div>
    )
}
