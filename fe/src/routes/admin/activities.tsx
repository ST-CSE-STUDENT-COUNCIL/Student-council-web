import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { activityApi, activityAdminApi } from '../../lib/api/activities'
import type { ActivityListItem, Activity, ActivityCreateRequest, ActivityType } from '../../types/activities'
import { activityTypeLabels, getActivityStatus } from '../../types/activities'
import { RegistrationsModal, FormFieldsManager, ImageUploader, type UploadImage } from '../../components/activities/admin'

export const Route = createFileRoute('/admin/activities')({
  component: AdminActivitiesPage,
})


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
    form_fields: [],
    config: {}
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
      thumbnail_url: '',
      config: {}
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
        form_fields: detail.form_fields || [],
        config: detail.config || {}
      })
      // 기존 이미지 로드: image_urls가 있으면 사용, 없으면 thumbnail_url 사용
      const existingImages: UploadImage[] = []
      if (detail.images && detail.images.length > 0) {
        detail.images.forEach((img, idx) => {
          existingImages.push({
            id: `existing-${idx}`,
            file: new File([], 'existing'),
            preview: img.image_url,
            uploading: false,
            uploaded: true,
            url: img.image_url
          })
        })
      } else if (detail.thumbnail_url) {
        existingImages.push({
          id: 'existing-thumbnail',
          file: new File([], 'existing'),
          preview: detail.thumbnail_url,
          uploading: false,
          uploaded: true,
          url: detail.thumbnail_url
        })
      }
      setImages(existingImages)
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
                <ImageUploader
                  images={images}
                  onImagesChange={setImages}
                  isDragging={isDragging}
                  onDraggingChange={setIsDragging}
                  maxImages={10}
                />
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

              {formData.type === 'notice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">외부 링크</label>
                  <input
                    type="text"
                    value={formData.config?.external_link || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      config: { ...prev.config, external_link: e.target.value }
                    }))}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">배너 클릭 시 이동할 외부 링크를 입력하세요.</p>
                </div>
              )}

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
