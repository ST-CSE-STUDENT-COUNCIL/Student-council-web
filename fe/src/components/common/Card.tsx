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
                bg-surface rounded-xl border border-border-default shadow-sm
                ${paddingClasses[padding]}
                ${hover ? 'hover:shadow-md hover:border-border-muted transition-all duration-200' : ''}
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
        <div className={`border-b border-border-default pb-4 mb-4 ${className}`}>
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
        <h3 className={`text-lg font-bold text-foreground ${className}`}>
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
        <div className={`border-t border-border-default pt-4 mt-4 ${className}`}>
            {children}
        </div>
    )
}
