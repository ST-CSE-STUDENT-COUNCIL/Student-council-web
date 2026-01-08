import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { noticeApi } from '../../lib/api/notices'
import type { Notice } from '../../types/notices'
import { Modal } from '../../components/common/Modal'
import { Plus, Search, Filter, X, Upload, FileText, CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/admin/notices')({
  component: AdminNoticesPage,
})

const CATEGORIES = [
  { label: '학생회', value: 'student_council', boardId: 1 },
  { label: '민주자치', value: 'democracy', boardId: 2 },
]

// Sub-categories per board
const BOARD_SUB_CATEGORIES: Record<string, { label: string, value: string }[]> = {
  student_council: [
    { label: '공지', value: '공지' }, // General Notice combined here
    { label: '행사', value: '행사' },
    { label: '복지', value: '복지' },
  ],
  democracy: [
    { label: '공고', value: '공고' },
    { label: '고시', value: '고시' },
    { label: '대표자회의', value: '대표자회의' },
    { label: '학생회칙', value: '학생회칙' },
  ]
}

const ALL_SUB_CATEGORIES = [
  ...BOARD_SUB_CATEGORIES.student_council,
  ...BOARD_SUB_CATEGORIES.democracy
]



// Reverse Map for SubCategory display (if needed for English mapping, mostly redundant if values are Kr)
const subMapReverse: Record<string, string> = {
  'event': '행사',
  'welfare': '복지',
  'announcement': '공고',
  'notice': '고시',
  'meeting': '대표자회의',
  'rules': '학생회칙'
}

function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
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
    mainCategory: 'student_council',
    subCategory: '공지',
    isPinned: false,
  })
  const [files, setFiles] = useState<FileList | null>(null)

  const fetchNotices = async () => {
    setLoading(true)
    try {
      const params: any = { page: 1, page_size: 100 }
      if (filterMain !== 'all') params.mainCategory = filterMain
      if (filterSub !== 'all') params.subCategory = filterSub

      const res = await noticeApi.getAll(params)
      setNotices(res.notices)
    } catch (e) {
      console.error(e)
      alert('공지사항을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
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
      mainCategory: 'student_council',
      subCategory: '공지',
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

  const handleOpenEdit = (notice: Notice) => {
    setFormData({
      title: notice.title,
      content: notice.content,
      mainCategory: notice.main_category,
      subCategory: subMapReverse[notice.sub_category] || notice.sub_category || '공지',
      isPinned: notice.is_pinned || false,
    })
    setCurrentId(notice.id)
    setIsEditing(true)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await noticeApi.delete(id)
      fetchNotices()
    } catch (e) {
      console.error(e)
      alert('삭제에 실패했습니다.')
    }
  }

  const handleMainCategoryChange = (category: string) => {
    const validSubs = BOARD_SUB_CATEGORIES[category] || []
    setFormData(prev => ({
      ...prev,
      mainCategory: category,
      subCategory: validSubs[0]?.value || ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const boardId = CATEGORIES.find(c => c.value === formData.mainCategory)?.boardId || 1

    try {
      if (isEditing && currentId) {
        await noticeApi.update(currentId, {
          title: formData.title,
          content: formData.content,
          subcategory: formData.subCategory,
          is_pinned: formData.isPinned,
        })
        alert('수정되었습니다.')
      } else {
        const fileArray = files ? Array.from(files) : []
        await noticeApi.create({
          title: formData.title,
          content: formData.content,
          board_id: boardId,
          subcategory: formData.subCategory,
          is_pinned: formData.isPinned,
          attachments: fileArray
        })
        alert('작성되었습니다.')
      }
      resetForm()
      fetchNotices()
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Filter size={18} />
          <span className="font-medium text-sm">필터:</span>
        </div>

        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setFilterMain('all')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterMain === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            전체
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setFilterMain(c.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterMain === c.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-gray-300 hidden md:block" />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterSub('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterSub === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
          >
            전체 분류
          </button>
          {(filterMain === 'all' ? ALL_SUB_CATEGORIES : BOARD_SUB_CATEGORIES[filterMain] || []).map(c => (
            <button
              key={c.value}
              onClick={() => setFilterSub(c.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterSub === c.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={isEditing ? "공지사항 수정" : "새 공지사항 작성"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Category Tabs */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">게시판 선택</label>
            <div className="flex gap-4">
              {CATEGORIES.map(c => (
                <div
                  key={c.value}
                  onClick={() => handleMainCategoryChange(c.value)}
                  className={`flex-1 cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center justify-center font-semibold ${formData.mainCategory === c.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                >
                  {c.label}
                </div>
              ))}
            </div>
          </div>

          {/* Sub Category Pills */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">분류 선택</label>
            <div className="flex flex-wrap gap-2">
              {(BOARD_SUB_CATEGORIES[formData.mainCategory] || []).map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, subCategory: c.value }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.subCategory === c.value
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>



          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">제목</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                placeholder="제목을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">내용</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className="w-full border border-gray-200 rounded-lg p-3 h-48 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                placeholder="내용을 입력하세요"
                required
              />
            </div>
          </div>

          {/* File Upload & Options */}
          <div className="bg-gray-50 p-4 rounded-xl space-y-4">
            {!isEditing && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">첨부파일</label>
                <div className="flex gap-2 items-center">
                  <label className="cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 border-dashed border-2 flex items-center gap-2 transition-all">
                    <Upload size={16} />
                    <span>파일 선택</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {files && files.length > 0 ? (
                    <span className="text-sm text-blue-600 font-medium">{files.length}개 파일 선택됨</span>
                  ) : (
                    <span className="text-sm text-gray-400">선택된 파일 없음</span>
                  )}
                </div>
                {files && files.length > 0 && (
                  <div className="mt-2 pl-1 space-y-1">
                    {Array.from(files).map((f, i) => (
                      <div key={i} className="text-xs text-gray-500 flex items-center gap-1">
                        <FileText size={12} /> {f.name}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">※ 수정 모드에서는 파일 추가가 불가능합니다.</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div
                onClick={() => setFormData(prev => ({ ...prev, isPinned: !prev.isPinned }))}
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${formData.isPinned ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${formData.isPinned ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">상단 고정 (중요 공지)</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
            >
              {isEditing ? '수정 내용 저장' : '공지사항 등록'}
            </button>
          </div>

        </form>
      </Modal>

      {/* List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">상태</th>
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
              ) : notices.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="text-gray-300" size={48} />
                    <p>등록된 공지사항이 없습니다.</p>
                  </div>
                </td></tr>
              ) : (
                notices.map(notice => (
                  <tr key={notice.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-fit ${notice.main_category === 'student_council'
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'bg-emerald-50 text-emerald-600'
                          }`}>
                          {CATEGORIES.find(c => c.value === notice.main_category)?.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
                        {subMapReverse[notice.sub_category] || notice.sub_category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {notice.is_pinned && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-bold">고정</span>}
                        <span className="text-sm text-gray-900 font-medium truncate max-w-md block">{notice.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(notice.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(notice)}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(notice.id)}
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
    </div>
  )
}
