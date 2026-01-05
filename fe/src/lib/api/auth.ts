import { api } from '../axios'
import type { LoginResponse, SignupResponse, VerifyEmailResponse } from '../../types/users'

export const authApi = {
    login: async (data: { student_id: string; password: string }) => {
        const response = await api.post<LoginResponse>('/auth/login', data)
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
        const response = await api.post<SignupResponse>('/auth/signup', data)
        return response.data
    },

    sendVerification: async (email: string) => {
        const response = await api.post<{ message: string }>('/auth/send-verification', { email })
        return response.data
    },

    verifyEmail: async (data: { email: string; code: string }) => {
        const response = await api.post<VerifyEmailResponse>('/auth/verify-email', data)
        return response.data
    }
}
