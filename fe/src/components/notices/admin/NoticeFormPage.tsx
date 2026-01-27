import { useState, useRef, useCallback, useEffect } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { ArrowLeft, FileText, Upload, X, Eye, EyeOff, Image as ImageIcon, File, AlertCircle, Pin, CheckCircle } from 'lucide-react'
import { postApi } from '../../../lib/api/notices'
import type { NoticeListItem } from '../../../types/posts'
import { CATEGORIES, BOARD_SUB_CATEGORIES } from './constants'
import { toast } from 'sonner'

type NoticeFormPageProps = {
    editingPost?: NoticeListItem | null
    onSuccess: () => void
    onCancel: () => void
}

// Helper to format file size
const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Get file icon based on type
const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={20} className="text-purple-500" />
    return <File size={20} className="text-blue-500" />
}

export function NoticeFormPage({ editingPost, onSuccess, onCancel }: NoticeFormPageProps) {
    const [saving, setSaving] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [showPreview, setShowPreview] = useState(false)

    // File state
    const [localFiles, setLocalFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Form data
    const [formData, setFormData] = useState({
        title: editingPost?.title || '',
        content: editingPost?.content || '',
        board_id: editingPost?.board.id || 1,
        subCategory: editingPost?.subcategory || 'notification',
        isPinned: editingPost?.is_pinned || false,
    })

    const currentCategoryValue = CATEGORIES.find(c => c.boardId === formData.board_id)?.value || '1'

    // Scroll to center logic (reused from EventForm)
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

    useEffect(() => {
        adjustScrollToCenter()
    }, [formData.content, adjustScrollToCenter])

    // Drag & Drop handlers
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
        const droppedFiles = Array.from(e.dataTransfer.files)
        if (droppedFiles.length > 0) {
            setLocalFiles(prev => [...prev, ...droppedFiles])
        }
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setLocalFiles(prev => [...prev, ...Array.from(e.target.files!)])
        }
    }

    const removeFile = (index: number) => {
        setLocalFiles(prev => prev.filter((_, i) => i !== index))
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
        if (saving) return

        try {
            setSaving(true)

            if (editingPost) {
                // 수정 모드
                // 1. 새 파일 업로드
                const uploadedAttachments: { file_url: string, filename: string, file_size: number, mime_type: string }[] = []

                if (localFiles.length > 0) {
                    for (const file of localFiles) {
                        const contentType = file.type || 'application/octet-stream'
                        const { presigned_url, public_url } = await postApi.getPresignedUrl(
                            file.name,
                            editingPost.id,
                            contentType
                        )
                        await fetch(presigned_url, {
                            method: 'PUT',
                            body: file,
                            headers: { 'Content-Type': contentType }
                        })
                        uploadedAttachments.push({
                            file_url: public_url,
                            filename: file.name,
                            file_size: file.size,
                            mime_type: contentType
                        })
                    }
                }

                // 2. 게시글 업데이트
                await postApi.update(editingPost.id, {
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
                // 생성 모드
                // 1. Draft 생성
                const { post_id } = await postApi.createDraft(formData.board_id)

                // 2. 파일 업로드
                const uploadedAttachments = []
                for (const file of localFiles) {
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

                // 3. 최종 생성
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

            onSuccess()
        } catch (error) {
            console.error('Failed to save notice', error)
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
                                    {editingPost ? '공지사항 수정' : '새 공지사항 작성'}
                                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-blue-100 text-blue-700 rounded-full tracking-wide">
                                        NOTICE
                                    </span>
                                </h1>
                                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                    {editingPost ? '기존 공지사항을 수정합니다' : '학생들에게 전달할 새로운 공지사항을 작성합니다'}
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

                    {/* Category Selection */}
                    <section className="group bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <FileText size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">게시판 선택</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {CATEGORIES.map(c => {
                                    const isActive = formData.board_id === c.boardId
                                    const colors = c.boardId === 1
                                        ? { active: 'border-blue-500 bg-blue-50', icon: 'bg-blue-100 text-blue-600', text: 'text-blue-700' }
                                        : { active: 'border-emerald-500 bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-700' }

                                    return (
                                        <div
                                            key={c.value}
                                            onClick={() => !editingPost && handleMainCategoryChange(c.value)}
                                            className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${isActive
                                                ? `${colors.active} shadow-sm`
                                                : editingPost ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${isActive ? colors.icon : 'bg-gray-100 text-gray-400'}`}>
                                                {c.label.charAt(0)}
                                            </div>
                                            <div>
                                                <div className={`font-bold text-lg ${isActive ? colors.text : 'text-gray-600'}`}>
                                                    {c.label}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {c.boardId === 1 ? '총학생회 공식 공지사항입니다' : '민주자치기구 관련 공지사항입니다'}
                                                </div>
                                            </div>
                                            {isActive && (
                                                <div className={`absolute top-4 right-4 w-6 h-6 rounded-full ${colors.icon} flex items-center justify-center`}>
                                                    <CheckCircle size={14} />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 ml-1">상세 분류</label>
                                <div className="flex flex-wrap gap-2">
                                    {(BOARD_SUB_CATEGORIES[currentCategoryValue] || []).map(c => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, subCategory: c.value }))}
                                            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${formData.subCategory === c.value
                                                ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-105'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                                                }`}
                                        >
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Content Editor */}
                    <section className="group bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <FileText size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">내용 작성</h2>
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
                                {showPreview ? '편집 모드' : '미리보기'}
                            </button>
                        </div>

                        {!showPreview ? (
                            <div className="space-y-6">
                                <div>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-lg placeholder:text-gray-400 placeholder:font-normal"
                                        placeholder="제목을 입력하세요"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <TextareaAutosize
                                        ref={textareaRef}
                                        value={formData.content}
                                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                        minRows={15}
                                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all leading-relaxed placeholder:text-gray-400"
                                        placeholder="공지 내용을 자세히 작성해주세요..."
                                        required
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-2xl p-8 min-h-[400px] bg-gray-50/30">
                                <div className="max-w-3xl mx-auto">
                                    <div className="mb-8 border-b border-gray-200 pb-6">
                                        <div className="flex gap-2 mb-4">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">
                                                {CATEGORIES.find(c => c.boardId === formData.board_id)?.label}
                                            </span>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg border border-gray-200">
                                                {BOARD_SUB_CATEGORIES[currentCategoryValue]?.find(s => s.value === formData.subCategory)?.label}
                                            </span>
                                        </div>
                                        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                                            {formData.title || <span className="text-gray-300">제목 미리보기</span>}
                                        </h1>
                                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                                            <span>작성자: 관리자</span>
                                            <span>•</span>
                                            <span>{new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="prose prose-lg max-w-none text-gray-800 whitespace-pre-wrap leading-loose">
                                        {formData.content || <span className="text-gray-300">내용 미리보기</span>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Settings & Attachments */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Attachments */}
                        <section className="lg:col-span-2 group bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                                    <Upload size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">첨부파일</h2>
                            </div>

                            {editingPost && (
                                <div className="mb-4 p-3 bg-amber-50 text-amber-700 rounded-xl text-sm flex items-center gap-2 border border-amber-100">
                                    <AlertCircle size={16} />
                                    수정 시에는 파일 추가만 가능하며, 기존 파일 삭제는 아직 지원되지 않습니다.
                                </div>
                            )}

                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragging
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <div className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center transition-colors ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                                    }`}>
                                    <Upload size={24} />
                                </div>
                                <p className="font-bold text-gray-700">
                                    {isDragging ? '파일을 놓아주세요' : '파일 업로드'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    클릭하거나 파일을 드래그하여 추가하세요
                                </p>
                            </div>

                            {localFiles.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {localFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200/60 group">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-200 shadow-sm">
                                                {getFileIcon(file.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
                                                <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Settings */}
                        <section className="group bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                                    <Pin size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">설정</h2>
                            </div>

                            <div
                                onClick={() => setFormData(prev => ({ ...prev, isPinned: !prev.isPinned }))}
                                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col gap-4 group ${formData.isPinned
                                    ? 'border-amber-400 bg-amber-50/50'
                                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className={`font-bold transition-colors mb-1 ${formData.isPinned ? 'text-amber-900' : 'text-gray-700'}`}>상단 고정</div>
                                        <div className="text-xs text-gray-500 leading-relaxed">
                                            이 공지사항을 목록 최상단에 고정하여 강조합니다.
                                        </div>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.isPinned ? 'bg-amber-500' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${formData.isPinned ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

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
                            className="flex-[2] py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    저장 중...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    {editingPost ? '수정 완료' : '공지사항 등록'}
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>

            {/* Helper Component for caret position */}
        </div>
    )
}

// Helper code (keep accessible in the module)
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
