export function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    '신청 대기': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    '신청 승인': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    '신청 거절': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    '취소됨': 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400',
    '마감': 'bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-gray-400',
  }

  const colorClass = colors[status] || 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300'

  return (
    <span className={`${colorClass} px-3 py-1 rounded-full text-xs font-bold`}>
      {status}
    </span>
  )
}
``