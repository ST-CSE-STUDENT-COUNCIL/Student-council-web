/**
 * 학생회 소개 이미지 타입 정의
 * 백엔드 스키마와 일치하도록 정의
 */
export type IntroductionImage = {
    id: number
    title: string
    image_url: string
    display_order: number
    is_active: boolean
    created_at: string
    updated_at: string
}

/**
 * 학생회 소개 이미지 생성 요청 타입
 */
export type IntroductionImageCreate = {
    title: string
    image_url: string
    display_order?: number
}

/**
 * 학생회 소개 이미지 수정 요청 타입
 */
export type IntroductionImageUpdate = {
    title?: string
    display_order?: number
    is_active?: boolean
}

/**
 * 학생회 소개 이미지 목록 응답 타입
 */
export type IntroductionImageListResponse = {
    images: IntroductionImage[]
    total: number
}
