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
    '학생회칙': 'rules',
    '학과소식': 'news'
}

export const noticeApi = {
    getAll: async (params?: NoticeParams): Promise<{ notices: Notice[], pagination: NoticeListResponse['pagination'] }> => {
        const response = await api.get<NoticeListResponse>(`${API_BASE_URL}`, { params })

        const notices = response.data.notices.map(post => ({
            id: post.id,
            main_category: categoryMap[post.board?.category] || 'student_council',
            sub_category: subCategoryMap[post.subcategory] || 'event',
            title: post.title,
            content: post.content,
            view_count: post.view_count || 0,
            is_pinned: post.is_pinned,
            is_anonymous: false, // Backend doesn't support anonymous notices yet
            author_id: post.author?.id,
            author_name: post.author?.name,
            created_at: post.created_at,
            updated_at: post.updated_at,
            is_deleted: post.is_deleted || false,
            attachments: (post.attachments || []).map((att: any) => ({
                name: att.filename,
                url: att.file_url,
                size: att.file_size ? `${Math.round(att.file_size / 1024)}KB` : ''
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
            view_count: post.view_count || 0,
            is_pinned: post.is_pinned,
            is_anonymous: false,
            author_id: post.author?.id,
            author_name: post.author?.name,
            created_at: post.created_at,
            updated_at: post.updated_at,
            is_deleted: post.is_deleted || false,
            attachments: (post.attachments || []).map((att: any) => ({
                name: att.filename,
                url: att.file_url,
                size: att.file_size ? `${Math.round(att.file_size / 1024)}KB` : ''
            })),
            images: post.images || []
        }
    },

    incrementViews: async (id: number): Promise<void> => {
        await api.post(`${API_BASE_URL}/${id}/views`)
    }
}
