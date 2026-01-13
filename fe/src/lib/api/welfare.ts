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
    /**
     * Presigned URL을 획득합니다.
     * S3에 이미지를 직접 업로드할 때 필요합니다.
     */
    getPresignedUrl: async (filename: string, token?: string | null): Promise<{ presigned_url: string; public_url: string }> => {
        const response = await axios.post(`${API_BASE_URL}/admin/welfare/welfare_rentals/presigned-url`, {}, {
            params: { filename },
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response.data;
    },

    /**
     * Presigned URL을 사용하여 S3에 이미지를 직접 업로드합니다.
     * CORS preflight를 방지하기 위해 커스텀 헤더를 사용하지 않습니다.
     * R2는 파일 확장자로 Content-Type을 자동 추론합니다.
     */
    uploadImageToS3: async (presignedUrl: string, file: File): Promise<void> => {
        const response = await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
        });

        if (!response.ok) {
            throw new Error(`이미지 업로드 실패: ${response.status}`);
        }
    },

    /**
     * 사물함 배치도 업로드용 Presigned URL을 획득합니다.
     */
    getLockerImagePresignedUrl: async (filename: string, token?: string | null): Promise<{ presigned_url: string; public_url: string }> => {
        const response = await axios.post(`${API_BASE_URL}/admin/welfare/locker_image/presigned-url`, {}, {
            params: { filename },
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response.data;
    },

    /**
     * Presigned URL 업로드 완료 후 서버에 공개 URL을 전달합니다.
     */
    completeLockerImageUpload: async (publicUrl: string, token?: string | null): Promise<{ layout_image_url?: string }> => {
        const response = await axios.post(`${API_BASE_URL}/admin/welfare/locker_image/complete`, {}, {
            params: { public_url: publicUrl },
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response.data;
    },

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

    createRental: async (payload: Partial<WelfareRental>, token?: string | null) => {
        const response = await axios.post(`${API_BASE_URL}/admin/welfare/welfare_rentals`, payload, {
            headers: token
                ? {
                    Authorization: `Bearer ${token}`,
                }
                : undefined,
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
        const response = await axios.put(`${API_BASE_URL}/admin/welfare/locker_periods`, data, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response.data;
    },
};
