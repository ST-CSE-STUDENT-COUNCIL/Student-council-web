/**
 * 동아리 소개 이미지 타입
 */
export type ClubImage = {
    id: number
    club_id: number
    image_url: string
    display_order: number
    created_at: string
    updated_at: string
}

/**
 * 동아리 소개 이미지 (임시, 업로드 전)
 */
export type ClubImageTemp = {
    image_url: string
    display_order: number
    tempId: number
}

/**
 * 소개 이미지 상태 (관리용)
 */
export type IntroImageState = {
    image: ClubImage | ClubImageTemp
    file?: File
    preview?: string
}

/**
 * 동아리 소개 이미지 생성 요청 타입
 */
export type ClubImageCreate = {
    image_url: string
    display_order: number
}

/**
 * 동아리 소개 이미지 수정 요청 타입
 */
export type ClubImageUpdate = {
    display_order?: number
}

/**
 * 동아리 타입 정의
 * 백엔드 스키마와 일치하도록 정의
 */
export type Club = {
    id: number
    name: string
    image_url: string // 썸네일 이미지
    description: string
    website_url?: string | null
    created_at: string
    updated_at?: string
}

/**
 * 동아리 생성 요청 타입
 */
export type ClubCreate = {
    name: string
    description: string
    image_url: string // 썸네일 이미지
    website_url?: string | null
}

/**
 * 동아리 수정 요청 타입
 */
export type ClubUpdate = {
    name?: string
    description?: string
    image_url?: string // 썸네일 이미지
    website_url?: string | null
}
