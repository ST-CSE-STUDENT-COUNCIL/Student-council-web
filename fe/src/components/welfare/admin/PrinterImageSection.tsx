import React from 'react'
import type { PrinterInfo } from '../../../lib/api/welfare'

type PrinterImageSectionProps = {
    selectedFile: File | null
    previewUrl: string
    uploadedUrl: string
    isUploading: boolean
    printerInfo: PrinterInfo | null
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    onSave: () => void
    onReset: () => void
}

export function PrinterImageSection({
    selectedFile,
    previewUrl,
    uploadedUrl,
    isUploading,
    printerInfo,
    onFileChange,
    onSave,
    onReset,
}: PrinterImageSectionProps) {
    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">사용 안내 이미지</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700" htmlFor="printer-guide-image">
                        이미지 파일 선택
                    </label>
                    <input
                        id="printer-guide-image"
                        type="file"
                        accept="image/*"
                        onChange={onFileChange}
                        className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-black"
                    />
                    <p className="text-xs text-gray-500">PNG/JPG 권장. 최대 10MB까지 업로드 가능합니다.</p>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={isUploading || !selectedFile}
                            className="rounded-lg bg-gray-900 hover:bg-black text-white px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? '업로드 중...' : '저장'}
                        </button>
                        <button
                            type="button"
                            onClick={onReset}
                            className="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 text-sm font-semibold transition-colors"
                        >
                            초기화
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700">미리보기</div>
                    <div className="aspect-[16/9] w-full rounded-md border border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden">
                        {previewUrl ? (
                            <img src={previewUrl} alt="프린터 사용 안내 미리보기" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-sm text-gray-400">이미지를 선택하면 여기에 표시됩니다.</span>
                        )}
                    </div>
                    <div className="text-sm font-medium text-gray-700">현재 이미지</div>
                    <div className="aspect-[16/9] w-full rounded-md border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
                        {printerInfo?.image_url ? (
                            <img src={printerInfo.image_url} alt="프린터 사용 안내 현재 이미지" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-sm text-gray-400">등록된 이미지가 없습니다.</span>
                        )}
                    </div>
                </div>
            </div>

            {uploadedUrl && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-1">✓ 업로드 완료</p>
                    <p className="text-xs text-green-600 break-all">{uploadedUrl}</p>
                </div>
            )}
        </div>
    )
}
