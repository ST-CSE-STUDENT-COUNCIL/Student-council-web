export function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700">
      <span className="text-gray-600 dark:text-gray-400 font-medium">{label}</span>
      <span className="text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}
