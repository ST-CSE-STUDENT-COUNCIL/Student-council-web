import type { LucideIcon } from 'lucide-react'

type StatItem = {
    label: string
    value: number
    color: string
    icon: LucideIcon
}

type AdminStatsCardsProps = {
    stats: StatItem[]
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-600">{stat.label}</span>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                            <stat.icon size={18} />
                        </div>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">실시간 상태 반영</p>
                </div>
            ))}
        </div>
    )
}
