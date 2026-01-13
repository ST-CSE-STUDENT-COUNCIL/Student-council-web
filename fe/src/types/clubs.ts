/**
 * 동아리 소개 이미지 타입
 */
export type ClubImage = {
    id?: number
    image_url: string
    display_order: number
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
    // 소개 이미지 (백엔드와 협의 후 추가 예정)
    intro_images?: ClubImage[]
}

/**
 * 동아리 생성 요청 타입
 */
export type ClubCreate = {
    name: string
    description: string
    image_url: string // 썸네일 이미지
    website_url?: string | null
    // 소개 이미지 (백엔드와 협의 후 추가 예정)
    intro_images?: ClubImage[]
}

/**
 * 동아리 수정 요청 타입
 */
export type ClubUpdate = {
    name?: string
    description?: string
    image_url?: string // 썸네일 이미지
    website_url?: string | null
    // 소개 이미지 (백엔드와 협의 후 추가 예정)
    intro_images?: ClubImage[]
}
