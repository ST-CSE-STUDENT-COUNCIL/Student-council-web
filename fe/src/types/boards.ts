export type Board = {
    id: number;
    name: string;
    slug: string; // URL identifier
    description?: string | null;
    category: string[]; // 소카테고리 (공지, 공고, 고시, 행사, 복지, 대표자회의, 학과소식)
    created_at: string;
}