import { api } from '../axios'

export type SearchResultItem = {
    id: number
    type: 'activity' | 'notice' | 'club'
    title: string
    description?: string
    url: string
    date: string
    thumbnail_url?: string
}

export type SearchResponse = {
    results: SearchResultItem[]
    total_count: number
}

export const searchApi = {
    search: async (q: string, limit: number = 20): Promise<SearchResponse> => {
        const response = await api.get<SearchResponse>('/search', {
            params: { q, limit }
        })
        return response.data
    }
}
