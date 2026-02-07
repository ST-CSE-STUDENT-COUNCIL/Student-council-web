import { useState, useRef, useCallback, useLayoutEffect, useMemo } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { ArrowLeft, Calendar, Users, AlignLeft, Image as ImageIcon, CheckCircle, Smartphone, FileQuestion, BarChart3, Eye, EyeOff } from 'lucide-react'
import { activityAdminApi } from '../../../lib/api/activities'
import type { Activity, ActivityCreateRequest, ActivityType } from '../../../types/activities'
import { FormFieldsManager } from './FormFieldsManager'
import { ImageUploader, type UploadImage } from './ImageUploader'
import { toast } from 'sonner'
import { ActivityCard } from '../ActivityCard'

type SurveyFormProps = {
    editingActivity?: Activity | null
    onSuccess: () => void
    onCancel: () => void
}

const surveyTypes: Partial<Record<ActivityType, string>> = {
    survey: '설문조사 + 통계',
    demand_survey: '단순 수요조사'
}

// Helper to convert ISO to local datetime-local format
const toLocalISOString = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function SurveyForm({ editingActivity, onSuccess, onCancel }: SurveyFormProps) {
    const [saving, setSaving] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
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
                type: editingActivity.type,
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
            type: 'survey',
            title: '',
            description: '',
            registration_start: '',
            registration_end: '',
            max_capacity: undefined,
            require_membership: false,
            is_active: true,
            thumbnail_url: '',
            form_fields: [],
            config: { is_anonymous: true }
        }
    })

    const previewActivity = useMemo<Activity>(() => {
        return {
            id: editingActivity?.id || 0,
            type: formData.type || 'survey',
            title: formData.title || '제목 없음',
            description: formData.description || '내용 없음',
            registration_start: formData.registration_start ? new Date(formData.registration_start).toISOString() : undefined,
            registration_end: formData.registration_end ? new Date(formData.registration_end).toISOString() : undefined,
            max_capacity: formData.max_capacity,
            current_count: 0,
            require_membership: formData.require_membership || false,
            config: formData.config || {},
            form_fields: formData.form_fields || [],
            thumbnail_url: images[0]?.preview || images[0]?.url || '',
            images: images.map(img => ({ image_url: img.preview || img.url || '' })),
            is_active: formData.is_active ?? true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    }, [formData, images, editingActivity])

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
            const maxScrollTop = scrollParent.scrollHeight - scrollParent.clientHeight
            scrollParent.scrollTo({
                top: Math.min(Math.max(targetScrollTop, 0), maxScrollTop),
                behavior: 'smooth'
            })
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
                    config: formData.config,
                    is_anonymous: formData.config?.is_anonymous ?? true,
                    image_urls: imageUrls.length > 0 ? imageUrls : undefined
                })
                toast.success('설문이 수정되었습니다.')
            } else {
                await activityAdminApi.create({
                    ...formData,
                    registration_start: formData.registration_start ? new Date(formData.registration_start).toISOString() : undefined,
                    registration_end: formData.registration_end ? new Date(formData.registration_end).toISOString() : undefined,
                    thumbnail_url: thumbnailUrl,
                    image_urls: imageUrls
                })
                toast.success('새 설문이 생성되었습니다.')
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
        <div className="min-h-screen bg-gray-50/30 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/80 shadow-sm transition-all">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onCancel}
                                className="group p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all duration-200"
                            >
                                <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    {editingActivity ? '설문·수요조사 수정' : '새 설문·수요조사 만들기'}
                                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-700 rounded-full tracking-wide">
                                        SURVEY
                                    </span>
                                </h1>
                                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                    {editingActivity ? '기존 설문 내용을 수정하여 업데이트합니다' : '학생들의 의견을 듣기 위한 설문을 생성합니다'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-gray-400">
                                {saving ? '저장 중...' : '작성 중'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Basic Info Section */}
                    <section className="group bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <FileQuestion size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">설문 기본 정보</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPreview(!showPreview)}
                                className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all ${showPreview
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                                {showPreview ? '편집 모드' : '카드 미리보기'}
                            </button>
                        </div>

                        {!showPreview ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 ml-1">설문 타입</label>
                                        <div className="relative">
                                            <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ActivityType }))}
                                                disabled={!!editingActivity}
                                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all font-medium text-gray-900 appearance-none cursor-pointer"
                                            >
                                                {Object.entries(surveyTypes).map(([value, label]) => (
                                                    <option key={value} value={value}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-400 ml-1">
                                            {formData.type === 'survey' ? '자세한 통계와 분석이 가능한 일반 설문조사입니다.' : '빠르게 수요를 파악할 수 있는 간단한 조사입니다.'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 ml-1">최대 참여 인원</label>
                                        <div className="relative">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="number"
                                                value={formData.max_capacity || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: e.target.value ? parseInt(e.target.value) : undefined }))}
                                                min={1}
                                                placeholder="무제한 (입력하지 않으면 제한 없음)"
                                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-gray-400 placeholder:font-normal"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 ml-1">제목</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        required
                                        placeholder="설문조사 제목을 입력하세요"
                                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-lg placeholder:text-gray-400 placeholder:font-normal"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 ml-1">설문 안내 및 설명</label>
                                    <div className="relative">
                                        <TextareaAutosize
                                            ref={textareaRef}
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            minRows={6}
                                            placeholder="설문의 목적이나 참여 방법에 대해 자세히 적어주세요."
                                            className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all leading-relaxed"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center items-center bg-gray-50 rounded-2xl p-4 md:p-8 min-h-[400px]">
                                <div className="relative w-full max-w-4xl">
                                    <ActivityCard activity={previewActivity} />
                                    {/* Interaction Blocker Overlay */}
                                    <div
                                        className="absolute inset-0 z-10 cursor-default"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast.info('미리보기 모드입니다.'); }}
                                    />
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Image Upload Section */}
                    <section className="group bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500">
                                <ImageIcon size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">설문 배너 이미지</h2>
                                <p className="text-xs text-gray-500 font-medium">설문 상단에 표시될 이미지를 업로드하세요</p>
                            </div>
                        </div>
                        <ImageUploader
                            images={images}
                            onImagesChange={setImages}
                            isDragging={isDragging}
                            onDraggingChange={setIsDragging}
                            maxImages={10}
                        />
                    </section>

                    {/* Period & Settings Section */}
                    <section className="group bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                                <Calendar size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">기간 및 참여 설정</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 ml-1">시작 일시</label>
                                <input
                                    type="datetime-local"
                                    value={formData.registration_start}
                                    onChange={(e) => setFormData(prev => ({ ...prev, registration_start: e.target.value }))}
                                    className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 ml-1">종료 일시</label>
                                <input
                                    type="datetime-local"
                                    value={formData.registration_end}
                                    onChange={(e) => setFormData(prev => ({ ...prev, registration_end: e.target.value }))}
                                    className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <div
                                onClick={() => setFormData(prev => ({ ...prev, require_membership: !prev.require_membership }))}
                                className={`flex-1 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between group ${formData.require_membership
                                    ? 'border-indigo-500 bg-indigo-50/30'
                                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl transition-colors ${formData.require_membership ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <div className={`font-bold transition-colors ${formData.require_membership ? 'text-indigo-900' : 'text-gray-600'}`}>학생회비 납부자 전용</div>
                                        <div className="text-xs text-gray-500">납부자만 참여할 수 있습니다</div>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.require_membership ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                                    {formData.require_membership && <CheckCircle size={14} className="text-white" />}
                                </div>
                            </div>

                            <div
                                onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                                className={`flex-1 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between group ${formData.is_active
                                    ? 'border-emerald-500 bg-emerald-50/30'
                                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl transition-colors ${formData.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                                        <Smartphone size={20} />
                                    </div>
                                    <div>
                                        <div className={`font-bold transition-colors ${formData.is_active ? 'text-emerald-900' : 'text-gray-600'}`}>앱에 노출</div>
                                        <div className="text-xs text-gray-500">학생들이 이 설문을 볼 수 있습니다</div>
                                    </div>
                                </div>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <div
                                onClick={() => setFormData(prev => {
                                    const nextIsAnonymous = !(prev.config?.is_anonymous ?? true)
                                    return {
                                        ...prev,
                                        is_anonymous: nextIsAnonymous,
                                        config: { ...prev.config, is_anonymous: nextIsAnonymous }
                                    }
                                })}
                                className={`w-full p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between group ${(formData.config?.is_anonymous ?? true)
                                    ? 'border-gray-500 bg-gray-50/30'
                                    : 'border-blue-500 bg-blue-50/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl transition-colors ${(formData.config?.is_anonymous ?? true) ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {(formData.config?.is_anonymous ?? true) ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </div>
                                    <div>
                                        <div className={`font-bold transition-colors ${(formData.config?.is_anonymous ?? true) ? 'text-gray-700' : 'text-blue-900'}`}>
                                            {(formData.config?.is_anonymous ?? true) ? '익명으로 진행' : '기명으로 진행'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {(formData.config?.is_anonymous ?? true)
                                                ? '참여자의 이름, 학번 등 개인정보를 수집하지 않습니다'
                                                : '참여자의 실명과 학번을 수집합니다'}
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${(formData.config?.is_anonymous ?? true) ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {(formData.config?.is_anonymous ?? true) ? '익명' : '기명'}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Additional Fields Section */}
                    <section className="group bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                                <AlignLeft size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">질문 항목 구성</h2>
                                <p className="text-xs text-gray-500 font-medium">설문 내용을 여기서 구성하세요</p>
                            </div>
                        </div>
                        <FormFieldsManager
                            fields={formData.form_fields || []}
                            onChange={(fields) => setFormData(prev => ({ ...prev, form_fields: fields }))}
                        />
                    </section>

                    {/* Bottom Action Bar */}
                    <div className="sticky bottom-6 z-10 flex gap-4 p-4 bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-4 px-6 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all shadow-sm transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-[2] py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    저장 중...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    {editingActivity ? '수정 완료' : '설문 시작하기'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
            {/* Helper for caret position */}
        </div >
    )
}

// Helper code
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
