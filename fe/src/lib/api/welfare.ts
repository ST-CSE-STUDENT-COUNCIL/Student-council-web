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

export interface RentalRequestPayload {
    rental_id: number;
    user_id: string;
    status: string;
    rental_start_date: string;
    rental_end_date: string;
    actual_return_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface LockerPeriod {
    id: number;
    name?: string;
    period_name?: string;
    rental_start?: string;
    rental_end?: string;
    return_start?: string;
    return_end?: string;
    application_start?: string;
    application_end?: string;
    usage_start?: string;
    usage_end?: string;
    is_active?: boolean;
    created_at: string;
    updated_at: string;
}

export const welfareApi = {
    getRentals: async (): Promise<WelfareRental[]> => {
        const response = await axios.get(`${API_BASE_URL}/welfare_rentals`);
        return response.data;
    },

    getLockerPeriods: async (): Promise<LockerPeriod[]> => {
        const response = await axios.get(`${API_BASE_URL}/locker_periods`);
        return response.data;
    },

    getRentalById: async (id: number): Promise<WelfareRental> => {
        const response = await axios.get(`${API_BASE_URL}/welfare_rentals/${id}`);
        return response.data;
    },

    createRentalRequest: async (payload: RentalRequestPayload, token?: string | null) => {
        const response = await axios.post(`${API_BASE_URL}/welfare_rental_requests`, payload, {
            headers: token
                ? {
                    Authorization: `Bearer ${token}`,
                }
                : undefined,
        });
        return response.data;
    }
};
