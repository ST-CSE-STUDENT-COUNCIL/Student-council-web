import { Search } from 'lucide-react'
import type { NoticeListItem } from '../../../types/posts'
import { subMapReverse } from './constants'

type NoticeListProps = {
    loading: boolean
    posts: NoticeListItem[]
    handleOpenEdit: (post: NoticeListItem) => void
    handleDelete: (id: number) => void
}

export function NoticeList({ loading, posts, handleOpenEdit, handleDelete }: NoticeListProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">분류</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">구분</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/2">제목</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">작성일</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">관리</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">
                                <div className="flex justify-center items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                                    로딩 중...
                                </div>
                            </td></tr>
                        ) : posts.length === 0 ? (
                            <tr><td colSpan={5} className="p-12 text-center text-gray-500">
                                <div className="flex flex-col items-center gap-2">
                                    <Search className="text-gray-300" size={48} />
                                    <p>등록된 공지사항이 없습니다.</p>
                                </div>
                            </td></tr>
                        ) : (
                            posts.map(post => (
                                <tr key={post.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-fit ${post.board.id === 1
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : post.board.id === 2
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : 'bg-gray-50 text-gray-600'
                                                }`}>
                                                {post.board.id === 1 ? '학생회' : post.board.id === 2 ? '민주자치' : '미분류'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
                                            {subMapReverse[post.subcategory || ''] || post.subcategory}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {post.is_pinned && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-bold">고정</span>}
                                            <span className="text-sm text-gray-900 font-medium truncate max-w-md block">{post.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleOpenEdit(post)}
                                                className="text-gray-500 hover:text-blue-600 transition-colors"
                                            >
                                                수정
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                className="text-gray-500 hover:text-red-600 transition-colors"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
