


type ProfileUpdateItem = {
  id: string
  updates: Array<{ field: 'name' | 'student_id'; newValue: string }>
  statusLabel: string
  requestedAt: string
  rejectionReason: string
}

type ProfileUpdateSectionProps = {
  error: string | null
  items: ProfileUpdateItem[]
}

export function ProfileUpdateSection({ error, items }: ProfileUpdateSectionProps) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">프로필 변경 요청</h3>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {!error && items.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">요청 내역이 없습니다.</p>
      )}
      {!error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((req) => (
            <div
              key={req.id}
              className="border border-gray-100 dark:border-slate-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">요청일: {req.requestedAt}</p>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  {req.updates.map((update) => (
                    <p key={update.field}>
                      변경 요청: <span className="font-semibold text-gray-900 dark:text-white">{update.field === 'name' ? '이름' : '학번'}</span> →{' '}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{update.newValue}</span>
                    </p>
                  ))}
                </div>
                {req.statusLabel === '반려' && req.rejectionReason && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    반려 사유: {req.rejectionReason}
                  </p>
                )}
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-200">
                {req.statusLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
