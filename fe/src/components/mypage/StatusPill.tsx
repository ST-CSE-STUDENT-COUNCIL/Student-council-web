export function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    '신청 완료': 'bg-blue-100 text-blue-700',
    '입금 대기': 'bg-yellow-100 text-yellow-700',
    '접수 완료': 'bg-green-100 text-green-700',
  }

  const colorClass = colors[status] || 'bg-gray-100 text-gray-700'

  return (
    <span className={`${colorClass} px-3 py-1 rounded-full text-xs font-bold`}>
      {status}
    </span>
  )
}
