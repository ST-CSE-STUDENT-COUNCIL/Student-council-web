import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import { activityApi, activityAdminApi } from '../../lib/api/activities'
import type { ActivityListItem, Activity, ActivityCreateRequest, ActivityType, ActivityRegistrationResponse, FormField } from '../../types/activities'
import { activityTypeLabels, getActivityStatus } from '../../types/activities'

export const Route = createFileRoute('/admin/activities')({
  component: AdminActivitiesPage,
})

// 업로드할 이미지 타입
type UploadImage = {
  id: string
  file: File
  preview: string
  uploading: boolean
  uploaded: boolean
  url?: string
  error?: string
}

// 신청자 관리 모달 컴포넌트
function RegistrationsModal({ activity, onClose }: { activity: ActivityListItem; onClose: () => void }) {
  const [registrations, setRegistrations] = useState<ActivityRegistrationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const fetchRegistrations = useCallback(async (pageNum: number) => {
    try {
      setLoading(true)
      const data = await activityAdminApi.getRegistrations(activity.id, { page: pageNum, page_size: 10 })
      setRegistrations(data.registrations)
      setTotalPages(data.pagination.total_pages)
      setTotalCount(data.pagination.total)
    } catch (error) {
      console.error('Failed to fetch registrations', error)
      alert('신청자 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [activity.id])

  useEffect(() => {
    fetchRegistrations(page)
  }, [page, fetchRegistrations])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">신청자 목록</h2>
            <p className="text-sm text-gray-500 mt-1">{activity.title} (총 {totalCount}명)</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-10 text-gray-500">신청자가 없습니다.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">이름</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">학번/학과</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">연락처</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">신청일시</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {registrations.map(reg => (
                  <tr key={reg.id}>
                    <td className="px-4 py-2 font-medium">{reg.name || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {reg.student_id ? `${reg.student_id} / ` : ''}{reg.department || '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {reg.phone}<br />{reg.email}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(reg.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${reg.status === 'approved' ? 'bg-green-100 text-green-800' :
                        reg.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {reg.status === 'approved' ? '승인됨' :
                          reg.status === 'rejected' ? '거절됨' :
                            reg.status === 'cancelled' ? '취소됨' : '대기중'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >이전</button>
            <span className="px-3 py-1">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >다음</button>
          </div>
        )}
      </div>
    </div>
  )
}


// 추가 정보 필드 관리 컴포넌트
function FormFieldsManager({
  fields,
  onChange
}: {
  fields: FormField[],
  onChange: (fields: FormField[]) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const [currentField, setCurrentField] = useState<FormField>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    options: [],
    placeholder: '',
    help_text: ''
  })

  // 옵션 문자열 관리 (줄바꿈이나 콤마로 구분된 문자열을 배열로 변환)
  const [optionsStr, setOptionsStr] = useState('')

  const handleEdit = (index: number) => {
    const field = fields[index]
    setEditingIndex(index)
    setCurrentField(field)
    setOptionsStr(field.options?.join('\n') || '')
    setIsEditing(true)
  }

  const handleAdd = () => {
    setEditingIndex(null)
    setCurrentField({
      name: `field_${Date.now()}`,
      label: '',
      type: 'text',
      required: false,
      options: [],
      placeholder: '',
      help_text: ''
    })
    setOptionsStr('')
    setIsEditing(true)
  }

  const handleDelete = (index: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const newFields = [...fields]
    newFields.splice(index, 1)
    onChange(newFields)
  }

  const handleSave = () => {
    if (!currentField.label) {
      alert('질문 제목(라벨)을 입력해주세요.')
      return
    }

    const fieldToSave = {
      ...currentField,
      options: ['select', 'radio', 'checkbox'].includes(currentField.type)
        ? optionsStr.split('\n').map(s => s.trim()).filter(Boolean)
        : undefined
    }

    const newFields = [...fields]
    if (editingIndex !== null) {
      newFields[editingIndex] = fieldToSave
    } else {
      newFields.push(fieldToSave)
    }
    onChange(newFields)
    setIsEditing(false)
  }

  return (
    <div className="space-y-4 border rounded-md p-4 bg-gray-50">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">추가 질문 (선택 사항)</label>
        <button
          type="button"
          onClick={handleAdd}
          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
        >
          + 질문 추가
        </button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">설정된 추가 질문이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div key={idx} className="bg-white border rounded p-3 flex justify-between items-center text-sm">
              <div>
                <span className="font-medium mr-2">{field.label}</span>
                <span className="text-gray-500 text-xs bg-gray-100 px-1 rounded mr-2">{field.type}</span>
                {field.required && <span className="text-red-500 text-xs">필수</span>}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleEdit(idx)} className="text-blue-600 hover:text-blue-800">수정</button>
                <button type="button" onClick={() => handleDelete(idx)} className="text-red-600 hover:text-red-800">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 편집 모달 */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingIndex !== null ? '질문 수정' : '새 질문 추가'}</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">질문 제목</label>
                <input
                  type="text"
                  value={currentField.label}
                  onChange={e => setCurrentField({ ...currentField, label: e.target.value })}
                  className="w-full border rounded px-2 py-1"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">답변 타입</label>
                <select
                  value={currentField.type}
                  onChange={e => setCurrentField({ ...currentField, type: e.target.value as FormField['type'] })}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="text">단답형 (Text)</option>
                  <option value="textarea">서술형 (Textarea)</option>
                  <option value="radio">객관식 (단일 선택)</option>
                  <option value="checkbox">객관식 (다중 선택)</option>
                  <option value="select">드롭다운 (Select)</option>
                  <option value="number">숫자</option>
                  <option value="date">날짜</option>
                  <option value="file">파일 첨부</option>
                </select>
              </div>

              {['radio', 'checkbox', 'select'].includes(currentField.type) && (
                <div>
                  <label className="block text-xs font-medium text-gray-700">선택지 (줄바꿈으로 구분)</label>
                  <textarea
                    value={optionsStr}
                    onChange={e => setOptionsStr(e.target.value)}
                    className="w-full border rounded px-2 py-1 h-20"
                    placeholder="예: 참여\n불참\n미정"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentField.required}
                  onChange={e => setCurrentField({ ...currentField, required: e.target.checked })}
                  id="field-required"
                />
                <label htmlFor="field-required" className="text-sm">필수 응답</label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >취소</button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


function AdminActivitiesPage() {
  const [activities, setActivities] = useState<ActivityListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [viewingRegistrationsActivity, setViewingRegistrationsActivity] = useState<ActivityListItem | null>(null)
  const [saving, setSaving] = useState(false)

  // 이미지 관련 상태
  const [images, setImages] = useState<UploadImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<ActivityCreateRequest>({
    type: 'event',
    title: '',
    description: '',
    registration_start: '',
    registration_end: '',
    max_capacity: undefined,
    require_membership: false,
    is_active: true,
    thumbnail_url: '',
    form_fields: []
  })

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await activityApi.getAll({ is_active_only: false })
      setActivities(response.activities)
    } catch (error) {
      console.error('Failed to fetch activities', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  // 이미지 파일 추가 핸들러
  const addImageFiles = useCallback((files: FileList | File[]) => {
    const newImages: UploadImage[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        uploaded: false
      }))
    // 단일 썸네일만 지원한다면 기존걸 덮어쓰거나, 리스트에 추가
    setImages(prev => [...prev, ...newImages])
  }, [])

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      addImageFiles(e.dataTransfer.files)
    }
  }, [addImageFiles])

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addImageFiles(e.target.files)
    }
  }, [addImageFiles])

  // 이미지 제거 핸들러
  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id)
      if (img) URL.revokeObjectURL(img.preview)
      return prev.filter(i => i.id !== id)
    })
  }, [])

  // 이미지 업로드 함수
  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = []

    for (const img of images) {
      if (img.uploaded && img.url) {
        uploadedUrls.push(img.url)
        continue
      }

      try {
        setImages(prev => prev.map(i =>
          i.id === img.id ? { ...i, uploading: true } : i
        ))

        const { presigned_url, public_url } = await activityAdminApi.getPresignedUrl(img.file.name)
        await activityAdminApi.uploadImage(presigned_url, img.file)

        setImages(prev => prev.map(i =>
          i.id === img.id ? { ...i, uploading: false, uploaded: true, url: public_url } : i
        ))
        uploadedUrls.push(public_url)
      } catch (error) {
        setImages(prev => prev.map(i =>
          i.id === img.id ? { ...i, uploading: false, error: '업로드 실패' } : i
        ))
      }
    }

    return uploadedUrls
  }

  const handleCreate = () => {
    setEditingActivity(null)
    setFormData({
      type: 'event',
      title: '',
      description: '',
      registration_start: '',
      registration_end: '',
      max_capacity: undefined,
      require_membership: false,
      is_active: true,
      thumbnail_url: ''
    })
    setImages([])
    setIsModalOpen(true)
  }

  const handleEdit = async (activity: ActivityListItem) => {
    try {
      const detail = await activityApi.getById(activity.id)
      setEditingActivity(detail)
      setFormData({
        type: detail.type,
        title: detail.title,
        description: detail.description || '',
        registration_start: toLocalISOString(detail.registration_start),
        registration_end: toLocalISOString(detail.registration_end),
        max_capacity: detail.max_capacity || undefined,
        require_membership: detail.require_membership,
        is_active: detail.is_active,
        thumbnail_url: detail.thumbnail_url || '',
        form_fields: detail.form_fields || []
      })
      // 기존 이미지가 있으면 표시
      if (detail.thumbnail_url) {
        setImages([{
          id: 'existing-thumbnail',
          file: new File([], 'existing'),
          preview: detail.thumbnail_url,
          uploading: false,
          uploaded: true,
          url: detail.thumbnail_url
        }])
      } else {
        setImages([])
      }
      setIsModalOpen(true)
    } catch (error) {
      console.error('Failed to fetch activity detail', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await activityAdminApi.delete(id)
      fetchActivities()
    } catch (error) {
      console.error('Failed to delete activity', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)

      // 이미지 업로드
      const uploadedUrls = await uploadImages()
      const thumbnailUrl = uploadedUrls[0] || formData.thumbnail_url

      // 모든 이미지를 image_urls 형식으로 변환
      const imageUrls = uploadedUrls.map(url => ({ public_url: url }))

      if (editingActivity) {
        await activityAdminApi.update(editingActivity.id, {
          title: formData.title,
          description: formData.description,
          registration_start: formData.registration_start ? new Date(formData.registration_start).toISOString() : undefined,
          registration_end: formData.registration_end ? new Date(formData.registration_end).toISOString() : undefined,
          max_capacity: formData.max_capacity,
          require_membership: formData.require_membership,
          is_active: formData.is_active,
          thumbnail_url: thumbnailUrl || undefined,
          form_fields: formData.form_fields,
          image_urls: imageUrls.length > 0 ? imageUrls : undefined // 다중 이미지도 업데이트 지원
        })
      } else {
        await activityAdminApi.create({
          ...formData,
          registration_start: formData.registration_start ? new Date(formData.registration_start).toISOString() : undefined,
          registration_end: formData.registration_end ? new Date(formData.registration_end).toISOString() : undefined,
          thumbnail_url: thumbnailUrl,
          image_urls: imageUrls, // 다중 이미지 URL 전송
        })
      }
      setIsModalOpen(false)
      fetchActivities()
    } catch (error) {
      console.error('Failed to save activity', error)
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // datetime-local input 용으로 날짜 포맷 변환 (UTC -> Local YYYY-MM-DDTHH:mm)
  const toLocalISOString = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
  }

  const getStatusBadge = (activity: ActivityListItem) => {
    const status = getActivityStatus(activity)
    const styles = {
      active: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800'
    }
    const labels = {
      active: '진행중',
      scheduled: '예정됨',
      closed: '마감됨'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">신청 관리</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 새 신청 만들기
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">타입</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신청현황</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기간</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                      {activityTypeLabels[activity.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {activity.thumbnail_url && (
                        <img
                          src={activity.thumbnail_url}
                          alt=""
                          className="w-8 h-8 rounded object-cover border border-gray-200"
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900">{activity.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(activity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activity.current_count}
                    {activity.max_capacity ? ` / ${activity.max_capacity}` : ''}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-col gap-1">
                      {activity.registration_start && (
                        <div className="text-xs">
                          <span className="text-gray-400 mr-2">시작</span>
                          {new Date(activity.registration_start).toLocaleString()}
                        </div>
                      )}
                      {activity.registration_end && (
                        <div className="text-xs">
                          <span className="text-gray-400 mr-2">종료</span>
                          {new Date(activity.registration_end).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setViewingRegistrationsActivity(activity)}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      신청자
                    </button>
                    <button
                      onClick={() => handleEdit(activity)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {activities.length === 0 && (
            <div className="text-center py-12 text-gray-500 border-t border-gray-200">
              등록된 신청이 없습니다.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">
                {editingActivity ? '신청 수정' : '새 신청 만들기'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* 이미지 업로드 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">대표 이미지</label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      relative border-2 border-dashed rounded-lg p-6 text-center
                      transition-colors duration-200
                      ${isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <div className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="text-gray-400 mb-2">
                        <svg className="mx-auto h-8 w-8" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600">
                        {images.length > 0 ? '이미지 추가하기' : '클릭하여 이미지를 선택하거나 드래그하세요'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        (최대 10MB, {images.length}개 선택됨)
                      </p>
                    </div>
                  </div>

                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-4 justify-center">
                      {images.map((img) => (
                        <div key={img.id} className="relative group w-full max-w-[200px]">
                          <img
                            src={img.preview}
                            alt="Preview"
                            className={`
                              w-full h-32 object-cover rounded-lg border
                              ${img.error ? 'border-red-500' : 'border-gray-200'}
                            `}
                          />
                          {img.uploading && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(img.id)}
                            className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full shadow-md w-6 h-6 flex items-center justify-center hover:bg-red-50 border border-red-100"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">신청 타입</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ActivityType }))}
                    disabled={!!editingActivity}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    {Object.entries(activityTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">최대 정원</label>
                  <input
                    type="number"
                    value={formData.max_capacity || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: e.target.value ? parseInt(e.target.value) : undefined }))}
                    min={1}
                    placeholder="무제한"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              <FormFieldsManager
                fields={formData.form_fields || []}
                onChange={(fields) => setFormData(prev => ({ ...prev, form_fields: fields }))}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">신청 시작</label>
                  <input
                    type="datetime-local"
                    value={formData.registration_start}
                    onChange={(e) => setFormData(prev => ({ ...prev, registration_start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">신청 종료</label>
                  <input
                    type="datetime-local"
                    value={formData.registration_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, registration_end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.require_membership}
                    onChange={(e) => setFormData(prev => ({ ...prev, require_membership: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">회비 납부자만</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">활성화</span>
                </label>
              </div>
              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '저장 중...' : (editingActivity ? '수정' : '생성')}
                </button>
              </div>
            </form>
          </div >
        </div >
      )
      }

      {/* 신청자 목록 모달 */}
      {
        viewingRegistrationsActivity && (
          <RegistrationsModal
            activity={viewingRegistrationsActivity}
            onClose={() => setViewingRegistrationsActivity(null)}
          />
        )
      }
    </div >
  )
}
