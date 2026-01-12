/**
 * Attachment Response
 * Corresponds to backend `schemas.posts.AttachmentResponse`
 */
export type AttachmentResponse = {
    filename: string;
    public_url: string;
    file_size?: number | null;
    mime_type?: string | null;
}
/**
 * Post Response (Detail) - Frontend Model
 */
export type Post = {
    id: number;
    board_id: number;
    title: string;
    content: string;
    subcategory?: string | null;
    is_pinned: boolean;
    attachment_urls: AttachmentResponse[];
    created_at: string;
    updated_at: string;
}