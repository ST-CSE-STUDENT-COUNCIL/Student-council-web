import { api } from '../axios'
import type { Club } from '../../types/clubs'

const API_BASE_URL = '/clubs'

export const clubApi = {
    getAll: async () => {
        const response = await api.get<{ clubs: Club[], total: number }>(`${API_BASE_URL}`)
        return response.data.clubs  // clubs 배열만 반환
    },

    getById: async (id: number) => {
        const response = await api.get<Club>(`${API_BASE_URL}/${id}`)
        return response.data
    }
}