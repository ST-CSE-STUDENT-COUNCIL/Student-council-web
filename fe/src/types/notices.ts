export type Notice = {
    id: number
    main_category: string
    sub_category: string
    title: string
    content: string

    is_pinned: boolean
    is_anonymous: boolean
    author_id?: string
    author_name?: string
    created_at: string
    updated_at: string
    is_deleted: boolean
    deleted_at?: string

    // 붙임 자료
    attachments?: {
        name: string
        url: string
        size: string
    }[]
    images?: string[]
}
