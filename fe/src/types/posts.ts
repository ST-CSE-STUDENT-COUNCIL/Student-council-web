/**
 * 게시판 정보 - Backend: BoardInfo
 */
export type BoardInfo = {
    id: number;
    name: string;
    category: string;
}

/**
 * 작성자 정보 - Backend: AuthorInfo
 */
export type AuthorInfo = {
    id: string;
    name: string;
}

/**
 * 첨부파일 정보 - Backend: AttachmentInfo
 */
export type AttachmentInfo = {
    id: number;
    filename: string;
    file_url: string;
    file_size?: number | null;
    mime_type?: string | null;
    created_at: string;
}

/**
 * 첨부파일 업로드 정보 (Presigned URL 방식) - Backend: AttachmentFileInfo
 */
export type AttachmentFileInfo = {
    filename: string;
    public_url: string;
    file_size?: number | null;
    mime_type?: string | null;
}

/**
 * 공지사항 목록 아이템 - Backend: NoticeListItem
 */
export type NoticeListItem = {
    id: number;
    title: string;
    content: string;
    subcategory?: string | null;
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
    board: BoardInfo;
    author: AuthorInfo;
}

/**
 * 공지사항 상세 응답 - Backend: NoticeDetailResponse
 */
export type NoticeDetailResponse = {
    id: number;
    title: string;
    content: string;
    subcategory?: string | null;
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
    board: BoardInfo;
    author: AuthorInfo;
    attachments: AttachmentInfo[];
}

/**
 * 페이지네이션 메타 정보 - Backend: PaginationMeta
 */
export type PaginationMeta = {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

/**
 * 공지사항 목록 응답 - Backend: NoticeListResponse
 */
export type NoticeListResponse = {
    notices: NoticeListItem[];
    pagination: PaginationMeta;
}

/**
 * 공지사항 작성 요청 - Backend: NoticeCreateRequest
 */
export type NoticeCreateRequest = {
    title: string;
    content: string;
    board_id: number;
    subcategory?: string | null;
    is_pinned?: boolean;
    attachment_urls?: AttachmentFileInfo[] | null;
}

/**
 * 공지사항 수정 요청 - Backend: NoticeUpdateRequest
 */
export type NoticeUpdateRequest = {
    title?: string;
    content?: string;
    subcategory?: string | null;
    is_pinned?: boolean;
    attachment_urls?: AttachmentFileInfo[] | null;
    delete_attachment_ids?: number[] | null;
}

// ===== 하위 호환용 (기존 코드에서 Post 타입 사용하는 경우) =====
export type Post = NoticeDetailResponse;