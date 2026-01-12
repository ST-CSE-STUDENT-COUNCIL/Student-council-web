import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { PostFilter } from '../../components/notices/PostFilter'
import { PostList } from '../../components/notices/PostList'
import type { Post } from '../../types/posts'

type PostSearch = {
  board_id: number
  subCategory: string
  search: string
  sort: string
  page: number
}

export const Route = createFileRoute('/notices/')({
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

  const [posts, setPosts] = useState<Post[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const itemsPerPage = 20

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const { postApi } = await import('../../lib/api/notices')
      const { posts: data, pagination } = await postApi.getAll({
        board_id,
        subCategory,
        search,
        sort,
        page,
        page_size: itemsPerPage
      })
      setPosts(data)
      setTotalPages(pagination.total_pages)
    } catch (error) {
      console.error('Failed to fetch notices', error)
      setPosts([]) // Clear notices on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [board_id, subCategory, search, sort, page])

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSearch({ search: e.target.value, page: 1 })
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSearch({ sort: e.target.value, page: 1 })
  }

  const handlePageChange = (newPage: number) => {
    updateSearch({ page: newPage })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Title */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">공지사항</h1>
        <p className="text-gray-500">학생회의 주요 소식과 공고를 확인하세요.</p>
      </div>

      <PostFilter
        board_id={board_id}
        onBoardIdChange={handleBoardIdChange}
        subCategory={subCategory}
        onSubCategoryChange={handleSubCategoryChange}
        search={search}
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
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={`w-10 h-10 rounded-lg font-medium transition-colors ${page === p
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(Math.min(page + 1, totalPages))}
            disabled={page === totalPages}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  )
}
