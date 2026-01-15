import { Search, Pin, Calendar, Edit2, Trash2, LayoutGrid, List, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import type { NoticeListItem } from '../../../types/posts'
import { subMapReverse } from './constants'
import { useState } from 'react'

type ViewMode = 'table' | 'card'

type NoticeListProps = {
    loading: boolean
    posts: NoticeListItem[]
    handleOpenEdit: (post: NoticeListItem) => void
    handleDelete: (id: number) => void
    selectedIds?: number[]
    onSelectChange?: (ids: number[]) => void
    onBulkDelete?: () => void
}

// Skeleton component for loading state
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-6 py-4">
                <div className="h-4 w-4 bg-gray-200 rounded" />
            </td>
            <td className="px-6 py-4">
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
            </td>
            <td className="px-6 py-4">
                <div className="h-5 w-14 bg-gray-200 rounded-md" />
            </td>
            <td className="px-6 py-4">
                <div className="h-5 w-48 bg-gray-200 rounded" />
            </td>
            <td className="px-6 py-4">
                <div className="h-5 w-20 bg-gray-200 rounded" />
            </td>
            <td className="px-6 py-4">
                <div className="h-5 w-16 bg-gray-200 rounded" />
            </td>
        </tr>
    )
}

function SkeletonCard() {
    return (
        <div className="animate-pulse bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                    <div className="h-5 w-14 bg-gray-200 rounded-full" />
                    <div className="h-5 w-12 bg-gray-200 rounded-full" />
                </div>
                <div className="h-5 w-5 bg-gray-200 rounded" />
            </div>
            <div className="h-6 w-3/4 bg-gray-200 rounded mb-3" />
            <div className="h-4 w-full bg-gray-200 rounded mb-2" />
            <div className="h-4 w-2/3 bg-gray-200 rounded mb-4" />
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                    <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                </div>
            </div>
        </div>
    )
}

