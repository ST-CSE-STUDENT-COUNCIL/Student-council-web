export function InfoCard({
  title,
  value,
  sub,
}: {
  title: string
  value: string
  sub?: string
}) {
  return (
    <div className="border border-gray-100 dark:border-slate-700 rounded-xl p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <p className="font-semibold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
