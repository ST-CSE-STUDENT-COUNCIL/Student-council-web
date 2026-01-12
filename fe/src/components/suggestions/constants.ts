import type { Suggestion } from '../../types/suggestions'

export const STATUS_META: Record<
    Suggestion['status'],
    { label: string; badge: string; dot: string; description: string }
> = {
    received: {
        label: '접수됨',
        badge: 'bg-sky-50 text-sky-700',
        dot: 'bg-sky-400',
        description: '접수되었습니다.',
    },
    in_progress: {
        label: '처리 중',
        badge: 'bg-amber-50 text-amber-700',
        dot: 'bg-amber-400',
        description: '검토중입니다.',
    },
    approved: {
        label: '반영 완료',
        badge: 'bg-emerald-50 text-emerald-700',
        dot: 'bg-emerald-400',
        description: '',
    },
    rejected: {
        label: '반려',
        badge: 'bg-rose-50 text-rose-700',
        dot: 'bg-rose-400',
        description: '',
    },
}
