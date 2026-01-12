/**
 * Suggestion Response (Detail)
 * Corresponds to backend `schemas.suggestions.SuggestionResponse`
 */
export type Suggestion = {
    id: number;
    author_id?: string | null;
    author_name: string;
    title: string;
    content: string;
    status: 'received' | 'in_progress' | 'rejected' | 'approved';
    rejection_reason?: string | null;
    resolution_note?: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Suggestion List Item
 * Corresponds to backend `schemas.suggestions.SuggestionListItem`
 */
export type SuggestionListItem = {
    id: number;
    author_id?: string | null;
    author_name: string;
    title: string;
    status: Suggestion['status'];
    rejection_reason?: string | null;
    resolution_note?: string | null;
    created_at: string;
}

/**
 * Suggestion List Response
 * Corresponds to backend `schemas.suggestions.SuggestionListResponse`
 */
export type SuggestionListResponse = {
    suggestions: SuggestionListItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}
