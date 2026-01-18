export function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    '신청 대기': 'bg-yellow-100 text-yellow-700',
    '신청 승인': 'bg-blue-100 text-blue-700',
    '반려됨': 'bg-red-100 text-red-700',
    '취소됨': 'bg-gray-100 text-gray-500',
    '마감': 'bg-gray-200 text-gray-600',
  }

  const colorClass = colors[status] || 'bg-gray-100 text-gray-700'

  return (
    <span className={`${colorClass} px-3 py-1 rounded-full text-xs font-bold`}>
      {status}
    </span>
  )
}
