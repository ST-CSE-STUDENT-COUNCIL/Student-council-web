import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';

export interface WelfareRental {
    id: number;
    item_name: string;
    category: string;
    description: string;
    quantity: number;
    available_quantity: number;
    image_url: string;
    rental_period_days: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const welfareApi = {
    getRentals: async (): Promise<WelfareRental[]> => {
        const response = await axios.get(`${API_BASE_URL}/welfare_rentals`);
        return response.data;
    },

    getRentalById: async (id: number): Promise<WelfareRental> => {
        const response = await axios.get(`${API_BASE_URL}/welfare_rentals/${id}`);
        return response.data;
    }
};
