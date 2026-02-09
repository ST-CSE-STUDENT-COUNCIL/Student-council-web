import type { StatusFilter } from './types'

type ProfileUpdatesFilterProps = {
  statusFilter: StatusFilter
  onChange: (status: StatusFilter) => void
}

const STATUS_LABELS: Record<StatusFilter, string> = {
  pending: '요청',
  approved: '승인',
  rejected: '반려',
}

export function ProfileUpdatesFilter({ statusFilter, onChange }: ProfileUpdatesFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onChange(status)}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${statusFilter === status
            ? 'border-blue-600 bg-blue-50 text-blue-600'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
        >
          {STATUS_LABELS[status]}
        </button>
      ))}
    </div>
  )
}
