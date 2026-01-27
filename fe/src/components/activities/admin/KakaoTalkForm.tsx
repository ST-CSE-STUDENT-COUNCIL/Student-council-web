import { useState, useRef, useCallback, useLayoutEffect } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { ArrowLeft } from 'lucide-react'
import { activityAdminApi } from '../../../lib/api/activities'
import type { Activity, ActivityCreateRequest } from '../../../types/activities'
import { FormFieldsManager } from './FormFieldsManager'
import { ImageUploader, type UploadImage } from './ImageUploader'
import { toast } from 'sonner'

type KakaoTalkFormProps = {
    editingActivity?: Activity | null
    onSuccess: () => void
    onCancel: () => void
}

// Helper to convert ISO to local datetime-local format
const toLocalISOString = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function KakaoTalkForm({ editingActivity, onSuccess, onCancel }: KakaoTalkFormProps) {
    const [saving, setSaving] = useState(false)
    const [images, setImages] = useState<UploadImage[]>(() => {
        if (!editingActivity) return []
        const existingImages: UploadImage[] = []
        if (editingActivity.images && editingActivity.images.length > 0) {
            editingActivity.images.forEach((img, idx) => {
                existingImages.push({
                    id: `existing-${idx}`,
                    file: new File([], 'existing'),
                    preview: img.image_url,
                    uploading: false,
                    uploaded: true,
                    url: img.image_url
                })
            })
        } else if (editingActivity.thumbnail_url) {
            existingImages.push({
                id: 'existing-thumbnail',
                file: new File([], 'existing'),
                preview: editingActivity.thumbnail_url,
                uploading: false,
                uploaded: true,
                url: editingActivity.thumbnail_url
            })
        }
        return existingImages
    })
    const [isDragging, setIsDragging] = useState(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const [formData, setFormData] = useState<ActivityCreateRequest>(() => {
        if (editingActivity) {
            return {
                type: 'kakao_invite',
                title: editingActivity.title,
                description: editingActivity.description || '',
                registration_start: toLocalISOString(editingActivity.registration_start),
                registration_end: toLocalISOString(editingActivity.registration_end),
                max_capacity: editingActivity.max_capacity || undefined,
                require_membership: editingActivity.require_membership,
                is_active: editingActivity.is_active,
                thumbnail_url: editingActivity.thumbnail_url || '',
                form_fields: editingActivity.form_fields || [],
                config: editingActivity.config || {}
            }
        }
        return {
            type: 'kakao_invite',
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
        }
    })

    // Scroll to center logic
    const adjustScrollToCenter = useCallback(() => {
        if (!textareaRef.current) return
        const textarea = textareaRef.current
        const scrollParent = textarea.closest('.overflow-y-auto') as HTMLElement
        if (scrollParent) {
            const caret = getCaretCoordinates(textarea, textarea.selectionEnd)
            const textareaRect = textarea.getBoundingClientRect()
            const parentRect = scrollParent.getBoundingClientRect()
            const relativeTop = textareaRect.top - parentRect.top + scrollParent.scrollTop
            const caretAbsoluteTop = relativeTop + caret.top
            const targetScrollTop = caretAbsoluteTop - (scrollParent.clientHeight / 2)
            scrollParent.scrollTo({ top: targetScrollTop, behavior: 'smooth' })
        }
    }, [])

    useLayoutEffect(() => {
        adjustScrollToCenter()
    }, [formData.description, adjustScrollToCenter])

    // Image upload
    const uploadImages = async (): Promise<string[]> => {
        const uploadedUrls: string[] = []
        for (const img of images) {
            if (img.uploaded && img.url) {
                uploadedUrls.push(img.url)
                continue
            }
            if (img.uploading) continue
            try {
                setImages(prev => prev.map(i => i.id === img.id ? { ...i, uploading: true } : i))
                const { presigned_url, public_url } = await activityAdminApi.getPresignedUrl(img.file.name)
                await activityAdminApi.uploadImage(presigned_url, img.file)
                setImages(prev => prev.map(i => i.id === img.id ? { ...i, uploading: false, uploaded: true, url: public_url } : i))
                uploadedUrls.push(public_url)
            } catch (error) {
                console.error('Image upload error:', error)
                setImages(prev => prev.map(i => i.id === img.id ? { ...i, uploading: false, error: '업로드 실패' } : i))
            }
        }
        return uploadedUrls
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (saving) return

        try {
            setSaving(true)
            const uploadedUrls = await uploadImages()
            const thumbnailUrl = uploadedUrls[0] || formData.thumbnail_url
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
                    image_urls: imageUrls.length > 0 ? imageUrls : undefined
                })
                toast.success('수정되었습니다.')
            } else {
                await activityAdminApi.create({
                    ...formData,
                    registration_start: formData.registration_start ? new Date(formData.registration_start).toISOString() : undefined,
                    registration_end: formData.registration_end ? new Date(formData.registration_end).toISOString() : undefined,
                    thumbnail_url: thumbnailUrl,
                    image_urls: imageUrls
                })
                toast.success('새 카톡방 초대 활동이 생성되었습니다.')
            }
            onSuccess()
        } catch (error) {
            console.error('Failed to save activity', error)
            toast.error('저장에 실패했습니다.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onCancel}
                            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                {editingActivity ? '카톡방 초대 수정' : '새 카톡방 초대 만들기'}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {editingActivity ? '기존 정보를 수정합니다' : '새로운 카카오톡 오픈채팅방 초대 활동을 등록합니다'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Image Upload */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">썸네일 이미지</h2>
                        <ImageUploader
                            images={images}
                            onImagesChange={setImages}
                            isDragging={isDragging}
                            onDraggingChange={setIsDragging}
                            maxImages={5}
                        />
                    </div>

                    {/* Basic Info */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
                        <h2 className="text-lg font-bold text-gray-900">기본 정보</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">활동 타입</label>
                                <input
                                    type="text"
                                    value="카톡방 초대"
                                    disabled
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">최대 참여자</label>
                                <input
                                    type="number"
                                    value={formData.max_capacity || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: e.target.value ? parseInt(e.target.value) : undefined }))}
                                    min={1}
                                    placeholder="무제한"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">제목</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                required
                                placeholder="예: 학과 카카오톡 오픈채팅방 초대"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">설명</label>
                            <TextareaAutosize
                                ref={textareaRef}
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                minRows={4}
                                placeholder="활동에 대한 설명을 입력하세요. 인증 방법이나 안내사항을 적어주세요."
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 resize-none"
                            />
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">추가 질문 설정</h2>
                        <FormFieldsManager
                            fields={formData.form_fields || []}
                            onChange={(fields) => setFormData(prev => ({ ...prev, form_fields: fields }))}
                        />
                    </div>

                    {/* Period & Settings */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
                        <h2 className="text-lg font-bold text-gray-900">신청 기간 및 설정</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">신청 시작</label>
                                <input
                                    type="datetime-local"
                                    value={formData.registration_start}
                                    onChange={(e) => setFormData(prev => ({ ...prev, registration_start: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">신청 종료</label>
                                <input
                                    type="datetime-local"
                                    value={formData.registration_end}
                                    onChange={(e) => setFormData(prev => ({ ...prev, registration_end: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div
                                    onClick={() => setFormData(prev => ({ ...prev, require_membership: !prev.require_membership }))}
                                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${formData.require_membership ? 'bg-yellow-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${formData.require_membership ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-sm font-medium text-gray-700">회비 납부자만</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div
                                    onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-sm font-medium text-gray-700">활성화</span>
                            </label>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 sticky bottom-6">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-4 px-6 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-4 px-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-600 shadow-lg shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {saving ? '저장 중...' : (editingActivity ? '수정 완료' : '생성하기')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Helper for caret position
const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
    const { value } = element
    const properties = [
        'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
        'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
        'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
        'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform',
        'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing',
    ]

    const computed = window.getComputedStyle(element)
    const div = document.createElement('div')
    div.id = 'input-textarea-caret-position-mirror-div'
    document.body.appendChild(div)

    div.style.whiteSpace = 'pre-wrap'
    div.style.wordWrap = 'break-word'
    div.style.position = 'absolute'
    div.style.visibility = 'hidden'

    properties.forEach(prop => {
        div.style.setProperty(prop, computed.getPropertyValue(prop))
    })

    if (element.scrollHeight > parseInt(computed.height)) {
        div.style.overflowY = 'scroll'
    } else {
        div.style.overflow = 'hidden'
    }

    div.textContent = value.substring(0, position)

    const span = document.createElement('span')
    span.textContent = value.substring(position) || '.'
    div.appendChild(span)

    const coordinates = {
        top: span.offsetTop + parseInt(computed.borderTopWidth),
        left: span.offsetLeft + parseInt(computed.borderLeftWidth)
    }

    document.body.removeChild(div)
    return coordinates
}
