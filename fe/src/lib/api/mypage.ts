import { api } from '../axios'
import type { User } from '../../types/users'

const API_BASE_URL = '/mypage'

export const mypageApi = {
    getProfile: async () => {
        const response = await api.get<User>(API_BASE_URL)
        return response.data
    },

    changePassword: async (data: { current_password: string; new_password: string }) => {
        const response = await api.post(`${API_BASE_URL}/password`, data)
        return response.data
    },

    getVerificationPresignedUrl: async (
        filename: string,
    ): Promise<{ presigned_url: string; public_url: string; file_key: string }> => {
        const response = await api.post(`${API_BASE_URL}/verification-image/presigned-url`, null, {
            params: { filename },
        })
        return response.data
    },

    uploadVerificationImageToStorage: async (presignedUrl: string, file: File) => {
        const response = await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                // Backend signs the presigned URL with this content type
                'Content-Type': 'application/octet-stream',
            },
        })

        if (!response.ok) {
            throw new Error(`이미지 업로드 실패: ${response.status}`)
        }
    },

    completeVerificationImageUpload: async (imageUrl: string) => {
        const response = await api.post<{ file_path: string }>(`${API_BASE_URL}/verification-image`, {
            image_url: imageUrl,
        })
        return response.data
    },
}
