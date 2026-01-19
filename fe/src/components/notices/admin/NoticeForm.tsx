import { Upload, X, Eye, EyeOff, Image as ImageIcon, File, AlertCircle } from 'lucide-react'
import { Modal } from '../../common/Modal'
import { CATEGORIES, BOARD_SUB_CATEGORIES } from './constants'
import { useState, useCallback, useRef, useLayoutEffect } from 'react'
import TextareaAutosize from 'react-textarea-autosize'

type NoticeFormData = {
    title: string
    content: string
    board_id: number
    subCategory: string
    isPinned: boolean
}

type NoticeFormProps = {
    isOpen: boolean
    onClose: () => void
    isEditing: boolean
    formData: NoticeFormData
    setFormData: React.Dispatch<React.SetStateAction<NoticeFormData>>
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleSubmit: (e: React.FormEvent) => void
    handleMainCategoryChange: (categoryValue: string) => void
    files: FileList | null
    onFilesChange?: (files: File[]) => void
}

// Helper to format file size
const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Get file icon based on type
const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={16} className="text-purple-500" />
    return <File size={16} className="text-blue-500" />
}

export function NoticeForm({
    isOpen,
    onClose,
    isEditing,
    formData,
    setFormData,
    handleInputChange,
    handleFileChange,
    handleSubmit,
    handleMainCategoryChange,
    files,
    onFilesChange
}: NoticeFormProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [localFiles, setLocalFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Scroll to center logic
    const adjustScrollToCenter = useCallback(() => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const scrollParent = textarea.closest('.overflow-y-auto') as HTMLElement;

        if (scrollParent) {
            const caret = getCaretCoordinates(textarea, textarea.selectionEnd);
            // Calculate absolute top of caret relative to the scroll parent
            const textareaRect = textarea.getBoundingClientRect();
            const parentRect = scrollParent.getBoundingClientRect();
            const relativeTop = textareaRect.top - parentRect.top + scrollParent.scrollTop;

            const caretAbsoluteTop = relativeTop + caret.top;

            // We want caretAbsoluteTop to be in the middle of scrollParent visible height
            const targetScrollTop = caretAbsoluteTop - (scrollParent.clientHeight / 2);

            scrollParent.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
        }
    }, [])

    // Ensure scroll to center happens when content changes (and thus height potentially changes)
    useLayoutEffect(() => {
        adjustScrollToCenter()
    }, [formData.content, adjustScrollToCenter])

    const currentCategoryValue = CATEGORIES.find(c => c.boardId === formData.board_id)?.value || '1'
    const allFiles = files ? Array.from(files) : localFiles

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
            const newFiles = [...localFiles, ...droppedFiles]
            setLocalFiles(newFiles)
            onFilesChange?.(newFiles)
        }
    }, [localFiles, onFilesChange])

    const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = [...localFiles, ...Array.from(e.target.files)]
            setLocalFiles(newFiles)
            onFilesChange?.(newFiles)
        }
        handleFileChange(e)
    }

    const removeFile = (index: number) => {
        const newFiles = localFiles.filter((_, i) => i !== index)
        setLocalFiles(newFiles)
        onFilesChange?.(newFiles)
    }

    const handleClose = () => {
        setLocalFiles([])
        setShowPreview(false)
        onClose()
    }

    const onSubmit = (e: React.FormEvent) => {
        handleSubmit(e)
        setLocalFiles([])
        setShowPreview(false)
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEditing ? "공지사항 수정" : "새 공지사항 작성"}
            maxWidth="max-w-3xl"
        >
            <form onSubmit={onSubmit} className="flex flex-col gap-6">

                {/* Category Tabs - Redesigned */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        게시판 선택
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {CATEGORIES.map(c => {
                            const isActive = formData.board_id === c.boardId
                            const colors = c.boardId === 1
                                ? { active: 'border-indigo-500 bg-indigo-50', icon: 'bg-indigo-100 text-indigo-600', text: 'text-indigo-700' }
                                : { active: 'border-emerald-500 bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-700' }

                            return (
                                <div
                                    key={c.value}
                                    onClick={() => handleMainCategoryChange(c.value)}
                                    className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${isActive
                                            ? `${colors.active} shadow-sm`
                                            : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                                        } `}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${isActive ? colors.icon : 'bg-gray-100 text-gray-400'} `}>
                                        {c.label.charAt(0)}
                                    </div>
                                    <div>
                                        <div className={`font-semibold ${isActive ? colors.text : 'text-gray-600'} `}>
                                            {c.label}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {c.boardId === 1 ? '학생회 공지사항' : '민주자치 공지사항'}
                                        </div>
                                    </div>
                                    {isActive && (
                                        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full ${colors.icon} flex items-center justify-center`}>
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Sub Category Pills - Redesigned */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        분류 선택
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {(BOARD_SUB_CATEGORIES[currentCategoryValue] || []).map(c => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, subCategory: c.value }))}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${formData.subCategory === c.value
                                        ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-200'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    } `}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Title & Content with Preview Toggle */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            내용 작성
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${showPreview
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                } `}
                        >
                            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                            {showPreview ? '편집' : '미리보기'}
                        </button>
                    </div>

                    {!showPreview ? (
                        <>
                            <div>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-lg placeholder:text-gray-300"
                                    placeholder="제목을 입력하세요"
                                    required
                                />
                            </div>

                            <div>
                                <TextareaAutosize
                                    ref={textareaRef}
                                    name="content"
                                    value={formData.content}
                                    onChange={handleInputChange}
                                    minRows={10}
                                    onFocus={adjustScrollToCenter}
                                    onClick={adjustScrollToCenter}
                                    onKeyUp={(e) => {
                                        if (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                            adjustScrollToCenter();
                                        }
                                    }}
                                    className="w-full border border-gray-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans leading-relaxed placeholder:text-gray-300 overflow-hidden"
                                    placeholder="내용을 입력하세요..."
                                    required
                                />
                                <div className="flex justify-end mt-1">
                                    <span className="text-xs text-gray-400">
                                        {formData.content.length}자
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="border border-gray-200 rounded-xl p-6 min-h-[280px] bg-gray-50/50">
                            <div className="max-w-2xl">
                                {formData.title ? (
                                    <h1 className="text-2xl font-bold text-gray-900 mb-4">{formData.title}</h1>
                                ) : (
                                    <div className="text-2xl font-bold text-gray-300 mb-4">제목 없음</div>
                                )}
                                {formData.content ? (
                                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {formData.content}
                                    </div>
                                ) : (
                                    <div className="text-gray-300">내용 없음</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* File Upload - Drag & Drop Enhanced */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-5 rounded-2xl space-y-4 border border-gray-100">
                    {!isEditing && (
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                첨부파일
                            </label>

                            {/* Drag & Drop Zone */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragging
                                        ? 'border-blue-400 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-white'
                                    } `}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    onChange={handleLocalFileChange}
                                    className="hidden"
                                />
                                <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors ${isDragging
                                        ? 'bg-blue-100'
                                        : 'bg-gray-100'
                                    } `}>
                                    <Upload size={24} className={isDragging ? 'text-blue-600' : 'text-gray-400'} />
                                </div>
                                <p className="font-medium text-gray-700">
                                    {isDragging ? '여기에 파일을 놓으세요' : '파일을 드래그하거나 클릭하여 업로드'}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    최대 10MB, PDF, 이미지, 문서 파일
                                </p>
                            </div>

                            {/* File List */}
                            {allFiles.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {allFiles.map((f, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 group hover:border-gray-200 transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                                                {getFileIcon(f.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                                                <p className="text-xs text-gray-400">{formatFileSize(f.size)}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    removeFile(i)
                                                }}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {isEditing && (
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-3 rounded-xl">
                            <AlertCircle size={16} />
                            <span>수정 모드에서는 기존 첨부파일이 유지됩니다. 새 파일 추가는 지원되지 않습니다.</span>
                        </div>
                    )}

                    {/* Pin Toggle - Enhanced */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.isPinned
                                    ? 'bg-amber-100'
                                    : 'bg-gray-100'
                                } `}>
                                <svg
                                    className={`w-5 h-5 transition-colors ${formData.isPinned ? 'text-amber-600' : 'text-gray-400'} `}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M10.5 3.5a1 1 0 00-1.707-.707L4.5 7.086V2a1 1 0 00-2 0v6a1 1 0 001 1h6a1 1 0 000-2H5.914l4.293-4.293a1 1 0 00.293-.707zM14 11a1 1 0 100 2h3.586l-4.293 4.293a1 1 0 001.414 1.414L19.086 14.5H20a1 1 0 000-2h-6z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">상단 고정</p>
                                <p className="text-xs text-gray-400">중요 공지사항을 목록 상단에 고정합니다</p>
                            </div>
                        </div>
                        <div
                            onClick={() => setFormData(prev => ({ ...prev, isPinned: !prev.isPinned }))}
                            className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-all ${formData.isPinned
                                    ? 'bg-amber-500 shadow-lg shadow-amber-200'
                                    : 'bg-gray-200'
                                } `}
                        >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${formData.isPinned ? 'translate-x-7' : 'translate-x-0'} `} />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isEditing ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                수정 내용 저장
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                공지사항 등록
                            </>
                        )}
                    </button>
                </div>

            </form>
        </Modal>
    )
}

