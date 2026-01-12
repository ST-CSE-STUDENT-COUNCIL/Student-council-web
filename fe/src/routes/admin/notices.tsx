import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { postApi } from '../../lib/api/notices'
import type { Post } from '../../types/posts'
import { Plus } from 'lucide-react'
import { NoticeList } from '../../components/admin/notice/NoticeList'
import { NoticeFilter } from '../../components/admin/notice/NoticeFilter'
import { NoticeForm } from '../../components/admin/notice/NoticeForm'
import { CATEGORIES, BOARD_SUB_CATEGORIES } from '../../components/admin/notice/constants'

export const Route = createFileRoute('/admin/notices')({
  component: AdminNoticesPage,
})

function AdminNoticesPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)

  // Filter State
  const [filterMain, setFilterMain] = useState<string>('all')
  const [filterSub, setFilterSub] = useState<string>('all')

  // Form State
  const [isEditing, setIsEditing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [currentId, setCurrentId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    board_id: 1,
    subCategory: 'notice',
    isPinned: false,
  })
  const [files, setFiles] = useState<FileList | null>(null)

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params: any = { page: 1, page_size: 100 }
      if (filterMain !== 'all') params.mainCategory = filterMain
      if (filterSub !== 'all') params.subCategory = filterSub

      const res = await postApi.getAll(params)
      setPosts(res.posts)
    } catch (e) {
      console.error(e)
      alert('공지사항을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [filterMain, filterSub])

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
      subCategory: 'notice',
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

  const handleOpenEdit = (post: Post) => {
    setFormData({
      title: post.title,
      content: post.content,
      board_id: post.board_id,
      subCategory: post.subcategory || 'notice',
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
      fetchPosts()
    } catch (e) {
      console.error(e)
      alert('삭제에 실패했습니다.')
    }
  }

  const handleMainCategoryChange = (categoryValue: string) => {
    const category = CATEGORIES.find(c => c.value === categoryValue)
    if (!category) return

    const validSubs = BOARD_SUB_CATEGORIES[categoryValue] || []
    setFormData(prev => ({
      ...prev,
      board_id: category.boardId,
      subCategory: validSubs[0]?.value || 'notice'
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isEditing && currentId) {
        // 수정 모드
        await postApi.update(currentId, {
          title: formData.title,
          content: formData.content,
          subcategory: formData.subCategory,
          is_pinned: formData.isPinned,
        })
        alert('수정되었습니다.')
      } else {
        // 1. 게시글 생성 (첨부파일 URL 빈 배열로 시작)
        const newPost = await postApi.create({
          title: formData.title,
          content: formData.content,
          board_id: formData.board_id,
          subcategory: formData.subCategory,
          is_pinned: formData.isPinned,
          attachment_urls: []
        })

        // 2. 파일 업로드 및 URL 수집
        const fileArray = files ? Array.from(files) : []
        const uploadedUrls: string[] = []

        if (fileArray.length > 0) {
          for (const file of fileArray) {
            try {
              // Presigned URL 요청
              const { presigned_url, public_url } = await postApi.getPresignedUrl(file.name, newPost.id)

              // R2로 업로드 (PUT)
              await fetch(presigned_url, {
                method: 'PUT',
                body: file,
                headers: {
                  'Content-Type': file.type
                }
              })

              uploadedUrls.push(public_url)
            } catch (err) {
              console.error(`Failed to upload ${file.name}`, err)
            }
          }

          // 3. 업로드된 파일이 있다면 게시글 업데이트
          if (uploadedUrls.length > 0) {
            await postApi.update(newPost.id, {
              attachment_urls: uploadedUrls
            })
          }
        }

        alert('작성되었습니다.')
      }
      resetForm()
      fetchPosts()
    } catch (e) {
      console.error(e)
      alert(`저장에 실패했습니다: ${e}`)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-900 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">공지사항 관리</h1>
          <p className="text-gray-500 mt-1">학생회 및 민주자치 공지사항을 관리합니다.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Plus size={18} />
          <span>새 공지사항</span>
        </button>
      </div>

      {/* Filter */}
      <NoticeFilter
        filterMain={filterMain}
        setFilterMain={setFilterMain}
        filterSub={filterSub}
        setFilterSub={setFilterSub}
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

      {/* List Table */}
      <NoticeList
        loading={loading}
        posts={posts}
        handleOpenEdit={handleOpenEdit}
        handleDelete={handleDelete}
      />
    </div>
  )
}
