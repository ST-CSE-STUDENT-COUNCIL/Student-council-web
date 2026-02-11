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
    banUser: async (userId: string, reason: string) => {
        const response = await api.patch<{ message: string; user_id: string }>(`/admin/users/${userId}/ban`, { reason })
        return response.data
    },
    unbanUser: async (userId: string, note?: string) => {
        const response = await api.patch<{ message: string; user_id: string }>(`/admin/users/${userId}/unban`, { note })
        return response.data
    },
    deleteUser: async (userId: string) => {
        const response = await api.delete<{ message: string; user_id: string }>(`/admin/users/${userId}`)
        return response.data
    },
    getProfileUpdates: async (params?: { status_filter?: string | null; page?: number; page_size?: number }) => {
        const response = await api.get('/admin/profile-updates', { params })
        return response.data
    },
    getApprovedProfileUpdates: async (params?: { page?: number; page_size?: number }) => {
        const response = await api.get('/admin/profile-updates/approved', { params })
        return response.data
    },
    getRejectedProfileUpdates: async (params?: { page?: number; page_size?: number }) => {
        const response = await api.get('/admin/profile-updates/rejected', { params })
        return response.data
    },
    getStorageSignedUrl: async (path: string) => {
        const response = await api.get<{ signed_url?: string }>('/admin/storage/signed-url', {
            params: { path },
        })
        return response.data
    },
    approveProfileUpdate: async (requestId: string | number) => {
        const response = await api.post(`/admin/profile-updates/${requestId}/approve`)
        return response.data
    },
    rejectProfileUpdate: async (requestId: string | number, reason: string) => {
        const response = await api.post(`/admin/profile-updates/${requestId}/reject`, null, {
            params: { reason },
        })
        return response.data
    },
    getSignedUrl: async (path: string) => {
        const response = await api.get<{ signed_url: string }>('/admin/storage/signed-url', { params: { path } })
        return response.data
    },
    getActivityAttendance: async (activityId: number) => {
        const response = await api.get<{
            activity_id: number
            activity_title: string
            total_registrations: number
            attended_count: number
            attendance_rate: number
            registrations: any[]
            is_attendance_open: boolean
        }>(`/admin/${activityId}/attendance`)
        return response.data
    },
    cancelActivityAttendance: async (activityId: number, registrationId: number) => {
        const response = await api.delete(`/admin/${activityId}/registrations/${registrationId}/attend`)
        return response.data
    },
    markActivityAttendance: async (activityId: number, registrationId: number) => {
        const response = await api.post(`/admin/${activityId}/registrations/${registrationId}/attend`)
        return response.data
    },
}
