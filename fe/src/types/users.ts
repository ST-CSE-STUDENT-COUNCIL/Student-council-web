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
    role: 'student' | 'council' | 'admin'
    verification_status: 'pending' | 'approved' | 'rejected'
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
    is_banned?: boolean
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

/**
 * Rejected User Item
 * Returned from /admin/rejected-users
 */
export type RejectedUserItem = {
    id: number
    original_user_id: string
    email: string
    name: string
    student_id: string
    department: string
    phone: string
    rejection_reason: string
    rejected_at: string
    rejected_by: string | null
}

/**
 * Blocked User Item
 * Returned from /admin/users/blocked
 */
export type BlockedUserItem = {
    id?: string | number | null
    student_id?: string | null
    name?: string | null
    email?: string | null
    department?: string | null
    phone?: string | null
    blocked_at?: string | null
    block_until?: string | null
    block_reason?: string | null
    failed_attempts?: number | null
    created_at?: string | null
    recent_attempts?: Array<{
        id: number
        student_id: string
        attempt_time: string
        success: boolean
        ip_address: string
        created_at: string
    }>
}
