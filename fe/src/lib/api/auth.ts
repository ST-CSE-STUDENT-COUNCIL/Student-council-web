import { api } from '../axios'
import type { LoginResponse, SignupResponse, VerifyEmailResponse } from '../../types/users'

const API_BASE_URL = '/auth'

export const authApi = {
    login: async (data: { student_id: string; password: string }) => {
        const response = await api.post<LoginResponse>(`${API_BASE_URL}/login`, data)
        return response
    },

    signup: async (data: {
        name: string
        student_id: string
        email: string
        phone: string
        password: string
        department: string
    }) => {
        const response = await api.post<SignupResponse>(`${API_BASE_URL}/signup`, data)
        return response.data
    },
    checkStudentId: async (student_id: string) => {
        const response = await api.post<{ available: boolean; message: string }>(`${API_BASE_URL}/check-student-id`, { student_id })
        return response.data
    },
    logout: async () => {
        const response = await api.post<{ message: string }>(`${API_BASE_URL}/logout`)
        return response.data
    },
    sendVerification: async (email: string) => {
        const response = await api.post<{ message: string }>(`${API_BASE_URL}/send-verification`, { email })
        return response.data
    },

    verifyEmail: async (data: { email: string; code: string }) => {
        const response = await api.post<VerifyEmailResponse>(`${API_BASE_URL}/verify-email`, data)
        return response.data
    },

    resetPassword: async (data: { email: string; new_password: string }) => {
        const response = await api.post<{ message: string }>(`${API_BASE_URL}/reset-password`, data)
        return response.data
    }
}
