import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { clubApi } from '../../lib/api/clubs'
import type { Club, ClubCreate, ClubUpdate, IntroImageState } from '../../types/clubs'
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown, X } from 'lucide-react'
import { toast } from 'sonner'
import Swal from 'sweetalert2'
import { Modal } from '../../components/common/Modal'

export const Route = createFileRoute('/admin/clubs')({
  component: AdminClubsPage,
})

function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingClub, setEditingClub] = useState<Club | null>(null)

  // 폼 상태
  const [formData, setFormData] = useState<ClubCreate>({
    name: '',
    description: '',
    image_url: '',
    website_url: '',
  })

  // 썸네일 이미지 업로드 상태
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')

  // 소개 이미지 상태 (image, file, preview를 함께 관리)
  const [introImages, setIntroImages] = useState<IntroImageState[]>([])

  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 동아리 목록 조회
  const fetchClubs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await clubApi.getAll()
      setClubs(data)
    } catch (err: any) {
      setError('동아리 목록을 불러오는데 실패했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClubs()
  }, [])

  // 썸네일 이미지 미리보기 처리
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setThumbnailFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // 소개 이미지 추가
  const handleAddIntroImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onloadend = () => {
        const preview = reader.result as string
        const tempId = Date.now()
        const nextOrder = introImages.length > 0
          ? Math.max(...introImages.map(item => item.image.display_order)) + 1
          : 0

        setIntroImages(prev => [...prev, {
          image: {
            image_url: '',
            display_order: nextOrder,
            tempId: tempId
          },
          file: file,
          preview: preview
        }])
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  // 소개 이미지 삭제
  const handleRemoveIntroImage = (index: number) => {
    setIntroImages(prev => {
      const newImages = prev.filter((_, i) => i !== index)
      // 순번 재정렬
      return newImages.map((item, i) => ({
        ...item,
        image: { ...item.image, display_order: i }
      }))
    })
  }

  // 소개 이미지 순번 변경
  const handleIntroImageOrderChange = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === introImages.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1

    setIntroImages(prev => {
      const newImages = [...prev]
      // 배열 교환 (file, preview도 함께 이동)
      const temp = newImages[index]
      newImages[index] = newImages[targetIndex]
      newImages[targetIndex] = temp

      // 순번 재정렬
      return newImages.map((item, i) => ({
        ...item,
        image: { ...item.image, display_order: i }
      }))
    })
  }

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      website_url: '',
    })
    setThumbnailFile(null)
    setThumbnailPreview('')
    setIntroImages([])
    setEditingClub(null)
  }

  // 추가 모달 열기
  const handleOpenAdd = () => {
    resetForm()
    setShowAddModal(true)
  }

  // 수정 모달 열기
  const handleOpenEdit = async (club: Club) => {
    setFormData({
      name: club.name,
      description: club.description,
      image_url: club.image_url,
      website_url: club.website_url || '',
    })
    setThumbnailPreview(club.image_url)
    setThumbnailFile(null)
    setEditingClub(club)

    // 소개 이미지 별도 조회
    try {
      const images = await clubApi.getIntroImages(club.id)
      const sortedImages = images.sort((a, b) => a.display_order - b.display_order)
      setIntroImages(sortedImages.map(img => ({
        image: img,
        preview: img.image_url
      })))
    } catch (err) {
      console.error('소개 이미지를 불러오는데 실패했습니다.', err)
      setIntroImages([])
    }

    setShowEditModal(true)
  }

  // 이미지 업로드 (Presigned URL 사용)
  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true)
    try {
      const timestamp = Date.now()
      const filename = `clubs/${timestamp}_${file.name}`

      // 1. Presigned URL 획득
      const { presigned_url, public_url } = await clubApi.getPresignedUrl(filename)

      // 2. R2에 직접 업로드
      await clubApi.uploadImageToR2(presigned_url, file)

      // 3. public URL 반환
      return public_url
    } catch (err: any) {
      let errorMessage = '이미지 업로드에 실패했습니다.'
      if (err.response?.status === 403) {
        errorMessage = '권한이 없습니다. 관리자 권한이 필요합니다.'
      } else if (err.response?.status === 401) {
        errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.'
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      }
      throw new Error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  // 동아리 추가
  const handleAdd = async () => {
    if (!formData.name.trim()) {
      toast.error('동아리명을 입력해주세요.')
      return
    }
    if (!formData.description.trim()) {
      toast.error('동아리 설명을 입력해주세요.')
      return
    }
    if (!thumbnailFile && !formData.image_url) {
      toast.error('동아리 썸네일 이미지를 업로드해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      let thumbnailUrl = formData.image_url

      // 썸네일 이미지 업로드
      if (thumbnailFile) {
        thumbnailUrl = await uploadImage(thumbnailFile)
      }

      // 1. 동아리 생성
      const newClub: ClubCreate = {
        name: formData.name,
        description: formData.description,
        image_url: thumbnailUrl,
        website_url: formData.website_url || null,
      }

      const createdClub = await clubApi.create(newClub)

      // 2. 소개 이미지 별도 추가
      if (introImages.length > 0) {
        for (const item of introImages) {
          if (item.file) {
            // 새로 업로드된 파일
            const timestamp = Date.now()
            const filename = `${timestamp}_${item.file.name}`
            const { presigned_url, public_url } = await clubApi.getIntroImagePresignedUrl(createdClub.id, filename)

            // R2에 직접 업로드
            await clubApi.uploadImageToR2(presigned_url, item.file)

            // 소개 이미지 추가
            await clubApi.createIntroImage(createdClub.id, {
              image_url: public_url,
              display_order: item.image.display_order
            })
          }
        }
      }

      toast.success('동아리가 추가되었습니다.')
      resetForm()
      setShowAddModal(false)
      fetchClubs()
    } catch (err: any) {
      toast.error(err.message || '동아리 추가에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 동아리 수정
  const handleUpdate = async () => {
    if (!editingClub) return
    if (!formData.name.trim()) {
      toast.error('동아리명을 입력해주세요.')
      return
    }
    if (!formData.description.trim()) {
      toast.error('동아리 설명을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      let thumbnailUrl = formData.image_url

      // 썸네일 이미지 업로드
      if (thumbnailFile) {
        thumbnailUrl = await uploadImage(thumbnailFile)
      }

      // 1. 동아리 정보 수정 (소개 이미지 없이)
      const updateData: ClubUpdate = {
        name: formData.name,
        description: formData.description,
        image_url: thumbnailUrl,
        website_url: formData.website_url || null,
      }

      await clubApi.update(editingClub.id, updateData)

      // 2. 기존 소개 이미지 모두 삭제
      const existingImages = await clubApi.getIntroImages(editingClub.id)
      for (const img of existingImages) {
        await clubApi.deleteIntroImage(editingClub.id, img.id)
      }

      // 3. 현재 소개 이미지들 새로 추가
      if (introImages.length > 0) {
        for (const item of introImages) {
          if (item.file) {
            // 새로 업로드된 파일
            const timestamp = Date.now()
            const filename = `${timestamp}_${item.file.name}`
            const { presigned_url, public_url } = await clubApi.getIntroImagePresignedUrl(editingClub.id, filename)

            // R2에 직접 업로드
            await clubApi.uploadImageToR2(presigned_url, item.file)

            // 소개 이미지 추가
            await clubApi.createIntroImage(editingClub.id, {
              image_url: public_url,
              display_order: item.image.display_order
            })
          } else if ('id' in item.image && item.image.id) {
            // 기존 이미지 (순서만 변경된 경우)
            await clubApi.createIntroImage(editingClub.id, {
              image_url: item.image.image_url,
              display_order: item.image.display_order
            })
          }
        }
      }

      toast.success('동아리 정보가 수정되었습니다.')
      resetForm()
      setShowEditModal(false)
      fetchClubs()
    } catch (err: any) {
      toast.error(err.message || '동아리 수정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 동아리 삭제
  const handleDelete = async (club: Club) => {
    const result = await Swal.fire({
      title: `"${club.name}" 동아리를 삭제하시겠습니까?`,
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
      await clubApi.delete(club.id)
      toast.success('동아리가 삭제되었습니다.')
      fetchClubs()
    } catch (err: any) {
      toast.error('동아리 삭제에 실패했습니다.')
      console.error(err)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">동아리 관리</h1>
          <p className="text-gray-500 mt-1">동아리 정보를 추가, 수정, 삭제할 수 있습니다.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          동아리 추가
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">로딩 중...</div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">등록된 동아리가 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative mb-3">
                <img
                  src={club.image_url}
                  alt={club.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{club.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{club.description}</p>

              {club.website_url && (
                <a
                  href={club.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center text-xs font-semibold text-blue-600 hover:text-blue-700 mb-3"
                >
                  웹사이트 보기 →
                </a>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEdit(club)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 text-sm font-semibold transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  수정
                </button>
                <button
                  onClick={() => handleDelete(club)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm font-semibold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 추가 모달 */}
      {showAddModal && (
        <ClubModal
          isOpen={showAddModal}
          isEditing={false}
          formData={formData}
          thumbnailPreview={thumbnailPreview}
          introImages={introImages}
          isUploading={isUploading}
          isSubmitting={isSubmitting}
          onClose={() => {
            resetForm()
            setShowAddModal(false)
          }}
          onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
          onThumbnailChange={handleThumbnailChange}
          onAddIntroImage={handleAddIntroImage}
          onRemoveIntroImage={handleRemoveIntroImage}
          onIntroImageOrderChange={handleIntroImageOrderChange}
          onSubmit={handleAdd}
        />
      )}

      {/* 수정 모달 */}
      {showEditModal && editingClub && (
        <ClubModal
          isOpen={showEditModal}
          isEditing={true}
          formData={formData}
          thumbnailPreview={thumbnailPreview}
          introImages={introImages}
          isUploading={isUploading}
          isSubmitting={isSubmitting}
          onClose={() => {
            resetForm()
            setShowEditModal(false)
          }}
          onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
          onThumbnailChange={handleThumbnailChange}
          onAddIntroImage={handleAddIntroImage}
          onRemoveIntroImage={handleRemoveIntroImage}
          onIntroImageOrderChange={handleIntroImageOrderChange}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  )
}

// 동아리 모달 컴포넌트
type ClubModalProps = {
  isOpen: boolean
  isEditing: boolean
  formData: ClubCreate
  thumbnailPreview: string
  introImages: IntroImageState[]
  isUploading: boolean
  isSubmitting: boolean
  onClose: () => void
  onChange: (field: keyof ClubCreate, value: string) => void
  onThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAddIntroImage: () => void
  onRemoveIntroImage: (index: number) => void
  onIntroImageOrderChange: (index: number, direction: 'up' | 'down') => void
  onSubmit: () => void
}

function ClubModal({
  isOpen,
  isEditing,
  formData,
  thumbnailPreview,
  introImages,
  isUploading,
  isSubmitting,
  onClose,
  onChange,
  onThumbnailChange,
  onAddIntroImage,
  onRemoveIntroImage,
  onIntroImageOrderChange,
  onSubmit,
}: ClubModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? '동아리 수정' : '동아리 추가'}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
          {/* 썸네일 이미지 */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              동아리 썸네일 (아이콘) *
            </label>
            <label className="block cursor-pointer">
              <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="thumbnail preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-gray-500 font-medium">클릭하여 썸네일 업로드</p>
                    <p className="text-xs text-gray-400">PNG, JPG (최대 10MB)</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onThumbnailChange}
                disabled={isUploading || isSubmitting}
              />
            </label>
            {isUploading && (
              <p className="text-sm text-blue-600 mt-2">이미지 업로드 중...</p>
            )}
          </div>

          {/* 소개 이미지 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-900">
                소개 이미지 (선택)
              </label>
              <button
                type="button"
                onClick={onAddIntroImage}
                disabled={isUploading || isSubmitting}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                이미지 추가
              </button>
            </div>

            {introImages.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <p className="text-gray-500 text-sm">소개 이미지가 없습니다.</p>
                <p className="text-gray-400 text-xs mt-1">위의 "이미지 추가" 버튼을 클릭하여 추가하세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {introImages.map((item, index) => {
                  const preview = item.preview || item.image.image_url
                  const key = 'id' in item.image ? item.image.id : ('tempId' in item.image ? item.image.tempId : index)

                  return (
                    <div
                      key={key}
                      className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-32 h-20">
                          {preview ? (
                            <img
                              src={preview}
                              alt={`소개 이미지 ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                              <p className="text-xs text-gray-400">이미지 없음</p>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              순번: {item.image.display_order + 1}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {preview ? '이미지 업로드됨' : '이미지 없음'}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onIntroImageOrderChange(index, 'up')}
                              disabled={index === 0 || isUploading || isSubmitting}
                              className="p-1.5 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              title="위로 이동"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onIntroImageOrderChange(index, 'down')}
                              disabled={index === introImages.length - 1 || isUploading || isSubmitting}
                              className="p-1.5 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              title="아래로 이동"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveIntroImage(index)}
                              disabled={isUploading || isSubmitting}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              title="삭제"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">동아리명 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="예: 알고리즘 동아리"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">동아리 설명 *</label>
            <textarea
              value={formData.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="동아리에 대한 설명을 입력해주세요."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              웹사이트 URL (선택)
            </label>
            <input
              type="url"
              value={formData.website_url || ''}
              onChange={(e) => onChange('website_url', e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting || isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (isEditing ? '수정 중...' : '추가 중...') : isEditing ? '수정하기' : '추가하기'}
            </button>
          </div>
        </div>
    </Modal>
  )
}
