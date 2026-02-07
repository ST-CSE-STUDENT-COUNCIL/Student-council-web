import { memo } from 'react'

type SideButtonProps = {
    icon: React.ReactNode
    label: string
    onClick: () => void
}

export const SideButton = memo(({ icon, label, onClick }: SideButtonProps) => (
    <button
        onClick={onClick}
        type="button"
        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative group"
    >
        {icon}
        <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">
            {label}
        </span>
    </button>
))
SideButton.displayName = 'SideButton'
