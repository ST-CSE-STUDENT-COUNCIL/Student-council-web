export interface Notice {
    id: number;
    main_category: string; // 대카테고리 student_council(학생회), democracy(민주자치)
    sub_category: string; // 소카테고리 (행사, 복지, 학과소식 | 공고, 고시, 대표자회의, 학생회칙)
    title: string;
    content: string;
    view_count: number;
    is_pinned: boolean;
    is_anonymous: boolean;
    author_id?: string; // UUID from profiles
    author_name?: string; // Optional: Joined from profiles for display
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    deleted_at?: string;

    // 붙임 자료
    attachments?: {
        name: string;
        url: string;
        size: string;
    }[];
    images?: string[];
}
