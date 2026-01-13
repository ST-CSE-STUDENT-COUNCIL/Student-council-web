import { api } from '../axios'
import type { Club, ClubCreate, ClubUpdate } from '../../types/clubs'

const API_BASE_URL = '/clubs'

/**
 * 동아리 관련 API 함수
 */
export const clubApi = {
    /**
     * 동아리 목록 조회 (공개 API)
     */
    getAll: async () => {
        const response = await api.get<{ clubs: Club[], total: number }>(`${API_BASE_URL}`)
        return response.data.clubs  // clubs 배열만 반환
    },

    /**
     * 동아리 상세 조회 (공개 API)
     */
    getById: async (id: number) => {
        const response = await api.get<Club>(`${API_BASE_URL}/${id}`)
        return response.data
    },

    /**
     * 동아리 이미지 업로드용 Presigned URL 발급 (관리자 전용)
     * api 인스턴스가 자동으로 Authorization 헤더를 추가하므로 별도로 헤더 설정 불필요
     */
    getPresignedUrl: async (filename: string) => {
        const response = await api.post<{ presigned_url: string; public_url: string; file_key: string }>(
            `/admin/clubs/presigned-url`,
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
        })

        if (!response.ok) {
            throw new Error(`이미지 업로드 실패: ${response.status}`)
        }
    },

    /**
     * 동아리 추가 (관리자 전용)
     */
    create: async (data: ClubCreate) => {
        const response = await api.post<Club>(`/admin/clubs`, data)
        return response.data
    },

    /**
     * 동아리 정보 수정 (관리자 전용)
     */
    update: async (id: number, data: ClubUpdate) => {
        const response = await api.patch<Club>(`/admin/clubs/${id}`, data)
        return response.data
    },

    /**
     * 동아리 삭제 (관리자 전용)
     */
    delete: async (id: number) => {
        await api.delete(`/admin/clubs/${id}`)
    }
}