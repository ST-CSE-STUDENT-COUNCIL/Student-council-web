import React from 'react'

type LockerLayoutSectionProps = {
    layoutImage: string | null
    isUploading: boolean
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function LockerLayoutSection({ layoutImage, isUploading, onFileChange }: LockerLayoutSectionProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleUploadButtonClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <section className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">사물함 배치도</h2>
                    <p className="text-sm text-gray-500">사물함 배치도 이미지를 업로드하여 관리하세요.</p>
                </div>
                <button
                    onClick={handleUploadButtonClick}
                    disabled={isUploading}
                    className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? '업로드 중...' : '+ 배치도 업로드'}
                </button>
            </div>

            <input
                id="locker-layout-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
            />

            {layoutImage ? (
                <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden bg-gray-50 border-2 border-gray-100">
                        <img src={layoutImage} alt="사물함 배치도" className="w-full h-auto max-h-96 object-contain" />
                    </div>
                </div>
            ) : (
                <label className="block cursor-pointer" htmlFor="locker-layout-upload">
                    <div className="rounded-xl border-2 border-dashed border-gray-300 py-12 px-6 text-center hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center">
                            <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33A3 3 0 0119.5 19.5A4.5 4.5 0 016.75 19.5z"
                                />
                            </svg>
                            <p className="text-sm font-semibold text-gray-900">이미지를 드래그하거나 클릭하여 업로드</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (최대 10MB)</p>
                        </div>
                    </div>
                </label>
            )}
        </section>
    )
}
