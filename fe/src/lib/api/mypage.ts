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

    uploadVerificationImage: async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await api.post<{ file_path: string }>(`${API_BASE_URL}/verification-image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return response.data
    }
}
