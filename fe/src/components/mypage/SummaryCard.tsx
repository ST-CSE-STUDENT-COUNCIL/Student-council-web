export function SummaryCard({
  title,
  value,
  tone,
}: {
  title: string
  value: number
  tone: 'blue' | 'gray'
}) {
  const colors = tone === 'blue' ? 'text-blue-600' : 'text-gray-700'

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 text-center">
      <div className={`text-2xl font-bold ${colors} dark:text-blue-400 mb-1`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{title}</div>
    </div>
  )
}
