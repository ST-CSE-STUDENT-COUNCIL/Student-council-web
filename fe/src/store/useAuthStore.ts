import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
    id: string
    student_id: string
    name: string
    email: string
    department?: string
    phone?: string
    role: 'student' | 'council' | 'admin'
    is_verified: boolean
    verification_image_url?: string
    verification_status: 'pending' | 'approved' | 'rejected'
    verified_at?: string
    rejection_reason?: string
    membership_paid: boolean
    membership_paid_at?: string
    created_at?: string
    updated_at?: string
}

interface AuthState {
    user: User | null
    isAuthenticated: boolean
    accessToken: string | null
    login: (user: User, accessToken: string) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            login: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
            logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage',
        },
    ),
)
