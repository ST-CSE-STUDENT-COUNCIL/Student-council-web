import { SUMMARY_CARDS } from './constants'
import type { SummaryCounts } from './types'

type SummaryCardsProps = {
  summaryCounts: SummaryCounts
}

export function SummaryCards({ summaryCounts }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {SUMMARY_CARDS.map((card) => {
        const Icon = card.icon
        const value = summaryCounts[card.key]
        return (
          <div
            key={card.key}
            className={`rounded-2xl border border-gray-100 p-5 flex flex-col gap-2 shadow-sm ${card.accent}`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm opacity-80">{card.label}</div>
              <Icon size={18} />
            </div>
            <div className="text-3xl font-bold">{value}</div>
          </div>
        )
      })}
    </div>
  )
}
