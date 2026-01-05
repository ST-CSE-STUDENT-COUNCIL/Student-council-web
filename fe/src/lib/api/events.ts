import { api } from '../axios'
import type { Event } from '../../types/events'

const API_BASE_URL = '/events'

export const eventApi = {
    getAll: async (): Promise<Event[]> => {
        const response = await api.get(`${API_BASE_URL}`)
        return response.data
    },

    getById: async (id: number): Promise<Event> => {
        const response = await api.get(`${API_BASE_URL}/${id}`)
        return response.data
    },

    create: async (event: Omit<Event, 'id'>): Promise<Event> => {
        const response = await api.post(`${API_BASE_URL}`, event)
        return response.data
    },

    update: async (id: number, event: Partial<Event>): Promise<Event> => {
        const response = await api.patch(`${API_BASE_URL}/${id}`, event)
        return response.data
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`${API_BASE_URL}/${id}`)
    }
}
