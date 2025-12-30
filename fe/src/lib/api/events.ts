import axios from 'axios';
import type { Event } from '../../types/events';

const API_BASE_URL = 'http://localhost:4000';

export const eventApi = {
    getAll: async (): Promise<Event[]> => {
        const response = await axios.get(`${API_BASE_URL}/events`);
        return response.data;
    },

    getById: async (id: number): Promise<Event> => {
        const response = await axios.get(`${API_BASE_URL}/events/${id}`);
        return response.data;
    },

    create: async (event: Omit<Event, 'id'>): Promise<Event> => {
        const response = await axios.post(`${API_BASE_URL}/events`, event);
        return response.data;
    },

    update: async (id: number, event: Partial<Event>): Promise<Event> => {
        const response = await axios.patch(`${API_BASE_URL}/events/${id}`, event);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await axios.delete(`${API_BASE_URL}/events/${id}`);
    }
};
