import { api } from '../axios'
import type { User } from '../../types/users'

const API_BASE_URL = '/mypage'

export type MyRegistration = {
    id: number
    activity_id: number
    status: 'pending' | 'approved' | 'rejected' | 'cancelled'
    created_at: string
    activity: {
        id: number
        type: string
        title: string
        description?: string
        thumbnail_url?: string
        registration_start?: string
        registration_end?: string
        is_active: boolean
    } | null
}

export type MyRegistrationsResponse = {
    registrations: MyRegistration[]
}

export const mypageApi = {
    getProfile: async () => {
        const response = await api.get<User>(API_BASE_URL)
        return response.data
    },

    getMyRegistrations: async (): Promise<MyRegistrationsResponse> => {
        const response = await api.get<MyRegistrationsResponse>(`${API_BASE_URL}/registrations`)
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
}

