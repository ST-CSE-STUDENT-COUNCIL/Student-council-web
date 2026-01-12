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
    subCategory?: string
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
        attachment_urls: (data.attachments || []).map((att: any) => ({
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
        attachments?: File[]
    }): Promise<Post> => {
        const attachmentUrls: { filename: string; public_url: string; file_size: number; mime_type: string }[] = []

        // 첨부파일이 있으면 Presigned URL 플로우 사용
        if (data.attachments && data.attachments.length > 0) {
            // 1. Draft 생성하여 post_id 획득
            const draftRes = await api.post<{ post_id: number }>('/admin/notices/draft', {
                board_id: data.board_id
            })
            const postId = draftRes.data.post_id

            // 2. 각 파일에 대해 Presigned URL 발급 및 업로드
            for (const file of data.attachments) {
                // 2-1. Presigned URL 발급 (content_type 포함)
                const presignedRes = await api.post<{
                    presigned_url: string
                    public_url: string
                    filename: string
                    content_type: string
                }>('/admin/notices/presigned-url', null, {
                    params: {
                        filename: file.name,
                        post_id: postId,
                        content_type: file.type || 'application/octet-stream'
                    }
                })

                // 2-2. R2로 직접 파일 업로드 (Presigned URL 사용)
                await fetch(presignedRes.data.presigned_url, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type || 'application/octet-stream'
                    }
                })

                // 2-3. 업로드된 파일 정보 저장
                attachmentUrls.push({
                    filename: file.name,
                    public_url: presignedRes.data.public_url,
                    file_size: file.size,
                    mime_type: file.type || 'application/octet-stream'
                })
            }
        }

        // 3. 최종 공지사항 등록
        const response = await api.post<Post>('/admin/notices', {
            title: data.title,
            content: data.content,
            board_id: data.board_id,
            subcategory: data.subcategory,
            is_pinned: data.is_pinned || false,
            attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : null
        })

        return response.data
    },


    update: async (id: number, data: {
        title?: string
        content?: string
        subcategory?: string
        is_pinned?: boolean
        attachments?: {
            file_url: string
            filename: string
            file_size: number
            mime_type: string
        }[]
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
    createDraft: async (board_id: number): Promise<{ post_id: number }> => {
        const response = await api.post(`admin${API_BASE_URL}/draft`, { board_id })
        return response.data
    },

    getPresignedUrl: async (filename: string, post_id: number): Promise<{ presigned_url: string, public_url: string, key: string }> => {
        const response = await api.post(`admin${API_BASE_URL}/presigned-url`, null, {
            params: { filename, post_id }
        })
        return response.data
    },

    getAll: async (params?: PostParams): Promise<{ posts: Post[], pagination: PostListResponse['pagination'] }> => {
        const response = await api.get<any>(`${API_BASE_URL}`, { params })
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
