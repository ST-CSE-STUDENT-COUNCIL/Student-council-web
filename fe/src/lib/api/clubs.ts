import { api } from '../axios'
import type { Club, ClubCreate, ClubUpdate, ClubImage, ClubImageCreate, ClubImageUpdate } from '../../types/clubs'

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
     * 
     * 주의: Content-Type을 백엔드가 presigned URL 서명 시 사용한 값과 동일하게 설정해야 함
     * 백엔드의 generate_presigned_url은 'application/octet-stream'으로 서명하므로
     * 프론트엔드도 동일한 Content-Type을 사용해야 403 에러가 발생하지 않음
     */
    uploadImageToR2: async (presignedUrl: string, file: File): Promise<void> => {
        const response = await fetch(presignedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/octet-stream'
            },
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
    },

    /**
     * 동아리 소개 이미지 목록 조회 (공개 API)
     */
    getIntroImages: async (clubId: number) => {
        const response = await api.get<{ images: ClubImage[], total: number }>(`${API_BASE_URL}/${clubId}/images`)
        return response.data.images
    },

    /**
     * 동아리 소개 이미지 업로드용 Presigned URL 발급 (관리자 전용)
     */
    getIntroImagePresignedUrl: async (clubId: number, filename: string) => {
        const response = await api.post<{ presigned_url: string; public_url: string; file_key: string }>(
            `/admin/clubs/${clubId}/images/presigned-url`,
            {},
            {
                params: { filename }
            }
        )
        return response.data
    },

    /**
     * 동아리 소개 이미지 추가 (관리자 전용)
     */
    createIntroImage: async (clubId: number, data: ClubImageCreate) => {
        const response = await api.post<ClubImage>(`/admin/clubs/${clubId}/images`, data)
        return response.data
    },

    /**
     * 동아리 소개 이미지 수정 (관리자 전용)
     */
    updateIntroImage: async (clubId: number, imageId: number, data: ClubImageUpdate) => {
        const response = await api.patch<ClubImage>(`/admin/clubs/${clubId}/images/${imageId}`, data)
        return response.data
    },

    /**
     * 동아리 소개 이미지 삭제 (관리자 전용)
     */
    deleteIntroImage: async (clubId: number, imageId: number) => {
        await api.delete(`/admin/clubs/${clubId}/images/${imageId}`)
    }
}