/**
 * 활동(Activities) API
 * 백엔드 엔드포인트: be/app/routes/activities.py
 */
import { api } from '../axios'
import type {
    Activity,
    ActivityListResponse,
    ActivityCreateRequest,
    ActivityUpdateRequest,
    ActivityRegistrationRequest,
    ActivityRegistrationResponse,
    ActivityRegistrationListResponse,
    ActivityType,
    SurveySubmitRequest
} from '../../types/activities'

// 활동 API
export const activityApi = {
    /**
     * 활동 목록 조회
     */
    getAll: async (params?: {
        type_filter?: ActivityType
        is_active_only?: boolean
        page?: number
        page_size?: number
    }): Promise<ActivityListResponse> => {
        const response = await api.get('/activities', { params })
        return response.data
    },

    /**
     * 활동 상세 조회
     */
    getById: async (id: number): Promise<Activity> => {
        const response = await api.get(`/activities/${id}`)
        return response.data
    },

    /**
     * 활동 신청
     */
    register: async (
        activityId: number,
        data: ActivityRegistrationRequest
    ): Promise<ActivityRegistrationResponse> => {
        const response = await api.post(`/activities/${activityId}/register`, data)
        return response.data
    },

    /**
     * 활동 신청 취소
     */
    cancelRegistration: async (activityId: number): Promise<void> => {
        await api.delete(`/activities/${activityId}/register`)
    },

    /**
     * 인증 이미지 업로드 Presigned URL 발급
     */
    getVerificationPresignedUrl: async (
        activityId: number,
        filename: string
    ): Promise<{ presigned_url: string; public_url: string; file_key: string }> => {
        const response = await api.post(
            `/activities/${activityId}/register/presigned-url`,
            null,
            { params: { filename } }
        )
        return response.data
    },

    /**
     * 설문조사 제출
     */
    submitSurvey: async (activityId: number, data: SurveySubmitRequest): Promise<void> => {
        await api.post(`/activities/${activityId}/survey`, data)
    },

    /**
     * 파일 업로드용 Presigned URL 발급
     */
    getPresignedUrl: async (activityId: number, filename: string): Promise<{ presigned_url: string; public_url: string; file_key: string }> => {
        const response = await api.post(`/activities/${activityId}/register/presigned-url`, null, {
            params: { filename }
        })
        return response.data
    },

    /**
     * 파일 업로드
     */
    uploadFile: async (presignedUrl: string, file: File): Promise<void> => {
        const response = await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': 'application/octet-stream'
            }
        })

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'No response body')
            console.error('File upload failed:', response.status, response.statusText, errorText)
            throw new Error(`File upload failed: ${response.status} ${response.statusText}`)
        }
    }
}

// 관리자 API
export const activityAdminApi = {
    /**
     * 이미지 업로드용 Presigned URL 발급
     */
    getPresignedUrl: async (filename: string): Promise<{ presigned_url: string; public_url: string; file_key: string }> => {
        const response = await api.post('/admin/activities/presigned-url', null, {
            params: { filename }
        })
        return response.data
    },

    /**
     * Presigned URL로 이미지 업로드
     * 
     * file.type을 Content-Type으로 사용하여 이미지 MIME 타입을 전송
     */
    uploadImage: async (presignedUrl: string, file: File): Promise<void> => {
        const response = await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': 'application/octet-stream'
            }
        })

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'No response body')
            console.error('Image upload failed:', response.status, response.statusText, errorText)
            throw new Error(`Image upload failed: ${response.status} ${response.statusText}`)
        }
    },

    /**
     * 활동 생성 (관리자)
     */
    create: async (data: ActivityCreateRequest): Promise<Activity> => {
        const response = await api.post('/admin/activities', data)
        return response.data
    },

    /**
     * 활동 수정 (관리자)
     */
    update: async (id: number, data: ActivityUpdateRequest): Promise<Activity> => {
        const response = await api.patch(`/admin/activities/${id}`, data)
        return response.data
    },

    /**
     * 활동 삭제 (관리자)
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/admin/activities/${id}`)
    },

    /**
     * 활동 신청자 목록 조회 (관리자)
     */
    getRegistrations: async (
        activityId: number,
        params?: { page?: number; page_size?: number }
    ): Promise<ActivityRegistrationListResponse> => {
        const response = await api.get(`/admin/activities/${activityId}/registrations`, { params })
        return response.data
    },

    /**
     * 신청 상태 변경 (관리자)
     */
    updateRegistrationStatus: async (
        activityId: number,
        registrationId: number,
        status: 'pending' | 'approved' | 'rejected',
        adminNote?: string
    ): Promise<void> => {
        await api.patch(`/admin/activities/${activityId}/registrations/${registrationId}`, {
            status,
            admin_note: adminNote
        })
    },

    /**
     * 설문조사 통계 조회 (관리자)
     */
    getSurveyStats: async (activityId: number): Promise<{
        activity_id: number
        total_responses: number
        question_stats: any[]
    }> => {
        const response = await api.get(`/admin/activities/${activityId}/survey-stats`)
        return response.data
    }
}
