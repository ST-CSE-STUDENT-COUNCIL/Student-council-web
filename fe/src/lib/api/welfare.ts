import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export type WelfareRental = {
    id: number;
    item_name: string;
    category: string;
    image_url?: string | null;
    available_quantity?: number | null;
    application_sheet_url?: string;
    is_active: boolean;
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

export type LockerInfo = {
    id: number;
    layout_image_url: string;
    application_form_url: string;
    return_extension_form_url?: string;
    application_start?: string;
    application_end?: string;
    return_extension_start?: string;
    return_extension_end?: string;
    description?: string | null;
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

    getLockerInfo: async (): Promise<LockerInfo> => {
        const response = await axios.get(`${API_BASE_URL}/welfare/locker_periods`);
        return response.data;
    },

    // NOTE: 대여 신청 API는 현재 백엔드에서 제공되지 않습니다.
};
