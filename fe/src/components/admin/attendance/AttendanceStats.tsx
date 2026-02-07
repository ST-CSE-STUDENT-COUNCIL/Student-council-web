import type { ReactNode } from 'react'
import { CheckCircle2, ClipboardList, Users, XCircle } from 'lucide-react'

import type { AttendanceSummary } from '../../../types/attendance'

type AttendanceStatsProps = {
    stats: AttendanceSummary
}

export function AttendanceStats({ stats }: AttendanceStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="총 신청" value={stats.total} icon={<Users size={18} />} accent="from-slate-600 to-slate-700" />
            <StatCard label="출석" value={stats.attended} icon={<CheckCircle2 size={18} />} accent="from-emerald-500 to-emerald-600" />
            <StatCard label="미출석" value={stats.absent} icon={<XCircle size={18} />} accent="from-rose-500 to-rose-600" />
            <StatCard label="출석률" value={`${stats.rate}%`} icon={<ClipboardList size={18} />} accent="from-indigo-500 to-indigo-600" />
        </div>
    )
}

type StatCardProps = {
    label: string
    value: number | string
    icon: ReactNode
    accent: string
}

function StatCard({ label, value, icon, accent }: StatCardProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-500 font-semibold">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
        </div>
    )
}
