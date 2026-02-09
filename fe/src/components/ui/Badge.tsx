type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
type BadgeSize = 'sm' | 'md'

type BadgeProps = {
    children: React.ReactNode
    variant?: BadgeVariant
    size?: BadgeSize
    className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-purple-100 text-purple-700',
}

const sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
}

export function Badge({
    children,
    variant = 'default',
    size = 'md',
    className = '',
}: BadgeProps) {
    return (
        <span
            className={`
                inline-flex items-center font-semibold rounded-full
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${className}
            `}
        >
            {children}
        </span>
    )
}
