import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { PostFilter } from '../../../../components/notices/PostFilter'
import { PostList } from '../../../../components/notices/PostList'
import { useNotices } from '../../../../hooks/queries/useNotices'
import { SEO } from '../../../../components/common/SEO'

type PostSearch = {
  board_id: number
  subCategory: string
  search: string
  sort: string
  page: number
}

export const Route = createFileRoute('/_main/(info)/notices/')({
  component: Notices,
  validateSearch: (search: Record<string, unknown>): PostSearch => {
    return {
      board_id: (search.board_id as number) || 1,
      subCategory: (search.subCategory as string) || 'all',
      search: (search.search as string) || '',
      sort: (search.sort as string) || 'newest',
      page: Number(search.page) || 1,
    }
  },
})


function Notices() {
  const { board_id, subCategory, search, sort, page } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  // 한글 입력 버그 수정: 로컬 검색 상태 분리
  const [localSearch, setLocalSearch] = useState(search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // URL search 파라미터가 변경되면 로컬 상태 동기화
  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  const itemsPerPage = 20

  const { data, isLoading: loading } = useNotices({
    mainCategory: board_id === 1 ? 'student_council' : board_id === 2 ? 'democracy' : undefined,
    subCategory: subCategory === 'all' ? undefined : subCategory,
    search: search || undefined,
    sort,
    page,
    pageSize: itemsPerPage
  })

  const posts = data?.posts || []
  const totalPages = data?.pagination.total_pages || 1

  // Pagination Logic handled by server
  const paginatedPosts = posts

  // Navigation Handlers
  const updateSearch = (updates: Partial<PostSearch>) => {
    navigate({
      search: (prev) => ({ ...prev, ...updates }),
    })
  }

  const handleBoardIdChange = (board_id: number) => {
    navigate({
      search: (prev) => ({ ...prev, board_id, subCategory: 'all', page: 1 }),
    })
  }

  const handleSubCategoryChange = (category: string) => {
    updateSearch({ subCategory: category, page: 1 })
  }

  // 한글 입력 버그 수정: debounce 적용
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearch(value)

    // 이전 타이머 취소
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // 300ms 후에 URL 업데이트 (한글 조합 완료 대기)
    debounceRef.current = setTimeout(() => {
      updateSearch({ search: value, page: 1 })
    }, 300)
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSearch({ sort: e.target.value, page: 1 })
  }

  const handlePageChange = (newPage: number) => {
    updateSearch({ page: newPage })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO
        title="공지사항"
        description="학생회 공지사항 및 소식"
        url="/notices"
      />
      {/* Page Title */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">공지사항</h1>
        <p className="text-gray-500 dark:text-gray-400">학생회의 주요 소식과 공고를 확인하세요.</p>
      </div>

      <PostFilter
        board_id={board_id}
        onBoardIdChange={handleBoardIdChange}
        subCategory={subCategory}
        onSubCategoryChange={handleSubCategoryChange}
        search={localSearch}
        onSearchChange={handleSearchChange}
        sort={sort}
        onSortChange={handleSortChange}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <PostList posts={paginatedPosts} />
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(Math.max(page - 1, 1))}
            disabled={page === 1}
            className="p-2 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={`w-10 h-10 rounded-lg font-medium transition-colors ${page === p
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800'
                }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(Math.min(page + 1, totalPages))}
            disabled={page === totalPages}
            className="p-2 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  )
}
