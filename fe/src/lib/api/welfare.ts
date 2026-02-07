import axios from 'axios';

// 환경 변수에서 API URL을 가져옴 (기본값: 프록시 경유)
const API_BASE_URL =
    import.meta.env.VITE_API_URL || '/api';

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
    created_at: string;
    updated_at: string;
};

export type PrinterInfo = {
    id: number;
    image_url: string | null;
    description: string | null;
    google_form_url: string | null;
    updated_at: string;
};

export type GuidebookInfo = {
    notion_url: string;
    title?: string;
    description?: string;
};

export type RentalConfig = {
    sheet_url: string;
    application_form_url: string;
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
            headers: {
                'Content-Type': 'application/octet-stream'
            }
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
     * 프린터 사용 안내 이미지 업로드용 Presigned URL을 획득합니다.
     */
    getPrinterImagePresignedUrl: async (filename: string, token?: string | null): Promise<{ presigned_url: string; public_url: string }> => {
        const response = await axios.post(`${API_BASE_URL}/admin/welfare/print/image/presigned-url`, {}, {
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

    /**
     * 프린터 사용 안내 이미지 업로드 완료를 서버에 알립니다.
     */
    completePrinterImageUpload: async (publicUrl: string, token?: string | null): Promise<string> => {
        const response = await axios.post(`${API_BASE_URL}/admin/welfare/print/image/complete`, {}, {
            params: { public_url: publicUrl },
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response.data;
    },

    /**
     * 복지 물품 목록을 가져옵니다.
     */
    getRentals: async (): Promise<WelfareRental[]> => {
        const response = await axios.get(`${API_BASE_URL}/welfare/welfare_rentals`);
        return response.data;
    },

    /**
     * 사물함 정보를 가져옵니다.
     */
    getLockerInfo: async (): Promise<LockerInfo> => {
        const response = await axios.get(`${API_BASE_URL}/welfare/locker_periods`);
        return response.data;
    },

    /**
     * 프린터 사용 안내 정보를 가져옵니다.
     */
    getPrinterInfo: async (): Promise<PrinterInfo> => {
        const response = await axios.get(`${API_BASE_URL}/welfare/print`);
        return response.data;
    },

    /**
     * 대여사업 공통 시트/신청 폼 URL을 조회합니다.
     */
    getRentalConfig: async (): Promise<RentalConfig> => {
        const response = await axios.get(`${API_BASE_URL}/welfare/rental_config`);
        return response.data;
    },

    /**
     * 특정 복지 물품 정보를 가져옵니다.
     */
    getRentalById: async (id: number): Promise<WelfareRental> => {
        const response = await axios.get(`${API_BASE_URL}/welfare/welfare_rentals/${id}`);
        return response.data;
    },

    /**
     * 복지 물품을 생성합니다.
     */
    createRental: async (payload: Partial<WelfareRental>, token?: string | null) => {
        const response = await axios.post(`${API_BASE_URL}/admin/welfare/welfare_rentals`, payload, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response.data;
    },

    /**
     * 복지 물품을 삭제합니다.
     */
    deleteRental: async (itemId: number, token?: string | null) => {
        const response = await axios.delete(`${API_BASE_URL}/admin/welfare/welfare_rentals/${itemId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response.data;
    },

    /**
     * 복지 물품을 수정합니다.
     */
    updateRental: async (itemId: number, payload: Partial<WelfareRental>, token?: string | null) => {
        const response = await axios.put(`${API_BASE_URL}/admin/welfare/welfare_rentals/${itemId}`, payload, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response.data;
    },

    /**
     * 사물함 정보를 수정합니다.
     */
    updateLockerInfo: async (data: {
        application_form_url?: string | null;
        return_extension_form_url?: string | null;
        application_start?: string | null;
        application_end?: string | null;
        return_extension_start?: string | null;
        return_extension_end?: string | null;
        description?: string | null;
    }, token?: string | null): Promise<LockerInfo> => {
        const response = await axios.put(`${API_BASE_URL}/admin/welfare/locker_periods`, data, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response.data;
    },

    /**
     * 프린터 사용 안내 정보를 수정합니다.
     */
    updatePrinterInfo: async (data: { description?: string | null }, token?: string | null): Promise<PrinterInfo> => {
        const response = await axios.put(`${API_BASE_URL}/admin/welfare/print`, data, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response.data;
    },

    /**
     * 대여사업 공통 시트/신청 폼 URL을 수정합니다.
     */
    updateRentalConfig: async (data: {
        sheet_url: string;
        application_form_url: string;
    }, token?: string | null): Promise<RentalConfig> => {
        const response = await axios.put(`${API_BASE_URL}/admin/welfare/rental_config`, data, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response.data;
    },

    /**
     * 신입생 가이드북 정보를 가져옵니다.
     */
    getGuidebookInfo: async (): Promise<GuidebookInfo> => {
        const response = await axios.get(`${API_BASE_URL}/welfare/guidebook`);
        return response.data;
    },

    /**
     * 신입생 가이드북 정보를 수정합니다.
     */
    updateGuidebookInfo: async (data: { notion_url?: string; title?: string; description?: string }, token?: string | null): Promise<GuidebookInfo> => {
        const response = await axios.put(`${API_BASE_URL}/admin/welfare/guidebook`, data, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response.data;
    },
};

