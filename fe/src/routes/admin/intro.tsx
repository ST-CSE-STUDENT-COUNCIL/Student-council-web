import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { introductionApi } from '../../lib/api/introductions'
import type { IntroductionImage, IntroductionImageCreate, IntroductionImageUpdate } from '../../types/introductions'
import { Plus, Trash2, Edit2, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import Swal from 'sweetalert2'

export const Route = createFileRoute('/admin/intro')({
  component: AdminIntroPage,
})

function AdminIntroPage() {
  const [images, setImages] = useState<IntroductionImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingImage, setEditingImage] = useState<IntroductionImage | null>(null)

  // 폼 상태
  const [formData, setFormData] = useState<IntroductionImageCreate>({
    title: '',
    image_url: '',
    display_order: undefined,
  })

  // 이미지 업로드 상태
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 이미지 목록 조회
  const fetchImages = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await introductionApi.getAll(false) // 모든 이미지 조회 (비활성 포함)
      setImages(response.images.sort((a, b) => a.display_order - b.display_order))
    } catch (err: any) {
      setError('이미지 목록을 불러오는데 실패했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  // 이미지 미리보기 처리
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      display_order: undefined,
    })
    setImageFile(null)
    setImagePreview('')
    setEditingImage(null)
  }

  // 추가 모달 열기
  const handleOpenAdd = () => {
    resetForm()
    setShowAddModal(true)
  }

  // 수정 모달 열기
  const handleOpenEdit = (image: IntroductionImage) => {
    setFormData({
      title: image.title,
      image_url: image.image_url,
      display_order: image.display_order,
    })
    setImagePreview(image.image_url)
    setImageFile(null)
    setEditingImage(image)
    setShowEditModal(true)
  }

  // 이미지 업로드 (Presigned URL 사용)
  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true)
    try {
      const timestamp = Date.now()
      const filename = `introductions/${timestamp}_${file.name}`

      // 1. Presigned URL 획득
      const { presigned_url, public_url } = await introductionApi.getPresignedUrl(filename)

      // 2. R2에 직접 업로드
      await introductionApi.uploadImageToR2(presigned_url, file)

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

  // 이미지 추가
  const handleAdd = async () => {
    if (!formData.title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }
    if (!imageFile && !formData.image_url) {
      toast.error('이미지를 업로드해주세요.')
      return
    }
    // display_order가 빈칸인지 검사
    if (formData.display_order === undefined || formData.display_order === null) {
      toast.error('표시 순서를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      let imageUrl = formData.image_url

      // 새 이미지가 있으면 업로드
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const newImage: IntroductionImageCreate = {
        title: formData.title,
        image_url: imageUrl,
        display_order: formData.display_order,
      }

      await introductionApi.create(newImage)
      toast.success('이미지가 추가되었습니다.')
      resetForm()
      setShowAddModal(false)
      fetchImages()
    } catch (err: any) {
      toast.error(err.message || '이미지 추가에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 이미지 수정
  const handleUpdate = async () => {
    if (!editingImage) return
    if (!formData.title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }
    // display_order가 빈칸인지 검사
    if (formData.display_order === undefined || formData.display_order === null) {
      toast.error('표시 순서를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      // 참고: 백엔드 스키마에 image_url 업데이트가 없으므로 이미지 변경은 지원하지 않습니다.
      // 이미지를 변경하려면 삭제 후 재생성해야 합니다.
      const updateData: IntroductionImageUpdate = {
        title: formData.title,
        display_order: formData.display_order,
      }

      await introductionApi.update(editingImage.id, updateData)
      toast.success('이미지 정보가 수정되었습니다.')
      resetForm()
      setShowEditModal(false)
      fetchImages()
    } catch (err: any) {
      toast.error(err.message || '이미지 수정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 이미지 삭제
  const handleDelete = async (image: IntroductionImage) => {
    const result = await Swal.fire({
      title: `"${image.title}" 이미지를 삭제하시겠습니까?`,
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
      await introductionApi.delete(image.id)
      toast.success('이미지가 삭제되었습니다.')
      fetchImages()
    } catch (err: any) {
      toast.error('이미지 삭제에 실패했습니다.')
      console.error(err)
    }
  }

  // 순번 변경
  const handleOrderChange = async (image: IntroductionImage, direction: 'up' | 'down') => {
    const currentIndex = images.findIndex((img) => img.id === image.id)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= images.length) return

    const targetImage = images[targetIndex]
    const newOrder = targetImage.display_order
    const oldOrder = image.display_order

    try {
      // 두 이미지의 순번을 교환
      await Promise.all([
        introductionApi.update(image.id, { display_order: newOrder }),
        introductionApi.update(targetImage.id, { display_order: oldOrder }),
      ])
      fetchImages()
    } catch (err: any) {
      toast.error('순번 변경에 실패했습니다.')
      console.error(err)
    }
  }

  // 활성화/비활성화 토글
  const handleToggleActive = async (image: IntroductionImage) => {
    try {
      await introductionApi.update(image.id, { is_active: !image.is_active })
      toast.success(`이미지가 ${image.is_active ? '비활성화' : '활성화'}되었습니다.`)
      fetchImages()
    } catch (err: any) {
      toast.error('상태 변경에 실패했습니다.')
      console.error(err)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">학생회 소개 관리</h1>
          <p className="text-gray-500 mt-1">학생회 소개 이미지를 추가, 수정, 삭제하고 순서를 관리할 수 있습니다.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          이미지 추가
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">로딩 중...</div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 text-gray-500">등록된 이미지가 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow ${!image.is_active ? 'opacity-60 border-gray-300' : 'border-gray-200'
                }`}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-48 h-32">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{image.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        순번: {image.display_order} {!image.is_active && '(비활성화)'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(image)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${image.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {image.is_active ? '활성' : '비활성'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => handleOrderChange(image, 'up')}
                      disabled={index === 0}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-4 h-4" />
                      위로
                    </button>
                    <button
                      onClick={() => handleOrderChange(image, 'down')}
                      disabled={index === images.length - 1}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-4 h-4" />
                      아래로
                    </button>
                    <button
                      onClick={() => handleOpenEdit(image)}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-semibold transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(image)}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 추가 모달 */}
      {showAddModal && (
        <IntroModal
          isOpen={showAddModal}
          isEditing={false}
          formData={formData}
          imagePreview={imagePreview}
          isUploading={isUploading}
          isSubmitting={isSubmitting}
          onClose={() => {
            resetForm()
            setShowAddModal(false)
          }}
          onChange={(field, value) =>
            setFormData((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onImageChange={handleImageChange}
          onSubmit={handleAdd}
        />
      )}

      {/* 수정 모달 */}
      {showEditModal && editingImage && (
        <IntroModal
          isOpen={showEditModal}
          isEditing={true}
          formData={formData}
          imagePreview={imagePreview}
          isUploading={isUploading}
          isSubmitting={isSubmitting}
          onClose={() => {
            resetForm()
            setShowEditModal(false)
          }}
          onChange={(field, value) =>
            setFormData((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onImageChange={handleImageChange}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  )
}

// 학생회 소개 모달 컴포넌트
type IntroModalProps = {
  isOpen: boolean
  isEditing: boolean
  formData: IntroductionImageCreate
  imagePreview: string
  isUploading: boolean
  isSubmitting: boolean
  onClose: () => void
  onChange: (field: keyof IntroductionImageCreate, value: string | number) => void
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: () => void
}

function IntroModal({
  isOpen,
  isEditing,
  formData,
  imagePreview,
  isUploading,
  isSubmitting,
  onClose,
  onChange,
  onImageChange,
  onSubmit,
}: IntroModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">
            {isEditing ? '이미지 수정' : '이미지 추가'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">이미지 *</label>
            <label className="block cursor-pointer">
              <div className="w-full h-64 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-gray-500 font-medium">클릭하여 이미지 업로드</p>
                    <p className="text-xs text-gray-400">PNG, JPG (최대 10MB)</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageChange}
                disabled={isUploading || isSubmitting}
              />
            </label>
            {isUploading && (
              <p className="text-sm text-blue-600 mt-2">이미지 업로드 중...</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">제목 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="예: 현행 학생회, 조직도"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">표시 순서 *</label>
            <input
              type="number"
              value={formData.display_order ?? ''}
              onChange={(e) => {
                const value = e.target.value
                if (value === '') {
                  onChange('display_order', undefined as any)
                } else {
                  const numValue = parseInt(value)
                  if (!isNaN(numValue)) {
                    onChange('display_order', numValue)
                  }
                }
              }}
              placeholder="숫자를 입력하세요"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              숫자가 작을수록 먼저 표시됩니다. (예: 0, 1, 2...)
            </p>
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
              {isSubmitting
                ? isEditing
                  ? '수정 중...'
                  : '추가 중...'
                : isEditing
                  ? '수정하기'
                  : '추가하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
