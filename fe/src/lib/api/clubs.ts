import { api } from '../axios'
import type { Club } from '../../types/clubs'

export const clubApi = {
    getAll: async () => {
        const response = await api.get<Club[]>('/clubs')
        return response.data
    },

    getById: async (id: number) => {
        const response = await api.get<Club>(`/clubs/${id}`)
        return response.data
    }
}