const getBoardColor = (boardId: number) => {
    switch (boardId) {
        case 1:
            return { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' }
        case 2:
            return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' }
        default:
            return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100' }
    }
}

const getBoardLabel = (boardId: number) => {
    switch (boardId) {
        case 1: return '학생회'
        case 2: return '민주자치'
        default: return '미분류'
    }
}

export function NoticeList({
    loading,
    posts,
    handleOpenEdit,
    handleDelete,
    selectedIds = [],
    onSelectChange,
    onBulkDelete
}: NoticeListProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('table')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = viewMode === 'card' ? 9 : 10

    const totalPages = Math.ceil(posts.length / itemsPerPage)
    const paginatedPosts = posts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const isAllSelected = paginatedPosts.length > 0 && paginatedPosts.every(p => selectedIds.includes(p.id))

    const handleSelectAll = () => {
        if (!onSelectChange) return
        if (isAllSelected) {
            onSelectChange(selectedIds.filter(id => !paginatedPosts.find(p => p.id === id)))
        } else {
            const newIds = [...new Set([...selectedIds, ...paginatedPosts.map(p => p.id)])]
            onSelectChange(newIds)
        }
    }

    const handleSelectOne = (id: number) => {
        if (!onSelectChange) return
        if (selectedIds.includes(id)) {
            onSelectChange(selectedIds.filter(i => i !== id))
        } else {
            onSelectChange([...selectedIds, id])
        }
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                    {/* View Mode Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'table'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            title="테이블 뷰"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'card'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            title="카드 뷰"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>

                    {/* Selected count & bulk delete */}
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                            <span className="text-sm font-medium text-gray-600">
                                <span className="text-blue-600 font-bold">{selectedIds.length}</span>개 선택됨
                            </span>
                            {onBulkDelete && (
                                <button
                                    onClick={onBulkDelete}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 size={14} />
                                    일괄 삭제
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Page Info */}
                <div className="text-sm text-gray-500">
                    총 <span className="font-semibold text-gray-900">{posts.length}</span>개 공지사항
                </div>
            </div>

            {/* Table View */}
            {viewMode === 'table' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gradient-to-br from-gray-50 to-gray-100/50">
                                <tr>
                                    <th className="px-6 py-4 text-left w-12">
                                        <button
                                            onClick={handleSelectAll}
                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isAllSelected
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            {isAllSelected && <Check size={14} strokeWidth={3} />}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">분류</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">구분</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/2">제목</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">작성일</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">관리</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                                ) : paginatedPosts.length === 0 ? (
                                    <tr><td colSpan={6} className="p-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                                <Search className="text-gray-400" size={28} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">등록된 공지사항이 없습니다</p>
                                                <p className="text-sm text-gray-500 mt-1">새 공지사항을 작성해보세요</p>
                                            </div>
                                        </div>
                                    </td></tr>
                                ) : (
                                    paginatedPosts.map(post => {
                                        const boardColor = getBoardColor(post.board.id)
                                        const isSelected = selectedIds.includes(post.id)
                                        return (
                                            <tr
                                                key={post.id}
                                                className={`group transition-all cursor-pointer ${isSelected
                                                    ? 'bg-blue-50/50'
                                                    : 'hover:bg-gray-50/80'
                                                    } ${post.is_pinned ? 'bg-amber-50/30' : ''}`}
                                                onClick={() => handleSelectOne(post.id)}
                                            >
                                                <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleSelectOne(post.id)}
                                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                            }`}
                                                    >
                                                        {isSelected && <Check size={14} strokeWidth={3} />}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${boardColor.bg} ${boardColor.text}`}>
                                                        {getBoardLabel(post.board.id)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
                                                        {subMapReverse[post.subcategory || ''] || post.subcategory}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {post.is_pinned && (
                                                            <span className="flex items-center gap-1 text-[10px] bg-gradient-to-r from-amber-100 to-orange-100 text-orange-600 px-2 py-0.5 rounded-full border border-orange-200 font-bold">
                                                                <Pin size={10} className="rotate-45" />
                                                                고정
                                                            </span>
                                                        )}
                                                        <span className="text-sm text-gray-900 font-medium truncate max-w-md block">{post.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                                        <Calendar size={14} />
                                                        {new Date(post.created_at).toLocaleDateString('ko-KR', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleOpenEdit(post)
                                                            }}
                                                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-all"
                                                            title="수정"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDelete(post.id)
                                                            }}
                                                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-all"
                                                            title="삭제"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Card View */}
            {viewMode === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                    ) : paginatedPosts.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <Search className="text-gray-400" size={32} />
                            </div>
                            <p className="font-medium text-gray-900">등록된 공지사항이 없습니다</p>
                            <p className="text-sm text-gray-500 mt-1">새 공지사항을 작성해보세요</p>
                        </div>
                    ) : (
                        paginatedPosts.map(post => {
                            const boardColor = getBoardColor(post.board.id)
                            const isSelected = selectedIds.includes(post.id)
                            return (
                                <div
                                    key={post.id}
                                    className={`relative bg-white rounded-2xl border-2 p-5 transition-all cursor-pointer group hover:shadow-lg hover:shadow-gray-100 ${isSelected
                                        ? 'border-blue-400 bg-blue-50/30 shadow-lg shadow-blue-100'
                                        : 'border-gray-100 hover:border-gray-200'
                                        } ${post.is_pinned ? 'ring-2 ring-amber-200' : ''}`}
                                    onClick={() => handleSelectOne(post.id)}
                                >
                                    {/* Pinned indicator */}
                                    {post.is_pinned && (
                                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-200">
                                            <Pin size={14} className="text-white rotate-45" />
                                        </div>
                                    )}

                                    {/* Checkbox */}
                                    <div className="absolute top-4 left-4" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleSelectOne(post.id)}
                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'border-gray-300 bg-white hover:border-gray-400 opacity-0 group-hover:opacity-100'
                                                }`}
                                        >
                                            {isSelected && <Check size={14} strokeWidth={3} />}
                                        </button>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex items-start justify-between mb-4 pt-1">
                                        <div className="flex gap-2 flex-wrap ml-7">
                                            <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${boardColor.bg} ${boardColor.text}`}>
                                                {getBoardLabel(post.board.id)}
                                            </span>
                                            <span className="text-[10px] font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                                                {subMapReverse[post.subcategory || ''] || post.subcategory}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 pr-2">
                                        {post.title}
                                    </h3>

                                    {/* Content preview */}
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                        {post.content}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <Calendar size={12} />
                                            {new Date(post.created_at).toLocaleDateString('ko-KR', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleOpenEdit(post)
                                                }}
                                                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-all"
                                                title="수정"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDelete(post.id)
                                                }}
                                                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-all"
                                                title="삭제"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                                return page === 1 ||
                                    page === totalPages ||
                                    Math.abs(page - currentPage) <= 1
                            })
                            .map((page, idx, arr) => {
                                const showEllipsis = idx > 0 && arr[idx - 1] !== page - 1
                                return (
                                    <div key={page} className="flex items-center">
                                        {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                                        <button
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-10 h-10 rounded-lg font-medium transition-all ${currentPage === page
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    </div>
                                )
                            })}
                    </div>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    )
}
