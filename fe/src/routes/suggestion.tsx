import { api } from '../axios'
import type { Suggestion } from '../../types/suggestions' // 타입 파일이 없다면 추후 생성 필요

const API_BASE_URL = '/suggestions'

export const suggestionApi = {
    getAll: async (params?: { status_filter?: string; page?: number; page_size?: number }) => {
        const response = await api.get<{ suggestions: Suggestion[]; pagination: any }>(API_BASE_URL, { params })
        return response.data
    },

    create: async (data: { title: string; content: string }) => {
        const response = await api.post<Suggestion>(API_BASE_URL, data)
        return response.data
    }
}
