import { api } from '../axios'
import type {
    NoticeListItem,
    NoticeDetailResponse,
    NoticeListResponse,
    PaginationMeta,
    AttachmentFileInfo
} from '../../types/posts'

const API_BASE_URL = '/notices'

type PostParams = {
    mainCategory?: string
    subCategory?: string
    page?: number
    page_size?: number
    search?: string
    sort?: string
}

// Helper to map backend response to frontend type (minimal transformation)
const mapToNotice = (data: any): NoticeDetailResponse => {
    return {
        id: data.id,
        title: data.title,
        content: data.content,
        subcategory: data.subcategory || null,
        is_pinned: data.is_pinned === true || data.is_pinned === 'true',
        created_at: data.created_at,
        updated_at: data.updated_at,
        board: data.board || { id: data.board_id, name: '', category: '' },
        author: data.author || { id: '', name: '알 수 없음' },
        attachments: (data.attachments || []).map((att: any) => ({
            id: att.id || 0,
            filename: att.filename || att.name || '',
            file_url: att.file_url || att.url || '',
            file_size: att.file_size || att.size,
            mime_type: att.mime_type,
            created_at: att.created_at || new Date().toISOString()
        }))
    }
}

export const postApi = {
    /**
     * 공지사항 생성 (관리자)
     * 
     * 플로우:
     * 1. attachment_urls가 있으면 바로 최종 게시
     * 2. attachments (File[])가 있으면 Draft → Presigned URL 업로드 → 최종 게시
     */
    create: async (data: {
        title: string
        content: string
        board_id: number
        subcategory?: string
        is_pinned?: boolean
        attachments?: File[]
        attachment_urls?: AttachmentFileInfo[]
    }): Promise<NoticeDetailResponse> => {
        let attachmentUrls: AttachmentFileInfo[] = []

        // 이미 업로드된 첨부파일 정보가 있으면 그대로 사용
        if (data.attachment_urls && data.attachment_urls.length > 0) {
            attachmentUrls = data.attachment_urls
        }
        // File 객체가 있으면 Presigned URL 플로우 사용
        else if (data.attachments && data.attachments.length > 0) {
            // 1. Draft 생성하여 post_id 획득
            const draftRes = await api.post<{ post_id: number }>('/admin/notices/draft', {
                board_id: data.board_id
            })
            const postId = draftRes.data.post_id

            // 2. 각 파일에 대해 Presigned URL 발급 및 업로드
            for (const file of data.attachments) {
                const contentType = file.type || 'application/octet-stream'

                const { presigned_url, public_url } = await postApi.getPresignedUrl(
                    file.name,
                    postId,
                    contentType
                )

                // R2로 직접 파일 업로드
                await fetch(presigned_url, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': contentType }
                })

                attachmentUrls.push({
                    filename: file.name,
                    public_url: public_url,
                    file_size: file.size,
                    mime_type: contentType
                })
            }
        }

        // 최종 공지사항 등록
        const response = await api.post('/admin/notices', {
            title: data.title,
            content: data.content,
            board_id: data.board_id,
            subcategory: data.subcategory || null,
            is_pinned: data.is_pinned || false,
            attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : null
        })

        return mapToNotice(response.data)
    },

    /**
     * 공지사항 수정 (관리자)
     */
    update: async (id: number, data: {
        title?: string
        content?: string
        subcategory?: string
        is_pinned?: boolean
        attachment_urls?: AttachmentFileInfo[]
        delete_attachment_ids?: number[]
    }): Promise<NoticeDetailResponse> => {
        const response = await api.patch(`/admin${API_BASE_URL}/${id}`, {
            title: data.title,
            content: data.content,
            subcategory: data.subcategory || null,
            is_pinned: data.is_pinned,
            attachment_urls: data.attachment_urls,
            delete_attachment_ids: data.delete_attachment_ids
        })
        return mapToNotice(response.data)
    },

    /**
     * 공지사항 삭제 (관리자)
     */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/admin${API_BASE_URL}/${id}`)
    },

    /**
     * Draft 게시글 생성 (파일 업로드를 위한 post_id 획득)
     */
    createDraft: async (board_id: number): Promise<{ post_id: number }> => {
        const response = await api.post(`/admin${API_BASE_URL}/draft`, { board_id })
        return response.data
    },

    /**
     * Presigned URL 발급 (파일 업로드용)
     */
    getPresignedUrl: async (
        filename: string,
        post_id: number,
        content_type: string
    ): Promise<{ presigned_url: string; public_url: string; file_key: string }> => {
        const response = await api.post(`/admin${API_BASE_URL}/presigned-url`, null, {
            params: { filename, post_id, content_type }
        })
        return response.data
    },

    /**
     * 공지사항 목록 조회
     */
    getAll: async (params?: PostParams): Promise<{ posts: NoticeListItem[]; pagination: PaginationMeta }> => {
        const response = await api.get<NoticeListResponse>(`${API_BASE_URL}`, { params })

        // 백엔드는 notices로 반환, 프론트는 posts로 사용
        const notices = response.data.notices || []

        return {
            posts: notices,
            pagination: response.data.pagination
        }
    },

    /**
     * 공지사항 상세 조회
     */
    getById: async (id: number): Promise<NoticeDetailResponse> => {
        const response = await api.get(`${API_BASE_URL}/${id}`)
        return mapToNotice(response.data)
    }
}
