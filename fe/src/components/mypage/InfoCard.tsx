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
    <div className="border border-gray-100 rounded-xl p-4">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
