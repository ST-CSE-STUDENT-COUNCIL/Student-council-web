import axios from 'axios';

// 환경 변수에서 API URL을 가져옴 (기본값: http://localhost:8000)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export type WelfareRental = {
    id: number;
    item_name: string;
    category: string | null;
    image_url: string | null;
    application_sheet_url: string;
    spreadsheet_id: string;
    quantity_sheet_name: string;
    quantity_cell_range: string;
    available_quantity: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type RentalRequestPayload = {
    rental_id: number;
    user_id: string;
    status: string;
    rental_start_date: string;
    rental_end_date: string;
    actual_return_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type LockerPeriod = {
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
};

export const welfareApi = {
    getRentals: async (): Promise<WelfareRental[]> => {
        const response = await axios.get(`${API_BASE_URL}/welfare/welfare_rentals`);
        return response.data;
    },

    getLockerPeriods: async (): Promise<LockerPeriod[]> => {
        const response = await axios.get(`${API_BASE_URL}/welfare/locker_periods`);
        return response.data;
    },

    getRentalById: async (id: number): Promise<WelfareRental> => {
        const response = await axios.get(`${API_BASE_URL}/welfare/welfare_rentals/${id}`);
        return response.data;
    },

    createRental: async (formData: FormData, token?: string | null) => {
        const response = await axios.post(`${API_BASE_URL}/admin/welfare/welfare_rentals`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        return response.data;
    },

    createRentalRequest: async (payload: RentalRequestPayload, token?: string | null) => {
        const response = await axios.post(`${API_BASE_URL}/admin/welfare/welfare_rental_requests`, payload, {
            headers: token
                ? {
                    Authorization: `Bearer ${token}`,
                }
                : undefined,
        });
        return response.data;
    },

    deleteRental: async (itemId: number, token?: string | null) => {
        const response = await axios.delete(`${API_BASE_URL}/admin/welfare/welfare_rentals/${itemId}`, {
            headers: token
                ? {
                    Authorization: `Bearer ${token}`,
                }
                : undefined,
        });
        return response.data;
    },

    updateRental: async (itemId: number, payload: Partial<WelfareRental>, token?: string | null) => {
        const response = await axios.put(`${API_BASE_URL}/admin/welfare/welfare_rentals/${itemId}`, payload, {
            headers: token
                ? {
                    Authorization: `Bearer ${token}`,
                }
                : undefined,
        });
        return response.data;
    },
};
