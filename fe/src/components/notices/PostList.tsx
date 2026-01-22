import { Link } from '@tanstack/react-router';
import type { NoticeListItem } from '../../types/posts';

type PostListProps = {
    posts: NoticeListItem[];
}

export const PostList = ({ posts }: PostListProps) => {
    const getSubCategoryLabel = (sub?: string | null) => {
        if (!sub) return '미분류';

        // 영어 → 한글 매핑
        const engToKor: Record<string, string> = {
            'event': '행사', 'welfare': '복지', 'notification': '공지',
            'announcement': '공고', 'notice': '고시', 'meeting': '대표자회의', 'rules': '학생회칙'
        };

        // 한글 값 목록 (이미 한글이면 그대로 반환)
        const korValues = ['행사', '복지', '공지', '공고', '고시', '대표자회의', '학생회칙'];

        if (korValues.includes(sub)) return sub;
        return engToKor[sub] || sub;
    };

    return (
        <div className="w-full max-w-5xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header for Desktop */}
            <div className="hidden md:flex bg-gray-50 border-b border-gray-100 text-gray-500 font-medium text-sm py-3 px-6 text-center">
                <div className="w-20 shrink-0">번호</div>
                <div className="w-24 shrink-0">분류</div>
                <div className="flex-1 text-left px-4">제목</div>
                <div className="w-28 shrink-0">작성일</div>

            </div>

            {/* List Items */}
            <div className="divide-y divide-gray-100">
                {posts.map((post) => (
                    <Link
                        key={post.id}
                        to="/notices/$noticeId"
                        params={{ noticeId: post.id.toString() }}
                        className="flex flex-col md:flex-row items-start md:items-center py-4 px-6 hover:bg-gray-50 transition-colors group cursor-pointer"
                    >
                        {/* Mobile: Top Row with Category and Date */}
                        <div className="flex items-center justify-between w-full md:w-auto md:hidden mb-2">
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                {getSubCategoryLabel(post.subcategory)}
                            </span>
                            <span className="text-xs text-gray-400">{post.created_at.split('T')[0]}</span>
                        </div>

                        {/* Desktop Columns */}
                        <div className="hidden md:block w-20 text-center text-gray-400 text-sm font-medium shrink-0">
                            {post.is_pinned ? <span className="text-red-500">📌</span> : post.id}
                        </div>
                        <div className="hidden md:block w-24 text-center shrink-0">
                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                ${post.board.id === 1
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-green-50 text-green-700'}`}>
                                {getSubCategoryLabel(post.subcategory)}
                            </span>
                        </div>

                        {/* Title */}
                        <div className="flex-1 w-full md:w-auto text-left md:px-4 mb-1 md:mb-0">
                            <div className="flex items-center gap-1.5">
                                {post.is_pinned && (
                                    <span className="md:hidden text-red-500 text-sm shrink-0">📌</span>
                                )}
                                <span className="text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                    {post.title}
                                </span>
                            </div>
                        </div>

                        {/* Mobile: Bottom Row with Author and Views */}
                        <div className="flex items-center w-full md:hidden text-xs text-gray-500 mt-1 gap-3">
                        </div>

                        {/* Desktop: Author, Date, Views */}
                        <div className="hidden md:block w-28 text-center text-gray-500 text-sm shrink-0">
                            {post.created_at.split('T')[0]}
                        </div>

                    </Link>
                ))}

                {posts.length === 0 && (
                    <div className="py-20 text-center text-gray-500">
                        등록된 공지사항이 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
};
