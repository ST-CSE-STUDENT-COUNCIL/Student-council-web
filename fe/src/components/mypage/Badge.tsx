export function Badge({ tone }: { tone: string }) {
  const colorMap: Record<string, string> = {
    확인중: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    '확인 중': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    납부: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    미납부: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    '인증 완료': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    '인증 대기': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    미인증: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  const cls = colorMap[tone] || 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300'

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {tone}
    </span>
  )
}
