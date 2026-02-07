import { api } from '../axios'
import type { PrivacyOfficerInfo, PrivacyOfficerUpdateRequest } from '../../types/privacyOfficer'

/**
 * 개인정보 총책임자(학생회장) 정보 관련 API
 */
export const privacyOfficerApi = {
    /**
     * 개인정보 총책임자 정보 조회 (공개 API)
     * 푸터 등에서 사용
     */
    getPublic: async (): Promise<PrivacyOfficerInfo> => {
        const response = await api.get<PrivacyOfficerInfo>('/privacy-officer')
        return response.data
    },

    /**
     * 개인정보 총책임자 정보 조회 (관리자 전용)
     */
    get: async (): Promise<PrivacyOfficerInfo> => {
        const response = await api.get<PrivacyOfficerInfo>('/admin/privacy-officer')
        return response.data
    },

    /**
     * 개인정보 총책임자 정보 수정 (관리자 전용)
     * @param data 수정할 필드
     */
    update: async (data: PrivacyOfficerUpdateRequest): Promise<PrivacyOfficerInfo> => {
        // 빈 문자열이 아닌 필드만 쿼리 파라미터로 전송
        const params = new URLSearchParams()
        if (data.name) params.append('name', data.name)
        if (data.phone) params.append('phone', data.phone)
        if (data.email) params.append('email', data.email)
        if (data.office_address) params.append('office_address', data.office_address)
        if (data.description) params.append('description', data.description)

        const response = await api.put<PrivacyOfficerInfo>(`/admin/privacy-officer?${params.toString()}`)
        return response.data
    }
}

