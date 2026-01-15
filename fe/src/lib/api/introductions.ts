import { api } from '../axios'
import type { IntroductionImage, IntroductionImageCreate, IntroductionImageUpdate, IntroductionImageListResponse } from '../../types/introductions'

const API_BASE_URL = '/introductions'

/**
 * 학생회 소개 이미지 관련 API 함수
 */
export const introductionApi = {
    /**
     * 학생회 소개 이미지 목록 조회 (공개 API)
     * @param activeOnly 활성화된 이미지만 조회할지 여부 (기본값: true)
     */
    getAll: async (activeOnly: boolean = true) => {
        const response = await api.get<IntroductionImageListResponse>(
            `${API_BASE_URL}/images`,
            {
                params: { active_only: activeOnly }
            }
        )
        return response.data
    },

    /**
     * 학생회 소개 이미지 업로드용 Presigned URL 발급 (관리자 전용)
     * api 인스턴스가 자동으로 Authorization 헤더를 추가하므로 별도로 헤더 설정 불필요
     */
    getPresignedUrl: async (filename: string) => {
        const response = await api.post<{ presigned_url: string; public_url: string; file_key: string }>(
            `/admin/introductions/images/presigned-url`,
            {},
            {
                params: { filename }
            }
        )
        return response.data
    },

    /**
     * Presigned URL을 사용하여 R2에 이미지를 직접 업로드
     */
    uploadImageToR2: async (presignedUrl: string, file: File): Promise<void> => {
        const response = await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': 'application/octet-stream'
            }
        })

        if (!response.ok) {
            throw new Error(`이미지 업로드 실패: ${response.status}`)
        }
    },

    /**
     * 학생회 소개 이미지 추가 (관리자 전용)
     */
    create: async (data: IntroductionImageCreate) => {
        const response = await api.post<IntroductionImage>(`/admin/introductions/images`, data)
        return response.data
    },

    /**
     * 학생회 소개 이미지 정보 수정 (관리자 전용)
     */
    update: async (id: number, data: IntroductionImageUpdate) => {
        const response = await api.patch<IntroductionImage>(`/admin/introductions/images/${id}`, data)
        return response.data
    },

    /**
     * 학생회 소개 이미지 삭제 (관리자 전용)
     */
    delete: async (id: number) => {
        await api.delete(`/admin/introductions/images/${id}`)
    }
}
