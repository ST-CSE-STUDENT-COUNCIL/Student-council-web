import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { NoticeFilters } from '../../components/notice/NoticeFilters'
import { NoticeList } from '../../components/notice/NoticeList'
import type { Notice } from '../../types/notice'

interface NoticeSearch {
  mainCategory: string
  subCategory: string
  search: string
  sort: string
  page: number
}

export const Route = createFileRoute('/notice/')({
  component: Notice,
  validateSearch: (search: Record<string, unknown>): NoticeSearch => {
    return {
      mainCategory: (search.mainCategory as string) || 'student_council',
      subCategory: (search.subCategory as string) || 'all',
      search: (search.search as string) || '',
      sort: (search.sort as string) || 'newest',
      page: Number(search.page) || 1,
    }
  },
})

function Notice() {
  const { mainCategory, subCategory, search, sort, page } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

  const itemsPerPage = 10

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const { noticeApi } = await import('../../lib/api/notice')
      const data = await noticeApi.getAll()
      setNotices(data)
    } catch (error) {
      console.error('Failed to fetch notices', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  // Filtering Logic
  const filteredNotices = notices.filter(notice => {
    // 1. Board filter
    if (notice.main_category !== mainCategory) return false

    // 2. Sub Category filter
    if (subCategory !== 'all' && notice.sub_category !== subCategory) return false

    // 3. Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      return notice.title.toLowerCase().includes(searchLower) ||
        notice.content.toLowerCase().includes(searchLower)
    }

    return true
  }).sort((a, b) => {
    // 0. Pin logic (Priority) - is_pinned
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1

    // Normal sort
    if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (sort === 'views') return b.view_count - a.view_count
    return 0
  })

  // Pagination Logic
  const totalPages = Math.ceil(filteredNotices.length / itemsPerPage)
  const paginatedNotices = filteredNotices.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  // Navigation Handlers
  const updateSearch = (updates: Partial<NoticeSearch>) => {
    navigate({
      search: (prev) => ({ ...prev, ...updates }),
    })
  }

  const handleMainCategoryChange = (category: string) => {
    navigate({
      search: (prev) => ({ ...prev, mainCategory: category, subCategory: 'all', page: 1 }),
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

      <NoticeFilters
        mainCategory={mainCategory}
        onMainCategoryChange={handleMainCategoryChange}
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
        <NoticeList notices={paginatedNotices} />
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
