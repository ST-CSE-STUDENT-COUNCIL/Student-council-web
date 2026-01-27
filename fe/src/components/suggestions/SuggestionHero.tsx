import { useMemo } from 'react'

import type { Suggestion } from '../../types/suggestions'
import { STATUS_META } from './constants'

export type Stats = { all: number; received: number; in_progress: number; approved: number; rejected: number }

export function SuggestionHero({ stats, statusFilter, onStatusFilterChange }: {
    stats: Stats
    statusFilter: 'all' | Suggestion['status']
    onStatusFilterChange: (value: 'all' | Suggestion['status']) => void
}) {
    const pills: Array<{ value: 'all' | Suggestion['status']; label: string; desc: string }> = useMemo(
        () => [
            { value: 'all', label: '전체보기', desc: `${stats.all}건` },
            { value: 'received', label: '접수됨', desc: '확인 중' },
            { value: 'in_progress', label: '처리 중', desc: '담당자 검토' },
            { value: 'approved', label: '반영 완료', desc: '조치 완료' },
            { value: 'rejected', label: '반려', desc: '추가 정보 필요' },
        ],
        [stats.all],
    )

    const tone: Record<'all' | Suggestion['status'], { active: string; idle: string }> = {
        all: {
            active: 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-600',
            idle: 'bg-transparent text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:border-slate-500 dark:hover:text-slate-200',
        },
        received: {
            active: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-800',
            idle: 'bg-transparent text-slate-600 border-sky-200 hover:border-sky-400 hover:text-sky-700 dark:text-slate-400 dark:border-sky-800 dark:hover:border-sky-600 dark:hover:text-sky-300',
        },
        in_progress: {
            active: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
            idle: 'bg-transparent text-slate-600 border-amber-200 hover:border-amber-400 hover:text-amber-700 dark:text-slate-400 dark:border-amber-800 dark:hover:border-amber-600 dark:hover:text-amber-300',
        },
        approved: {
            active: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
            idle: 'bg-transparent text-slate-600 border-emerald-200 hover:border-emerald-400 hover:text-emerald-700 dark:text-slate-400 dark:border-emerald-800 dark:hover:border-emerald-600 dark:hover:text-emerald-300',
        },
        rejected: {
            active: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800',
            idle: 'bg-transparent text-slate-600 border-rose-200 hover:border-rose-400 hover:text-rose-700 dark:text-slate-400 dark:border-rose-800 dark:hover:border-rose-600 dark:hover:text-rose-300',
        },
    }

    const dotTone: Record<'all' | Suggestion['status'], string> = {
        all: 'bg-slate-400',
        received: STATUS_META.received.dot,
        in_progress: STATUS_META.in_progress.dot,
        approved: STATUS_META.approved.dot,
        rejected: STATUS_META.rejected.dot,
    }

    return (
        <section className="text-center space-y-8 pt-6 sm:pt-10">
            <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">건의함</h1>
            </div>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                {pills.map((pill) => (
                    <button
                        key={pill.value}
                        onClick={() => onStatusFilterChange(pill.value)}
                        className={`group rounded-2xl px-6 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-base font-bold transition-all duration-150 border shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] ${statusFilter === pill.value
                            ? `${tone[pill.value].active} shadow-md`
                            : `${tone[pill.value].idle} hover:shadow-sm`
                            }`}
                    >
                        <span className="inline-flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${dotTone[pill.value]}`} />
                            {pill.label}
                        </span>
                    </button>
                ))}
            </div>
        </section>
    )
}
