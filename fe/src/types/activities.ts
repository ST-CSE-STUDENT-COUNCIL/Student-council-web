/**
 * 활동(Activities) 관련 타입 정의
 * 백엔드 스키마 기반: be/app/schemas/activities.py
 */

// 활동 타입
export type ActivityType = 'event' | 'demand_survey' | 'survey' | 'kakao_invite' | 'notice'

// 추가 정보 수집 필드 정의
export type FormField = {
    name: string
    label: string
    type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'date' | 'file'
    options?: string[]
    required: boolean
    placeholder?: string
    help_text?: string
}

// 활동 목록 항목
export type ActivityListItem = {
    id: number
    type: ActivityType
    title: string
    description?: string
    registration_start?: string
    registration_end?: string
    max_capacity?: number
    current_count: number
    thumbnail_url?: string
    is_active: boolean
    created_at: string
    is_registration_open: boolean
    is_full: boolean
}

// 활동 상세 응답
export type Activity = {
    id: number
    type: ActivityType
    title: string
    description?: string
    registration_start?: string
    registration_end?: string
    max_capacity?: number
    current_count: number
    require_membership: boolean
    config: Record<string, any>
    form_fields: FormField[]
    thumbnail_url?: string
    images?: { image_url: string }[]
    is_active: boolean
    created_by?: string
    created_at: string
    updated_at: string
    is_registered?: boolean
    my_registration_id?: number
}

// 활동 목록 응답
export type ActivityListResponse = {
    activities: ActivityListItem[]
    pagination: {
        page: number
        limit: number
        total: number
        total_pages: number
    }
}

// 활동 생성 요청
export type ActivityCreateRequest = {
    type: ActivityType
    title: string
    description?: string
    registration_start?: string
    registration_end?: string
    max_capacity?: number
    require_membership?: boolean
    config?: Record<string, any>
    form_fields?: FormField[]
    thumbnail_url?: string
    image_urls?: { public_url: string }[]
    is_active?: boolean
}

// 활동 수정 요청
export type ActivityUpdateRequest = {
    title?: string
    description?: string
    registration_start?: string
    registration_end?: string
    max_capacity?: number
    require_membership?: boolean
    config?: Record<string, any>
    form_fields?: FormField[]
    thumbnail_url?: string
    image_urls?: { public_url: string }[]
    is_active?: boolean
}


// 활동 신청 요청
export type ActivityRegistrationRequest = {
    name?: string
    student_id?: string
    department?: string
    phone?: string
    email?: string
    verification_image_url?: string
    form_responses?: Record<string, any>
    kakao_id?: string
}

// 활동 신청 응답
export type ActivityRegistrationResponse = {
    id: number
    activity_id: number
    user_id?: string
    name?: string
    student_id?: string
    department?: string
    phone?: string
    email?: string
    form_responses: Record<string, any>
    kakao_id?: string
    verification_image_url?: string
    status: 'pending' | 'approved' | 'rejected' | 'cancelled'
    created_at: string
}

// 활동 신청 목록 응답 (관리자용)
export type ActivityRegistrationListResponse = {
    registrations: ActivityRegistrationResponse[]
    pagination: {
        page: number
        limit: number
        total: number
        total_pages: number
    }
}

// 설문조사 제출 요청
export type SurveySubmitRequest = {
    name?: string
    student_id?: string
    department?: string
    phone?: string
    email?: string
    survey_responses: Record<string, any>
}

// 활동 상태 (UI용)
export type ActivityStatus = 'active' | 'scheduled' | 'closed'

// 시간 문자열을 Date 객체로 변환 (Timezone 처리 포함)
const parseAsLocalTime = (dateString: string): Date => {
    return new Date(dateString)
}

// 활동 상태 계산 함수
export const getActivityStatus = (activity: ActivityListItem | Activity): ActivityStatus => {
    if (!activity.is_active) return 'closed'

    const now = new Date()

    if (activity.registration_start) {
        const start = parseAsLocalTime(activity.registration_start)
        if (now < start) return 'scheduled'
    }

    if (activity.registration_end) {
        const end = parseAsLocalTime(activity.registration_end)
        if (now > end) return 'closed'
    }

    return 'active'
}

// 활동 타입 한글 매핑
export const activityTypeLabels: Record<ActivityType, string> = {
    event: '행사',
    demand_survey: '수요조사',
    survey: '설문조사',
    kakao_invite: '카톡방 초대',
    notice: '공지'
}
