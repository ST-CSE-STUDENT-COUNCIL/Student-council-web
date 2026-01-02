export function Badge({ tone }: { tone: string }) {
  const colorMap: Record<string, string> = {
    확인중: 'bg-yellow-100 text-yellow-700',
    납부: 'bg-green-100 text-green-700',
    미납부: 'bg-red-100 text-red-700',
    '인증 완료': 'bg-green-100 text-green-700',
    '인증 대기': 'bg-yellow-100 text-yellow-700',
    미인증: 'bg-red-100 text-red-700',
  }

  const cls = colorMap[tone] || 'bg-gray-100 text-gray-700'

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {tone}
    </span>
  )
}
