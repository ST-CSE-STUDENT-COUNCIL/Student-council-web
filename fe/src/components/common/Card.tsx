type CardProps = {
    children: React.ReactNode
    className?: string
    padding?: 'none' | 'sm' | 'md' | 'lg'
    hover?: boolean
}

const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
}

export function Card({
    children,
    className = '',
    padding = 'md',
    hover = false,
}: CardProps) {
    return (
        <div
            className={`
                bg-white rounded-xl border border-gray-200 shadow-sm
                ${paddingClasses[padding]}
                ${hover ? 'hover:shadow-md hover:border-gray-300 transition-all duration-200' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    )
}

// Card 하위 컴포넌트
Card.Header = function CardHeader({
    children,
    className = '',
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={`border-b border-gray-100 pb-4 mb-4 ${className}`}>
            {children}
        </div>
    )
}

Card.Title = function CardTitle({
    children,
    className = '',
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <h3 className={`text-lg font-bold text-gray-900 ${className}`}>
            {children}
        </h3>
    )
}

Card.Body = function CardBody({
    children,
    className = '',
}: {
    children: React.ReactNode
    className?: string
}) {
    return <div className={className}>{children}</div>
}

Card.Footer = function CardFooter({
    children,
    className = '',
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={`border-t border-gray-100 pt-4 mt-4 ${className}`}>
            {children}
        </div>
    )
}
