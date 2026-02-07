import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import type { NoticeDetailResponse } from '../../../../types/posts'

export const Route = createFileRoute('/_main/(info)/notices/$noticeId')({
    component: PostDetail,
})

function PostDetail() {
    const { noticeId: id } = Route.useParams()
    const [post, setPost] = useState<NoticeDetailResponse | null>(null)
    const [loading, setLoading] = useState(true)

    const processedPostId = useRef<string | null>(null)

    useEffect(() => {
        window.scrollTo(0, 0)
        const fetchPost = async () => {
            if (processedPostId.current === id) return
            processedPostId.current = id

            try {
                setLoading(true)
                const { postApi } = await import('../../../../lib/api/notices')
                const data = await postApi.getById(Number(id))

                // Type assertion/casting might be needed if api returns Post not Notice yet
                // But we will fix api next.
                setPost(data)
            } catch (error) {
                console.error('Failed to fetch post', error)
            } finally {
                setLoading(false)
            }
        }
        fetchPost()
    }, [id])

    const router = useRouter()

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-xl text-gray-600">공지사항을 찾을 수 없습니다.</p>
                <button
                    onClick={() => router.history.go(-1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    돌아가기
                </button>
            </div>
        )
    }

    const getCategoryLabel = (board: { id: number; category: string }, sub?: string | null) => {
        const mainLabel = board.category || (board.id === 1 ? '학생회' : '민주자치');
        if (!sub) return mainLabel;

        const subLabels: Record<string, string> = {
            'event': '행사', 'welfare': '복지', 'news': '학과소식',
            'announcement': '공고', 'notice': '고시', 'meeting': '대표자회의', 'rules': '학생회칙'
        };

        return `${mainLabel} > ${subLabels[sub] || sub}`;
    };

    return (
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
            <button
                onClick={() => {
                    if (window.history.length > 1) {
                        router.history.go(-1)
                    } else {
                        router.navigate({
                            to: '/notices',
                            search: {
                                board_id: 1,
                                subCategory: 'all',
                                search: '',
                                sort: 'newest',
                                page: 1
                            }
                        })
                    }
                }}
                className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
            >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                목록으로
            </button>

            <article className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 dark:bg-slate-800/80 px-8 py-6 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                            {getCategoryLabel(post.board, post.subcategory)}
                        </span>
                        {post.is_pinned && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                                필독
                            </span>
                        )}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">{post.title}</h1>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-4">
                        {/* Format Date if possible, assuming YYYY-MM-DDTHH:mm:ssZ */}
                        <span>{post.created_at ? post.created_at.split('T')[0] : ''}</span>

                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-8 min-h-[300px]">
                    <div className="prose prose-slate dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                    </div>
                </div>

                {/* Attachments */}
                <div className="px-8 py-6 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">첨부파일</h3>
                    {post.attachments && post.attachments.length > 0 ? (
                        <div className="space-y-2">
                            {post.attachments.map((file, idx) => (
                                <a
                                    key={idx}
                                    href={file.file_url ? encodeURI(file.file_url) : '#'} // URL 없으면 # 처리
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center p-3 bg-white dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group"
                                    onClick={(e) => !file.file_url && e.preventDefault()}
                                >
                                    <span className="text-2xl mr-3">📄</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                            {file.filename || (file.file_url ? decodeURIComponent(file.file_url.split('/').pop() || '파일') : '파일')}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{file.file_size || 'Unknown size'}</p>
                                    </div>
                                    <span className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400">⬇️</span>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500">첨부된 파일이 없습니다.</p>
                    )}
                </div>
            </article>
        </div>
    )
}
