/**
 * User Profile Response Schema
 * Corresponds to backend `schemas.users.UserProfileResponse`
 */
export interface UserProfileResponse {
    id: string; // 사용자 UUID
    email: string; // 서울과기대 이메일
    name: string; // 이름
    student_id: string; // 학번
    phone: string; // 전화번호
    department: string; // 학과
    role: 'student' | 'council' | 'admin'; // 권한
    verification_status: 'pending' | 'approved' | 'rejected'; // 승인 상태
    verification_image_url?: string | null; // 학적 인증 이미지 경로
    membership_paid: boolean; // 회비 납부 여부
    rejection_reason?: string | null; // 거절 사유
    verified_at?: string | null; // 승인 일시 (ISO 8601 string)
    created_at: string; // 가입 일시 (ISO 8601 string)
}

/**
 * Authentication Response Schemas
 * Corresponds to backend `schemas.auth`
 */

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: UserProfileResponse; // Backend returns dict, essentially UserProfile
}

export interface SignupResponse {
    message: string;
    user_id: string;
    email: string;
    name: string;
}

export interface VerifyEmailResponse {
    message: string;
    email: string;
}

export interface CheckStudentIdResponse {
    available: boolean;
    message: string;
}

/**
 * Admin User List Item
 * Corresponds to backend `schemas.admin.UserListItem`
 */
export interface UserListItem {
    id: string;
    student_id: string;
    name: string;
    email: string;
    department?: string | null;
    phone?: string | null;
    role: string;
    verification_status: string;
    membership_paid: boolean;
    created_at: string;
}

/**
 * Pending User Item
 * Corresponds to backend `schemas.admin.PendingUserItem`
 */
export interface PendingUserItem {
    id: string;
    student_id: string;
    name: string;
    email: string;
    department?: string | null;
    phone?: string | null;
    verification_image_url?: string | null;
    created_at: string;
}

// Frontend-only or legacy types (if applicable)
// If you have types that are not in the backend but used in frontend, define them here with comments.