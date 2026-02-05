/**
 * 개인정보 총책임자(학생회장) 정보 타입
 */
export interface PrivacyOfficerInfo {
    id: number
    name: string | null
    phone: string | null
    email: string | null
    office_address: string | null
    description: string | null
    created_at: string
    updated_at: string
}

/**
 * 개인정보 총책임자 정보 수정 요청 타입
 */
export interface PrivacyOfficerUpdateRequest {
    name?: string | null
    phone?: string | null
    email?: string | null
    office_address?: string | null
    description?: string | null
}
