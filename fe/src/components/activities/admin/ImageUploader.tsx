import { useRef, useCallback } from 'react'

export type UploadImage = {
    id: string
    file: File
    preview: string
    uploading: boolean
    uploaded: boolean
    url?: string
    error?: string
}

type ImageUploaderProps = {
    images: UploadImage[]
    onImagesChange: (images: UploadImage[]) => void
    isDragging: boolean
    onDraggingChange: (isDragging: boolean) => void
    maxImages?: number
}

/**
 * 여러 이미지를 드래그 앤 드롭 또는 파일 선택으로 업로드하는 컴포넌트
 */
export const ImageUploader = ({
    images,
    onImagesChange,
    isDragging,
    onDraggingChange,
    maxImages = 10
}: ImageUploaderProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null)

    // 이미지 파일 추가 핸들러
    const addImageFiles = useCallback((files: FileList | File[]) => {
        const newImages: UploadImage[] = Array.from(files)
            .filter(file => file.type.startsWith('image/'))
            .slice(0, maxImages - images.length) // 최대 개수 제한
            .map(file => ({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file,
                preview: URL.createObjectURL(file),
                uploading: false,
                uploaded: false
            }))
        onImagesChange([...images, ...newImages])
    }, [images, maxImages, onImagesChange])

    // 드래그 앤 드롭 핸들러
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        onDraggingChange(true)
    }, [onDraggingChange])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        onDraggingChange(false)
    }, [onDraggingChange])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        onDraggingChange(false)
        if (e.dataTransfer.files) {
            addImageFiles(e.dataTransfer.files)
        }
    }, [addImageFiles, onDraggingChange])

    // 파일 선택 핸들러
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addImageFiles(e.target.files)
        }
    }, [addImageFiles])

    // 이미지 제거 핸들러
    const removeImage = useCallback((id: string) => {
        onImagesChange(images.filter(i => {
            if (i.id === id) {
                URL.revokeObjectURL(i.preview)
                return false
            }
            return true
        }))
    }, [images, onImagesChange])

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">이미지 업로드 (최대 {maxImages}개)</label>
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
                        (최대 10MB, {images.length}/{maxImages}개 선택됨)
                    </p>
                </div>
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img) => (
                        <div key={img.id} className="relative group">
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
                            {img.uploaded && (
                                <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                            {img.error && (
                                <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1 text-center rounded-b-lg">
                                    {img.error}
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
    )
}
