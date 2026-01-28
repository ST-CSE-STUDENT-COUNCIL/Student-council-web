type LoadingProps = {
    size?: 'sm' | 'md' | 'lg'
    text?: string
    fullScreen?: boolean
}

const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
}

export function Loading({ size = 'md', text, fullScreen = false }: LoadingProps) {
    const content = (
        <div className="flex flex-col items-center justify-center gap-3">
            <div
                className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin`}
            />
            {text && <p className="text-gray-500 text-sm font-medium">{text}</p>}
        </div>
    )

    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-overlay backdrop-blur-sm z-50">
                {content}
            </div>
        )
    }

    return content
}
