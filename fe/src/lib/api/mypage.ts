import { api } from '../axios'
import type { User } from '../../types/users'

const API_BASE_URL = '/mypage'

export type MyRegistration = {
    registration_id: number
    status: 'pending' | 'approved' | 'rejected' | 'cancelled'
    registered_at: string
    updated_at?: string
    activity: {
        id: number
        type: string
        title: string
        description?: string
        thumbnail_url?: string
        registration_start?: string
        registration_end?: string
        max_capacity?: number
        current_count?: number
        require_membership?: boolean
        is_active: boolean
    }
}

export type MyRegistrationsResponse = {
    items: MyRegistration[]
    total: number
    page: number
    page_size: number
    total_pages: number
}

export const mypageApi = {
    getProfile: async () => {
        const response = await api.get<User>(API_BASE_URL)
        return response.data
    },

    getMyRegistrations: async (): Promise<MyRegistrationsResponse> => {
        const response = await api.get<MyRegistrationsResponse>(`${API_BASE_URL}/activities`)
        return response.data
    },

    changePassword: async (data: { current_password: string; new_password: string }) => {
        const response = await api.post(`${API_BASE_URL}/password`, data)
        return response.data
    },

    uploadVerificationImage: async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await api.post<{ file_path: string }>(`${API_BASE_URL}/verification-image/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data
    },

    withdraw: async (password: string) => {
        const response = await api.delete<{ message: string }>(`${API_BASE_URL}`, {
            data: { password },
            headers: {
                'Content-Type': 'application/json'
            }
        })
        return response.data
    }
}

