import type { Suggestion } from '../../../types/suggestions'

export type SuggestionStatus = Suggestion['status']

export type ActionDraft = {
  status: SuggestionStatus
  resolutionNote: string
}

export type SummaryCounts = Record<SuggestionStatus, number> & { total: number }
