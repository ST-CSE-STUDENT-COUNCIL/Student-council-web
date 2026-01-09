/**
 * Board Schema
 * Corresponds to backend `schemas.boards.BoardResponse`
 */
export type Board = {
    id: number;
    name: string;
    slug: string; // URL identifier
    description?: string | null;
    category: string; // 대카테고리 (학생회, 민주자치, 건의함)
    require_auth: boolean;
    allow_anonymous: boolean;
    require_admin: boolean;
    created_at: string;
}

/**
 * Board List Response
 * Corresponds to backend `schemas.boards.BoardListResponse`
 */
export type BoardListResponse = {
    boards: Board[];
    total: number;
}