// Helper to get caret coordinates
const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
    const {
        value
    } = element;

    const properties = [
        'direction',
        'boxSizing',
        'width',
        'height',
        'overflowX',
        'overflowY',
        'borderTopWidth',
        'borderRightWidth',
        'borderBottomWidth',
        'borderLeftWidth',
        'paddingTop',
        'paddingRight',
        'paddingBottom',
        'paddingLeft',
        'fontStyle',
        'fontVariant',
        'fontWeight',
        'fontStretch',
        'fontSize',
        'fontSizeAdjust',
        'lineHeight',
        'fontFamily',
        'textAlign',
        'textTransform',
        'textIndent',
        'textDecoration',
        'letterSpacing',
        'wordSpacing',
    ];

    const computed = window.getComputedStyle(element);
    const div = document.createElement('div');
    div.id = 'input-textarea-caret-position-mirror-div';
    document.body.appendChild(div);

    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';

    properties.forEach(prop => {
        div.style.setProperty(prop, computed.getPropertyValue(prop));
    });

    if (element.scrollHeight > parseInt(computed.height)) {
        div.style.overflowY = 'scroll';
    } else {
        div.style.overflow = 'hidden';
    }

    div.textContent = value.substring(0, position);

    const span = document.createElement('span');
    span.textContent = value.substring(position) || '.';
    div.appendChild(span);

    const coordinates = {
        top: span.offsetTop + parseInt(computed.borderTopWidth),
        left: span.offsetLeft + parseInt(computed.borderLeftWidth)
    };

    document.body.removeChild(div);

    return coordinates;
}
