import axios from 'axios';
import type { Notice } from '../../types/notices';

const API_BASE_url = 'http://localhost:4000';

export const noticeApi = {
    getAll: async (): Promise<Notice[]> => {
        const response = await axios.get(`${API_BASE_url}/notices`);
        return response.data;
    },

    getById: async (id: number): Promise<Notice> => {
        const response = await axios.get(`${API_BASE_url}/notices/${id}`);
        return response.data;
    },

    incrementViews: async (id: number): Promise<void> => {
        await axios.post(`${API_BASE_url}/notices/${id}/views`);
    }
};
