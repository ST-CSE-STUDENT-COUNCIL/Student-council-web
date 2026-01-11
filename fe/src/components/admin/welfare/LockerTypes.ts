/**
 * 사물함 관리 뷰에서 공유하는 공용 타입입니다.
 */
export type LockerFormState = {
    application_form_url: string
    return_extension_form_url: string
    application_start: string
    application_end: string
    return_extension_start: string
    return_extension_end: string
    description: string
}

/**
 * 타임라인 카드 데이터를 정의합니다.
 */
export type LockerTimelineStage = {
    label: string
    value: string
    colorClass: string
    buttonLabel: string
    formUrl: string
}
