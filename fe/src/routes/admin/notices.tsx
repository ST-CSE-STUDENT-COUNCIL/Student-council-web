import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useMemo } from 'react'
import { postApi } from '../../lib/api/notices'
import type { NoticeListItem } from '../../types/posts'
import { Plus, FileText } from 'lucide-react'
import { NoticeList } from '../../components/notices/admin/NoticeList'
import { NoticeFilter } from '../../components/notices/admin/NoticeFilter'
import { NoticeForm } from '../../components/notices/admin/NoticeForm'
import { CATEGORIES, BOARD_SUB_CATEGORIES } from '../../components/notices/admin/constants'
import { ToastContainer, useToast } from '../../components/common/Toast'

export const Route = createFileRoute('/admin/notices')({
  component: AdminNoticesPage,
})

type SortOption = 'newest' | 'oldest' | 'title'

function AdminNoticesPage() {
  const [posts, setPosts] = useState<NoticeListItem[]>([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  // Filter State
  const [filterMain, setFilterMain] = useState<string>('all')
  const [filterSub, setFilterSub] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Form State
  const [isEditing, setIsEditing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [currentId, setCurrentId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    board_id: 1,
    subCategory: 'notification',
    isPinned: false,
  })
  const [files, setFiles] = useState<FileList | null>(null)

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      board_id: 1,
      subCategory: 'notification',
      isPinned: false,
    })
    setFiles(null)
    setCurrentId(null)
    setIsEditing(false)
    setShowForm(false)
  }

  const handleOpenCreate = () => {
    resetForm()
    setShowForm(true)
    setIsEditing(false)
  }

  const handleOpenEdit = (post: NoticeListItem) => {
    setFormData({
      title: post.title,
      content: post.content,
      board_id: post.board.id,
      subCategory: post.subcategory || 'notification',
      isPinned: post.is_pinned || false,
    })
    setCurrentId(post.id)
    setIsEditing(true)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
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
    if (!confirm(`선택한 ${selectedIds.length}개의 공지사항을 삭제하시겠습니까?`)) return

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

  const handleMainCategoryChange = (categoryValue: string) => {
    const category = CATEGORIES.find(c => c.value === categoryValue)
    if (!category) return

    const validSubs = BOARD_SUB_CATEGORIES[categoryValue] || []
    setFormData(prev => ({
      ...prev,
      board_id: category.boardId,
      subCategory: validSubs[0]?.value || 'notification'
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isEditing && currentId) {
        // ===== 수정 모드 =====
        const fileArray = files ? Array.from(files) : []
        const uploadedAttachments: { file_url: string, filename: string, file_size: number, mime_type: string }[] = []

        // 1. 새 파일이 있다면 업로드
        if (fileArray.length > 0) {
          for (const file of fileArray) {
            try {
              const contentType = file.type || 'application/octet-stream'
              const { presigned_url, public_url } = await postApi.getPresignedUrl(
                file.name,
                currentId,
                contentType
              )

              await fetch(presigned_url, {
                method: 'PUT',
                body: file,
                headers: {
                  'Content-Type': contentType
                }
              })

              uploadedAttachments.push({
                file_url: public_url,
                filename: file.name,
                file_size: file.size,
                mime_type: contentType
              })
            } catch (err) {
              console.error(`Failed to upload ${file.name}`, err)
            }
          }
        }

        // 2. 게시글 수정
        await postApi.update(currentId, {
          title: formData.title,
          content: formData.content,
          subcategory: formData.subCategory,
          is_pinned: formData.isPinned,
          attachment_urls: uploadedAttachments.length > 0 ? uploadedAttachments.map(a => ({
            filename: a.filename,
            public_url: a.file_url,
            file_size: a.file_size,
            mime_type: a.mime_type
          })) : undefined,
        })

        toast.success('공지사항이 수정되었습니다.')
      } else {
        // ===== 생성 모드 =====

        // 1. Draft 게시글 생성하여 post_id 획득
        const { post_id } = await postApi.createDraft(formData.board_id)

        // 2. post_id로 파일 업로드
        const fileArray = files ? Array.from(files) : []
        const uploadedAttachments = []

        for (const file of fileArray) {
          const contentType = file.type || 'application/octet-stream'
          const { presigned_url, public_url } = await postApi.getPresignedUrl(file.name, post_id, contentType)

          await fetch(presigned_url, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': contentType }
          })

          uploadedAttachments.push({
            filename: file.name,
            public_url,
            file_size: file.size,
            mime_type: contentType
          })
        }

        // 3. 최종 게시
        await postApi.create({
          post_id,
          title: formData.title,
          content: formData.content,
          board_id: formData.board_id,
          subcategory: formData.subCategory,
          is_pinned: formData.isPinned,
          attachment_urls: uploadedAttachments.length > 0 ? uploadedAttachments : undefined
        })

        toast.success('새 공지사항이 등록되었습니다.')
      }

      resetForm()
      fetchPosts()
    } catch (e) {
      console.error(e)
      toast.error(`저장에 실패했습니다: ${e}`)
    }
  }


  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-900 font-sans">
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

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

      {/* Form (Modal) */}
      <NoticeForm
        isOpen={showForm}
        onClose={resetForm}
        isEditing={isEditing}
        formData={formData}
        setFormData={setFormData}
        handleInputChange={handleInputChange}
        handleFileChange={handleFileChange}
        handleSubmit={handleSubmit}
        handleMainCategoryChange={handleMainCategoryChange}
        files={files}
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
