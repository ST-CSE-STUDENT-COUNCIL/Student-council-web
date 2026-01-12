/**
 * Attachment Response
 * Corresponds to backend `schemas.posts.AttachmentResponse`
 */
export type Attachment = {
    id: number;
    filename: string;
    file_url: string; // Signed URL
    file_size?: number | null;
    mime_type?: string | null;
    created_at: string;
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
    attachments: Attachment[];
    created_at: string;
    updated_at: string;
}