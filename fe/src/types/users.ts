/**
 * User Profile Response Schema
 * Corresponds to backend `schemas.users.UserProfileResponse`
 */
export type User = {
    id: string
    email: string
    name: string
    student_id: string
    phone: string
    department: string
    role: 'student' | 'admin'
    verification_status: 'pending' | 'submitted' | 'approved' | 'rejected'
    verification_image_url?: string | null
    membership_paid: boolean
    rejection_reason?: string | null
    verified_at?: string | null
    created_at: string
}

/**
 * Authentication Response Schemas
 * Corresponds to backend `schemas.auth`
 */

export type LoginResponse = {
    access_token: string
    token_type: string
    user: User
}

export type SignupResponse = {
    message: string
    user_id: string
    email: string
    name: string
}

export type VerifyEmailResponse = {
    message: string
    email: string
}

export type CheckStudentIdResponse = {
    available: boolean
    message: string
}

/**
 * Admin User List Item
 * Corresponds to backend `schemas.admin.UserListItem`
 */
export type UserListItem = {
    id: string
    student_id: string
    name: string
    email: string
    department?: string | null
    phone?: string | null
    role: string
    verification_status: string
    membership_paid: boolean
    created_at: string
}

/**
 * Pending User Item
 * Corresponds to backend `schemas.admin.PendingUserItem`
 */
export type PendingUserItem = {
    id: string
    student_id: string
    name: string
    email: string
    department?: string | null
    phone?: string | null
    verification_image_url?: string | null
    created_at: string
}
