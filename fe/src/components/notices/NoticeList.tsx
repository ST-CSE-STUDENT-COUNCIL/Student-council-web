import { Link } from '@tanstack/react-router';
import type { Notice } from '../../types/notices';

type NoticeListProps = {
    notices: Notice[];
}

export const NoticeList = ({ notices }: NoticeListProps) => {
    const getSubCategoryLabel = (_main: string, sub: string) => {
        const labels: Record<string, string> = {
            'event': '행사', 'welfare': '복지',
            'announcement': '공고', 'notice': '고시', 'meeting': '대표자회의', 'rules': '학생회칙'
        };
        return labels[sub] || sub;
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
                {notices.map((notice) => (
                    <Link
                        key={notice.id}
                        to="/notices/$noticeId"
                        params={{ noticeId: notice.id.toString() }}
                        className="flex flex-col md:flex-row items-start md:items-center py-4 px-6 hover:bg-gray-50 transition-colors group cursor-pointer"
                    >
                        {/* Mobile: Top Row with Category and Date */}
                        <div className="flex items-center justify-between w-full md:w-auto md:hidden mb-2">
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                {getSubCategoryLabel(notice.main_category, notice.sub_category)}
                            </span>
                            <span className="text-xs text-gray-400">{notice.created_at.split('T')[0]}</span>
                        </div>

                        {/* Desktop Columns */}
                        <div className="hidden md:block w-20 text-center text-gray-400 text-sm font-medium shrink-0">
                            {notice.is_pinned ? <span className="text-red-500">📌</span> : notice.id}
                        </div>
                        <div className="hidden md:block w-24 text-center shrink-0">
                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                ${notice.main_category === 'student_council'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-green-50 text-green-700'}`}>
                                {getSubCategoryLabel(notice.main_category, notice.sub_category)}
                            </span>
                        </div>

                        {/* Title */}
                        <div className="flex-1 w-full md:w-auto text-left md:px-4 mb-1 md:mb-0">
                            <span className="text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                {notice.title}
                                {notice.attachments && notice.attachments.length > 0 && (
                                    <span className="ml-2 inline-block text-gray-400">📎</span>
                                )}
                            </span>
                        </div>

                        {/* Mobile: Bottom Row with Author and Views */}
                        <div className="flex items-center w-full md:hidden text-xs text-gray-500 mt-1 gap-3">
                        </div>

                        {/* Desktop: Author, Date, Views */}
                        <div className="hidden md:block w-28 text-center text-gray-500 text-sm shrink-0">
                            {notice.created_at.split('T')[0]}
                        </div>

                    </Link>
                ))}

                {notices.length === 0 && (
                    <div className="py-20 text-center text-gray-500">
                        등록된 공지사항이 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
};
