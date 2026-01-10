import { api } from '../axios'
import type { Notice } from '../../types/notices'

const API_BASE_URL = '/notices'

type NoticeListResponse = {
    notices: any[] // Backend raw type
    pagination: {
        total: number
        page: number
        page_size: number
        total_pages: number
    }
}

type NoticeParams = {
    mainCategory?: string
    subCategory?: string
    page?: number
    page_size?: number
    search?: string
    sort?: string
}

// Map Backend Korean Categories -> Frontend English Keys
const categoryMap: Record<string, string> = {
    '학생회': 'student_council',
    '민주자치': 'democracy'
}

const subCategoryMap: Record<string, string> = {
    '행사': 'event',
    '복지': 'welfare',
    '공고': 'announcement',
    '고시': 'notice',
    '대표자회의': 'meeting',
    '학생회칙': 'rules'
}

export const noticeApi = {
    create: async (data: {
        title: string
        content: string
        board_id: number
        subcategory?: string
        is_pinned?: boolean
        attachments?: File[]
    }): Promise<Notice> => {
        const formData = new FormData()
        formData.append('title', data.title)
        formData.append('content', data.content)
        formData.append('board_id', data.board_id.toString())
        if (data.subcategory) formData.append('subcategory', data.subcategory)
        formData.append('is_pinned', String(data.is_pinned || false))

        if (data.attachments) {
            data.attachments.forEach((file) => {
                formData.append('attachments', file)
            })
        }

        const response = await api.post<Notice>(`${API_BASE_URL}`, formData)
        return response.data
    },

    update: async (id: number, data: {
        title?: string
        content?: string
        subcategory?: string
        is_pinned?: boolean
    }): Promise<Notice> => {
        const url = `${API_BASE_URL}/${id}`
        const response = await api.patch<Notice>(url, data)
        return response.data
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`${API_BASE_URL}/${id}`)
    },

    getAll: async (params?: NoticeParams): Promise<{ notices: Notice[], pagination: NoticeListResponse['pagination'] }> => {
        const response = await api.get<NoticeListResponse>(`${API_BASE_URL}`, { params })

        const notices = response.data.notices.map(post => ({
            id: post.id,
            main_category: categoryMap[post.board?.category] || 'student_council',
            sub_category: subCategoryMap[post.subcategory] || 'event',
            title: post.title,
            content: post.content,

            is_pinned: post.is_pinned === true || post.is_pinned === 'true',
            is_anonymous: false, // Backend doesn't support anonymous notices yet
            author_id: post.author?.id,
            author_name: post.author?.name,
            created_at: post.created_at,
            updated_at: post.updated_at,
            is_deleted: post.is_deleted || false,
            attachments: (post.attachments || []).map((att: any) => ({
                name: att.name || att.filename,
                url: att.url || att.file_url,
                size: att.size || (att.file_size ? `${Math.round(att.file_size / 1024)}KB` : '')
            })),
            images: post.images || []
        }))

        return {
            notices,
            pagination: response.data.pagination
        }
    },

    getById: async (id: number): Promise<Notice> => {
        const response = await api.get(`${API_BASE_URL}/${id}`)
        const post = response.data
        return {
            id: post.id,
            main_category: categoryMap[post.board?.category] || 'student_council',
            sub_category: subCategoryMap[post.subcategory] || 'event',
            title: post.title,
            content: post.content,

            is_pinned: post.is_pinned === true || post.is_pinned === 'true',
            is_anonymous: false,
            author_id: post.author?.id,
            author_name: post.author?.name,
            created_at: post.created_at,
            updated_at: post.updated_at,
            is_deleted: post.is_deleted || false,
            attachments: (post.attachments || []).map((att: any) => ({
                name: att.name || att.filename,
                url: att.url || att.file_url,
                size: att.size || (att.file_size ? `${Math.round(att.file_size / 1024)}KB` : '')
            })),
            images: post.images || []
        }
    }
}


