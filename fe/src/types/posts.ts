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
 * Post Response (Detail)
 * Corresponds to backend `schemas.posts.PostResponse`
 */
export type Post = {
    id: number;
    board_id: number;
    author_id?: string | null; // UUID, null if anonymous
    author_name?: string | null; // "익명" or Name
    title: string;
    content: string;
    subcategory?: string | null;
    is_pinned: boolean;
    is_anonymous: boolean;
    attachments: Attachment[];
    created_at: string;
    updated_at: string;
}

/**
 * Post List Item (Summary)
 * Corresponds to backend `schemas.posts.PostListItem`
 */
export type PostListItem = {
    id: number;
    board_id: number;
    author_name?: string | null;
    title: string;
    subcategory?: string | null;
    is_pinned: boolean;
    is_anonymous: boolean;
    created_at: string;
}

/**
 * Pagination Metadata
 * Corresponds to backend `schemas.posts.PaginationMeta`
 */
export type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
}

/**
 * Post List Response
 * Corresponds to backend `schemas.posts.PostListResponse`
 */
export type PostListResponse = {
    posts: PostListItem[];
    pagination: PaginationMeta;
}

// Frontend specific types (Legacy compatibility if needed)
export type Event = Post & {
    // Frontend 'Event' type used to have these, mapping them to Post fields
    // status: 'active' | 'closed' | 'scheduled'; // -> Derived from created_at/content? Backend doesn't have status yet.
    // image: string; // -> attachments[0]?.file_url
    // maxCount: number; // -> Not in backend yet
    // currentCount: number; // -> Not in backend yet
}
