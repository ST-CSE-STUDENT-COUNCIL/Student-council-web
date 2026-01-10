import axios from 'axios';

// 환경 변수에서 API URL을 가져옴 (기본값: 프록시 경유)
const API_BASE_URL =
    import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://seoultechcom-api.onrender.com');

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
    layout_image_url?: string;
    application_form_url?: string;
    return_extension_form_url?: string;
    application_start?: string;
    application_end?: string;
    return_extension_start?: string;
    return_extension_end?: string;
    description?: string;
    created_at: string;
    updated_at: string;
};

export const welfareApi = {
    getRentals: async (): Promise<WelfareRental[]> => {
        const response = await axios.get(`${API_BASE_URL}/welfare/welfare_rentals`);
        return response.data;
    },

    getLockerPeriods: async (): Promise<LockerPeriod> => {
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

    uploadLockerImage: async (formData: FormData, token?: string | null) => {
        const response = await axios.post(`${API_BASE_URL}/admin/welfare/locker_image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        return response.data;
    },

    updateLockerPeriods: async (data: {
        application_form_url?: string | null;
        return_extension_form_url?: string | null;
        application_start?: string | null;
        application_end?: string | null;
        return_extension_start?: string | null;
        return_extension_end?: string | null;
        description?: string | null;
    }, token?: string | null): Promise<LockerPeriod> => {
        // FormData로 변환
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        });

        const response = await axios.put(`${API_BASE_URL}/admin/welfare/locker_periods`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        return response.data;
    },
};
