import { api } from '../axios'
import type { Post } from '../../types/posts'

const API_BASE_URL = '/notices'

type PostListResponse = {
    posts: any[]
    pagination: {
        total: number
        page: number
        page_size: number
        total_pages: number
    }
}

type PostParams = {
    board_id?: number
    subcategory?: string
    page?: number
    page_size?: number
    search?: string
    sort?: string
}

// Helper to map backend response (Post/Notice Schema) to Frontend Notice Type
const mapToPost = (data: any): Post => {
    return {
        id: data.id,
        // Map board.category or derive from board_id if necessary
        // Backend returns board object with category
        board_id: data.board.id,
        subcategory: data.subcategory || 'notice', // Default to 'notice' if empty
        title: data.title,
        content: data.content,
        is_pinned: data.is_pinned === true || data.is_pinned === 'true',
        created_at: data.created_at,
        updated_at: data.updated_at,
        attachments: (data.attachments || []).map((att: any) => ({
            id: att.id || 0, // Fallback if missing
            filename: att.name || att.filename || '',
            file_url: att.url || att.file_url || '',
            file_size: att.size || att.file_size,
            mime_type: att.mime_type,
            created_at: att.created_at || new Date().toISOString()
        })),
    }
}

export const postApi = {
    create: async (data: {
        title: string
        content: string
        board_id: number
        subcategory?: string
        is_pinned?: boolean
        attachment_urls?: string[]
    }): Promise<Post> => {
        const formData = new FormData()
        formData.append('title', data.title)
        formData.append('content', data.content)
        formData.append('board_id', data.board_id.toString())
        if (data.subcategory) formData.append('subcategory', data.subcategory)
        formData.append('is_pinned', String(data.is_pinned || false))

        // Note: attachments are not sent here as we use presigned URL flow in update
        const response = await api.post(`admin${API_BASE_URL}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return mapToPost(response.data)
    },


    update: async (id: number, data: {
        title?: string
        content?: string
        subcategory?: string
        is_pinned?: boolean
        attachment_urls?: string[]
    }): Promise<Post> => {
        const url = `admin${API_BASE_URL}/${id}`
        const response = await api.patch(url, {
            ...data,
            subcategory: data.subcategory || null
        })
        return mapToPost(response.data)
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`admin${API_BASE_URL}/${id}`)
    },

    getPresignedUrl: async (filename: string, post_id: number): Promise<{ presigned_url: string, public_url: string, key: string }> => {
        const response = await api.post(`admin${API_BASE_URL}/presigned-url`, null, {
            params: { filename, post_id }
        })
        return response.data
    },

    getAll: async (params?: PostParams): Promise<{ posts: Post[], pagination: PostListResponse['pagination'] }> => {
        const response = await api.get<any>(`${API_BASE_URL}`, { params })
        // Handle potential mismatch between 'posts' and 'notices' key
        const list = response.data.posts || response.data.notices || []

        const posts = list.map((item: any) => mapToPost(item))

        return {
            posts,
            pagination: response.data.pagination
        }
    },

    getById: async (id: number): Promise<Post> => {
        const response = await api.get(`${API_BASE_URL}/${id}`)
        return mapToPost(response.data)
    }
}
