import { api } from '../axios'
import type { PendingUserItem, UserListItem, RejectedUserItem, BlockedUserItem } from '../../types/users'

export const adminApi = {
    getPendingUsers: async (params?: { page?: number; limit?: number }) => {
        const response = await api.get<{ users: PendingUserItem[]; total: number }>('/admin/users/pending', { params })
        return response.data
    },
    approveUser: async (userId: string) => {
        const response = await api.post<{ message: string }>(`/admin/users/${userId}/approve`)
        return response.data
    },
    rejectUser: async (userId: string, reason: string) => {
        const response = await api.post<{ message: string }>(`/admin/users/${userId}/reject`, { reason })
        return response.data
    },
    getUsers: async (params?: {
        role?: string | null
        verification_status?: string | null
        membership_paid?: boolean | null
        page?: number
        limit?: number
    }) => {
        const response = await api.get<{ users: UserListItem[]; total: number }>('/admin/users', { params })
        return response.data
    },
    updateUserRole: async (userId: string, role: 'student' | 'admin') => {
        const response = await api.patch<{ message: string }>(`/admin/users/${userId}/role`, { role })
        return response.data
    },
    updateMembershipPaid: async (userId: string, paid: boolean) => {
        const response = await api.patch<{ message: string }>(`/admin/users/${userId}/membership`, { paid })
        return response.data
    },
    getRejectedUsers: async (params?: { page?: number; page_size?: number }) => {
        const response = await api.get<{
            items: RejectedUserItem[]
            total: number
            page: number
            page_size: number
            total_pages: number
        }>('/admin/rejected-users', { params })
        return response.data
    },
    getBlockedUsers: async () => {
        const response = await api.get<{
            blocked_users?: BlockedUserItem[]
            users?: BlockedUserItem[]
            items?: BlockedUserItem[]
            total?: number
        } | BlockedUserItem[]>('/admin/users/blocked')
        return response.data
    },
    unblockUser: async (studentId: string) => {
        const response = await api.post<{ message: string }>(`/admin/users/${studentId}/unblock`)
        return response.data
    },
    getSignedUrl: async (path: string) => {
        const response = await api.get<{ signed_url: string }>('/admin/storage/signed-url', { params: { path } })
        return response.data
    },
}
