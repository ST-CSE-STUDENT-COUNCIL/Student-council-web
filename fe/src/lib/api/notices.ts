import { api } from '../axios';
import type { Notice } from '../../types/notices';

const API_BASE_URL = '/notices'; // Use relative path since baseURL is set in api instance

export const noticeApi = {
    getAll: async (): Promise<Notice[]> => {
        const response = await api.get(`${API_BASE_URL}`);
        return response.data;
    },

    getById: async (id: number): Promise<Notice> => {
        const response = await api.get(`${API_BASE_URL}/${id}`);
        return response.data;
    },

    incrementViews: async (id: number): Promise<void> => {
        await api.post(`${API_BASE_URL}/${id}/views`);
    }
};
