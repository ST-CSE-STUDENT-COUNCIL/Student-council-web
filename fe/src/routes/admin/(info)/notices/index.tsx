import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useMemo } from 'react'
import { postApi } from '../../../../lib/api/notices'
import type { NoticeListItem } from '../../../../types/posts'
import { Plus, FileText } from 'lucide-react'
import { NoticeList } from '../../../../components/notices/admin/NoticeList'
import { NoticeFilter } from '../../../../components/notices/admin/NoticeFilter'
import { toast } from 'sonner'
import Swal from 'sweetalert2'

export const Route = createFileRoute('/admin/(info)/notices/')({
  component: AdminNoticesPage,
})

type SortOption = 'newest' | 'oldest' | 'title'

function AdminNoticesPage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<NoticeListItem[]>([])
  const [loading, setLoading] = useState(false)

  // Filter State
  const [filterMain, setFilterMain] = useState<string>('all')
  const [filterSub, setFilterSub] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params: any = { page: 1, page_size: 100 }
      if (filterMain !== 'all') {
        params.mainCategory = filterMain === "1" ? 'student_council' : filterMain === "2" ? 'democracy' : undefined
      }
      if (filterSub !== 'all') params.subCategory = filterSub

      const res = await postApi.getAll(params)
      setPosts(res.posts)
    } catch (e) {
      console.error(e)
      toast.error('공지사항을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [filterMain, filterSub])

  // Client-side filtering & sorting
  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query)
      )
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
        break
    }

    // Pinned posts first
    result.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))

    return result
  }, [posts, searchQuery, sortBy])

  const handleOpenCreate = () => {
    navigate({ to: '/admin/notices/create' })
  }

  const handleOpenEdit = (post: NoticeListItem) => {
    navigate({ to: '/admin/notices/$noticeId/edit', params: { noticeId: post.id.toString() } })
  }

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: '정말 삭제하시겠습니까?',
      text: "삭제하면 되돌릴 수 없습니다!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '삭제',
      cancelButtonText: '취소'
    })

    if (!result.isConfirmed) return

    try {
      await postApi.delete(id)
      await fetchPosts()
      setSelectedIds(prev => prev.filter(i => i !== id))
      toast.success('공지사항이 삭제되었습니다.')
    } catch (e) {
      console.error(e)
      toast.error('삭제에 실패했습니다.')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return

    const result = await Swal.fire({
      title: `${selectedIds.length}개의 공지사항을 삭제하시겠습니까?`,
      text: "삭제하면 되돌릴 수 없습니다!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '삭제',
      cancelButtonText: '취소'
    })

    if (!result.isConfirmed) return

    try {
      await Promise.all(selectedIds.map(id => postApi.delete(id)))
      await fetchPosts()
      setSelectedIds([])
      toast.success(`${selectedIds.length}개의 공지사항이 삭제되었습니다.`)
    } catch (e) {
      console.error(e)
      toast.error('일괄 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-900 font-sans min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <FileText size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">공지사항 관리</h1>
            <p className="text-gray-500 mt-0.5">학생회 및 민주자치 공지사항을 관리합니다</p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-0.5 font-medium"
        >
          <Plus size={20} />
          <span>새 공지사항</span>
        </button>
      </div>

      {/* Filter */}
      <NoticeFilter
        filterMain={filterMain}
        setFilterMain={setFilterMain}
        filterSub={filterSub}
        setFilterSub={setFilterSub}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* List */}
      <NoticeList
        loading={loading}
        posts={filteredAndSortedPosts}
        handleOpenEdit={handleOpenEdit}
        handleDelete={handleDelete}
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
        onBulkDelete={handleBulkDelete}
      />
    </div>
  )
}
