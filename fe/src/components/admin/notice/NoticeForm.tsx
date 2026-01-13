import { Upload, FileText } from 'lucide-react'
import { Modal } from '../../common/Modal'
import { CATEGORIES, BOARD_SUB_CATEGORIES } from './constants'

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
    files
}: NoticeFormProps) {

    const currentCategoryValue = CATEGORIES.find(c => c.boardId === formData.board_id)?.value || 'student_council'

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
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
                                className={`flex-1 cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center justify-center font-semibold ${formData.board_id === c.boardId
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
                        {(BOARD_SUB_CATEGORIES[currentCategoryValue] || []).map(c => (
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
    )
}
