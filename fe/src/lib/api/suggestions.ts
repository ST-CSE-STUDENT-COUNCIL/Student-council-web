import { api } from '../axios'
import type { Suggestion, SuggestionListResponse } from '../../types/suggestions'

const API_BASE_URL = '/suggestions'

export const suggestionApi = {
    getAll: async (params?: { status_filter?: string; page?: number; page_size?: number }) => {
        const response = await api.get<SuggestionListResponse>(API_BASE_URL, { params })
        return response.data
    },

    getById: async (suggestionId: number) => {
        const response = await api.get<Suggestion>(`${API_BASE_URL}/${suggestionId}`)
        return response.data
    },

    create: async (data: { title: string; content: string }) => {
        const response = await api.post<Suggestion>(API_BASE_URL, data)
        return response.data
    },

    updateStatus: async (
        suggestionId: number,
        data: { status: Suggestion['status']; rejection_reason?: string; resolution_note?: string }
    ) => {
        const response = await api.patch<Suggestion>(`/admin/suggestions/${suggestionId}/status`, data)
        return response.data
    },

    delete: async (suggestionId: number) => {
        await api.delete(`${API_BASE_URL}/${suggestionId}`)
    }
}
