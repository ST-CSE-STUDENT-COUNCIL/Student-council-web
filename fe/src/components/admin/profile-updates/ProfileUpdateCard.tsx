import type { ProfileUpdateRequest, StatusFilter } from './types'

const STATUS_PILL_CONFIG = {
  pending: { label: '대기', bg: 'bg-amber-100', text: 'text-amber-700' },
  approved: { label: '승인', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  rejected: { label: '반려', bg: 'bg-rose-100', text: 'text-rose-700' },
}

type ProfileUpdateCardProps = {
  request: ProfileUpdateRequest
  statusFilter: StatusFilter
  actionLoadingId: string | null
  previewLoading: boolean
  onPreviewImage: (verificationImageUrl: string) => void
  onApprove: (requestId: string, requestIds: Array<string>) => void
  onReject: (requestId: string, requestIds: Array<string>) => void
}

export function ProfileUpdateCard({
  request,
  statusFilter,
  actionLoadingId,
  previewLoading,
  onPreviewImage,
  onApprove,
  onReject,
}: ProfileUpdateCardProps) {
  const nameUpdate = request.updates.find((update) => update.field === 'name')
  const currentName = nameUpdate?.currentValue?.trim()
  const displayName = (currentName && currentName !== '-' ? currentName : request.name) || '이름 미등록'
  const hasStudentIdUpdate = request.updates.some((item) => item.field === 'student_id')

  return (
    <div
      className={`px-6 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${getRequestCardClass(request.status)}`}
    >
      <div className="flex items-start gap-4 flex-1">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-lg">🧑‍🎓</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{displayName}의 요청</h3>
            <StatusPill status={request.status} />
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            {request.updates.map((update) => {
              const currentValue = update.currentValue.trim()
              const nextValue = update.newValue.trim()
              const isUnknownCurrent = !currentValue || currentValue === '-'
              const isUnknownNext = !nextValue || nextValue === '-'
              const valueUnchanged =
                isUnknownNext
                || (!isUnknownCurrent && currentValue === nextValue)
                || (update.field === 'name' && isUnknownCurrent && hasStudentIdUpdate)
              const displayedCurrentValue = currentValue || '-'
              const displayedNewValue = valueUnchanged ? '미변경' : (update.newValue || '-')

              return (
                <p key={update.field}>
                  변경 요청: <span className="font-medium text-gray-900">{update.field === 'name' ? '이름' : '학번'}</span>{' '}
                  <span className="font-medium text-gray-500">{displayedCurrentValue}</span>{' '}
                  →{' '}
                  <span className="font-medium text-blue-600">{displayedNewValue}</span>
                </p>
              )
            })}
          </div>
          <p className="text-xs text-gray-400">요청일: {request.requestedAt}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
          onClick={() => onPreviewImage(request.verificationImageUrl)}
          disabled={!request.verificationImageUrl || previewLoading}
        >
          {previewLoading ? '불러오는 중...' : '인증 이미지 보기'}
        </button>
        {statusFilter === 'pending' && (
          <>
            <button
              type="button"
              disabled={request.status !== 'pending' || actionLoadingId === request.id}
              onClick={() => onApprove(request.id, request.requestIds)}
              className={`px-3 py-2 text-sm font-medium text-white rounded-lg ${request.status !== 'pending' || actionLoadingId === request.id
                ? 'bg-emerald-500/60 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
            >
              {actionLoadingId === request.id ? '처리 중...' : '승인'}
            </button>
            <button
              type="button"
              disabled={request.status !== 'pending' || actionLoadingId === request.id}
              onClick={() => onReject(request.id, request.requestIds)}
              className={`px-3 py-2 text-sm font-medium text-white rounded-lg ${request.status !== 'pending' || actionLoadingId === request.id
                ? 'bg-rose-500/60 cursor-not-allowed'
                : 'bg-rose-500 hover:bg-rose-600'
                }`}
            >
              {actionLoadingId === request.id ? '처리 중...' : '반려'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

type StatusPillProps = {
  status: 'pending' | 'approved' | 'rejected'
}

function StatusPill({ status }: StatusPillProps) {
  const { label, bg, text } = STATUS_PILL_CONFIG[status]

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
      {label}
    </span>
  )
}

function getRequestCardClass(status: 'pending' | 'approved' | 'rejected') {
  if (status === 'approved') {
    return 'bg-emerald-50/40'
  }
  if (status === 'rejected') {
    return 'bg-rose-50/50 border-l-4 border-rose-200'
  }
  return 'bg-white'
}
