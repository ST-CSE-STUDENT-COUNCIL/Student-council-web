import { AlertCircle, CheckCircle2, Clock, Inbox } from 'lucide-react'
import type { SuggestionStatus } from './types'

export const STATUS_META: Record<SuggestionStatus, {
  label: string
  badge: string
  dot: string
  border: string
}> = {
  received: {
    label: '접수됨',
    badge: 'bg-blue-50 text-blue-700',
    dot: 'bg-blue-500',
    border: 'border-blue-100'
  },
  in_progress: {
    label: '처리 중',
    badge: 'bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-100'
  },
  approved: {
    label: '반영 완료',
    badge: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
    border: 'border-emerald-100'
  },
  rejected: {
    label: '반려됨',
    badge: 'bg-rose-50 text-rose-700',
    dot: 'bg-rose-500',
    border: 'border-rose-100'
  }
}

export const STATUS_TABS: { value: 'all' | SuggestionStatus, label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'received', label: '접수됨' },
  { value: 'in_progress', label: '처리 중' },
  { value: 'approved', label: '반영 완료' },
  { value: 'rejected', label: '반려됨' },
]

type SummaryCardConfig = {
  key: SuggestionStatus
  label: string
  icon: typeof Inbox
  accent: string
}

export const SUMMARY_CARDS: SummaryCardConfig[] = [
  {
    key: 'received',
    label: '접수됨',
    icon: Inbox,
    accent: 'bg-blue-50 text-blue-700'
  },
  {
    key: 'in_progress',
    label: '처리 중',
    icon: Clock,
    accent: 'bg-amber-50 text-amber-700'
  },
  {
    key: 'approved',
    label: '반영 완료',
    icon: CheckCircle2,
    accent: 'bg-emerald-50 text-emerald-700'
  },
  {
    key: 'rejected',
    label: '반려됨',
    icon: AlertCircle,
    accent: 'bg-rose-50 text-rose-700'
  },
]

export const formatDateTime = (value: string) => (
  new Date(value).toLocaleString('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
)
